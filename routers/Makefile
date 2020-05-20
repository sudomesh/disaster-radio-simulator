
all: firmware

DRLIB=./libs/disaster-radio/firmware/src
LL2LIB=./libs/LoRaLayer2/src
DEBUGLIB = ./libs/backward-cpp

FLAGS=-lbfd -ldl -pthread -DBACKWARD_HAS_BFD=1 -DSIM -DBOOST_ERROR_CODE_HEADER_ONLY -DBOOST_SYSTEM_NO_DEPRECATED

CPP_FILES=$(LL2LIB)/Layer1_Sim.cpp \
  $(LL2LIB)/LoRaLayer2.cpp \
  $(DRLIB)/DisasterMiddleware.cpp \
  $(DRLIB)/server/DisasterRadio.cpp \
  $(DRLIB)/client/WebSocketppClient.cpp \
  $(DRLIB)/client/LoRaClient.cpp \
  $(DRLIB)/client/SocatClient.cpp \
  $(DRLIB)/middleware/Console.cpp \
  $(DRLIB)/utils/utils.cpp \
  simulator.c \
  main.cpp

firmware: main.cpp
	g++ -g -I$(LL2LIB) -I$(DEBUGLIB) -I$(DRLIB) -o firmware $(CPP_FILES) $(FLAGS)

clean:
	rm -f firmware 
