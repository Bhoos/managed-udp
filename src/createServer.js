import { DISCOVER, APPEAR, DISAPPEAR, OPEN, CLOSE, MESSAGE } from './types';
import createListeners from './_createListeners';
import createNode from './_createNode';

const listeners = createListeners([OPEN]);

export default async function createServer(app, id, port, dgram, profile, pin) {
  const socket = dgram.createSocket('udp4');

  const rootNode = createNode(port, app, socket, id);
  const clients = {};

  function createClient() {
    const node = createNode(port, app, socket, id);
    const clientListeners = createListeners([MESSAGE, CLOSE]);

    return {
      send(payload) {
        node.send(MESSAGE, payload, this.target);
      },

      fire(type, args) {
        clientListeners.fire(type, args);
      },

      on(event, listener) {
        clientListeners.add(event, listener);
      },
    };
  }

  function getClient(clientId, address) {
    const client = clients[clientId] || createClient(clientId, address);

    // Since the target might need to be updated due to change in address
    client.target = {
      id: clientId,
      address,
    };

    clients[clientId] = client;
    return client;
  }

  // Listen on a port
  socket.bind(port);

  socket.once('listening', () => {
    rootNode.send(APPEAR, { profile, pin });
    socket.on('message', (data, rinfo) => {
      const msg = rootNode.parse(data);
      if (msg === null) {
        return;
      }

      const { type, payload, source } = msg;
      switch (type) {
        case DISCOVER:
          if (msg.pin === pin) {
            rootNode.send(APPEAR, pin, { id: source, address: rinfo.address });
          }
          break;

        case OPEN:
          listeners.fire(OPEN, [getClient(msg.source, rinfo.address)]);
          rootNode.send(OPEN, null, { id: source, address: rinfo.address });
          break;

        case CLOSE:
          if (clients[source]) {
            clients[source].fire(CLOSE, [source]);
            delete clients[source];
          }
          break;

        case MESSAGE:
          if (clients[source]) {
            clients[source].fire(MESSAGE, [payload, source]);
          }
          break;
        default:

          break;
      }
    });
  });

  return {
    close: () => {
      // Close all the client connections
      Object.keys(clients).forEach((clientId) => {
        const client = clients[clientId];
        delete clients[clientId];
        rootNode.send(CLOSE, null, client.target);
      });
      rootNode.send(DISAPPEAR, null);
    },

    on: (event, listener) => {
      listeners.add(event, listener);
    },
  };
}
