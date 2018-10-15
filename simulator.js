#!/usr/bin/env node

var Network = require('./network.js');
var process = require('process');
var SimulatorServer = require('./server.js');

var net = new Network({
  // network opts
  count: 15, // number of nodes in area
  monitorNode: 10,
  width: 2000, // width of area to fill with nodes
  height: 2000, // height of area to fill with nodes
  router: './routers/firmware > /dev/null',
  debug: false,
  // 1 second in the simulation == 1 second in real life * timeDistortion
  timeDistortion: 10
}, {
  // radio opts
});

var simulatorServer = new SimulatorServer({ simulator: net });


var node = net.nodes[0];
console.log("Nodes within range of node 0:", net.nodesInRangeOf(node).length)
/*
node.tx("hop 0", function(err) {
  if(err) return console.error(err);

//  console.log("Message sent");
})
*/
var count = 0;
setInterval(function(){ process.stderr.write("learning..." + count + "\r"); count++; }, 1000);

process.on('exit', function () {
  net.kill();
});
