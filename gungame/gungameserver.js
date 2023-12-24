const { WebSocketServer } = require('ws');
const { XSocketServer } = require('../ws-helpers-server')
const { handle_event, get_id, parseJSON, sendJSON, ws_send } = require('../ws-helpers');
const useragent = require('express-useragent')

function gungameserver() {
    const SPEED = 5;
    const FPS = 60;

    console.log('run gungameserver')
    const xsocketserver = new XSocketServer({port: 8082});

    const players = {}
    const latent_players = {}
    const registered_events = {}
    const desktops = {}
    const walls = [
        new SquareBlock(80, 80, 80),
        new SquareBlock(240, 80, 80),
        new SquareBlock(80, 240, 80),
        new SquareBlock(240, 240, 80)
    ]
    const bombs = {
        0: new Bomb(0, 0, 1)
    };

    xsocketserver.register_event("phone", "move-left", (ws) => {
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

        // collisions with blocks
        for (let wall of walls) {
            if (current_player.y < wall.y + wall.sideLength && current_player.y + current_player.width > wall.y && current_player.x >= wall.x + wall.sideLength) {
                future_x = max(wall.x + wall.sideLength, future_x)
            }
        }

        current_player.x = future_x;

        xsocketserver.broadcast_desktops("move-hor", {player: ws.id, x: current_player.x})
    })

    xsocketserver.register_event('phone', 'move-right', (ws) => {
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

        for (let wall of walls) {
            if (current_player.y < wall.y + wall.sideLength && current_player.y + current_player.height > wall.y && current_player.x + current_player.width <= wall.x) {
                future_x = min(wall.x - current_player.width, future_x)
            }
        }

        current_player.x = future_x;

        xsocketserver.broadcast_desktops("move-hor", {player: ws.id, x: current_player.x})

    })

    xsocketserver.register_event('phone', 'move-up', (ws) => {
        current_player = players[ws.id];
        let future_y = max(0, current_player.y - SPEED);
        
        // collisions with other players
        for (let player of Object.values(players)) {
            if (player == current_player) {
                continue;
            }
            if (current_player.x < player.x + player.width && current_player.x + current_player.width > player.x && current_player.y >= player.y + player.height) {
                future_y = max(player.y + player.height, future_y)
            }
        }
        
        // collisions with blocks
        for (let wall of walls) {
            if (current_player.x < wall.x + wall.sideLength && current_player.x + current_player.width > wall.x && current_player.y >= wall.y + wall.sideLength) {
                future_y = max(wall.y + wall.sideLength, future_y)
            }
        }
        
        current_player.y = future_y;
        
        xsocketserver.broadcast_desktops("move-ver", { player: ws.id, y: current_player.y})
    })
    
    xsocketserver.register_event('phone', 'move-down', (ws) => {
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

        for (let wall of walls) {
            if (current_player.x < wall.x + wall.sideLength && current_player.x + current_player.width > wall.x && current_player.y + current_player.height <= wall.y) {
                future_y = min(wall.y - current_player.height, future_y)
            }
        }

        current_player.y = future_y;

        xsocketserver.broadcast_desktops("move-ver", { player: ws.id, y: current_player.y})
    })

    handle_event(registered_events, 'drop-bomb', (ws, data) => {
        const bombid = get_id();
        const player = players[ws.id]
        const bomb = new Bomb(player.x + player.width / 2 - Bomb.sideLength / 2, player.y + player.height / 2 - Bomb.sideLength / 2, bombid)
        bombs[bombid] = bomb
        
        // xsocketserver.broadcast_desktops("move-ver", { player: ws.id, y: current_player.y})
    })

    xsocketserver.onconnect = (ws, req) => {
        if (ws.device === "desktop") {
            sendJSON(ws, {command: "init_players", data: players});
            sendJSON(ws, {command: "init_walls", data: walls});
        } else {
            if (ws.ip in latent_players) {
                let player = latent_players[ws.ip]
                delete latent_players[ws.ip]
                players[player.id] = player;
                ws.id = player.id
                ws.alreadyConnected = true;
            } else {
                players[ws.id] = new Player(ws.id, ws.ip);
            
                for (let desktop of Object.values(desktops)) {
                    sendJSON(desktop, {command: "add_player", data: {[ws.id]: players[ws.id]}})
                }
            }
        }
    }

    // websocketserver.on('connection', (ws, req) => {


    // })

    function update() {
        for (let bomb of Object.values(bombs)) {
            if (bomb.framesTilBlow === 0) {
                console.log('explode')
                for (let desktop of Object.values(desktops)) {
                    sendJSON(desktop, {command: 'explode_bomb', data: {id: bomb.id}})
                }
                delete bombs[bomb.id]
            }
            bomb.framesTilBlow--;
        }
    }
    
    function run() {
        setInterval(update, 1000 / FPS)
    }

    run();
}

class Player {
    constructor(id, ip) {
        this.x = 0;
        this.y = 0;
        this.width = 50;
        this.height = 50;
        this.id = id;
        this.hp = 10;
        this.ip = ip;
    }
}

class SquareBlock {
    constructor(x, y, sideLength) {
        this.x = x;
        this.y = y;
        this.sideLength = sideLength;
    }
}

class Bullet {
    constructor(id, x, y, velx, vely, playerid) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.id = id;
        this.velx = velx;
        this.vely = vely;
        this.playerID = playerid;
    }
}

class Bomb {
    static damage = 1;
    static sideLength = 30;
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.framesTilBlow = 120;
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