
var xtend = require('xtend');
var Node = require('./node.js')
var random = require('./random.js');

function network(opts, radioOpts) {

  this.opts = xtend({
    netStructure: {},
    count: 100, // number of nodes
    monitorNode: 0,
    width: 20000, // width of area to fill with nodes
    height: 20000, // height of area to fill with nodes
    debug: false,
    timeDistortion: 1
  }, opts || {});

  this.radioOpts = xtend({
    range: [800, 800], // min and max range of nodes (meters)
    rangeDelta: [0.0, 0.0], // min/max range variation for a node over time (in %)
    snr: [0.2, 0.8], // min/max signal to noise (0 to 1)
    snrDelta: [0.0, 2.0], // min/max snr variation for a node over time (in %)
  }, opts || {});


  this.nodes = [];
  
  var count = this.opts.count;
  if(this.opts.netStructure){
    count = this.opts.netStructure.nodes.length
  }

  console.log(count);
  var i, n;
  for(i=0; i < count; i++) {
    n = new Node(xtend(this.opts, {
      x: random.linear(0, this.opts.width),
      y: random.linear(0, this.opts.height),
      id: this.nodes.length,
      network: this,
    }), xtend(this.radioOpts, {
      range: random.gaussian(this.radioOpts.range),
      rangeDelta: this.radioOpts.rangeDelta,
      snr: random.gaussian(this.radioOpts.snr),
      snrDelta: this.radioOpts.snrDelta
    }));

    this.nodes.push(n);
    if(this.opts.debug) console.log(n.toString());
  }

  if(this.opts.netStructure){
    console.log(this.opts.netStructure.nodes);
    for(i in this.opts.netStructure.nodes){
        this.nodes[i].x = this.opts.netStructure.nodes[i].x;
        this.nodes[i].y = this.opts.netStructure.nodes[i].y;
        this.nodes[i].range = this.opts.netStructure.nodes[i].range;
    }
    this.opts.width = this.opts.netStructure.world.width;
    this.opts.height = this.opts.netStructure.world.height;
  }

  // find nodes within the specified circle;
  this.nodesWithinCircle = function(x, y, radius, ignoreNode) {
    var found = [];
    var top = Math.max(y - radius, 0);
    var bottom = Math.min(y + radius, this.opts.height - 1);
    var left = Math.max(x - radius, 0);
    var right = Math.min(x + radius, this.opts.width - 1);

    var i, n;
    for(i=0; i < this.nodes.length; i++) {
      n = this.nodes[i];
      if(ignoreNode && n.id === ignoreNode.id) continue;
      if(n.y > top && n.y < bottom && n.x > left && n.x < right) {
        if(Math.pow(x - n.x, 2) + Math.pow(y - n.y, 2) <= Math.pow(radius, 2)) {
          found.push(n);
        }
      }
    }
    return found;
  };

  // find nodes within receive range of the specified node
  this.nodesInRangeOf = function(node) {
    return this.nodesWithinCircle(node.x, node.y, node.radio.opts.range, node);
  };

  this.kill = function() {
    var i;
    for(i=0; i < this.nodes.length; i++) {
      this.nodes[i].kill();
    }
  };

  // simple event emitter interface. The websocket server uses this to listen
  // for transmission events to forward to viz clients.

  this.on = function(eventName, cb) {
    this._callbacks = this._callbacks || {};
    this._callbacks[eventName] = this._callbacks[eventName] || [];
    this._callbacks[eventName].push(cb);
  }

  this.emit = function(eventName, message) {
    this._callbacks[eventName].forEach((cb) => cb(message));
  }

  // use this getter to stretch simulation time by a factor of this.timeDistortion
  this.getSimulationTime = function(time) {
    return this.opts.timeDistortion * time;
  }

  this.setTimeDistortion = function(timeDistortion) {
    this.opts.timeDistortion = timeDistortion;
    // broadcast the new timeDistortion value to all nodes
    this.nodes.forEach((node) => node.sendMetaToRouter(`d${timeDistortion}`));
  }
}

module.exports = network;
