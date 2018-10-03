#!/usr/bin/env node

var Network = require('./network.js');
var process = require('process');

var net = new Network({
  count: 3, // number of nodes in area
  width: 2000, // width of area to fill with nodes
  height: 2000, // height of area to fill with nodes
  router: './routers/firmware',
  debug: true,
}, {

  // overwrite radio opts here if needed

});


var node = net.nodes[0];
/*
console.log("Nodes within range of node 0:", net.nodesInRangeOf(node).length)
node.tx("hop 0", function(err) {
  if(err) return console.error(err);

//  console.log("Message sent");
})
*/

//setTimeout(function(){ node.tx("hop 1"); }, 15000);

process.on('exit', function () {
  net.kill();
});
