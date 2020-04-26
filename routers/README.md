
This is a port of the disaster.radio firmware written in generic C++ (i.e. not for Arduino). 

This firmware communicates with the simulator using `stdin` and `stdout`.

The main.cpp of the firmware must declare:

```
int setup(); // called once on startup
int loop(); // called once per event loop iteration
```

If data is a null-terminated string then you can set len to 0 and it will be automatically determined. Remember that packets are maximum 256 bytes (not counting the optional null-terminator).

You can use the convenience function `Serial.printf()` to print debug output to `stderr` which will pass it to the javascript simulator and print it to stdout with a header that looks like this:

```
[node <node_id> router] <string>
```

If debug mode is enabled in the simulator then every time a packet is sent or received you will get output like so:

```
[node <node_id>] rx <data>
or
[node <node_id>] tx <data>
```

Remember that you cannot use `stdin` or `stdout` from within the external routers since they are already used for communication between the external router and the simulator so using just `printf()` will break things.

If you use `sleep()` or `usleep()` in `setup()` or `loop()` then this will block the event loop which means that your `packet_received()` function will not be called until after the sleep is over. If you want to avoid this then you can instead call `nsleep(seconds, microseconds)` once inside `loop()` (calling it more than once overrides the previous calls) which will cause `loop()` to be called again the specified amount of time after completion, without blocking packet reception while "sleeping".

