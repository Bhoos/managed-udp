// Discover servers around in the network (Client => ServerS)
export const DISCOVER = 'discover';

// Server has come up (Server => ClientS)
export const APPEAR = 'appear';

// Server has gone down (Server => ClientS)
export const DISAPPEAR = 'disappear';

// Client wants to connect (Client => Server)
export const OPEN = 'open';

// Connection close request (Both way)
export const CLOSE = 'close';

// Message Request
export const MESSAGE = 'message';
