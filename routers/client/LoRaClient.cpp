#include "LoRaClient.h"

bool LoRaClient::init()
{
    LL2.init();             // initialize Layer2
    LL2.setInterval(10000); // set to zero to disable routing packets
    return true;
}

void LoRaClient::loop()
{
    LL2.daemon();
    struct Packet packet = LL2.readData();
    if (packet.totalLength > HEADER_LENGTH)
    {
        #ifdef DEBUG
        Serial.printf("LoRaCient::loop(): packet.datagram message = ");
        for(int i = 0; i < packet.totalLength-HEADER_LENGTH-DATAGRAM_HEADER; i++){
          Serial.printf("%c", packet.datagram.message[i]);
        }
        Serial.printf("\r\n");
        #endif
        server->transmit(this, packet.datagram, packet.totalLength - HEADER_LENGTH);
    }
}

void LoRaClient::receive(struct Datagram datagram, size_t len)
{
    #ifdef DEBUG
    Serial.printf("LoRaCient::receive(): datagram message = ");
    for(int i = 0; i < len-DATAGRAM_HEADER; i++){
      Serial.printf("%c", datagram.message[i]);
    }
    Serial.printf("\r\n");
    #endif
    LL2.writeData(datagram, len);
}
