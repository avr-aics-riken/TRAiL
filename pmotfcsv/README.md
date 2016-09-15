# pmotfcsv

Converter to CSV file from OTF1 data for TRAiL

## Requires
- OpenMPI : 1.10.2 or higher
- OTF salmon : 1.12.5

## Installation
	 - MacOSX / Linux
```bash
$ ./configure --prefix=/usr/local CPPFLAGS="-I~/OTF-1.12.5salmon/otflib" LDFLAGS="-L/usr/local/lib" LIBS=-lopen-trace-format CXX=mpicxx CC=mpicc CXXFLAGS="-O3" CFLAGS="-O3"
$ make
$ sudo make install
```

## Run
	 - MacOSX / Linux
```bash
$ pmotfcsv input.otf output.csv
```
     
## Dependents

- OpenMPI (https://www.open-mpi.org/)
- OTF salmon (https://tu-dresden.de/die_tu_dresden/zentrale_einrichtungen/zih/forschung/projekte/otf/)
