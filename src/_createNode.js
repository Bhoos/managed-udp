import { Buffer } from 'buffer';

const version = 1;

function checksum(frame) {
  let sum = 0;
  for (let i = 0; i < frame.byteLength - 1; i += 2) {
    sum = (sum + frame.readUInt16BE(i)) & 0xffff;
  }

  return sum;
}

export default function createNode(port, app, socket, id) {
  return {
    send: (type, payload, target) => {
      const frame = Buffer.from(`00${JSON.stringify([version, type, app, id, target && target.id, payload])}`, 'utf-8');
      const cs = checksum(frame);

      let pre = cs;
      for (let i = 2; i < frame.length - 1; i += 2) {
        const next = frame.readUInt16BE(i) ^ pre;
        frame.writeUInt16BE(next, i);
        pre = next;
      }
      frame.writeUInt16BE(cs, 0);

      socket.send(frame, port, target && target.address);
    },

    parse: (data) => {
      try {
        const frame = Buffer.from(data);

        const cs = frame.readUInt16BE(0);
        let pre = cs;
        for (let i = 2; i < frame.length - 1; i += 2) {
          const next = frame.readUInt16BE(i);
          frame.writeUInt16BE(next ^ pre, i);
          pre = next;
        }

        const [rversion, rtype, rapp, rsource, rtarget, rpayload] = JSON.parse(frame.toString('utf-8', 2));

        if (rversion !== version) {
          return null;
        }

        // Only allow messages that are directed towards this app
        // And to this specific node (or is a broadcast)
        if (rapp !== app && (rtarget && rtarget !== id)) {
          return null;
        }

        return {
          version,
          type: rtype,
          app: rapp,
          source: rsource,
          target: rtarget,
          payload: rpayload,
        };
      } catch (e) {
        return null;
      }
    },
  };
}
