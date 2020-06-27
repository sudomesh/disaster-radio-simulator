#include "simulator.h"

struct timeval to_sleep;
serial Serial;
serial debug;

int nsleep(unsigned int secs, useconds_t usecs) {
  to_sleep.tv_sec = secs;
  to_sleep.tv_usec = usecs;
  return 0;
}

// STDERR acts as Serial.printf
int print_err(const char* format, ...) {
  int ret;
  va_list args;
  va_start(args, format);
  ret = vfprintf(stderr, format, args);
  va_end(args);
  fflush(stderr);
  return ret;
}

// Debug only printf option
int print_debug(const char* format, ...) {
  #ifdef DEBUG
  int ret;
  va_list args;
  va_start(args, format);
  ret = vfprintf(stderr, format, args);
  va_end(args);
  fflush(stderr);
  return ret;
  #endif
  return 0;
}

int simulator_setup_loop(){
  // initialize main loop variables
  char buffer[257];
  struct timeval tv;
  struct timeval start, end;
  gettimeofday(&start, NULL);
  fd_set fds;
  int flags;
  ssize_t ret;
  ssize_t len = 0;
  ssize_t got;
  ssize_t meta = 0;
  nsleep(0, 0); // set intial sleep time value to zero
  Serial.printf = &print_err;
  debug.printf = &print_debug;
  debug.printf("DEBUG PRINTING ENABLED\r\n");
  flags = fcntl(STDIN, F_GETFL, 0);
  if(flags == -1) {
    perror("Failed to get socket flags\n");
    return 1;
  }
  flags = flags | O_NONBLOCK;
  if(ret = fcntl(STDIN, F_SETFL, flags)) {
    perror("Failed to set non-blocking mode\n");
    return 1;
  }
  // Call main setup function
  if(ret = setup()) {
    return ret;
  }
  // Enter main program loop
  while(1) {
    // add STDIN to file descriptor set
    FD_ZERO(&fds);
    FD_SET(STDIN, &fds);
    // set select timeout to sleep time value
    // typically zero, unless you have called nsleep somewhere
    tv.tv_sec = to_sleep.tv_sec;
    tv.tv_usec = to_sleep.tv_usec;
    // select STDIN to see if data is available
    ret = select(STDIN + 1, &fds, NULL, NULL, &tv);
    if(ret < 0) {
      perror("select() failed");
      return 1;
    }
    // set sleep time value back to zero
    to_sleep.tv_sec = 0;
    to_sleep.tv_usec = 0;
    // if STDIN has data availble
    if(ret && FD_ISSET(STDIN, &fds)) {
      if(!meta){
        // readout the metadata flag
        ret = read(STDIN, &meta, 1);
        if(ret < 0) {
          perror("failed to read metadata flag");
          return 1;
        }
      }
      if(!len) {
        // readout the length of the incoming packet
        ret = read(STDIN, &len, 1);
        if(ret < 0) {
          perror("receiving length of incoming packet failed");
          return 1;
        }
        got = 0;
      }
      while(got < len) {
        // readout the received packet
        ret = read(STDIN, (void*)(buffer+got), len-got);
        if(ret < 0) {
          if(errno == EAGAIN) { // we need to wait for more data
            break;
          }
          perror("receiving incoming data failed");
          return 1;
        }
        got += ret;
      }
      if(got < len) {
        continue;
      }
      if(meta){
        // this is meta data message from simualtor,
        // parse for configuration updates
        if(ret = Layer1->parse_metadata(buffer, len)){
          return ret;
        }
      }
      else{
        // this is a normal packet, write to Layer1 rx buffer
        BufferEntry entry;
        memcpy(&entry.data[0], &buffer[0], len);
        entry.length = len;
        Layer1->rxBuffer->write(entry);
        #ifdef DEBUG
        Serial.printf("Layer1::receive(): buffer = ");
        for(int i = 0; i < len; i++){
          Serial.printf("%c", buffer[i]);
        }
        Serial.printf("\r\n");
        #endif
      }
      meta = 0;
      len = 0;
    }
    // Use gettimeofday to find elasped time in milliseconds
    gettimeofday(&end, NULL);
    long seconds = (end.tv_sec - start.tv_sec);
    long micros = ((seconds * 1000000) + end.tv_usec) - (start.tv_usec);
    Layer1Class::setTime((int)(micros/1000));
    // call main loop
    if(ret = loop()) {
      return ret;
    }
  }
return 0;
}
