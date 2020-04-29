#!/usr/bin/env node

var Network = require('./network.js');
var process = require('process');
var SimulatorServer = require('./server.js');
var networkStructure = require('./net_structures/test.json');

var net = new Network({
  // network opts
  netStructure: networkStructure,
  count: 15, // number of nodes in area (will be ignored if given network struct)
  monitorNode: 0, // choose a single node to debug, set to 0 to show all nodes
  width: 3000, // width of area to fill with nodes (will be ignored if given network struct)
  height: 3000, // height of area to fill with nodes (will be ignored if given network struct)
  router: '../routers/firmware',
  debug: false,
  // 1 second in the simulation == 1 second in real life * timeDistortion
  timeDistortion: 1
}, {
  // radio opts
});

var simulatorServer = new SimulatorServer({ simulator: net });

var node = net.nodes[net.opts.monitorNode];
console.log("Nodes within range of node " + net.opts.monitorNode + ": " + net.nodesInRangeOf(node).length)
/*
node.tx("hop 0", function(err) {
  if(err) return console.error(err);

//  console.log("Message sent");
})
*/

process.on('exit', function () {
  net.kill();
});
