
var uuid = require('uuid').v4;
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

  this.transmitting = false; // is transmit in progress

  this.incoming = {}; // messages currently being received


  this.interruptIncoming = function() {
    if(Object.keys(this.incoming).length) {
      var id;
      for(id in this.incoming) {
        this.incoming[id].interrupted = true;
      }
    }
  }

  this.tx = function(data, cb) {
    if(this.transmitting) return cb(new Error("transmit already in progress"));

    this.interruptIncoming(); // transmitting interrupts messages being received

    var nodes = this.network.nodesInRangeOf(this);

    var i;
    for(i=0; i < nodes.length; i++) {
      nodes[i]._rx(data);
    }
    this.transmitting = true;
    var time = this.radio.getPayloadTime(data);
    console.log("Payload time:", time);

    setTimeout(function() {
      this.transmitting = false;
      cb();
      
    }.bind(this), time);
  }

  this._rx = function(data) {
    // receiving interrupts messages currently being received
    this.interruptIncoming(); 

    var msg = {
      id: uuid(),
      data: data,
      interrupted: false
    };

    this.incoming[msg.id] = msg;

    var time = this.radio.getPayloadTime(data);

    setTimeout(function() {
      var m = this.incoming[msg.id];

      if(!m.interrupted) {
        this.rx(m.data);
      }

      delete this.incoming[m.id];
    }.bind(this), time);
  }


  this.rx = function(msg) {


    // fill me out
  }

}


module.exports = Node;
