(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

const { handle_event, parseJSON } = require('./ws-helpers.js');
const rope = document.querySelector('#rope');
const lobbypeeps = document.querySelector('#lobbypeeps');
const thisclient = document.querySelector('#thisclient');
const pushertext = document.querySelector('#pushertext')
const pullertext = document.querySelector('#pullertext')
const bepuller = document.querySelector('#bepuller')
const bepusher = document.querySelector('#bepusher')
const bespectator = document.querySelector('#bespectator')
const pullbutton = document.querySelector('#pullbutton');
const pushbutton = document.querySelector('#pushbutton');
const startbutton = document.querySelector('#startbutton')
const newgamebutton = document.querySelector('#newgamebutton')
const noticeboard = document.querySelector('#noticeboard')
// rope.setAttribute('style', `width: ${pos}rem;`)

let state = {};

function changeRopeLength(length, diff=null) {
    rope.setAttribute('style', `width: ${pos}rem;`);
}

pullbutton.style.display = "none"
pushbutton.style.display = "none"
newgamebutton.style.display = "none"
// startbutton.style.display = "none"


const websocket = new WebSocket('ws://localhost:8081')

const registered_events = {};
const callbacks = {
    'clientString': () => {
        lobbypeeps.innerText = state.clientString
    }, 
    'puller': () => {
        pullertext.innerText = `The puller is: ${state.clientNo == -1 ? '': state.clientNo}`
    }, 
    'pusher': () => {
        pushertext.innerText = `The pusher is: ${data.clientNo == -1 ? '': data.clientNo}`
    }
}

handle_event(registered_events, 'init_state', (data) => {
    state = data;
})

handle_event(registered_events, 'update', (data) => {
    console.log("data", data)
    console.log("state", state)
    for (let entry of Object.entries(data)) {
        state[entry[0]] = entry[1]

        if (entry[0] in callbacks) {
            callbacks[entry[0]]()
        }
    }
})

websocket.onmessage = (message) => {
    const [command, data] = parseJSON(message.data);
    console.log(command, data)

    if (command in registered_events) {
        registered_events[command](data)
    }

    if (command == 'update') {
        rope.setAttribute('style', `width: ${data.pos}rem;`);
    } else if (command == 'setclient') {
        if (data.field == 'currentclient') {
            thisclient.innerText = `You are user number ${data.clientNo}`;
        }
    } else if (command == 'activateButton') {
        if (data.event == 'activate') {
            if (data.role == 'puller') {
                pullbutton.style.display = 'block'
            } else if (data.role == 'pusher') {
                pushbutton.style.display = 'block';
            } else if (data.role == 'startbutton') {
                startbutton.style.display = 'block';
            } else if (data.role == 'newgamebutton') {
                newgamebutton.style.display = 'block';
            }
        } else if (data.event == 'deactivate') {
            if (data.role == 'puller') {
                pullbutton.style.display = 'none'
            } else if (data.role == 'pusher') {
                pushbutton.style.display = 'none';
            } else if (data.role == 'startbutton') {
                startbutton.style.display = 'none';
            } else if (data.role == 'newgamebutton') {
                newgamebutton.style.display = 'none';
            }
        }
        
    } else if (command == 'notify') {
        if (data.event == 'winner') {
            if (data.value == 'puller') {
                noticeboard.innerText = 'PULLER WON';
            } else if (data.value == 'pusher') {
                noticeboard.innerText = 'PUSHER WON';
            }
        } else if (data.event == 'clear') {
            noticeboard.innerText = '';
        } else if (data.event == 'doubledc') {
            noticeboard.innerText = 'BOTH PLAYERS DISCONNECTED'
        }
    }
    
    
}

pushbutton.addEventListener('click', () => {
    websocket.send(JSON.stringify({"command": "push"}))
})

pullbutton.addEventListener('click', () => {
    websocket.send(JSON.stringify({"command": "pull"}))
})

bepuller.addEventListener('click', () => {
    update(websocket, {"puller": "this_id"})
})

bepusher.addEventListener('click', () => {
    update(websocket, {"pusher": "this_id"})
})

bespectator.addEventListener('click', () => {
    update(websocket, {"pusher": null})
})

startbutton.addEventListener('click', () => {
    sendJSON(websocket, {"command": "startgame"})
})

newgamebutton.addEventListener('click', () => {
    sendJSON(websocket, {"command": "newgame"})
})
},{"./ws-helpers.js":2}],2:[function(require,module,exports){

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
    while (i < 1000) {
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
    get_id
}
},{}]},{},[1]);
