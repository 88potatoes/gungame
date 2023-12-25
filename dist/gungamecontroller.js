(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"../info.json":2,"../ws-helpers":4,"../ws-helpers-client":3}],2:[function(require,module,exports){
module.exports={
    "ip_address": "172.20.10.2"
}
},{}],3:[function(require,module,exports){
function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

class XSocketClient extends WebSocket {
    constructor(type, ...args) {
        super(...args)
        console.assert(type == 'phone' || type == 'desktop')
        this.type = type;
        this.events = {}  
        this.onmessage = (event) => {
            const [command, data] = parseJSON(event.data)
            if (command in this.events) {
                this.events[command](data)
            }

        }      
    }   

    register_event = (event, callback) => {
        this.events[event] = callback;
    }
}

module.exports = {
    XSocketClient
}
},{}],4:[function(require,module,exports){
/**
 * Send JSON(s) through websocket
 * @param {WebSocket} ws 
 * @param {Array || Object} messages 
 */
function sendJSON(ws, ...messages) {
    for (let message of messages) {
        ws.send(JSON.stringify(message));
    }
}

function ws_send(ws, event, payload) {
    ws.send(JSON.stringify({"command": event, "data": payload}))
}

function handle_event(event_dict, event, callback) {
    event_dict[event] = callback;
}

function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

function* create_id_generator() {
    let i = 0;
    while (i < 10000) {
        yield i;
        i++;
    }
}

const id_generator = create_id_generator();

function get_id() {
    return id_generator.next().value;
}

module.exports = {
    sendJSON,
    handle_event,
    parseJSON,
    get_id,
    ws_send
}
},{}]},{},[1]);
