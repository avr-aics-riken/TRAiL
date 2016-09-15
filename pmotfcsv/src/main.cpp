

#include "PerfOtfReader.h"
#include <string>

int main (int argc, char *argv[])
{
	if(argc!=3){
		printf("parameter is illegal.\n");
		return -1;
	}

	std::string otf = std::string(argv[1]);
	std::string csv = std::string(argv[2]);
	
	printf("otf=%s\n",otf.c_str());
	printf("csv=%s\n",csv.c_str());
	
	pm_lib::PerfOtfReader r;
	int retCode = r.OtfToCsv(otf,csv);
	printf("Result code=%d\n",retCode);

	return 0;
}

