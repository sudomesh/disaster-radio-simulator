#ifndef SIMULATOR_H
#define SIMULATOR_H

#include <stdio.h>
#include <stdarg.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/time.h>
#include <Layer1_Sim.h>
#include <LoRaLayer2.h>

typedef struct _serial {
  int (*printf)(const char*, ...);
} serial;

extern serial Serial;
extern serial debug;
extern int nsleep(unsigned int secs, useconds_t usecs);

int simulator_setup_loop();

// declare these in main.cpp 
int setup(); // called once on startup
int loop(); // called once per event loop iteration

extern Layer1Class *Layer1;
#endif
