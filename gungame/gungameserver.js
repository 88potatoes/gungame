const { WebSocketServer } = require('ws');

const { handle_event, get_id, parseJSON, sendJSON, PhoneSocketServer } = require('../ws-helpers');

function gungameserver() {
    const SPEED = 5;
    const BULLET_SPEED = 10;
    const FPS = 60;

    console.log('run gungameserver')
    const websocketserver = new WebSocketServer({ port: 8082 });

    const players = {}
    const latent_players = {}
    const bullets = {}
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

    let bullet_id = 0;

    const pss = new PhoneSocketServer({ port: 8083 });

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

        // collisions with blocks
        for (let wall of walls) {
            if (current_player.y < wall.y + wall.sideLength && current_player.y + current_player.width > wall.y && current_player.x >= wall.x + wall.sideLength) {
                future_x = max(wall.x + wall.sideLength, future_x)
            }
        }

        current_player.x = future_x;

        for (let desktop of Object.values(desktops)) {
            sendJSON(desktop, {command: "move-hor", data: {player: ws.id, x: current_player.x}})
        }
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

        for (let wall of walls) {
            if (current_player.y < wall.y + wall.sideLength && current_player.y + current_player.height > wall.y && current_player.x + current_player.width <= wall.x) {
                future_x = min(wall.x - current_player.width, future_x)
            }
        }

        current_player.x = future_x;

        for (let desktop of Object.values(desktops)) {
            sendJSON(desktop, {command: "move-hor", data: {player: ws.id, x: current_player.x}})
        }
    })

    handle_event(registered_events, 'move-up', (ws) => {
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

        for (let desktop of Object.values(desktops)) {
            sendJSON(desktop, {command: "move-ver", data: { player: ws.id, y: current_player.y}})
        }
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

        for (let wall of walls) {
            if (current_player.x < wall.x + wall.sideLength && current_player.x + current_player.width > wall.x && current_player.y + current_player.height <= wall.y) {
                future_y = min(wall.y - current_player.height, future_y)
            }
        }

        current_player.y = future_y;

        for (let desktop of Object.values(desktops)) {
            sendJSON(desktop, {command: "move-ver", data: {player: ws.id, y: current_player.y}})
        }
    })

    // handle_event(registered_events, 'shoot', (ws, data) => {
    //     let player = players[ws.id];
    //     let dx = data.x - player.x;
    //     let dy = data.y - player.y;
    //     let d = Math.sqrt(dx*dx + dy*dy)
    //     let velx = dx/d * BULLET_SPEED;
    //     let vely = dy/d * BULLET_SPEED;
    //     bullets[bullet_id] = new Bullet(bullet_id, player.x + player.width / 2, player.y + player.height /2, velx, vely, ws.id);
    //     websocketserver.clients.forEach((client) => {
    //         sendJSON(client, {command: 'init_bullet', data: bullets[bullet_id]})
    //     })

    //     bullet_id++;
    // })

    handle_event(registered_events, 'phone_join', (ws, data) => {
        ws.device = 'phone'
        if (!ws.alreadyConnected) {
            players[ws.id] = new Player(ws.id, ws.ip);
            
            for (let desktop of Object.values(desktops)) {
                sendJSON(desktop, {command: "add_player", data: {[ws.id]: players[ws.id]}})
            }
        }
    })

    handle_event(registered_events, 'desktop_join', (ws, data) => {
        ws.device = 'desktop'
        desktops[ws.id] = ws;
        // send all player data
        sendJSON(ws, {command: "init_players", data: players});
        sendJSON(ws, {command: "init_walls", data: walls});
    })

    handle_event(registered_events, 'drop-bomb', (ws, data) => {
        const bombid = get_id();
        const player = players[ws.id]
        const bomb = new Bomb(player.x + player.width / 2 - Bomb.sideLength / 2, player.y + player.height / 2 - Bomb.sideLength / 2, bombid)
        bombs[bombid] = bomb
        
        for (let desktop of Object.values(desktops)) {
            sendJSON(desktop, {command: 'create_bomb', data: {x: bomb.x, y: bomb.y, sideLength: Bomb.sideLength, id: bomb.id}})
        }
    })

    websocketserver.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        ws.ip = ip;
        ws.alreadyConnected = false;
        
        if (ws.ip in latent_players) {
            let player = latent_players[ws.ip]
            delete latent_players[ws.ip]
            players[player.id] = player;
            ws.id = player.id
            ws.alreadyConnected = true;
        } else {
            ws.id = get_id();
        }
        // to determine device - is set in 'desktop_join' and 'phone_join' event
        ws.device = null;
        console.log('connected', ws.ip, ws.id);

        ws.onclose = () => {
            console.log('disconnected', ws.id)
            if (ws.device === 'phone') {
                latent_players[ws.ip] = players[ws.id]
                delete players[ws.id]
            }
            console.log(latent_players)
            // websocketserver.clients.forEach((client) => {
            //     sendJSON(client, {command: "disconnect", data: {player: ws.id}})
            // })
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

    function update() {
        // no more need for bullets
        // for (let bullet of Object.values(bullets)) {
        //     bullet.x += bullet.velx;
        //     bullet.y += bullet.vely;
        //     if (bullet.x > 640 || bullet.x < 0 || bullet.y > 640 || bullet.y < 0) {
        //         delete bullets[bullet.id];
        //         websocketserver.clients.forEach((client) => {
        //             sendJSON(client, {command: "delete_bullet", data: {id: bullet.id}})
        //         })
        //         continue;
        //     }


        //     let bullet_hit = false;
        //     for (let player of Object.values(players)) {
        //         if (player.id != bullet.playerID && bullet.x + bullet.radius > player.x && bullet.x < player.x + player.width && bullet.y < player.y + player.height && bullet.y + bullet.radius > player.y) {
        //             bullet_hit = true;
        //             player.hp -= 2;

        //             if (player.hp <= 0) {
        //                 websocketserver.clients.forEach((client) => {
        //                     sendJSON(client, {command: "alert", data: {message: "player died"}})
        //                 })
        //             }
        //             delete bullets[bullet.id];
        //             websocketserver.clients.forEach((client) => {
        //                 sendJSON(client, {command: "delete_bullet", data: {id: bullet.id}})
        //             })
        //             break;
        //         }
        //     }
        //     if (bullet_hit) {
        //         continue;
        //     }

        //     websocketserver.clients.forEach((client) => {
        //         sendJSON(client, {command: "update_bullet", data: {id: bullet.id, x: bullet.x, y: bullet.y}})
        //     })
        // }

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