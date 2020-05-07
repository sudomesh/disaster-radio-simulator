
A javascript network simulator for the [disaster.radio](https://disaster.radio) routing protocol.

![](screenshot.png?raw=true)

This simulator comes in three parts,
* `router` - a full port of the disaster.radio firmware that can be run inside of a Linux system
* `simulator` - a node js script that creates a virtual network of disaster radio routers
* `visualizer` - a browser-based "visual simulator" that provides a visual representation of the simulated network


The default protocol used in this simulator is [LoRaLayer2](https://github.com/sudomesh/LoRaLayer2), find more details about the protocol on [our wiki](https://github.com/sudomesh/disaster-radio/wiki/Protocol).

## Prerequisites
It is best to run this simulator on an Ubuntu 18.04 machine. It is unknown how it will perform on other operating systems, though it should be possible to run it on any given machine.  

Install the dependencies for compiling the firmware,
```
sudo apt update
sudo apt install build-essential libwebsocketpp-dev libboost-dev libdw-dev
```
You will need version 7.10 of Node.js to run the simulator script and build the web app. it is recommended that you use something like [nvm](https://github.com/nvm-sh/nvm) to install the correct version of Node.js.

## Router Firmware

### Compile the firmware

From the root of the repository, navigate to the routers directory, and get fetch the dependencies (i.e. the latest LoRaLayer2 library),  
```
cd routers
./fetch_deps.sh
```
Then compile the firmware with,
```
make firmware
```
After making any changes to the firmware source files, it is recommended you recompile by running,
```
make clean
make firmware
```

### Test the firmware

Start a single disaster.radio node by running,
```
./firmware
```
Connect to your virtual node by creating a PTY using socat, like so
```
socat PTY,link=./tty/N1,raw,echo=0 -
```
`N1` corresponds to the ID of the node you wish to connect to.

## Simulator Script

Once the firmware has been compiled and test, you can run the simulator. From the root of the repository,
```
cd simulator
npm install
./simulator.js
```
This should produce a large amount of output showing that all of your nodes have been started and tell you the tty file to which you can connect.

You can now play around with the network's configuration by modifying the options in `simulator.js`. The structure of the network can be changed by modifiying the json files in `simulator/net_structures/`  

The router firmware can be modified in the `routers/` directory, you must recompile it before re-running the simulator.  

## Visualizer Web App

From the root of the repository, navigate into the visualizer directory, install javascript dependencies, build and start the web app.
```
cd visualizer 
npm install
npm run build
npm start
```
Be sure to also start `simulator.js` if you haven't already (see above), and open a browser to http://localhost:8000.

You can develop the server using,
```
npm run watch
```
## Using the Simulator
To send messages from one simulated node to another, you need to access the nodes over a virtual tty device using socat.  
From the root of the repository, navigate to the simulator directory and create the virtual tty device,  
```
cd simulator
socat PTY,link=./tty/N0,raw,echo=0 -
```
`N0` corresponds to the ID of the node you wish to connect to. The node IDs can be found in the visualizer or in the net structures json files.  

After pressing the Enter key once, you should be greeted by a disaster radio banner.  
You can then open another terminal and again from the simulator directory create another virtual tty device for a different node.  
```
socat PTY,link=./tty/N1,raw,echo=0 -
```
This can be done for as many node as you would like to observe. Ideally, they should behave just as though you were conencted via serial or telnet to a real disaster radio node.  

Send broadcast messages from the any of the socat instances you have opened by typing your message an pressing enter. You can send a direct/routed message to a specific node by starting the message with `@<node address>`, node addresses can be copied from the routing table, which can be viewed by typing `/lora`. Watch the packet get forwarded by each node in the route in the visualizer. 

# ToDo
* expand visual interface (e.g. choose which nodes send/receive packets, inspect metrics and routing tables)
* fix various bugs, https://github.com/sudomesh/disaster-radio-simulator/issues

# License and copyright
* Copyright 2020 Sudo Mesh
* javascript simulator is licensed AGPLv3
* `routers/*` is dual-licensed under both GPLv3 and AGPLv3
