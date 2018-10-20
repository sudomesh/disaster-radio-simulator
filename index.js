const d3 = window.d3 = require('d3');
const emojis = require('emoji.json/emoji-compact.json');

const util = require('./util.js');
const {
  MESSAGE_TYPE_INIT,
  MESSAGE_TYPE_TX,
  MESSAGE_TYPE_SET_TIME_DISTORTION
} = require('./uiMessageTypes.js');

const wsUrl = 'ws://localhost:8086';
const ws = window.ws = new WebSocket(wsUrl);
checkConnected();

ws.addEventListener('open', (event) => {
  console.log(`Connected to ${wsUrl}`);
});

ws.addEventListener('close', (event) => {
  appendError('WebSocket closed :(\n');
});

ws.addEventListener('error', (event) => {
  appendError('WebSocket error :(\n');
});

function appendError(message) {
  document.getElementById('error').innerText += message;
}

function checkConnected() {
  setTimeout(() => {
    if (ws.readyState === 0) {
      checkConnected();
    } else if (ws.readyState !== 1) {
      appendError('Could not connect to WebSocket. Are you sure the simulator is running? Try ./simulator.js');
    }
  }, 1000);
}

ws.addEventListener('message', (event) => {
  console.log(`Received message: ${event.data}`);
  let message = JSON.parse(event.data);
  
  if (message.type === MESSAGE_TYPE_INIT) {
    initModel(message);
  } else if (message.type === MESSAGE_TYPE_TX) {
    transmitPacket(message);
  }
});

let model = window.model = {
  nodes: [],
  packets: [],
  world: {},
  timeDistortion: null,
  animationSpeed: '1',
  modes: ['emoji', 'packet'],
  mode: 'emoji',
  labels: ['none', 'id', 'mac'],
  label: 'mac'
};

let svg = d3.select('#plot');
let labelsGroup = svg.append('g')
  .attr('class', 'labels');
let nodesGroup = svg.append('g')
  .attr('class', 'nodes');
let routesGroup = svg.append('g')
  .attr('class', 'routes');
let packetsGroup = svg.append('g')
  .attr('class', 'packets');

function getViewMode() {
  return model.mode;
}

function getLabelMode() {
  return model.label;
}

function initModel({ nodes, world, timeDistortion }) {
  model.nodes = nodes;
  model.world = world;
  model.timeDistortion = parseFloat(timeDistortion);

  svg.attr('viewBox', `0 0 ${world.width} ${world.height}`);
  svg.style('width', `${document.documentElement.clientWidth}px`);
  svg.style('height', `${document.documentElement.clientHeight}px`);

  labelsGroup.selectAll('text').data(model.nodes)
    .enter()
    .append('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('font-size', '100px')
      .attr('font-family', 'VT323')
      .attr('fill', 'lime');
  updateLabels();

  nodesGroup.selectAll('.node-container').data(model.nodes)
    .enter()
    .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 40)
      .style('fill', 'rgba(0, 255, 0, 0.5)');

  renderControls();

  console.log(nodes);
}

function updateLabels(){
  let mode = getLabelMode();
  labelsGroup.selectAll('text').text((d) => {
    if (mode === 'none') {
      return '';
    } else if (mode === 'id') {
      return d.id;
    } else if (mode === 'mac') {
      return d.mac;
    }
  });
}

function transmitPacket({ source_id, target_ids, time, data }) {
  let sourceNode = model.nodes.find((n) => n.id === source_id);
  if (!sourceNode) {
    console.warn(`Could not find node with id ${source_id}. This shouldn't happen.`);
    return;
  }

  // create one new packet per target id
  let packetEmoji = getEmoji(util.parsePacket(data.data));
  let newPackets = target_ids.map((id) => {
    return {
      source_id: source_id,
      target_id: id,
      data: data,
      time: time,
      emoji: packetEmoji
    };
  });
  model.packets = model.packets.concat(newPackets);
  
  let newPacketEls = packetsGroup.selectAll('.packet-container').data(model.packets)
    .enter()
    .append('g')
      .attr('class', 'packet-container')
      .attr('transform', `translate(${sourceNode.x}, ${sourceNode.y})`)
  
  let getAnimationTime = function(time) {
    if (model.animationSpeed.endsWith('fixed')) {
      return parseFloat(model.animationSpeed);
    } else {
      return parseFloat(model.animationSpeed) * time;
    }
  };

  newPacketEls
    .transition()
    .duration(getAnimationTime(time))
    .attr('transform', (packet) => {
      let targetNode = model.nodes.find((n) => n.id === packet.target_id);
      if (!targetNode) {
        console.warn(`Could not find node with id ${packet.target_id}. This shouldn't happen.`);
        return;
      }
      return `translate(${targetNode.x}, ${targetNode.y})`;
    })
    .on('end', (packet) => {
      // delete the packet once it arrives at its destination
      model.packets = model.packets.filter((p) => p !== packet); 
    })
    .remove();

  newPacketEls.append('text')
    .attr('class', 'packet-text')
    .attr('font-size', '100px')
    .attr('font-family', 'VT323')
    .attr('fill', 'lime')
    .text((packet) => getViewMode() === 'emoji' ? packet.emoji : 'packet');

  // render route lines if it's a chat packet
  let parsedPacket = util.parsePacket(data.data);
  if (parsedPacket.typeReadable === 'chat') {
    let nextHopNode = model.nodes.find((n) => n.mac === parsedPacket.nextHopReadable);
    console.log(nextHopNode);
    routesGroup.append('line')
      .attr('x1', sourceNode.x)
      .attr('y1', sourceNode.y)
      .attr('x2', sourceNode.x)
      .attr('y2', sourceNode.y)
      .attr('stroke', 'lime')
      .attr('stroke-dasharray', '40 20')
      .attr('stroke-width', 5)
      .attr('opacity', 1)
      .transition()
        .duration(getAnimationTime(time))
        .attr('x2', nextHopNode.x)
        .attr('y2', nextHopNode.y)
        .transition()
        .duration(5000)
          .attr('opacity', 0)
          .remove();
  }
}

const emojiCache = window.emojiCache =  {}; // dict of emojis keyed by packet destination
function getEmoji(packet) {
  var key = packet.source+packet.destination+packet.sequence
  if (!(key in emojiCache)) {
    emojiCache[key] = emojis[Math.floor(Math.random() * emojis.length)]; 
  }
  return emojiCache[key];
}

// Controls

window.setTimeDistortion = (timeDistortion) => {
  model.timeDistortion = timeDistortion;
  sendTimeDistortionMessage(model.timeDistortion);
  renderControls();
}

window.setLabelMode = function(label) {
  model.label = label;
  updateLabels();
  renderControls();
}

window.setViewMode = function(mode) {
  model.mode = mode;
  renderControls();
}

window.setAnimationSpeed = function(speed) {
  model.animationSpeed = speed;
  renderControls();
}

function renderControls() {
  d3.select('#controls').selectAll('.button')
    .classed('toggled', function() {
      let el = d3.select(this);
      return model[el.attr('my-model')] == el.attr('my-value');
    });
}

function sendTimeDistortionMessage(timeDistortion) {
  ws.send(JSON.stringify({
    type: MESSAGE_TYPE_SET_TIME_DISTORTION,
    timeDistortion: timeDistortion
  }));
}
