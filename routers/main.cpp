#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <Layer1.h>
#include <LoRaLayer2.h>

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

int setup(){

    LL2.init();
    LL2.setInterval(routeInterval());
    srand(time(NULL) + getpid());
    uint8_t* myAddress = Layer1.localAddress();
    Serial.printf("local address ");
    LL2.printAddress(myAddress);
    chance=rand()%15;
    if(chance == 1){
        Serial.printf(" will transmit");
    }
    Serial.printf("\n");

    // random blocking wait at boot
    int wait = rand()%maxRandomDelay();
    Serial.printf("waiting %d s\n", wait);
    sleep(wait);
    return 0;
}

int loop(){
    if(Layer1.begin_packet()){
        LL2.daemon();
    }
    /*
        checkBuffer(); 
        if(state == 0){
            long timestamp = transmitRoutes(routeInterval(), lastRoutingTime);
            if(timestamp){
                lastRoutingTime = timestamp;
            }
            if(getTime() - startTime > learningTimeout()){
                state++;
                printNeighborTable();
                printRoutingTable();
            }
        }else if(state == 1){
            if(chance == 1){
                long timestamp = transmitToRoute(routeInterval(), lastRoutingTime, dest);
                dest++;
                if(dest == getRouteEntry()){
                    dest = 0;
                }
                if(timestamp){
                    lastRoutingTime = timestamp;
                }
            }
        }
    */
    Layer1.nsleep(0, 1000000*Layer1.simulationTime(1));
}
