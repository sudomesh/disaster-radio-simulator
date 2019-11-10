const {
  MESSAGE_TYPE_INIT,
  MESSAGE_TYPE_TX,
  MESSAGE_TYPE_SET_TIME_DISTORTION
} = require('./uiMessageTypes.js');

const WebSocket = require('ws');
const port = 8086;

class SimulatorServer {
  constructor({ simulator } = {}) {
    this.simulator = simulator;
    
    this.wss = new WebSocket.Server({ port });
    console.log(`SimulatorServer started on port ${port}`);
    
    this.wss.on('connection', (client) => {
      console.log('SimulatorServer: new client connected');
      
      // Send the initial model (nodes, world params, etc) to every new client
      // that connects
      client.send(JSON.stringify(this.getModelInitData()));

      client.on('message', (msg) => this.handleClientMessage(JSON.parse(msg)));
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

  handleClientMessage(message) {
    switch(message.type) {
      case MESSAGE_TYPE_SET_TIME_DISTORTION:
        this.simulator.setTimeDistortion(message.timeDistortion);
        break;
      default:
        console.error(`Received message of unknown type: ${message.type}`);
    }
  }

  getModelInitData() {
    return {
      type: MESSAGE_TYPE_INIT,
      nodes: this.simulator.nodes.map((n) => {
        return {
          x: n.x,
          y: n.y,
          id: n.id,
          mac: n.mac,
          range: n.radio.opts.range,
          routeTable: []
        };
      }),
      world: {
        width: this.simulator.opts.width,
        height: this.simulator.opts.height
      },
      timeDistortion: this.simulator.opts.timeDistortion
    };
  }
}

module.exports = SimulatorServer;
