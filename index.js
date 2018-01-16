

var d3 = require('d3');
var c = d3.select('#plot')

/*
  // experimental pan/zoom (not working well)
  c.call(d3.zoom().on("zoom", function () {
    c.attr("transform", d3.event.transform)
  }))
*/


var dotData = [
  {
    x: Math.round(Math.random()*500),
    y: Math.round(Math.random()*500),
    radius: 10
  },
  {
    x: Math.round(Math.random()*500),
    y: Math.round(Math.random()*500),
    radius: 25
  }
];

function drawLine() {
  c.append("line")
    .attr('x1', dotData[0].x)
    .attr('y1', dotData[0].y)
    .attr('x2', dotData[1].x)
    .attr('y2', dotData[1].y)
    .attr('stroke-width', 2)
    .attr('stroke', 'blue');
}


function update() {
  var dots = c.selectAll('circle')
  
  var newDots = dots
    .data(dotData)
    .enter()
    .append('circle')

  newDots
    .attr('cx', function(o) {
      return o.x;
    })
    .attr('cy', function(o) {
      return o.y;
    })
    .attr('r', function(o) {
      return o.radius;
    })
    .style('fill', 'green');
  
}

//drawLine();
update();

