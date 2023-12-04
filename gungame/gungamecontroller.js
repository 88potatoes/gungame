const { sendJSON } = require('../ws-helpers')
const info = require('../info.json')
const websocket = new WebSocket(`ws://${info.ip_address}:8082`)

websocket.onopen = () => {
    sendJSON(websocket, {command: 'phone_join'})
    console.log('phone_join event')
}

const upbutton = document.getElementById('upbutton');
upbutton.addEventListener('click', (e) => {
    e.preventDefault();
    sendJSON(websocket, {command: 'move-up'})
})

const downbutton = document.getElementById('downbutton');
downbutton.addEventListener('click', (e) => {
    sendJSON(websocket, {command: 'move-down'})
    e.preventDefault();
})

const leftbutton = document.getElementById('leftbutton');
leftbutton.addEventListener('click', (e) => {
    e.preventDefault();
    sendJSON(websocket, {command: 'move-left'})
})

const rightbutton = document.getElementById('rightbutton');
rightbutton.addEventListener('click', (e) => {
    sendJSON(websocket, {command: 'move-right'})
    e.preventDefault();
})