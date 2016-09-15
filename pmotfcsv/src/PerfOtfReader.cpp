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

//! @file   PerfOtfReader.cpp
//! @brief  PerfOtfReader class

// When compiling with USE_PAPI macro, openmp option should be enabled.

#include "PerfOtfReader.h"

#include <stdio.h>
#include <assert.h>

#include "PerfOtfWriter.h"

#define PMLIB_OTF_OPEN_FILE_SUM (100)
#define PMLIB_OTF_LIMIT (100000)

#define ENTER_FUNC_ID (1)
#define ENTER_FLOP_INIT_VAL (0)

#define LEAVE_FUNC_ID (2)

#define SEND_FUNC_ID (3)
#define RECV_FUNC_ID (4)
#define FLOP_INIT_VAL (0)

//ログが多すぎるのでデバック版でもログを出さない
//#define _DEBUG_PRINT
#ifdef _DEBUG_PRINT
#define debug_printf(...) printf(__VA_ARGS__)
#else
#define debug_printf(...) ((void)0)
#endif


namespace pm_lib {

extern int handleDefProcess (void *userData, uint32_t stream, uint32_t process, const char *name, uint32_t parent) ;
extern int handleDefFunction (void *userData, uint32_t stream, uint32_t func, const char *name, uint32_t funcGroup, uint32_t source, OTF_KeyValueList *list);
extern int handleDefCounter (void* userData, uint32_t stream, uint32_t counter, const char* name, uint32_t properties, uint32_t counterGroup, const char* unit, OTF_KeyValueList* kvlist);

extern int handleLeave (void *userData, uint64_t time, uint32_t function, uint32_t process, uint32_t source, OTF_KeyValueList *list);
extern int handleEnter (void *userData, uint64_t time, uint32_t function, uint32_t process, uint32_t source, OTF_KeyValueList *list);
extern int handleCounter (void *userData, uint64_t time, uint32_t process, uint32_t counter, uint64_t value, OTF_KeyValueList *list);

extern int handleDefKeyValue( void* userData, uint32_t stream, uint32_t key, OTF_Type type, const char* name, const char *description );

extern  int handleReceive (void *userData, uint64_t time,
    uint32_t receiver, uint32_t sender, uint32_t communicator,
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list);

extern int handleSend (void *userData, uint64_t time, 
    uint32_t sender, uint32_t receiver, uint32_t communicator, 
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list);



int handleDefProcess (void *userData, uint32_t stream, uint32_t process, const char *name, uint32_t parent) 
{
	
	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleDefProcess( stream, 
							process, 
							name, 
							parent);
	return OTF_RETURN_OK;
}

int handleDefFunction (void *userData, uint32_t stream, uint32_t func, const char *name, uint32_t funcGroup, uint32_t source, OTF_KeyValueList *list) {
	
	assert(userData!=NULL);

	((PerfOtfReader*)userData)->_handleDefFunction (
						stream,
						func, 
						name, 
						funcGroup,
						source, 
						list);

	return OTF_RETURN_OK;
}	

int handleDefCounter (void *userData, uint32_t stream, uint32_t func, const char *name, uint32_t funcGroup, uint32_t source, const char* unit, OTF_KeyValueList *list) {
	
	assert(userData!=NULL);

	((PerfOtfReader*)userData)->_handleDefCounter (
						stream,
						func, 
						name, 
						funcGroup,
						source, 
						unit, 
						list);

	return OTF_RETURN_OK;
}	

int handleEnter (void *userData, uint64_t time, uint32_t function, uint32_t process, uint32_t source, OTF_KeyValueList *list) 
{
	
	assert(userData!=NULL);

	((PerfOtfReader*)userData)->_handleEnter (time, 
				  function, 
				  process, 
				  source, 
				  list);

	return OTF_RETURN_OK;
}

/**
int OTF_WStream_writeLeaveKV( OTF_WStream* wstream, uint64_t time,
    uint32_t statetoken, uint32_t cpuid, uint32_t scltoken, OTF_KeyValueList* list );
	に対応したコールバック
*/
int handleLeave (void *userData, uint64_t time, uint32_t function, uint32_t process, uint32_t source, OTF_KeyValueList *list) 
{
	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleLeave (time, 
				  function, 
				  process, 
				  source, 
				  list);

	return OTF_RETURN_OK;
}

int handleCounter (void *userData, uint64_t time, uint32_t process, uint32_t counter, uint64_t value, OTF_KeyValueList *list) 
{
	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleCounter (time, 
				  process, 
				  counter, 
				  value, 
				  list);

	return OTF_RETURN_OK;
}

int handleDefKeyValue( void* userData, uint32_t stream, uint32_t key, OTF_Type type, const char* name, const char *description ) 
{
	
	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleDefKeyValue (stream, 
				  key, 
				  type, 
				  name, 
				  description);

    return OTF_RETURN_OK;
}

/*
int OTF_WStream_writeSendMsgKV( OTF_WStream* wstream, uint64_t time, 
    uint32_t sender, uint32_t receiver, uint32_t communicator, 
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list );
*/
int handleSend (void *userData, uint64_t time, 
    uint32_t sender, uint32_t receiver, uint32_t communicator, 
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list) 
{

	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleSend (
									time, 
									sender, 
									receiver,
									communicator, 
									msgtype, 
									msglength, 
									scltoken, 
									list) ;


    return OTF_RETURN_OK;
}

int handleReceive (void *userData, uint64_t time,
    uint32_t receiver, uint32_t sender, uint32_t communicator,
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list) 
{
	assert(userData!=NULL);
	((PerfOtfReader*)userData)->_handleReceive (
									time,
									receiver, 
									sender, 
									communicator,
									msgtype, 
									msglength, 
									scltoken, 
									list);

    return OTF_RETURN_OK;

}


PerfOtfReader::PerfOtfReader():m_fp_csv_wk(NULL),
								m_fp_csv_out(NULL),
								m_bStart_label_defFunc(false),
								m_bStart_label_defCoun(false),
								m_bStart_label_event(false),
								m_global_start_time(ULLONG_MAX), 
								m_global_end_time(0)
{

}

/// デストラクタ.
PerfOtfReader::~PerfOtfReader()
{

}



void PerfOtfReader::_handleDefProcess (const uint32_t& stream, 
							const uint32_t& process, 
							const char *name, 
							const uint32_t& parent)
{
	//特に無し

	uint32_t key = process;
	std::string val(name);

	std::map<uint32_t, std::string>::iterator it = m_process_dic.find(key);
	if(it == m_process_dic.end()){
		m_process_dic.insert(std::make_pair(key,val));
	}else{
		//2回よばれた？
		assert(false);
	}
}

void PerfOtfReader::_handleDefFunction (const uint32_t& stream,
						const uint32_t& func,
						const char *name,
						const uint32_t& funcGroup,
						const uint32_t& source, 
						OTF_KeyValueList *list)
{
	debug_printf("handleDefFunction stream=%d,func=%d,name=%s\n",stream,func,name);

	int KEY_LABEL_TYPE_key = PerfOtfWriter::KEY_LABEL_TYPE;
	uint32_t value_type=0;

	switch( OTF_KeyValueList_getUint32( list, KEY_LABEL_TYPE_key, &value_type) ) {
      case 0:
         debug_printf("We entered function %u with argument %d\n", func, value_type);
         break;
      case 1:
         debug_printf("We entered function %u with no argument.\n", func);
         break;
      default: 
         debug_printf("An error occurred while asking for key value pair.\n");
    }

	int KEY_EXCLUSIVEFLAG_key = PerfOtfWriter::KEY_EXCLUSIVEFLAG;
	uint32_t value_exec=0;

	switch( OTF_KeyValueList_getUint32( list, KEY_EXCLUSIVEFLAG_key, &value_exec) ) {
      case 0:
         debug_printf("We entered function %u with argument %d\n", func, value_exec);
         break;
      case 1:
         debug_printf("We entered function %u with no argument.\n", func);
         break;
      default: 
         debug_printf("An error occurred while asking for key value pair.\n");
    }

	if(!m_bStart_label_defFunc){
		//head行作成。初回のみ
		m_bStart_label_defFunc = true;
		fprintf(m_fp_csv_wk, "<DefFunction>\n");
	}

	//「ラベルＩＤ、ラベル名、関数種別(0 or 1:)、排他フラグ(0or1)」がラベル数分Ｎ行あり。
	int rc = fprintf(m_fp_csv_wk, "%u,%s,%u,%u\n",func,name,value_type, value_exec);
    if (rc == -1)
    {
		assert(false);
	}

}

void PerfOtfReader::_handleDefCounter (uint32_t stream, 
										uint32_t counter, 
										const char* name, 
										uint32_t properties, 
										uint32_t counterGroup, 
										const char* unit, 
										OTF_KeyValueList* kvlist)
{
	debug_printf("handleDefCounter stream=%d,func=%d,name=%s\n",stream,func,name);
	if(!m_bStart_label_defCoun){
		//head行作成。初回のみ
		m_bStart_label_defCoun = true;
		fprintf(m_fp_csv_wk, "<DefCounter>\n");
	}
	//「カウンタID、カウンタ名、単位」がカウンタ数分Ｎ行あり。
	const uint32_t OFFSET = 50;
	uint32_t id = counter - OFFSET;
	int rc = fprintf(m_fp_csv_wk, "%u,%s,%s\n", id, name, unit);
    if (rc == -1)
    {
		assert(false);
	}
}

void PerfOtfReader::create_header_CSV()
{
/*
<head>
rank_sum=ランク数, start_time=開始時間, end_time=終了時間
<define>
*/
	uint64_t starttime	= m_global_start_time;
	uint64_t endtime	= m_global_end_time;
	uint32_t process_sum =m_process_dic.size();

	assert(process_sum>0);

	//ファイルポインタを先頭に移動して、先頭に書き込む

	fprintf(m_fp_csv_head, "<head>\n");
	int rc = fprintf(m_fp_csv_head, "%u,%lu,%lu\n",process_sum,starttime,endtime);
    if (rc == -1)
    {
		assert(false);
	}
	

}

void PerfOtfReader::create_out_CSV()
{
	#define BUF_SIZE (10000)
	unsigned char buf[BUF_SIZE];
	int i, size;
	FILE *head;
	FILE *wk;
	FILE *out;


	head = fopen( m_label_csvFile_head.c_str(), "rb" );
	if( head == NULL ){
		printf( "head can not open ¥n", m_label_csvFile_head.c_str() );
		assert(false);
	}

	wk = fopen( m_label_csvFile_wk.c_str(), "rb" );
	if( wk == NULL ){
		printf( "wk can not open ¥n", m_label_csvFile_wk.c_str() );
		assert(false);
	}

	out = fopen( m_label_csvFile_out.c_str(), "wb" );
	if( out == NULL ){
		printf( "書込用 %sファイルが開けません¥n", m_label_csvFile_out.c_str() );
		assert(false);
	}

	//head
	while( ( size = fread( buf, sizeof( unsigned char ), BUF_SIZE, head ) ) > 0){
		fwrite( buf, sizeof( unsigned char ), size, out );
	}
	//wk
	while( ( size = fread( buf, sizeof( unsigned char ), BUF_SIZE, wk ) ) > 0){
		fwrite( buf, sizeof( unsigned char ), size, out );
	}

	fclose( head );
	fclose( wk );
	fclose( out );

}

#define pf_max(a, b) ((a) > (b) ? (a) : (b))
#define pf_min(a, b) ((a) < (b) ? (a) : (b))

void PerfOtfReader::update_globalMinMax(const uint64_t& time )
{
	//global start time
	m_global_start_time = pf_min(time , m_global_start_time);

	m_global_end_time = pf_max(time, m_global_end_time);

}

void PerfOtfReader::_handleEnter (const uint64_t& time, 
				  const uint32_t& function, 
				  const uint32_t& process, 
				  const uint32_t& source, 
				  OTF_KeyValueList *list)
{

	debug_printf("_handleEnter time=%lu,function=%d,process=%d\n",time,function,process);

	//「ラベルＩＤ、ランク番号、時間、種別:Enter（=1） or Leave(=2)、Flop値or通信量(Enter時は0, Leave時のみ有効な値)」のＣＳＶ行です。

	if(!m_bStart_label_event){
		//event行作成。初回のみ
		fprintf(m_fp_csv_wk, "<Event>\n");
		m_bStart_label_event = true;
	}

	update_globalMinMax(time);

	//出力しないでmapに登録
	Watch_key key;
	//key.m_function = function;
	key.m_process = process;

	Watch w;
	w.m_function	= function;
	w.m_process		= process;
	w.m_start_time	= time;

	std::map<Watch_key, WatchVec>::iterator it = m_dic.find(key);
	if(it != m_dic.end()){
		//見つかった
		WatchVec& vec = it->second;
		vec.m_watch.push_back(w);
	}else{
		//見つからなかった
		WatchVec vec;
		vec.m_watch.push_back(w);
		m_dic.insert(std::make_pair(key,vec));
	}

/*
	int rc = fprintf(m_fp_label_csv, "%u,%u,%lu,%u,%u\n",function,process,time, ENTER_FUNC_ID, ENTER_FLOP_INIT_VAL);
    if (rc == -1)
    {
		assert(false);
	}
*/


}

void  PerfOtfReader::_handleLeave ( const uint64_t& time, 
								   const uint32_t& function, 
								   const uint32_t& process, 
								   const uint32_t& source, 
								   OTF_KeyValueList *list) 
{

	//TODO:fuchikami 2016/03/23
	//鶴田アドバイスによると
	//vmpirew のサンプルのOTF1はfunction=0に常になっているので
	// キーはプロセス番号のみで辞書管理して
	// enter/leaveのキュー取り出しを実施する
	//本当にこれが正しいかは不明。三上さんのロジックには明示的に
	// enterとペアのleaveがfunction!=0で値が設定されているOTF1になっていると
	//思われるが、vampireを正として以下は実装する

	//最後が不明なので常に更新
	update_globalMinMax(time);

	//キューから取得対応する開始時間を取得するため
	Watch_key key;
	//key.m_function = function;
	key.m_process = process;

	uint64_t end_time		= time;//終了時間
	std::map<Watch_key, WatchVec>::iterator it = m_dic.find(key);
	if(it != m_dic.end()){
		//見つかった　最後に詰まっているWatchを取り出し popで削除してファイルに書きだす
		WatchVec& vec = it->second;
		
		size_t sum = vec.m_watch.size();
		if(sum > 0){
			Watch& w = vec.m_watch.back();

			//ファイル書き込み
			//id, rank, Start time, End time     , value
			uint64_t start_time		= w.m_start_time;
			
			assert(w.m_process == process);

			int rc = fprintf(m_fp_csv_wk, "%u,%u,%lu,%lu,%llu\n", w.m_function, process, start_time, end_time, w.m_value);
			if (rc == -1)
			{
				assert(false);
			}

			// 末尾データを取り出しておく
			vec.m_watch.pop_back();     

		}

	}else{
		//見つからなかった
		//孤児の終了イベント。開始をNANにして書き込み

#ifdef _DEBUG		
		//ありえるのでアサート無し
		//assert(false);
#endif

		int rc = fprintf(m_fp_csv_wk, "%u,%u,%s,%lu,%lu\n", function, process, "NAN", end_time, 0);

		if (rc == -1)
		{
			assert(false);
		}
	}

/*
	//ファイル書き込み
	int rc = fprintf(m_fp_label_csv, "%u,%u,%lu,%u,%lf\n",function,process,time, LEAVE_FUNC_ID, value);
    if (rc == -1)
    {
		assert(false);
	}
*/
}

void  PerfOtfReader::_handleCounter ( 
							const uint64_t time, 
							const uint32_t process, 
							const uint32_t counter, 
							const uint64_t value, 
							OTF_KeyValueList *list)
{
	//最後が不明なので常に更新
	update_globalMinMax(time);

	if (value == 0) return;

	//キューから取得対応する開始時間を取得するため
	Watch_key key;
	//key.m_function = function;
	key.m_process = process;

	uint64_t end_time		= time;//終了時間
	std::map<Watch_key, WatchVec>::iterator it = m_dic.find(key);
	if(it != m_dic.end()){
		//見つかった　最後に詰まっているWatchにvalueを保持
		WatchVec& vec = it->second;
		
		size_t sum = vec.m_watch.size();
		if(sum > 0){
			Watch& w = vec.m_watch.back();
			w.m_value = value;
		}
	}
}

// 開始して終了してない孤児の開始イベントを出力する。終了をNANとして出力
void PerfOtfReader::write_remained_startEvent()
{
	//孤児の開始イベント。終了時間をNANにして書き込み
	std::map<Watch_key, WatchVec>::iterator itr;

    for(itr = m_dic.begin(); itr != m_dic.end(); itr++) {
        const Watch_key& key = itr->first;// キーを表示
        WatchVec& val = itr->second;// 値を表示
		
		for(int i=0;i<val.m_watch.size();i++){

			uint32_t& function		= val.m_watch[i].m_function;
			uint32_t& process		= val.m_watch[i].m_process;
			uint64_t& start_time	= val.m_watch[i].m_start_time;
			
			//孤児はありえる
			//assert(false);

			int rc = fprintf(m_fp_csv_wk, "%u,%u,%lu,%s,%lf\n",function,process,start_time, "NAN",  FLOP_INIT_VAL);
			if (rc == -1)
			{
				assert(false);
			}
		}
    }

}


void PerfOtfReader::_handleDefKeyValue( const uint32_t& stream, 
									   const uint32_t& key, 
									   const OTF_Type& type, 
									   const char* name, 
									   const char* description ) 
{
	debug_printf("handleDefKeyValue stream=%d ,key=%d,name=%s,description=%s\n", stream, key,name,description);
}




/*
int OTF_WStream_writeRecvMsgKV( OTF_WStream* wstream, uint64_t time,
    uint32_t receiver, uint32_t sender, uint32_t communicator,
    uint32_t msgtype, uint32_t msglength, uint32_t scltoken, OTF_KeyValueList* list );
*/

void PerfOtfReader::_handleReceive (const uint64_t& time,
    const uint32_t& receiver, 
	const uint32_t& sender, 
	const uint32_t& communicator,
    const uint32_t& msgtype, 
	const uint32_t& msglength, 
	const uint32_t& scltoken, 
	const OTF_KeyValueList* list)
{

	//「MPI種別Send（=3）orRecv(=4)、送信ランク番号(uint32)、受信ランク番号(uint32)、時間、データタイプ(　表１　No7参照)、データ長(uint32)」がSend/Receive数分Ｎ行あり。

	debug_printf("handleReceive time=%d ,receiver=%d,sender=%d,msglength=%d\n", time, receiver,sender,msglength);

	int rc = fprintf(m_fp_mpi_csv, "%u,%u,%u,%lu,%u,%u\n",
									RECV_FUNC_ID,
									sender, 
									receiver, 
									time,
									msgtype,
									msglength);
    if (rc == -1)
    {
		assert(false);
	}
}

void PerfOtfReader::_handleSend (
	const uint64_t& time, 
    const uint32_t& sender, 
	const uint32_t& receiver,
	const uint32_t& communicator, 
    const uint32_t& msgtype, 
	const uint32_t& msglength, 
	const uint32_t& scltoken, 
	const OTF_KeyValueList* list) 
{
	debug_printf("handleSend time=%d ,sender=%d,receiver=%d,msglength=%d\n", time, sender,receiver,msglength);

	int rc = fprintf(m_fp_mpi_csv, "%u,%u,%u,%lu,%u,%u\n",
									SEND_FUNC_ID,
									sender, 
									receiver, 
									time,
									msgtype,
									msglength);

}

void PerfOtfReader::set_FileNames(const std::string& csv)
{
	assert(csv.size()>0);
	//.csvを削除して
	//最後に_mpi.csvとする
	std::string wk = csv.substr(0,csv.size()-4);
	m_mpi_csvFile = wk + "_mpi.csv";

	m_label_csvFile_out	= csv;
	m_label_csvFile_head = csv + ".head.csv";
	m_label_csvFile_wk	= csv + ".wk.csv";

}

int PerfOtfReader::OtfToCsv(const std::string& otf_withoutExtension, const std::string& csv)
{
	// otf の拡張子は不要のファイル名
	m_otfFile = otf_withoutExtension;
	
	set_FileNames(csv);
	//csvオープン
	open_csv_files();


	OTF_FileManager* manager;
	OTF_Reader* reader;
	OTF_HandlerArray* handlers;

	uint64_t minbytes;
	uint64_t curbytes;
	uint64_t maxbytes;

	uint64_t ret;

	//オープンするファイル数
	uint32_t filesum = PMLIB_OTF_OPEN_FILE_SUM;
	manager= OTF_FileManager_open( filesum );
    assert( manager );

	handlers = OTF_HandlerArray_open();
    assert( handlers );

	const char* otffile = m_otfFile.c_str();
	reader = OTF_Reader_open( otffile, manager );
    assert( reader );

	//DefFunction
	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleDefFunction, OTF_DEFFUNCTION_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_DEFFUNCTION_RECORD );

	//DefProcess
	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleDefProcess, OTF_DEFPROCESS_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_DEFPROCESS_RECORD );

	//DefCounter
	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleDefCounter, OTF_DEFCOUNTER_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_DEFCOUNTER_RECORD );

	
	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleEnter, OTF_ENTER_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_ENTER_RECORD );

	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleLeave, OTF_LEAVE_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_LEAVE_RECORD );

	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleCounter, OTF_COUNTER_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_COUNTER_RECORD );

	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleDefKeyValue, OTF_DEFKEYVALUE_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_DEFKEYVALUE_RECORD );
	
	
	//send /recv
	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleReceive, OTF_RECEIVE_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_RECEIVE_RECORD );

	OTF_HandlerArray_setHandler( handlers, (OTF_FunctionPointer*) handleSend, OTF_SEND_RECORD );
	OTF_HandlerArray_setFirstHandlerArg( handlers, this, OTF_SEND_RECORD );


	OTF_Reader_readDefinitions( reader, handlers );

	uint64_t s = OTF_Reader_getTimeIntervalMin( reader );
	uint64_t e = OTF_Reader_getTimeIntervalMax( reader );


	//limit数毎にメモリアクセスしてイベントコールバック取得
	uint64_t limit = PMLIB_OTF_LIMIT;
	OTF_Reader_setRecordLimit( reader, limit );
	while ( 0 != ( ret= OTF_Reader_readEvents( reader, handlers ) ) ) {
		if( OTF_READ_ERROR == ret ) {
			 
             fprintf( stderr, "Error while reading events. Aborting\n" );
             
			 OTF_Reader_close( reader );
             OTF_HandlerArray_close( handlers );
             OTF_FileManager_close( manager );
             assert(false);
			 exit(1);
        }
		OTF_Reader_eventBytesProgress( reader, &minbytes, &curbytes, &maxbytes );
        debug_printf( "%llub / %llub\n", (long long unsigned)(curbytes - minbytes), (long long unsigned)(maxbytes-minbytes) );

    }
	


	OTF_Reader_close( reader );
	OTF_HandlerArray_close( handlers );
	OTF_FileManager_close( manager );

	//後処理
	write_remained_startEvent();
	//header部分作成
	create_header_CSV();
	
	//CSV閉じる
	close_csv_files();

	//merge csv
	create_out_CSV();

	delete_wk_file();


	return 0;
}

void PerfOtfReader::delete_wk_file()
{

	//wkファイルは不要なので削除
	if( remove( m_label_csvFile_wk.c_str() ) == 0 ){
		printf( "%sファイルを削除しました\n", m_label_csvFile_wk.c_str() );
	}
	else{
		printf( "ファイル削除に失敗しました\n" );
	}

	if( remove( m_label_csvFile_head.c_str() ) == 0 ){
		printf( "%sファイルを削除しました\n", m_label_csvFile_head.c_str() );
	}
	else{
		printf( "ファイル削除に失敗しました\n" );
	}

}

void PerfOtfReader::open_csv_files()
{


	assert(m_label_csvFile_wk.size()>0);
	m_fp_csv_wk = fopen(m_label_csvFile_wk.c_str(), "w");
	if (m_fp_csv_wk == NULL){
		debug_printf("wk file open error %s\n" ,m_label_csvFile_wk.c_str() );
		assert(false);
	}

	assert(m_label_csvFile_head.size()>0);
	m_fp_csv_head = fopen(m_label_csvFile_head.c_str(), "w");
	if (m_fp_csv_head == NULL){
		debug_printf("wk file open error %s\n" ,m_label_csvFile_head.c_str() );
		assert(false);
	}

	m_fp_mpi_csv = fopen(m_mpi_csvFile.c_str(), "w");
	if (m_fp_mpi_csv == NULL){
		debug_printf("file open error %s\n" ,m_mpi_csvFile.c_str() );
		assert(false);
	}

}

void PerfOtfReader::close_csv_files()
{

	fclose(m_fp_csv_wk);
	fclose(m_fp_csv_head);
	fclose(m_fp_mpi_csv);

}


} /* namespace pm_lib */

