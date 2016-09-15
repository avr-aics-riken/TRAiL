/* ##################################################################
 *
 * PMlib - Performance Monitor library
 *
 * Copyright (c) 2010-2011 VCAD System Research Program, RIKEN.
 * All rights reserved.
 *
 * Copyright (c) 2012-2015 Advanced Institute for Computational Science, RIKEN.
 * All rights reserved.
 *
 * ###################################################################
 */

//! @file   PerfOtfWriter.cpp
//! @brief  PerfOtfWriter class

// When compiling with USE_PAPI macro, openmp option should be enabled.



#include "PerfOtfWriter.h"

#include <mpi.h>
#include "PerfWatch.h"

#include <assert.h>

#include <otf.h>

#ifdef WIN32
#include "pm_win32_util.h"
#endif

#ifdef WIN32
#include <stdio.h>
#define snprintf    _snprintf
#else
#include <unistd.h>
#include <sys/time.h>
#endif


namespace pm_lib {

/**
*	環境変数キー名称
*/


#define PM_OFT_NAME				"PM_OFT_NAME"

//圧縮レベル
#define COMPRESS_LEVEL (0)

//グローバルストリームの識別子
#define PM_OTF_GLOBAL_STREAM_ID (0)

//プロセスは0を起点とすると,warningがつくが、1をoffsetとして開始を1からにするとvampireの表示がおかしくなる。最後のランクが表示されてない
//  当面 プロセスIDはランク番号と同じにする
#define PROCESS_OFFSET (1)
//#define PROCESS_OFFSET (0)
//ストリームは必ずOFFSETが必要。glocalが0を占有する
#define STREAMID_OFFSET (1)

	PerfOtfWriter::PerfOtfWriter():m_nWatch(0),m_manager(NULL),m_global_stream(NULL),m_local_stream(NULL),m_rank_no(-1),m_rank_size(-1)
	{
		readEnvVar();
	}
    
    /// デストラクタ.
	PerfOtfWriter::~PerfOtfWriter()
	{

	}
	
	int32_t PerfOtfWriter::get_rank_no() const
	{
		pm_assert(m_rank_no>=0);
		return m_rank_no;
	}

	int32_t PerfOtfWriter::get_rank_size() const
	{
		pm_assert(m_rank_size>0);
		return m_rank_size;
	}

	bool_t PerfOtfWriter::isMasterRank() const
	{
		//ランク番号が0のマスターかをチェック
		return ( get_rank_no() == 0);
	}

	void PerfOtfWriter::readEnvVar()
	{
		//初期値の設定

		m_filename = "./output_pm";

		//環境変数の読み込み
		char_t* var = std::getenv("PM_OFT_NAME");
		printf( "Your PM_OFT_NAME is: %s\n", var );

		
		var = std::getenv(PM_OFT_NAME);
		if (var != NULL) {
			m_filename = std::string(var);
			assert(m_filename.size()>0);
		}


		
	}

	const char* PerfOtfWriter::getfileName()const
	{
		pm_assert(m_filename.size()>0);

		const char* ptr = m_filename.c_str();
		return ptr;
	}



	void PerfOtfWriter::readRankInfo()
	{
		//ランク情報を読み込み
		MPI_Comm_rank(MPI_COMM_WORLD, &m_rank_no);
		MPI_Comm_size(MPI_COMM_WORLD, &m_rank_size);

		get_rank_no();
		get_rank_size();

	}

	// otfファイル名取得
	// 環境変数から取得する
	 	
	void PerfOtfWriter::initialize_otf (const int32_t& init_nWatch)
	{
	
		readRankInfo();

		const char_t* basefile = getfileName();
		//最大限開くファイル数を指定する。
		//TODO: fuchi ランク数とは違うのか？
		// zero だとランク数になるかも?

		//Initialize the file manager. Open at most 100 OS files.

		const int32_t file_sum = 100;//get_rank_size() + 1; // Globalのストリーム分
		pm_assert(file_sum>0);
		
		m_manager = OTF_FileManager_open( file_sum );
		pm_assert(m_manager);

		m_local_stream = OTF_WStream_open(basefile, getLocalStreamID(), m_manager);
		pm_assert(m_local_stream);
		
		//もし0ランクならグローﾊﾞﾙファイルも作成
		if(isMasterRank()){
			setup_global_Definion();
		}

	}
	
	int PerfOtfWriter::getLocalStreamID()const
	{
		//0はグローバル用
		//1以上である必要があるので、ランク番号+1をローカルＩＤとする
		return get_rank_no() + STREAMID_OFFSET;
	}

	OTF_WStream* PerfOtfWriter::get_global_stream()
	{
		pm_assert(isMasterRank());
		pm_assert(m_global_stream!=NULL);
		return m_global_stream;
	}

	OTF_WStream* PerfOtfWriter::get_local_stream()
	{
		pm_assert(m_local_stream!=NULL);
		return m_local_stream;
	}


	void PerfOtfWriter::setup_global_Definion()
	{
		pm_assert(isMasterRank());
		
		const char_t* basefile = getfileName();
		m_global_stream = OTF_WStream_open(basefile, PM_OTF_GLOBAL_STREAM_ID , m_manager);
		pm_assert(m_global_stream);
		
		OTF_WStream* st = get_global_stream();

		int32_t ret = 0;

		ret = OTF_WStream_writeDefTimerResolution( st, 
				1e6 /* uint64_t ticksPerSecond */ );
		pm_assert(ret !=0 );


		//バッファの設定
		uint32_t buffersize = 1024 *1024;
		OTF_WStream_setBufferSizes( st, buffersize );

		//圧縮レベルの指定
		int32_t compression = COMPRESS_LEVEL;//圧縮しない。する
		if ( 0 < compression && compression <= 9 ) {
			ret = OTF_WStream_setCompression( st, compression );
			pm_assert(ret!=0);
		}

		//ランク名称の定義
		int32_t processID= PROCESS_OFFSET;//プロセスＩＤ  .  0は無効な数字なので、1からスタート
		for( ; processID < get_rank_size()+ PROCESS_OFFSET; processID++ ) {
			char_t name[101];
			snprintf( name, 100, "Process %d", processID );
			ret = OTF_WStream_writeDefProcess( st, 
				processID /*uint32_t process */, //ランク番号そのもの０はじまり
				name /* const char_t *name */ , //ランク名称
				0 /* uint32_t parent */ );//プロセス間に親子関係ないので0
			pm_assert(ret!=0);
		}

		//関数グループを登録
		ret = OTF_WStream_writeDefFunctionGroup( st, 
				FUNC_GROUP_PMLIB /* uint32_t funcGroup */, 
				"PMLib" /* const char_t *name */ );
		pm_assert(ret!=0);

		/// SetProperty , Enter/Leave のkey名称の定義
		//key登録
		ret = OTF_WStream_writeDefKeyValue(st,KEY_LABEL_TYPE, OTF_UINT32 ,"PMLIB.KEY_LABEL_TYPE","this is LABEL_TYPE");
		pm_assert(ret!=0);

		ret = OTF_WStream_writeDefKeyValue(st,KEY_EXCLUSIVEFLAG, OTF_UINT32 ,"PMLIB.KEY_EXCLUSIVEFLAG","thisis EXCLUSIVEFLAG");
		pm_assert(ret!=0);

		ret = OTF_WStream_writeDefKeyValue(st,KEY_FLOPVAL, OTF_DOUBLE ,"PMLIB.KEY_FLOPVAL","this is _FLOPVAL");
		pm_assert(ret!=0);



		pm_assert(ret!=0);
	}

	void PerfOtfWriter::finalize_otf()
	{
		int32_t ret = 0;
	
		//まず自分のランクのストリームを閉じる
		OTF_WStream* local_st = get_local_stream();
		ret = OTF_WStream_close(local_st);
		pm_assert(ret!=0);


		// 上記のclose待ち。全ランクおわるまで待ち合わせ
		MPI_Barrier(MPI_COMM_WORLD);


		//マスターランクの場合　、グローバルストリームを閉じる
		if(isMasterRank()){
			ret = OTF_WStream_close(m_global_stream);
			pm_assert(ret!=0);	
		}

		/* write master control file */
		if (isMasterRank())
		{
			const char_t* basefile = getfileName();

			OTF_MasterControl* master = OTF_MasterControl_new(m_manager);
			pm_assert(master != NULL);
			int size = get_rank_size();
			for (int32_t i = 0; i < size; i++)
			{
				int streamID = i+STREAMID_OFFSET;//ストリームは０番はグローバル用、
				int processID = i+PROCESS_OFFSET ;//プロセスは０始まり,ランク番号そのもの
				ret = OTF_MasterControl_append(master, 
													streamID, // stream id 
													processID  // process id
													);
				pm_assert(ret!=0);
			}
			ret = OTF_MasterControl_write(master, basefile);
			pm_assert(ret!=0);

			OTF_MasterControl_close(master);

		}

		OTF_FileManager_close(m_manager);

	}
	

	// ラベル登録
	void PerfOtfWriter::setProperties_otf(const std::string& label, const int& type, const bool_t& exclusive)
	{
		pm_assert(label.size()>0);

		//関数登録
		int32_t label_id = add_perf_label(label);
		pm_assert(label_id>0);
		
		//登録番号を使って、defに関数名とIDの対応関係を登録する
		uint32_t deftoken = label_id;
		const char_t* name  = label.c_str();
		uint32_t group    = FUNC_GROUP_PMLIB;
		uint32_t scltoken =0;

		////////////////////////////////////
		// ファイル書き込みはグローバグだけとする
		if(isMasterRank()){
			OTF_WStream* st =  get_global_stream();


			//関数のkey/value属性として typeとexclusiveを書き込み
			//ラベル属性、関数タイプと排他フラグ
			OTF_KeyValueList* keyvaluelist = OTF_KeyValueList_new();
			
			//ラベルタイプ
			uint32_t val1 = (type == 0)? 0:1;
			OTF_KeyValueList_appendUint32( keyvaluelist, KEY_LABEL_TYPE, val1 );

			//排他フラグ
			uint32_t val2 = (exclusive) ? 1:0;
			OTF_KeyValueList_appendUint32( keyvaluelist, KEY_EXCLUSIVEFLAG, val2 );
			
			//ラベル名を登録
			int32_t ret = 0;
			ret = OTF_WStream_writeDefFunctionKV(st,
				deftoken,
				name, //ラベル名を登録
				group,
				scltoken,
				keyvaluelist);

			pm_assert(ret!=0);

			//解放
			OTF_KeyValueList_close( keyvaluelist );




		}
	}

	/// 時刻を取得.
	///
	///   Unix/Linux: gettimeofdayシステムコールを使用.
	///   Windows: GetSystemTimeAsFileTime API(sph_win32_util.h)を使用.
	///
	///   @return 時刻値(秒)
	///
	double_t PerfOtfWriter::getTime()
	{
		struct timeval tv;
		gettimeofday(&tv, 0);
		double_t time = (double_t)tv.tv_sec + (double_t)tv.tv_usec * 1.0e-6;
		return time;
	}

    /// labelに対応した計測区間のkey番号を追加作成する
    ///
    ///   @param[in] 測定区間のラベル
    ///
    int32_t PerfOtfWriter::add_perf_label( std::string arg_st)
    {
		m_nWatch++;//関数名は1からスタート
		int32_t ip = m_nWatch;
    	// perhaps it is better to return ip showing the insert status.
		// sometime later...
    	m_array_of_symbols.insert( make_pair(arg_st, ip) );
		#ifdef DEBUG_PRINT_LABEL
    	fprintf(stderr, "<add_perf_label> %s : %d\n", arg_st.c_str(), ip);
		#endif
    	return ip;
    }

    /// labelに対応するkey番号を取得
    ///
    ///   @param[in] 測定区間のラベル
    ///
    int32_t PerfOtfWriter::key_perf_label( std::string arg_st)
    {
    	int32_t pair_value;
    	if (m_array_of_symbols.find(arg_st) == m_array_of_symbols.end()) {
    		pair_value = -1;
    	} else {
    		pair_value = m_array_of_symbols[arg_st] ;
    	}
		#ifdef DEBUG_PRINT_LABEL
    	fprintf(stderr, "<key_perf_label> %s : %d\n", arg_st.c_str(), pair_value);
		#endif
    	return pair_value;
    }

	void PerfOtfWriter::start_otf (const std::string& label)
	{
		pm_assert(label.size()>0);

		uint64_t time = getTime();
		uint32_t function = key_perf_label(label);//label に関する関数ID
		uint32_t process = get_rank_no();
		uint32_t source = 0;
		
		int32_t ret=0;
		ret = OTF_WStream_writeEnter( get_local_stream() , time , function, process, source);
		pm_assert(ret!=0);

	}

	void PerfOtfWriter::stop_otf(const std::string& label, double_t flopPerTask, uint32_t iterationCount)
	{


		pm_assert(label.size()>0);

		uint64_t time = getTime();
		uint32_t function = key_perf_label(label);//label に関する関数ID
		uint32_t process = get_rank_no();
		uint32_t source = 0;
		
		int32_t ret=0;

		//手動計算
		double_t flop = flopPerTask*iterationCount;

		//関数のkey/value属性
		OTF_KeyValueList* keyvaluelist = OTF_KeyValueList_new();
        OTF_KeyValueList_appendDouble( keyvaluelist, KEY_FLOPVAL, flop );



		ret = OTF_WStream_writeLeaveKV( get_local_stream() , time , function, process, source,keyvaluelist);
		pm_assert(ret!=0);

		//解放
		ret = OTF_KeyValueList_close( keyvaluelist );
		pm_assert(ret==0);
	}

	void PerfOtfWriter::gather_otf(void)
	{
		//ファイル結合
		finalize_otf();
	}

	void PerfOtfWriter::print_otf(FILE* fp, const std::string hostname, const std::string comments, int32_t seqSections,
				PerfWatch* watchArray,   ///< 測定時計配列
				uint32_t nWatch          ///< 測定区間数
				)
	{	


	}


	void PerfOtfWriter::printDetail_otf(FILE* fp, int32_t legend, int32_t seqSections)
	{
		//特になし
	}

} /* namespace pm_lib */

