const { sendJSON } = require('../ws-helpers')
const info = require('../info.json')
const websocket = new WebSocket(`ws://${info.ip_address}:8082`)

let goup = false;
let godown = false;
let goright = false;
let goleft = false;

websocket.onopen = () => {
    sendJSON(websocket, {command: 'phone_join'})
    console.log('phone_join event')
}

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

document.body.oncontextmenu = (e) => {
    e.preventDefault();
}