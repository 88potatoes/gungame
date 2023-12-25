const { sendJSON, ws_send } = require('../ws-helpers')
const info = require('../info.json');
const { XSocketClient } = require('../ws-helpers-client');
// const websocket = new WebSocket(`ws://${info.ip_address}:8082`)
const phonesocket = new XSocketClient('phone', `ws://${info.ip_address}:8082`)
console.log(" ing")

let goup = false;
let godown = false;
let goright = false;
let goleft = false;

const upbutton = document.getElementById('upbutton');
upbutton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    goup = true;
})
upbutton.addEventListener('touchend', (e) => {
    e.preventDefault();
    goup = false;
})


const downbutton = document.getElementById('downbutton');
downbutton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    godown = true;
})
downbutton.addEventListener('touchend', (e) => {
    e.preventDefault();
    godown = false;
})

const leftbutton = document.getElementById('leftbutton');
leftbutton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    goleft = true;
})
leftbutton.addEventListener('touchend', (e) => {
    e.preventDefault();
    goleft = false;
})

const rightbutton = document.getElementById('rightbutton');
rightbutton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    goright = true;
})
rightbutton.addEventListener('touchend', (e) => {
    e.preventDefault();
    goright = false;
})

const bombbutton = document.getElementById('bombbutton');
bombbutton.addEventListener('touchstart', (e) => {
    e.preventDefault()
    sendJSON(phonesocket, {command: 'drop-bomb'})
})

const resetbutton = document.getElementById('resetbutton');
resetbutton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // console.log('resetting toggle')
    ws_send(phonesocket, 'toggle_reset')
})

// prevent double click zoom on phone
document.ondblclick = function(e) {
    e.preventDefault()
}

const loop = () => {
    update();
    // console.log('looping')
    // render();
    requestAnimationFrame(loop)
};

window.requestAnimationFrame(loop)

function update() {
    if (goup) {
        sendJSON(phonesocket, {command: "move-up"})
    }
    if (godown) {
        sendJSON(phonesocket, {command: "move-down"})
    }
    if (goleft) {
        sendJSON(phonesocket, {command: "move-left"})
    }
    if (goright) {
        sendJSON(phonesocket, {command: "move-right"})
    }
}

document.body.oncontextmenu = (e) => {
    e.preventDefault();
}

const dcmessage = document.getElementById('dc-message')

phonesocket.onclose = (e) => {
    dcmessage.innerText = 'You have disconnected. Please refresh to rejoin'
}

phonesocket.register_event('reset_state', (data) => {
    resetbutton.innerText = data === 'ready' ? 'READY' : '';
})