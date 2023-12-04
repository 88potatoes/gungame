const canvas = document.getElementById('canv');
const playerListElement = document.getElementById('playerlist')
const { sendJSON, handle_event, parseJSON } = require('../ws-helpers.js')
let goup = false;
let godown = false;
let goright = false;
let goleft = false;

const websocket = new WebSocket('ws://localhost:8082')

const registered_events = {}
let players = {}
let playerElements = {}
let bullets = {}
let bulletElements = {}
let lobbyElements = {}


websocket.onmessage = (event) => {
    const [command, data] = parseJSON(event.data);
    
    if (command in registered_events) {
        registered_events[command](data)
    }
}

// initialise all players initially
handle_event(registered_events, 'init_players', (data) => {
    players = data;
    console.log("init players", Object.values(players))

    for (let player of Object.values(players)) {
        // console.log(player)
        let playerEl = document.createElement('div');
        playerEl.style = `position: absolute; background: red; width: ${player.width}px; height: ${player.height}px; left: ${player.x}px; top: ${player.y}px;`;
        playerElements[player.id] = playerEl;
        canvas.appendChild(playerElements[player.id]);

        // for lobby
        const lobbyElement = document.createElement('li');
        lobbyElement.innerText = `Player ${player.id}`;
        lobbyElements[player.id] = lobbyElement;
        playerListElement.appendChild(lobbyElement)
    }
})

// add a new player upon connection
handle_event(registered_events, 'add_player', (data) => {
    const player = Object.values(data)[0];
    players = {...players, [player.id]: player }
    console.log("players", players)

    let playerEl = document.createElement('div');
    playerEl.style = `position: absolute; background: red; width: ${player.width}px; height: ${player.height}px; left: ${player.x}px; top: ${player.y}px;`;
    playerEl.id = `p${player.id}`
    playerElements[player.id] = playerEl;
    canvas.appendChild(playerElements[player.id]);

    // for lobby
    const lobbyElement = document.createElement('li');
    lobbyElement.innerText = `Player ${player.id}`;
    lobbyElements[player.id] = lobbyElement;
    playerListElement.appendChild(lobbyElement)
})

//handle disconnect event
handle_event(registered_events, 'disconnect', (data) => {
    delete players[data.player]
    canvas.removeChild(playerElements[data.player])
    delete playerElements[data.player]
})

handle_event(registered_events, 'move-hor', (data) => {
    players[data.player].x = data.x;
    playerElements[data.player].style.left = `${data.x}px`;
})

handle_event(registered_events, 'move-ver', (data) => {
    players[data.player].y = data.y
    playerElements[data.player].style.top = `${data.y}px`;
})

handle_event(registered_events, 'init_bullet', (data) => {
    // console.log(data)
    let current_bullet = data;
    bullets[data.id] = data;
    // console.log(bullets)

    let bulletElement = document.createElement('div')
    bulletElement.style = `position: absolute; background: green; width: ${current_bullet.radius}px; height: ${current_bullet.radius}px; left: ${current_bullet.x}px; top: ${current_bullet.y}px;` 

    bulletElements[data.id] = bulletElement;
    canvas.appendChild(bulletElements[data.id]);
})

handle_event(registered_events, 'update_bullet', (data) => {
    bullets[data.id].x = data.x;
    bullets[data.id].y = data.y;
    bulletElements[data.id].style.left = `${data.x}px`;
    bulletElements[data.id].style.top = `${data.y}px`;
})

handle_event(registered_events, 'delete_bullet', (data) => {
    delete bullets[data.id];
    canvas.removeChild(bulletElements[data.id]);
    delete bulletElements[data.id];
})

handle_event(registered_events, 'alert', (data) => {
    alert(data.message)
})

canvas.addEventListener('mousedown', (e) => {
    let boundingRect = canvas.getBoundingClientRect();

    let divx = e.clientX - boundingRect.left;
    let divy = e.clientY - boundingRect.top;

    sendJSON(websocket, {command: "shoot", data: {x: divx, y: divy}})
})

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            goup = true;
            break;
        case 'a':
            goleft = true;
            break;
        case 's':
            godown = true;
            break;
        case 'd':
            goright = true;
            break;
    }
})

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            goup = false;
            break;
        case 'a':
            goleft = false;
            break;
        case 's':
            godown = false;
            break;
        case 'd':
            goright = false;
            break;
    }
})

// lose focus
window.addEventListener('blur', () => {
    console.log('lost focus')
    goup = false;
    godown = false;
    goleft = false;
    goright = false;
})

const loop = () => {
    update();
    render();
    requestAnimationFrame(loop)
};

window.requestAnimationFrame(loop)

function update() {
    if (goup) {
        sendJSON(websocket, {command: "move-up"})
    }
    if (godown) {
        sendJSON(websocket, {command: "move-down"})
    }
    if (goleft) {
        sendJSON(websocket, {command: "move-left"})
    }
    if (goright) {
        sendJSON(websocket, {command: "move-right"})
    }
}

function render() {
    //skip
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