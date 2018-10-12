const WebSocket = require('ws');
const port = 8086;

const MESSAGE_TYPE_INIT = 'init';
const MESSAGE_TYPE_TX = 'tx';

class SimulatorServer {
  constructor({ simulator } = {}) {
    this.simulator = simulator;
    
    this.wss = new WebSocket.Server({ port });
    console.log(`SimulatorServer started on port ${port}`);
    
    // Send the initial model (nodes, world params, etc) to every new client
    // that connects
    this.wss.on('connection', (client) => {
      console.log('SimulatorServer: new client connected');
      client.send(JSON.stringify(this.getModelInitData()));
    });

    // Send model updates (e.g. transmissions) when they occur
    simulator.on('tx', (message) => {
      this.broadcast(JSON.stringify({
        type: MESSAGE_TYPE_TX,
        source_id: message.source.id,
        target_ids: message.targets.map((n) => n.id),
        time: message.time,
        data: message.data
      }));
    });

    // simulator.on('rx', () => {

    // })
  }

  broadcast(data) {
    this.wss.clients.forEach(function each(client) {
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

module.exports = SimulatorServer;
