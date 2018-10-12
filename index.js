const d3 = window.d3 = require('d3');
const emojis = require('emoji.json/emoji-compact.json');

const wsUrl = 'ws://localhost:8086';
const ws = new WebSocket(wsUrl);
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
  
  if (message.type === 'init') {
    initModel(message);
  } else if (message.type === 'tx') {
    transmitPacket(message);
  }
});

let model = window.model = {
  nodes: [],
  packets: [],
  world: {},
  modes: ['emoji', 'packet'],
  modeIndex: 0
};

let svg = d3.select('#plot');
let nodesGroup = svg.append('g')
  .attr('class', 'nodes');
let packetsGroup = svg.append('g')
  .attr('class', 'packets');

window.toggleViewMode = function() {
  model.modeIndex = (model.modeIndex + 1) % model.modes.length;
}

function getViewMode() {
  return model.modes[model.modeIndex];
}

function initModel({ nodes, world }) {
  model.nodes = nodes;
  model.world = world;

  svg.attr('viewBox', `0 0 ${world.width} ${world.height}`);
  svg.style('width', `${document.documentElement.clientWidth}px`);
  svg.style('height', `${document.documentElement.clientHeight}px`);

  nodesGroup.selectAll('.node-container').data(model.nodes)
    .enter()
    .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 40)
      .style('fill', 'rgba(0, 255, 0, 0.5)');
  
  console.log(nodes);
}

function transmitPacket({ source_id, target_ids, time, data }) {
  let sourceNode = model.nodes.find((n) => n.id === source_id);
  if (!sourceNode) {
    console.warn(`Could not find node with id ${source_id}. This shouldn't happen.`);
    return;
  }

  // create one new packet per target id
  let packetEmoji = emojis[Math.floor(Math.random() * emojis.length)];
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
  
  newPacketEls
    .transition()
    .duration(time * 10) // make the animation 1/10th actual speed
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
    .attr('font-size', '60px')
    .attr('font-family', 'VT323')
    .attr('fill', 'lime')
    .text((packet) => getViewMode() === 'emoji' ? packet.emoji : 'packet');
}