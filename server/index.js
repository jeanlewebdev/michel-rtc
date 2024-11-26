const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString()); // Ensure valid string data is broadcasted
            }
        });
    });
});

console.log('Signaling server running on ws://localhost:3000');
