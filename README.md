
A javascript network simulator for [disaster.radio](https://disaster.radio) routers written in C.

# Firmware simulator
First install dependencies for compiling the C process that is used by the simulator,

```
sudo apt update
sudo apt install libssl-dev # this is the only one i needed
```

Next, compile the firmware,

```
cd routers
make firmware
```

Finally, run the simulator,

```
cd ..
./simulator.js
```

You can now play around with the network's configuration by modifying simulator.js
The router firmware can be modified through the routers/firmware.c file, you'll need recompile it before re-running the simulator.

# Visual simulator,
This is now functional!

# dependencies
```
npm install
```

# build
```
npm run build
```

# run
```
npm start
```
Be sure to start the simulator if you haven't already (see above), and open a browser to http://localhost:8000.

# develop
```
npm run watch
```

# ToDo

* snr currently does nothing
* rangeDelta currently does nothing
* allow development of routing algorithm in other languages

# license and copyright

* Copyright 2018 Marc Juul
* License: AGPLv3
* `routers/` is dual licensed under both GPLv3 and AGPLv3
