
#include <unistd.h>
#include <stdint.h>

#define STDIN 0
#define STDOUT 1
//#define DEBUG

struct serial {
  int (*printf)(const char*, ...);
};

struct serial Serial;

int print_err(const char* format, ...);

int debug_printf(const char* format, ...);

int send_packet(char* data, uint8_t len);

int nsleep(unsigned int secs, useconds_t usecs);

// you must declare these in your router
int setup(); // called once on startup
int loop(); // called once per event loop iteration
int packet_received(char* data, size_t len); // called when a packet is received
