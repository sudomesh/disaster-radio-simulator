#!/usr/bin/env node

var Network = require('./network.js');
var process = require('process');

var net = new Network({
  count: 1, // number of nodes in area
  width: 2000, // width of area to fill with nodes
  height: 2000, // height of area to fill with nodes
  router: './routers/ping_example',
  debug: true,
  airtime: false
}, {

  // overwrite radio opts here if needed

});


var node = net.nodes[0];
console.log("Nodes within range of node 0:", net.nodesInRangeOf(node).length)
/*
node.tx("hop 0", function(err) {
  if(err) return console.error(err);

//  console.log("Message sent");
})
*/

process.on('exit', function () {
  net.kill();
});
