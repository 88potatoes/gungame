const { WebSocketServer } = require('ws');
const { handle_event, get_id, parseJSON, sendJSON } = require('../ws-helpers');

function gungameserver() {
    const SPEED = 5;

    console.log('run gungameserver')
    const websocketserver = new WebSocketServer({ port: 8082 });

    const players = {}
    const registered_events = {}

    handle_event(registered_events, 'move-left', (ws) => {
        current_player = players[ws.id];
        current_player.x -= SPEED;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-hor", data: {posx: current_player.x}})
        });
    })

    handle_event(registered_events, 'move-right', (ws) => {
        current_player = players[ws.id];
        current_player.x += SPEED;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-hor", data: {posx: current_player.x}})
        });
    })

    handle_event(registered_events, 'move-up', (ws) => {
        current_player = players[ws.id];
        current_player.y -= SPEED;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-ver", data: {posy: current_player.y}})
        });
    })

    handle_event(registered_events, 'move-down', (ws) => {
        current_player = players[ws.id];
        current_player.y += SPEED;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-ver", data: {posy: current_player.y}})
        });
    })

    websocketserver.on('connection', (ws) => {
        console.log('connected');
        ws.id = get_id();
        players[ws.id] = new Player();

        ws.onclose = () => {

        }

        ws.onerror = () => {
            console.log("websocket error")
        }

        ws.onmessage = (message) => {
            const [command, data] = parseJSON(message.data)
            
            if (command in registered_events) {
                registered_events[command](ws, data);
            }
        }
    })
}

class Player {
    constructor(id) {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.id = id;
    }
}

module.exports = { gungameserver };