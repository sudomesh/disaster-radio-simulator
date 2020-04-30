#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <Layer1.h>
#include <LoRaLayer2.h>
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <string>

// server
#include "server/DisasterRadio.h"

// client
#include "client/WebSocketppClient.h"
#include "client/LoRaClient.h"
#include "client/SerialClient.h"

// middleware
#include "middleware/Console.h"

int nodeID = 1;
std::string root = "../routers/static/";

DisasterRadio *radio = new DisasterRadio();

int state = 0;
int chance;
int dest;

int _routeInterval = 10;
int _learningTimeout = 200;
int _maxRandomDelay = 20;

int routeInterval(){
        return Layer1.simulationTime(_routeInterval);
}
int learningTimeout(){
        return Layer1.simulationTime(_learningTimeout);
}
int maxRandomDelay(){
        return Layer1.simulationTime(_maxRandomDelay);
}

void setupLoRa()
{
  Serial.printf("* Initializing LoRaLayer2...\r\n");
  uint8_t* myAddress = LL2.localAddress();
  LoRaClient *lora_client = new LoRaClient();
  if (lora_client->init())
  {
    Serial.printf(" --> init succeeded...");
    nodeID = Layer1.nodeID();
    Serial.printf("node ID: %i\r\n", nodeID);
    radio->connect(lora_client);
    //loraInitialized = true;
    return;
  }
  Serial.printf(" --> Failed to initialize LoRa\r\n");
}

void setupSerial()
{
  Serial.printf("* Initializing Serial...\r\n");

  // append nodeID to tty port (used string out of convience)
  std::string port = "./tty/N";
  std::string number = std::to_string(nodeID);
  std::string portname = port + number;

  Serial.printf(" --> connect to %s\r\n", portname.c_str());
  SerialClient *serial_client = new SerialClient(portname);
  if(serial_client->init()){
    Serial.printf(" --> Serial initialized and connected\r\n");
  }
  else{
    Serial.printf(" --> Serial initialized, no device connected\r\n");
  }
  radio->connect(new Console())
    ->connect(serial_client);
}

void setupWebSocket(){
  Serial.printf("* WebSocketpp not initialized...\r\n");
  /* TODO: Websocketpp polling cause seg fault inside of loop?
  uint16_t port = 8000 + nodeID;
  Serial.printf("* Initializing WebSocketpp...\r\n");
  WebSocketppClient *ws_client = new WebSocketppClient();
  ws_client->startServer(port, root);
  radio->connect(ws_client);
  */
}

int setup(){

    srand(time(NULL) + getpid());
    setupLoRa();
    setupSerial();
    setupWebSocket();
    // random blocking wait at boot
    int wait = rand()%maxRandomDelay();
    //Serial.printf("waiting %d s\n", wait);
    //sleep(wait);
    return 0;
}

int loop(){
    radio->loop();
    // nsleep sets time out for reading packet from STDIN
    // setting this helps always read packet correctly
    nsleep(0, 100000*Layer1.simulationTime(1));
}
