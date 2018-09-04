#!/usr/bin/env node

var Network = require('./network.js');

var net = new Network({
  count: 500, // number of nodes in area
  width: 40000, // width of area to fill with nodes
  height: 40000, // height of area to fill with nodes
  debug: true
});


var node = net.nodes[0];
console.log("Nodes within range of node 0:", net.nodesInRangeOf(node).length)

node.tx("Test message")
