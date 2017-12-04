import { APPEAR, DISAPPEAR, CLOSE, MESSAGE, DISCOVER, OPEN } from './types';
import createNode from './_createNode';
import createListeners from './_createListeners';

const listeners = createListeners([APPEAR, DISAPPEAR, MESSAGE, CLOSE]);

export default function createClient(app, id, port, dgram) {
  const socket = dgram.createSocket('udp4');
  const node = createNode(port, app, socket, id);

  const servers = {};
  let target = null; // Set once connected

  socket.once('listening', () => {
    socket.on('message', (data, rinfo) => {
      const message = node.parse(data);
      // If the message could not be parsed, or is not targetted towards the same app or node
      if (message === null) {
        return;
      }

      switch (message.t) {
        case APPEAR:
          servers[message.source] = rinfo.address;
          listeners.fire(APPEAR, [message.source, message.profile, message.pin]);
          break;

        case DISAPPEAR:
          if (servers[message.source]) {
            delete servers[message.source];
            listeners.fire(DISAPPEAR, [message.source]);
          }
          break;

        case MESSAGE:
          if (target && target.id === message.target) {
            listeners.fire(MESSAGE, [message.payload, message.id]);
          }
          break;

        case CLOSE:
          if (target && target.id === message.target) {
            listeners.fire(CLOSE, [message.id]);
          }
          break;

        default:
          break;
      }
    });
  });

  socket.bind(port);

  return {
    discover: (pin) => {
      node.send(DISCOVER, { pin });
    },

    connect: (serverId) => {
      const address = servers[serverId];
      if (!address) {
        throw new Error(`Server not found ${serverId}`);
      }

      target = {
        id: serverId,
        address,
      };

      node.send(OPEN, {}, target);
    },

    close: () => {
      if (!target) {
        throw new Error('Node is not connected');
      }
      node.send(CLOSE, {}, target);
      socket.close();
      target = null;
    },

    send: (payload) => {
      if (!target) {
        throw new Error('Node is not connected');
      }
      node.send(MESSAGE, { payload }, target);
    },

    on: (event, listener) => {
      if (typeof listener !== 'function') {
        throw new Error(`Listener callback should be a function got ${typeof listener}`);
      }

      listeners.add(event, listener);
    },
  };
}
