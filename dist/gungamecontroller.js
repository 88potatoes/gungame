(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { sendJSON, ws_send } = require('../ws-helpers')
const info = require('../info.json')
const websocket = new WebSocket(`ws://${info.ip_address}:8082`)
console.log(" ing")

let goup = false;
let godown = false;
let goright = false;
let goleft = false;

websocket.onopen = () => {
    // sendJSON(websocket, {command: 'phone_join'})
    ws_send(websocket, "phone_join")
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

const bombbutton = document.getElementById('bombbutton');
bombbutton.addEventListener('touchstart', (e) => {
    e.preventDefault()
    sendJSON(websocket, {command: 'drop-bomb'})
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

const dcmessage = document.getElementById('dc-message')

websocket.onclose = (e) => {
    dcmessage.innerText = 'You have disconnected. Please refresh to rejoin'
}
},{"../info.json":2,"../ws-helpers":4}],2:[function(require,module,exports){
module.exports={
    "ip_address": "192.168.50.29"
}
},{}],3:[function(require,module,exports){
'use strict';

module.exports = function () {
  throw new Error(
    'ws does not work in the browser. Browser clients must use the native ' +
      'WebSocket object'
  );
};

},{}],4:[function(require,module,exports){
const { WebSocketServer } = require("ws");

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

class XSocketServer extends WebSocketServer {
    constructor(options) {
        super(options)
        this.phone_events = {};
        this.phone_connections = {};
        this.desk_events = {};
        this.desk_connections = {};
        this.latent_players = {};
        this.device_register_events = {
            'phone': function(ws) {
                ws.device = 'phone'
            },
            'desktop': function(ws) {
                ws.device = 'desktop'
            }
        };
        this.state = {}
        this.on('connection', (ws, req) => {
            ws.id = get_id();
            ws.ip = req.socket.remoteAddress;
            ws.alreadyConnected = false;
        
            // if (ws.ip in this.latent_players) {
            //     let player = this.latent_players[ws.ip]
            //     delete latent_players[ws.ip]
            //     players[player.id] = player;
            //     ws.id = player.id
            //     ws.alreadyConnected = true;
            // } else {
            //     ws.id = get_id();
            // }

            // to determine device - is set in 'desktop_join' and 'phone_join' event
            ws.device = null;
            console.log('connected', ws.ip, ws.id);

            ws.onclose = () => {
                console.log('disconnected', ws.id)
                // if (ws.device === 'phone') {
                //     latent_players[ws.ip] = players[ws.id]
                //     delete players[ws.id]
                // }
                // console.log(latent_players)
                // websocketserver.clients.forEach((client) => {
                //     sendJSON(client, {command: "disconnect", data: {player: ws.id}})
                // })
            }

            ws.onerror = () => {
                console.log("websocket error")
            }

            ws.onmessage = (message) => {
                const [command, data] = parseJSON(message.data)
                
                // if device is neither phone nor desktop then it doesn't do anything
                if (ws.device === null) {
                    // to register device
                    this.device_register_events[command](ws, data);
                } else if (ws.device === 'phone') {
                    if (command in this.phone_events) {
                        this.phone_events[command](ws, data);
                    }
                } else if (ws.device === 'desktop') {
                    if (command in this.desk_events) {
                        this.desk_events[command](ws, data);
                    }
                }
            }
        })
        
        console.log(this)


    }
    
}

class XSocketClient extends WebSocket {
    constructor(type, ...args) {
        super(...args)
        console.assert(type == 'phone' || type == 'desktop')
        this.type = type;
        this.events = {}  
        this.onopen = () => {
            ws_send(this, "device_register", this.type)
        }
        this.onmessage = (event) => {
            const [command, data] = parseJSON(event)
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
    sendJSON,
    handle_event,
    parseJSON,
    get_id,
    ws_send,
    XSocketServer
}
},{"ws":3}]},{},[1]);
