const d3 = window.d3 = require('d3');

const wsUrl = 'ws://localhost:8086';
const ws = new WebSocket(wsUrl);

ws.addEventListener('open', (event) => {
  console.log(`Connected to ${wsUrl}`);
});

ws.addEventListener('message', (event) => {
  let message = JSON.parse(event.data);
  console.log(`Received message: ${message}`);
  if (message.type === 'init') {
    initModel(message);
  } else {

  }
});

function initModel({ nodes, world }) {
  let svg = d3.select('#plot');

  svg.attr('viewBox', `0 0 ${world.width} ${world.height}`);
  svg.style('width', `${document.documentElement.clientWidth}px`);
  svg.style('height', `${document.documentElement.clientHeight}px`);

  let nodesGroup = svg.append('g')
    .attr('class', 'nodes');

  nodesGroup.selectAll('.node-container').data(nodes)
    .enter()
    .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 40)
      .style('fill', 'rgba(0, 255, 0, 0.5)');
  
  console.log(nodes);

}