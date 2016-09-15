#ifndef _PM_PerfOtfWriter_H_
#define _PM_PerfOtfWriter_H_

/* ############################################################################
 *
 * PMlib - Performance Monitor library
 *
 * Copyright (c) 2010-2011 VCAD System Research Program, RIKEN.
 * All rights reserved.
 *
 * Copyright (c) 2012-2015 Advanced Institute for Computational Science, RIKEN.
 * All rights reserved.
 *
 * ############################################################################
 */

//! @file   PerfOtfWriter.h
//! @brief  PerfOtfWriter class Header
//! @version rev.2.2 dated 03/02/2016 

#include <string>
#include <map>
#include "otf.h"

//#ifdef _DEBUG
	#define pm_assert(expr) if(!(expr)){printf("%s:%d:MY_ASSERT\n",__FILE__,__LINE__);assert(false);}
//#else
//	#define pm_assert(expr) ((void)0)
//#endif

typedef bool bool_t;
typedef double double_t;
typedef char char_t;

namespace pm_lib {

  class PerfWatch;

  /**
   * OTF1 出力クラス.
   */
  class PerfOtfWriter {

  public:

    /// 関数グループタイプ
    enum FUNC_GROUP_Type {
      FUNC_GROUP_PMLIB=100,  
    };

    /* two macros that define my keys in key-value-lists  */
	enum LABEL_ATTR_Type{
		//ラベル毎の定義属性
		KEY_EXCLUSIVEFLAG = 1,//char
		KEY_LABEL_TYPE = 2,//char
		KEY_FLOPVAL = 103, //double
		KEY_COMMVAL = 50, //double
		KEY_CALCVAL = 51 //double
	};

	/// コンストラクタ.
	PerfOtfWriter();

	/// デストラクタ.
	~PerfOtfWriter();


	void initialize_otf (const int32_t& init_nWatch);

	void setProperties_otf(const std::string& label, const int& type, const bool_t& exclusive);

	void start_otf (const std::string& label);

	void stop_otf(const std::string& label, double_t flopPerTask, uint32_t iterationCount);

	void gather_otf(void);

	void print_otf(FILE* fp, const std::string hostname, const std::string comments, int32_t seqSections,
				PerfWatch* m_watchArray,   ///< 測定時計配列
				uint32_t m_nWatch         ///< 測定区間数
				);

	void printDetail_otf(FILE* fp, int32_t legend, int32_t seqSections);

	// helper
	bool IsEnable()const;

  private:
	int getLocalStreamID()const;
	OTF_WStream* get_local_stream();
	OTF_WStream* get_global_stream();
	void setup_global_Definion();
	bool isMasterRank() const;
	int32_t get_rank_size() const;
	int32_t get_rank_no() const;

	void setFlopVal( pm_lib::PerfWatch* watchArray, uint32_t nWatch );

	int32_t key_perf_label( std::string arg_st);
	int32_t add_perf_label( std::string arg_st);
	void readRankInfo();
	double getTime();
	void finalize_otf();
	void readEnvVar();
	const char* getfileName()const;


  private:

    OTF_FileManager*	m_manager;
    OTF_WStream*		m_local_stream;

	//ランク番号０だけのグローバルデフィニション
	OTF_WStream*		m_global_stream;

	//ランク情報
	int32_t m_rank_no;
	int32_t m_rank_size;


	std::string m_filename;

	//ラベルとIDのマッピング
	std::map<std::string, int32_t > m_array_of_symbols;
	uint32_t m_nWatch;         ///< 測定区間数
  };
  
} /* namespace pm_lib */

#endif // _PM_PerfOtfWriter_H_

