const WebSocket = require('ws');
const port = 8086;

const MESSAGE_TYPE_INIT = 'init';

class SimulatorServer {
  constructor({ simulator } = {}) {
    this.simulator = simulator;
    console.log(`SimulatorServer started on port ${port}`);
    this.wss = new WebSocket.Server({ port });
    this.wss.on('connection', (client) => {
      console.log('SimulatorServer: new client connected');
      client.send(JSON.stringify(this.getModelInitData()));
    });
  }

  broadcast(data) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  getModelInitData() {
    return {
      type: MESSAGE_TYPE_INIT,
      nodes: this.simulator.nodes.map((n) => {
        return {
          x: n.x,
          y: n.y,
          id: n.id,
          range: n.radio.opts.range
        };
      }),
      world: {
        width: this.simulator.opts.width,
        height: this.simulator.opts.height
      }
    };
  }
}

// simulator.on('tx', () => {

// })

// simulator.on('rx', () => {

// })

module.exports = SimulatorServer;
