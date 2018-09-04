
var xtend = require('xtend');
var Radio = require('./radio.js');


function Node(opts, radioOpts) {

  this.opts = xtend({
    x: 0,
    y: 0,
    id: 0,
    network: undefined
  }, opts || {});

  this.x = this.opts.x;
  this.y = this.opts.y;
  this.id = this.opts.id;
  this.network = this.opts.network

  this.radio = new Radio(radioOpts);


  this.toString = function() {
    return '[node] ' + this.id + ': ' + this.x + ', ' + this.y + ' - ' + this.radio;
  }

  this.tx = function(msg) {
    var nodes = this.network.nodesInRangeOf(this);
    var i;
    for(i=0; i < nodes.length; i++) {
      nodes[i].rx(msg);
    }
  }

  this.rx = function(msg) {
    // fill me out
  }

}


module.exports = Node;
