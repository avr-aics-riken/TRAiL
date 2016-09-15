#ifndef _PM_PerfOtfReader_H_
#define _PM_PerfOtfReader_H_

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

//! @file   PerfOtfReader.h
//! @brief  PerfOtfReader class Header
//! @version rev.2.2 dated 10/30/2014 

#include <string>
#include "otf.h"
#include <stdio.h>

#include <vector>
#include <map>

namespace pm_lib {
  
//map key
struct Watch_key
{
	// function id はleave 時に常に0の場合があるので信用しない
	//function id
	//uint32_t m_function;
	
	
	//process id
	uint32_t m_process; 

	Watch_key( const Watch_key &obj ){

		//m_function			= obj.m_function;
		m_process			= obj.m_process;		

	};

	Watch_key(){
		//m_function = 0;
		m_process  = 0; 

	};

	bool operator < ( const Watch_key& rhs ) const
	{
		//if(m_function != rhs.m_function){
		//	return m_function < rhs.m_function;
		//}
		
		return m_process < rhs.m_process;

	};
};

//map vector value
// func/proc の開始が呼ばれる毎にinstance
struct Watch
{
	//function id
	uint32_t m_function;
	//process id
	uint32_t m_process;
	//start time
	uint64_t m_start_time;
	//value
	uint64_t m_value;

	// end time は不要。
	// その他属性部も

	Watch(){

		m_function = 0;
		m_process = 0;
		m_start_time = 0;
		m_value = 0;

	};
	Watch( const Watch &obj ){

		m_function			= obj.m_function;
		m_process			= obj.m_process;
		m_start_time		= obj.m_start_time;
		m_value				= obj.m_value;
	};

};

class WatchVec
{
  public:
    /// コンストラクタ.
	  WatchVec(){
		
			m_watch.reserve(10000);
	  };
    
    /// デストラクタ.
	  ~WatchVec(){};

	std::vector<Watch> m_watch;

};

  /**
   * 計算性能「測定時計」クラス.
   */
  class PerfOtfReader {

  public:
    /// コンストラクタ.
	  PerfOtfReader();
    
    /// デストラクタ.
    ~PerfOtfReader();
  
	int OtfToCsv(const std::string& otf, const std::string& csv);



	void _handleDefProcess (const uint32_t& stream, 
							const uint32_t& process, 
							const char *name, 
							const uint32_t& parent);


	void _handleDefFunction (const uint32_t& stream,
							const uint32_t& func, 
							const char *name, 
							const uint32_t& funcGroup,
							const uint32_t& source, 
							OTF_KeyValueList *list);

	void _handleDefCounter (uint32_t stream,
							uint32_t counter, 
							const char* name, 
							uint32_t properties, 
							uint32_t counterGroup, 
							const char* unit, 
							OTF_KeyValueList* kvlist);

	void  _handleEnter (const uint64_t& time, 
					  const uint32_t& function, 
					  const uint32_t& process, 
					  const uint32_t& source, 
					  OTF_KeyValueList *list);

	void  _handleLeave (const uint64_t& time, 
						const uint32_t& function, 
						const uint32_t& process, 
						const uint32_t& source, 
						OTF_KeyValueList *list);

	void  _handleCounter (
						const uint64_t time, 
						const uint32_t process, 
						const uint32_t counter, 
						const uint64_t value, 
						OTF_KeyValueList *list);

	void _handleDefKeyValue( 
						const uint32_t& stream,
						const uint32_t& key, 
						const OTF_Type& type, 
						const char* name, 
						const char *description );


	void _handleSend (
						const uint64_t& time, 
						const uint32_t& sender, 
						const uint32_t& receiver,
						const uint32_t& communicator, 
						const uint32_t& msgtype, 
						const uint32_t& msglength, 
						const uint32_t& scltoken, 
						const OTF_KeyValueList* list) ;

	void _handleReceive (const uint64_t& time,
						const uint32_t& receiver, 
						const uint32_t& sender, 
						const uint32_t& communicator,
						const uint32_t& msgtype, 
						const uint32_t& msglength, 
						const uint32_t& scltoken, 
						const OTF_KeyValueList* list) ;

	void set_FileNames(const std::string& csv);
	void write_remained_startEvent();
	void delete_wk_file();

	void open_csv_files();
	void close_csv_files();

	void create_header_CSV();
	void create_out_CSV();

	void update_globalMinMax(const uint64_t& time );


	std::string m_otfFile;
	std::string m_label_csvFile_out;
	std::string m_label_csvFile_head;
	std::string m_label_csvFile_wk;
	std::string m_mpi_csvFile;

	//ラベル用csv
	FILE* m_fp_csv_out;
	FILE* m_fp_csv_head;
	FILE* m_fp_csv_wk;

	//mpi send recv 用csv
	FILE* m_fp_mpi_csv;

	bool m_bStart_label_defFunc;
	bool m_bStart_label_defCoun;
	bool m_bStart_label_event;

	uint64_t m_global_start_time; 
	uint64_t m_global_end_time; 

	std::map<Watch_key, WatchVec> m_dic;	

	std::map<uint32_t, std::string> m_process_dic;
  };




} /* namespace pm_lib */

#endif // _PM_PerfOtfReader_H_

