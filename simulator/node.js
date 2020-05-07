
var async = require('async');
var spawn = require('child_process').spawn;
var uuid = require('uuid').v4;
var xtend = require('xtend');
var Radio = require('./radio.js');

function randomMac(){
  var mac = '';
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 8  ; i++){
    mac+=hexDigits.charAt(Math.round(Math.random() * 15));
  }
  return mac;
}
  
function Node(opts, radioOpts, routerOpts) {

  this.opts = xtend({
    x: 0,
    y: 0,
    id: 0,
    network: undefined, // The network that this node is part of.
    router: undefined // The router (routing algorithm).
                      // This can either be a js object 
                      // conforming to the Router interface
                      // or a string specifying an external command.
  }, opts || {});

  this.x = this.opts.x;
  this.y = this.opts.y;
  this.id = this.opts.id;
  this.mac = randomMac();
  this.network = this.opts.network

  this.radio = new Radio(radioOpts);

  if(this.opts.router) {
    if(typeof this.opts.router === 'function') {
      this.router = new this.opts.router(routerOpts);
      this.extRouter = false;
    } else if(typeof this.opts.router === 'string') {

      // Spawn router with cmd pointing to firmware c file and args providing the initialization values
      var args = this.opts.router.split(/\s+/);
      var cmd = args[0];
      args = args.slice(1);
      args = args.concat(['-t', this.network.opts.timeDistortion, '-a', this.mac, '-n', this.id ]);
      this.router = spawn(cmd, args);

      // Handle router on close event
      this.router.on('close', function(code) {
        console.error('[node ' + this.id + ' router]', "exited with exit code", code);
        this.router = null;
      }.bind(this));

      // Handle router on data event (i.e. transmitting a message from router)
      this.stdoutBuffer = new Buffer('');
      this.router.stdout.on('data', function(data) {
        this.stdoutBuffer = Buffer.concat([this.stdoutBuffer, data])

        // Slice off the first byte of buffer, it contains the length of the packet
        var len = this.stdoutBuffer.readUInt8(0);
        var packet = this.stdoutBuffer.slice(1, len+1);
        if(this.opts.debug){
          process.stderr.write('[node ' + this.id + ' router] stdout.on(data): ' + packet + '\n');
        }
        this.stdoutBuffer = new Buffer('');
        this.tx(packet);
      }.bind(this));

      if(this.id == this.opts.monitorNode || this.opts.monitorNode == 0){
          this.router.stderr.on('data', function(data) {
              if(this.opts.debug){
                process.stderr.write('[node ' + this.id + ' router] \n' + data.toString());
              }else{
                process.stderr.write(data.toString());
              }
          }.bind(this));
      }
      this.extRouter = true;
    }

  }

  this.toString = function() {
    return '[node ' + this.id + '] ' + this.x + ', ' + this.y + ' - ' + this.radio;
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

  this.txQueue = [];

  // Transmit packet to neighboring nodes
  this.tx = function(data, cb) {
    if(!data) {
      if(!this.txQueue.length) return;
      var o = this.txQueue[this.txQueue.length-1];
      this.txQueue = this.txQueue.slice(1);
      data = o.data;
      cb = o.cb;
    }

    cb = cb || function(){};

    if(this.transmitting) {

      this.txQueue.push({
        data: data,
        cb: cb
      });
      return;
    }
    
    if(this.opts.debug) {
      console.log('[node ' + this.id + '] transmitting packet:', data.toString());
    }

    this.interruptIncoming(); // transmitting interrupts messages being received
    
    var nodes = this.network.nodesInRangeOf(this);

    var i;
    for(i=0; i < nodes.length; i++) {
      nodes[i]._rx(data);
    }
    this.transmitting = true;
    // transmitting on
    this.sendMetaToRouter("t1");
    var time = this.radio.getPayloadTime(data);
    time = this.network.getSimulationTime(time);

    // Notify listeners that we're transmitting. The websocket server
    // listens for these events and forwards to connected viz clients.
    this.network.emit('tx', {
      source: this,
      targets: nodes,
      time: time,
      data: data
    });

    setTimeout(function() {
      this.transmitting = false;
      if(this.opts.debug) {
        console.log('[node ' + this.id + '] transmission completed in ' + time + "ms");
      }
      // transmitting off
      this.sendMetaToRouter("t0");
      cb();
      this.tx(); // send more packets if there are any queued
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
    time = this.network.getSimulationTime(time);

    setTimeout(function() {
      var m = this.incoming[msg.id];

      if(!m.interrupted) {
        this.rx(m.data);
      }

      delete this.incoming[m.id];
    }.bind(this), time);
  }


  this.rx = function(packet) {
    if(!this.router) return;
    if(packet.length > 256) {
      throw new Error("Got packet with size > 256 bytes");
    }

    if(this.opts.debug) {
      console.log('[node ' + this.id + '] received packet: ' + packet.toString());
    }

    if(!this.extRouter) {
      this.router.rx(packet);
      return;
    }

    this.sendToRouter(packet);
  };

  this.sendToRouter = function(packet, is_metadata=0) {
    var b = Buffer.concat([new Buffer([is_metadata]), new Buffer([packet.length]), new Buffer(packet)]);
    this.router.stdin.write(b);
  }

  this.sendMetaToRouter = function(metadata) {
    this.sendToRouter(metadata, 1);
  }

  this.kill = function() {
    if(this.router) this.router.kill();
  };
}

module.exports = Node;
