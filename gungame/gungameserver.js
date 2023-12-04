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

        // detecting future collision
        let future_x = max(0, current_player.x - SPEED);

        for (let player of Object.values(players)) {
            if (player == current_player) {
                continue;
            }
            if (current_player.y < player.y + player.height && current_player.y + current_player.height > player.y && current_player.x >= player.x + player.width) {
                future_x = max(player.x + player.width, future_x)
            }
        }

        current_player.x = future_x;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-hor", data: {player: ws.id, x: current_player.x}})
        });
    })

    handle_event(registered_events, 'move-right', (ws) => {
        current_player = players[ws.id];
        let future_x = min(640 - current_player.width, current_player.x + SPEED);

        for (let player of Object.values(players)) {
            if (player == current_player) {
                continue;
            }
            if (current_player.y < player.y + player.height && current_player.y + current_player.height > player.y && current_player.x + current_player.width <= player.x) {
                future_x = min(player.x - current_player.width, future_x)
            }
        }

        current_player.x = future_x;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-hor", data: {player: ws.id, x: current_player.x}})
        });
    })

    handle_event(registered_events, 'move-up', (ws) => {
        current_player = players[ws.id];
        let future_y = max(0, current_player.y - SPEED);

        for (let player of Object.values(players)) {
            if (player == current_player) {
                continue;
            }
            if (current_player.x < player.x + player.width && current_player.x + current_player.width > player.x && current_player.y >= player.y + player.height) {
                future_y = max(player.y + player.height, future_y)
            }
        }

        current_player.y = future_y;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-ver", data: { player: ws.id, y: current_player.y}})
        });
    })

    handle_event(registered_events, 'move-down', (ws) => {
        current_player = players[ws.id];
        let future_y = min(640 - current_player.height, current_player.y + SPEED);

        for (let player of Object.values(players)) {
            if (player == current_player) {
                continue;
            }
            if (current_player.x < player.x + player.width && current_player.x + current_player.width > player.x && current_player.y + current_player.height <= player.y) {
                future_y = min(player.y - current_player.height, future_y)
            }
        }

        current_player.y = future_y;

        websocketserver.clients.forEach((client) => {
            sendJSON(client, {command: "move-ver", data: {player: ws.id, y: current_player.y}})
        });
    })

    handle_event('shoot', (ws, data) => {

    })

    websocketserver.on('connection', (ws) => {
        ws.id = get_id();
        console.log('connected', ws.id);
        // send all player data
        sendJSON(ws, {command: "init_players", data: players});
        
        players[ws.id] = new Player(ws.id);
        for (let client of websocketserver.clients) {
            sendJSON(client, {command: "add_player", data: {[ws.id]: players[ws.id]}})
        }

        ws.onclose = () => {
            console.log('disconnected', ws.id)
            delete players[ws.id]
            websocketserver.clients.forEach((client) => {
                sendJSON(client, {command: "disconnect", data: {player: ws.id}})
            })
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
        this.width = 50;
        this.height = 50;
        this.id = id;
    }
}

class Bullet {
    constructor(id) {
        this.x = 0;
        this.y = 0;
        this.radius = 4;
        this.id = id;
    }
}

function max(a, b) {
    return a < b ? b : a;
}

function min(a, b) {
    return a < b ? a : b;
}

module.exports = { gungameserver };