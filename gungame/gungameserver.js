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
    let coins = {}
    let coinFrames = 0;

    xsocketserver.register_event("phone", "move-left", (ws) => {
        // can't move if still generating coins
        if (coinFrames < 5*FPS) {
            return;
        }
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

        // get coins
        collect_coins(current_player);

        xsocketserver.broadcast_desktops("move-hor", {player: ws.id, x: current_player.x})
    })

    xsocketserver.register_event('phone', 'move-right', (ws) => {
        // can't move if still generating coins
        if (coinFrames < 5*FPS) {
            return;
        }
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

        // get coins
        collect_coins(current_player);

        xsocketserver.broadcast_desktops("move-hor", {player: ws.id, x: current_player.x})

    })

    xsocketserver.register_event('phone', 'move-up', (ws) => {
        // can't move if still generating coins
        if (coinFrames < 5*FPS) {
            return;
        }
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

        // get coins
        collect_coins(current_player);
        
        xsocketserver.broadcast_desktops("move-ver", { player: ws.id, y: current_player.y})
    })
    
    xsocketserver.register_event('phone', 'move-down', (ws) => {
        // can't move if still generating coins
        if (coinFrames < 5*FPS) {
            return;
        }
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

        // get coins
        collect_coins(current_player);

        xsocketserver.broadcast_desktops("move-ver", { player: ws.id, y: current_player.y})
    })


    xsocketserver.register_event('phone', 'drop-bomb', (ws, data) => {
        console.log(ws.id)
        const bombid = get_id();
        const player = players[ws.id]
        console.log(player)
        const bomb = new Bomb(player.x + player.width / 2 - Bomb.sideLength / 2, player.y + player.height / 2 - Bomb.sideLength / 2, bombid)
        console.log(bomb)
        bombs[bombid] = bomb
        
        xsocketserver.broadcast_desktops("create_bomb", {...bomb, "sideLength": Bomb.sideLength})
    })

    xsocketserver.onconnect = (ws, req) => {
        if (ws.device === "desktop") {
            sendJSON(ws, {command: "init_players", data: players});
            sendJSON(ws, {command: "init_walls", data: walls});
            sendJSON(ws, {command: "init_coins", data: Object.values(coins)});
        } else {
            if (ws.ip in latent_players) {
                let player = latent_players[ws.ip]
                delete latent_players[ws.ip]
                players[player.id] = player;
                ws.id = player.id
                ws.alreadyConnected = true;
            } else {
                players[ws.id] = new Player(ws.id, ws.ip);
                xsocketserver.broadcast_desktops("add_player", {[ws.id]: players[ws.id]});
            }
        }
    }

    xsocketserver.register_event('phone', 'toggle_reset', (ws, data) => {
        players[ws.id].reset_agree = !players[ws.id].reset_agree;

        all_agree = true;
        for (let player of Object.values(players)) {
            if (!player.reset_agree ) {
                all_agree = false;
                break;
            }
        }

        if (all_agree) {
            xsocketserver.broadcast_phones('reset_state', 'not_ready')
            xsocketserver.broadcast_desktops('newgame', Object.keys(coins))
            coins = {}
            coinFrames = 0;
            // reset
            // spawn all players in corner
            // destroy all coins
            // give countdown
        } else {
            ws_send(ws, 'reset_state', players[ws.id].reset_agree ? 'ready' : 'not_ready')
        }
        // send msg to phone
    })

    function update() {
        for (let bomb of Object.values(bombs)) {
            if (bomb.framesTilBlow === 0) {
                console.log('explode')
                xsocketserver.broadcast_desktops('explode_bomb', {id: bomb.id})
                delete bombs[bomb.id]
            }
            bomb.framesTilBlow--;
        }

        if (coinFrames < FPS*5) {
            coinFrames++;
            console.log(coinFrames)
            if (coinFrames % 3 == 0) {
                let nCoin = new Coin(Math.floor(Math.random()*640), Math.floor(Math.random()*640), get_id())
                coins[nCoin.id] = nCoin;
                xsocketserver.broadcast_desktops("new_coin", nCoin)
            }
        }
    }
    
    function run() {
        setInterval(update, 1000 / FPS)
    }

    function collect_coins(current_player) {
        for (let coin of Object.values(coins)) {
            if (collidesWith(current_player, coin.x, coin.y, coin.side, coin.side)) {
                console.log('got coin')
                xsocketserver.broadcast_desktops("rm_coin", coin.id)
                delete coins[coin.id];
                current_player.coins++;
                xsocketserver.broadcast_desktops('change_player_score', {id: current_player.id, score: current_player.coins})
            }
        }
    }

    run();
}

function collidesWith(player, ox, oy, ow, oh) {
    return !(player.x + player.width < ox || player.x > ox + ow || player.y > oy + oh || player.y + player.height < oy);
    // if ((current_player.y < wall.y + wall.sideLength && current_player.y + current_player.width > wall.y && current_player.x >= wall.x + wall.sideLength) || (current_player.y < wall.y + wall.sideLength && current_player.y + current_player.height > wall.y && current_player.x + current_player.width <= wall.x) || (current_player.x < wall.x + wall.sideLength && current_player.x + current_player.width > wall.x && current_player.y >= wall.y + wall.sideLength) || (current_player.x < wall.x + wall.sideLength && current_player.x + current_player.width > wall.x && current_player.y + current_player.height <= wall.y))
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
        this.coins = 0;
        this.reset_agree = false;
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

class Coin {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.side = 15;
        this.id = id;
    }
}

module.exports = { gungameserver };

