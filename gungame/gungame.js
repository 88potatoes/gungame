const canvas = document.getElementById('canv');
const element = document.createElement('div');
const { sendJSON, handle_event, parseJSON } = require('../ws-helpers.js')
canvas.appendChild(element)
let posx = 10;
let posy = 60;
element.style = "position: absolute; background: red; width: 50px; height: 50px;"
element.style.left = `${posx}px`;
element.style.top = `${posy}px`;
let goup = false;
let godown = false;
let goright = false;
let goleft = false;

const websocket = new WebSocket('ws://localhost:8082')

const registered_events = {}
let players = {}
let playerElements = {}


websocket.onmessage = (event) => {
    const [command, data] = parseJSON(event.data);
    
    if (command in registered_events) {
        registered_events[command](data)
    }
}

// initialise all players initially
handle_event(registered_events, 'init_players', (data) => {
    players = data;
    // console.log(players)

    for (let player of Object.values(players)) {
        // console.log(player)
        let playerEl = document.createElement('div');
        playerEl.style = "position: absolute; background: red; width: 50px; height: 50px;";
        playerEl.style.left = `${player.x}px`
        playerEl.style.top = `${player.y}px`
        playerElements[player.id] = playerEl;
        canvas.appendChild(playerElements[player.id]);
    }
})

// add a new player upon connection
handle_event(registered_events, 'add_player', (data) => {
    console.log('another player connected', Object.values(data)[0])
    const player = Object.values(data)[0];
    // console.log('playerElements', playerElements)
    players = {...players, [player.id]: player }

    // console.log(players)
    // console.log(data)
    console.log(players)

    let playerEl = document.createElement('div');
    playerEl.style = "position: absolute; background: red; width: 50px; height: 50px;";
    playerEl.style.left = `${player.x}px`
    playerEl.style.top = `${player.y}px`

    console.log('playerElements', playerElements)
    // console.log('playerElements', playerE)
    console.log('player', player)
    playerElements[player.id] = playerEl;
    canvas.appendChild(playerElements[player.id]);
})

handle_event(registered_events, 'move-hor', (data) => {
    console.log('players: ', players)
    console.log('move-hordata', data)
    // console.log('player:', data.player)
    players[data.player].x = data.x;
    console.log(playerElements, data, data.player)
    playerElements[data.player].style.left = `${data.x}px`;
    
})

handle_event(registered_events, 'move-ver', (data) => {
    players[data.player].y = data.y
    playerElements[data.player].style.top = `${data.y}px`;
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

const loop = () => {
    update();
    render();
    requestAnimationFrame(loop)
};

window.requestAnimationFrame(loop)

const vel = 6;
function update() {
    if (goup) {
        sendJSON(websocket, {command: "move-up"})
        console.log('move-up')
    }
    if (godown) {
        sendJSON(websocket, {command: "move-down"})
        console.log('move-down')
    }
    if (goleft) {
        sendJSON(websocket, {command: "move-left"})
        console.log('move-left')
    }
    if (goright) {
        sendJSON(websocket, {command: "move-right"})
        console.log('move-right')
    }
}

function render() {
    element.style.top = `${posy}px`;
    element.style.left = `${posx}px`;
}

// websocket.onopen = () => {
//     console.log('established connection');
// }

class Player {
    constructor(id) {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.id = id;
    }
}