
all: firmware

LL2LIB=./libs/LoRaLayer2/src

FLAGS=-pthread -DSIM -DBOOST_ERROR_CODE_HEADER_ONLY -DBOOST_SYSTEM_NO_DEPRECATED

CPP_FILES=$(LL2LIB)/Layer1_Sim.cpp \
  $(LL2LIB)/LoRaLayer2.cpp \
  DisasterMiddleware.cpp \
  ./server/DisasterRadio.cpp \
  ./client/WebSocketppClient.cpp \
  ./client/LoRaClient.cpp \
  ./client/SerialClient.cpp \
  ./middleware/Console.cpp \
  main.cpp

firmware: main.cpp
	g++ -g -I$(LL2LIB) $(FLAGS) -o firmware $(CPP_FILES)

clean:
	rm -f firmware 
