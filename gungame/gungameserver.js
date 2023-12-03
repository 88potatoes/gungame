const { WebSocketServer } = require('ws');

function gungameserver() {
    const websocketserver = new WebSocketServer({ port: 8082 });

    websocketserver.on('connection', () => {
        console.log('connected');
    })
}

module.exports = { gungameserver };