# managed-udp

# Usage

```javascript
const server = createServer('marriage', device.id, 24667, dgram, profile, pin);
server.on('open', (client) => {
  client.on('message', (payload) => {

  });

  client.on('close', () => {

  });
});


const client = createClient('marriage', device.id, 24667, dgram);
client.on('appear', (id, profile, pin) => {
  addRooms(profile);
});

client.on('open', () => {
  // Event raised when the client is connected to the server
});

client.on('message', (payload) => {
  client.send(['__sync__', [Date.now(), 0]])
});

client.on('close', () => {

});

client.on('disappear', (id))

client.discover(pin);

client.connect(id);
```
