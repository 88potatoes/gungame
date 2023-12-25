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

// add a new player upon connection
desksocket.register_event('add_player', (data) => {
    console.log('need to add player')
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
desksocket.register_event('disconnect', (data) => {
    delete players[data.player]
    canvas.removeChild(playerElements[data.player])
    delete playerElements[data.player]
    
    // remove from lobby
    playerListElement.removeChild(lobbyElements[data.player])
    delete lobbyElements[data.player]
})

desksocket.register_event('move-hor', (data) => {
    players[data.player].x = data.x;
    playerElements[data.player].style.left = `${data.x}px`;
})
// handle_event(registered_events, 'move-hor', (data) => {
//     console.log('movign hor')
//     players[data.player].x = data.x;
//     playerElements[data.player].style.left = `${data.x}px`;
// })

desksocket.register_event('move-ver', (data) => {
    players[data.player].y = data.y
    playerElements[data.player].style.top = `${data.y}px`;
})

desksocket.register_event('alert', (data) => {
    alert(data.message)
})

desksocket.register_event('init_walls', (data) => {
    for (let wall of data) {
        let wallElement = document.createElement('div')
        wallElement.style = `position: absolute; background: blue; width: ${wall.sideLength}px; height: ${wall.sideLength}px; left: ${wall.x}px; top: ${wall.y}px;`
        canvas.appendChild(wallElement)
    }
})

desksocket.register_event('create_bomb', (data) => {
    console.log(data)
    const bombElement = document.createElement('div')
    bombElement.style = `position: absolute; background: green; width: ${data.sideLength}px; height: ${data.sideLength}px; left: ${data.x}px; top: ${data.y}px;`
    bombElements[data.id] = bombElement;
    canvas.appendChild(bombElement)
})

desksocket.register_event('new_coin', (data) => {
    console.log(data)
    const coinElement = document.createElement('div')
    coinElement.style = `position: absolute; background: green; width: ${data.side}px; height: ${data.side}px; left: ${data.x}px; top: ${data.y}px;`
    canvas.appendChild(coinElement)
})

desksocket.register_event('explode_bomb', (data) => {
    canvas.removeChild(bombElements[data.id]);
    delete bombElements[data.id]
})
