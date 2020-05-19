
all: firmware

LL2LIB=./libs/LoRaLayer2/src
DEBUGLIB = ./libs/backward-cpp

FLAGS=-lbfd -ldl -pthread -DBACKWARD_HAS_BFD=1 -DSIM -DBOOST_ERROR_CODE_HEADER_ONLY -DBOOST_SYSTEM_NO_DEPRECATED

CPP_FILES=$(LL2LIB)/Layer1_Sim.cpp \
  $(LL2LIB)/LoRaLayer2.cpp \
  DisasterMiddleware.cpp \
  ./server/DisasterRadio.cpp \
  ./client/WebSocketppClient.cpp \
  ./client/LoRaClient.cpp \
  ./client/SocatClient.cpp \
  ./middleware/Console.cpp \
  utils/utils.cpp \
  simulator.c \
  main.cpp

firmware: main.cpp
	g++ -g -I$(LL2LIB) -I$(DEBUGLIB) -o firmware $(CPP_FILES) $(FLAGS)

clean:
	rm -f firmware 
