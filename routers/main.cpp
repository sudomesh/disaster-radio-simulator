//#define BACKWARD_HAS_DW 1
#include "simulator.h"
#include <backward.cpp>
#include <Layer1_Sim.h>
#include <LoRaLayer2.h>

// server
#include "server/DisasterRadio.h"

// client
#include "client/WebSocketppClient.h"
#include "client/LoRaClient.h"
#include "client/SocatClient.h"

// middleware
#include "middleware/Console.h"

int nodeID = 1;
std::string root = "../routers/static/";

Layer1Class *Layer1 = new Layer1Class();
LL2Class *LL2 = new LL2Class(Layer1);
DisasterRadio *radio = new DisasterRadio();

int state = 0;
int chance;
int dest;

int _routeInterval = 10;
int _learningTimeout = 200;
int _maxRandomDelay = 20;

int routeInterval(){
        return Layer1->simulationTime(_routeInterval);
}
int learningTimeout(){
        return Layer1->simulationTime(_learningTimeout);
}
int maxRandomDelay(){
        return Layer1->simulationTime(_maxRandomDelay);
}

void setupLoRa()
{
  Serial.printf("* Initializing LoRaLayer2...\r\n");
  uint8_t* myAddress = LL2->localAddress();
  LoRaClient *lora_client = new LoRaClient(LL2);
  if (lora_client->init())
  {
    Serial.printf(" --> init succeeded...");
    nodeID = Layer1->nodeID();
    Serial.printf("node ID: %i\r\n", nodeID);
    radio->connect(lora_client);
    //loraInitialized = true;
    return;
  }
  Serial.printf(" --> Failed to initialize LoRa\r\n");
}

void setupSocat()
{
  Serial.printf("* Initializing Serial...\r\n");

  // append nodeID to tty port (used string out of convience)
  std::string port = "./tty/N";
  std::string number = std::to_string(nodeID);
  std::string portname = port + number;

  Serial.printf(" --> connect to %s\r\n", portname.c_str());
  SocatClient *socat_client = new SocatClient(portname);
  if(socat_client->init()){
    Serial.printf(" --> Serial initialized and connected\r\n");
  }
  else{
    Serial.printf(" --> Serial initialized, no device connected\r\n");
  }
  radio->connect(new Console())
    ->connect(socat_client);
}
void setupSocatSocket()
{
  // Sets up an open socat connection that bypasses console
  // intended to be accessed by socatSocket.cpp
  Serial.printf("* Initializing SocatSocket...\r\n");

  // append nodeID to tty port (used string out of convience)
  std::string port = "./tty/WS";
  std::string number = std::to_string(nodeID);
  std::string portname = port + number;

  Serial.printf(" --> socatSocket available at %s\r\n", portname.c_str());
  SocatClient *socat_client = new SocatClient(portname);
  if(socat_client->init()){
    Serial.printf(" --> socatSocket initialized and connected\r\n");
  }
  else{
    Serial.printf(" --> socatSocket initialized, no device connected\r\n");
  }
  radio->connect(socat_client);
}

int setup(){

    srand(time(NULL) + getpid());
    setupLoRa();
    setupSocat();
    setupSocatSocket();
    // random blocking wait at boot
    int wait = rand()%maxRandomDelay();
    Serial.printf("[node %d] waiting %d s\n", nodeID, wait);
    sleep(wait);
    return 0;
}

int loop(){
    radio->loop();
    // nsleep sets time out for reading packet from STDIN
    // setting this helps always read packet correctly
    nsleep(0, 100000*Layer1->simulationTime(1));
}

int main(int argc, char **argv) {
    int opt;
    // handle getopt arguments
    while ((opt = getopt(argc, argv, "t:a:n:")) != -1) {
        switch (opt) {
            case 't':
                Layer1->setTimeDistortion(strtod(optarg, NULL));
                break;
            case 'a':
                LL2->setLocalAddress(optarg);
                break;
            case 'n':
                Layer1->setNodeID(atoi(optarg));
                break;
            default:
                perror("Bad args\n");
                return 1;
        }
    }
    //Enter main program
    int ret = simulator_setup_loop();
    // from simulator.c
    // interfaces with simulator.js via STDOUT/STDIN
    // executes setup and loop functions
    return ret;
}

