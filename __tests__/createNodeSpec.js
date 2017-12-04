import createNode from '../src/_createNode';

describe('createNode', () => {
  const socket = {
    send: jest.fn(),
  };

  it('must encode data', () => {
    const APP = 'app';
    const TYPE = 'EV_TYPE';
    const SOURCE = '123456780';
    const TARGET = 'TG12345';
    const IP_ADDRESS = 'IP.ADD.RE.SS';
    const PAYLOAD = { pay: 'load' };

    const node = createNode(1000, APP, socket, SOURCE);
    node.send(TYPE, PAYLOAD, { id: TARGET, address: IP_ADDRESS });
    const frame = socket.send.mock.calls[0][0];

    const res = node.parse(frame);
    expect(res.version).toBe(1);
    expect(res.type).toBe(TYPE);
    expect(res.app).toBe(APP);
    expect(res.source).toBe(SOURCE);
    expect(res.target).toBe(TARGET);
    expect(res.payload).toMatchObject(PAYLOAD);
    expect(socket.send.mock.calls[0][1]).toBe(1000);
    expect(socket.send.mock.calls[0][2]).toBe(IP_ADDRESS);
  });
});

