
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