#include <stdio.h>
#include <errno.h>
#include <fcntl.h> 
#include <string>
#include <termios.h>
#include <unistd.h>

#include "../DisasterClient.h"
#include "../DisasterServer.h"

#include "Layer1.h"

class SerialClient : public DisasterClient
{
  public:
    SerialClient(std::string name) 
    : portname{name}{};

    int set_interface_attribs(int speed, int parity);

    bool init();
    void loop();

    void receive(struct Datagram datagram, size_t len);

  private:
    std::string portname;
    int tty_file;
    bool serialInitialized;
};
