
var async = require('async');
var spawn = require('child_process').spawn;
var uuid = require('uuid').v4;
var xtend = require('xtend');
var Radio = require('./radio.js');

// parse packets from incoming data
function parsePackets(data) {
  if(!data) return;
  var packets = [];
  var len;
  var got = 0;

  while(got < data.length) {
  
    len = data.readUInt8(got);
    if(len < 1) {
      console.error("Got bad packet from external router!");
      process.exit(1);
    }
    if(len > data.length - got - 1) {
      return {
        packets: packets,
        partial: data.slice(got)
      }
    }

    packets.push(data.slice(got + 1, got + len + 1));
    got += len;
  }
  return {
    packets: packets
  }
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
  this.network = this.opts.network

  this.radio = new Radio(radioOpts);

  if(this.opts.router) {
    if(typeof this.opts.router === 'function') {
      this.router = new this.opts.router(routerOpts);
      this.extRouter = false;
    } else if(typeof this.opts.router === 'string') {

      var args = this.opts.router.split(/\s+/);
      var cmd = args[0];
      args = args.slice(1);

      this.router = spawn(cmd, args);

      this.router.on('close', function(code) {
        console.error("Router", this.id, "exited with exit code", code);
        this.router = null;
      }.bind(this));

      this.stdoutBuffer = new Buffer();

      this.router.stdout.on('data', function(data) {
        var o = parsePackets(data);

        if(o.partial) {
          this.stdoutBuffer = Buffer.concat(this.stdoutBuffer, o.partial);
        }

        async.eachSeries(o.packets, this.tx, function(err) {
          if(err) console.error(err);

          // TODO how do we handle errors
        });

      }.bind(this));

      this.extRouter = true;
    }

  }

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
    cb = cb || function(){};
    if(this.transmitting) return cb(new Error("transmit already in progress"));

    this.interruptIncoming(); // transmitting interrupts messages being received

    var nodes = this.network.nodesInRangeOf(this);

    var i;
    for(i=0; i < nodes.length; i++) {
      nodes[i]._rx(data);
    }
    this.transmitting = true;
    var time = this.radio.getPayloadTime(data);

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


  this.rx = function(packet) {
    if(!this.router) return;
    if(packet.length > 256) {
      throw new Error("Got packet with size > 256 bytes");
    }

    if(!this.extRouter) {
      this.router.rx(packet);
      return;
    }

    var b = Buffer.concat(new Buffer([msg.length]), new Buffer(msg));
    this.router.stdin.write(b);
  }

}


module.exports = Node;
