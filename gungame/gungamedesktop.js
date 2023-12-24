const canvas = document.getElementById('canv');
const playerListElement = document.getElementById('playerlist')
const { sendJSON, handle_event, parseJSON } = require('../ws-helpers.js')
const info = require('../info.json')
const { XSocketClient } = require('../ws-helpers-client.js')

console.log(info);

// checks whether client device is a mobile device
// from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
// DON'T need anymore

// const websocket = new WebSocket('ws://localhost:8082')
const desksocket = new XSocketClient("desktop", `ws://${info.ip_address}:8082`)
console.log('after loading websocket')

const registered_events = {}
let players = {}
let playerElements = {}
let bullets = {}
let bulletElements = {}
let lobbyElements = {}
let bombElements = {}
// let wallElements = []

// initialise all players initially
desksocket.register_event("init_players", (data) => {
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
// handle_event(registered_events, 'init_players', (data) => {
//     players = data;
//     console.log("init players", Object.values(players))

//     for (let player of Object.values(players)) {
//         // console.log(player)
//         let playerEl = document.createElement('div');
//         playerEl.style = `position: absolute; background: red; width: ${player.width}px; height: ${player.height}px; left: ${player.x}px; top: ${player.y}px;`;
//         playerElements[player.id] = playerEl;
//         canvas.appendChild(playerElements[player.id]);

//         // for lobby
//         const lobbyElement = document.createElement('li');
//         lobbyElement.innerText = `Player ${player.id}`;
//         lobbyElements[player.id] = lobbyElement;
//         playerListElement.appendChild(lobbyElement)
//     }
// })

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
    
    // remove from lobby
    playerListElement.removeChild(lobbyElements[data.player])
    delete lobbyElements[data.player]
})

handle_event(registered_events, 'move-hor', (data) => {
    console.log('movign hor')
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

handle_event(registered_events, 'init_walls', (data) => {
    for (let wall of data) {
        let wallElement = document.createElement('div')
        wallElement.style = `position: absolute; background: blue; width: ${wall.sideLength}px; height: ${wall.sideLength}px; left: ${wall.x}px; top: ${wall.y}px;`
        canvas.appendChild(wallElement)
    }
})

handle_event(registered_events, 'create_bomb', (data) => {
    const bombElement = document.createElement('div')
    bombElement.style = `position: absolute; background: green; width: ${data.sideLength}px; height: ${data.sideLength}px; left: ${data.x}px; top: ${data.y}px;`
    bombElements[data.id] = bombElement;
    canvas.appendChild(bombElement)
})

handle_event(registered_events, 'explode_bomb', (data) => {
    canvas.removeChild(bombElements[data.id]);
    delete bombElements[data.id]
})
