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

websocket.onmessage = (event) => {
    const [command, data] = parseJSON(event.data);
    
    if (command in registered_events) {
        registered_events[command](data)
    }
}

handle_event(registered_events, 'move-hor', (data) => {
    posx = data.posx;
    element.style.left = `${posx}px`;

})

handle_event(registered_events, 'move-ver', (data) => {
    posy = data.posy;
    element.style.top = `${posy}px`;

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