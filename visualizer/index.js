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

//Create event listener to initialize network plot and update on packet transmit
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
  label: 'mac',
  broadcasts: ['off', 'on'],
  broadcast: 'on'

};

let svg = d3.select('#plot');

// Bottom-most Layer
let broadcastGroup = svg.append('g')
  .attr('class', 'broadcast');
let routesGroup = svg.append('g')
  .attr('class', 'routes');
let nodesGroup = svg.append('g')
  .attr('class', 'nodes');
let receiveGroup = svg.append('g')
  .attr('class', 'receive');
let packetsGroup = svg.append('g')
  .attr('class', 'packets');
let labelsGroup = svg.append('g')
  .attr('class', 'labels');
let tooltipGroup = svg.append('g')
  .attr('class', 'tooltip');
// Top-most Layer

function getViewMode() {
  return model.mode;
}

function getLabelMode() {
  return model.label;
}

function getBroadcastMode() {
  return model.broadcast;
}

function initModel({ nodes, world, timeDistortion }) {
  model.nodes = nodes;
  model.world = world;
  model.timeDistortion = parseFloat(timeDistortion);

  svg.attr('viewBox', `0 0 ${world.width} ${world.height}`);
  svg.style('width', `${document.documentElement.clientWidth}px`);
  svg.style('height', `${document.documentElement.clientHeight}px`);

  tooltipGroup.selectAll('.tooltip-container').data(model.nodes)
    .enter()

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
      .style('fill', 'rgba(0, 255, 0, 0.5)')
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);
      //.on("click", handleOnClick);

  renderControls();

  console.log(nodes);
}

// Create routing table pop up when mousing over node
function handleMouseOver(d, i) {
  //if there's no label enabled already, at a title label
  let mode = getLabelMode();
  if (mode === 'none') {
    //add rect as background for routing table
    tooltipGroup
      .append("rect")
        .attr("id", "r1")
        .attr("x", d.x)
         .attr("y", d.y - 90)
         .attr("width", 840)
         .attr("height", 220 + d.routeTable.length*110)
         .style('fill', 'rgba(0, 128, 0, 1)');

    tooltipGroup
      .append('text')
      .attr('id', 't0')
       .attr('x', d.x)
       .attr('y', d.y)
       .attr('font-size', '100px')
       .attr('font-family', 'VT323')
       .attr('fill', 'lime')
       .text(function(d){ return 'node ' + model.nodes[i].id + ': ' + model.nodes[i].mac; });
       // this is the "wrong" way to deal with the text but I can't figure out the right way
  }

  // Create HTML table for routing table
  let table = tooltipGroup
    .append('foreignObject')
      .attr('id', 't1')
      .attr('x', d.x)
      .attr('y', d.y)
      .attr('width', 840)
      .attr('height', 110 + d.routeTable.length*110)
      .append('xhtml:body')
        .append('table');
 
  let header = table.append('thead').append('tr')

  header.selectAll('th')
    .data(['ID ', 'Destination  ', 'Hops  ', 'Mertic  '])
    .enter()
    .append('th')
      .text((d) => { return d; });

  let tablebody = table.append('tbody');
  let rows = tablebody.selectAll('tr')
    // get data from routing table array (formatted as array of arrays)
    .data(d.routeTable)
    .enter()
    .append('tr');

  let cells = rows.selectAll('td')
    .data((d) => { return d; })
    .enter()
    .append('td')
    .text((d) => { return d; });
}

function handleMouseOut(d, i) {
    // Select elements by id and then remove
    d3.select('#t0').remove();  // Remove title text
    d3.select('#r1').remove();  // Remove background rect
    d3.select('#t1').remove();  // Remove table
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
    let nextHopNode = model.nodes.find((n) => n.mac === parsedPacket.receiverReadable);
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

  // Highlight node if it is intended receiver
  if (parsedPacket.typeReadable === 'chat') {
    let nextHopNode = model.nodes.find((n) => n.mac === parsedPacket.receiverReadable);
    if(parsedPacket.receiverReadable === parsedPacket.destinationReadable){
      receiveGroup.append('circle')
      .attr('cx', nextHopNode.x)
      .attr('cy', nextHopNode.y)
      .attr('r', 40)
      .style('fill', 'rgba(255, 255, 0, 1)')
      .attr('opacity', 0)
      .transition()
        .duration(getAnimationTime(time))
        .attr('opacity', 1)
        .transition()
        .duration(5000)
          .attr('opacity', 0)
          .remove();
    }
  }

  // Draw broadcast circle, if enabled and is broadcast or routing packet
  if (getBroadcastMode() === 'on' && 
    (parsedPacket.receiverReadable === 'ffffffff' || 
    parsedPacket.receiverReadable === 'afffffff')) {
      broadcastGroup.append('circle')
      .attr('cx', sourceNode.x)
      .attr('cy', sourceNode.y)
      .attr('r', 40)
      .attr('stroke', 'lime')
      .attr('stroke-width', 5)
      .attr('opacity', 0)
      .transition()
        .duration(getAnimationTime(time))
        .attr('r', sourceNode.range)
        .attr('opacity', .3)
        .transition()
        .duration(2000)
          .attr('opacity', 0)
          .remove();
  }

  // update UI route table if packet is addressed to routing multicast address
  if (parsedPacket.receiverReadable === 'afffffff') {
    var length = parsedPacket.totalLength;
    // concat entire datagram, routing table packets do not use destination or type
    var routes = parsedPacket.destination.concat(parsedPacket.type, parsedPacket.data);
    var id, mac, hops, metric;
    for(i = 0; i < length*(1/6); i++ ){
        id = 0;
        mac = routes.slice(i*6, (i*6)+4).map(util.parseHexPair).join('');
        hops = routes[(i*6)+4];
        metric = routes[(i*6)+5];
        for(j = 0; j < model.nodes.length; j++){
            if(model.nodes[j].mac == mac){
                id = model.nodes[j].id;
            }
        }
        sourceNode.routeTable[i] = [id, mac, hops, metric]
    }
  }
}

const emojiCache = window.emojiCache =  {}; // dict of emojis keyed by packet destination
function getEmoji(packet) {
  var key = packet.source+packet.destination;
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

window.setBroadcastMode = function(broadcast) {
  model.broadcast = broadcast;
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
