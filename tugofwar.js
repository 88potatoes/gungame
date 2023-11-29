const rope = document.querySelector('#rope');
const lobbypeeps = document.querySelector('#lobbypeeps');
const thisclient = document.querySelector('#thisclient');
const pushertext = document.querySelector('#pushertext')
const pullertext = document.querySelector('#pullertext')
const bepuller = document.querySelector('#bepuller')
const bepusher = document.querySelector('#bepusher')
const bespectator = document.querySelector('#bespectator')
// rope.setAttribute('style', `width: ${pos}rem;`)

function changeRopeLength(length, diff=null) {
    rope.setAttribute('style', `width: ${pos}rem;`);
}

const websocket = new WebSocket('ws://localhost:8081')

websocket.onmessage = (json) => {
    const info = JSON.parse(json.data);
    const command = info.command;
    const data = info.data;
    console.log(info);

    if (command == 'update') {
        rope.setAttribute('style', `width: ${data.pos}rem;`);
    } else if (command == 'join') {
        lobbypeeps.innerText = data.clientString
    } else if (command == 'setclient') {
        if (data.field == 'currentclient') {
            thisclient.innerText = `You are user number ${data.clientNo}`;
        } else if (data.field == 'puller') {
            pullertext.innerText = `The puller is: ${data.clientNo == -1 ? '': data.clientNo}`
        } else if (data.field == 'pusher') {
            pushertext.innerText = `The pusher is: ${data.clientNo == -1 ? '': data.clientNo}`
        }
    }
    
    
}

const pushbutton = document.querySelector('#pushbutton');

pushbutton.addEventListener('click', () => {
    websocket.send(JSON.stringify({"command": "push"}))
})

const pullbutton = document.querySelector('#pullbutton');

pullbutton.addEventListener('click', () => {
    websocket.send(JSON.stringify({"command": "pull"}))
})

bepuller.addEventListener('click', () => {
    sendJSON(websocket, {"command": "setclient", data: {"field": "puller"}})
})

bepusher.addEventListener('click', () => {
    sendJSON(websocket, {"command": "setclient", data: {"field": "pusher"}})
})

bespectator.addEventListener('click', () => {
    sendJSON(websocket, {"command": "setclient", data: {"field": "spectator"}})
})

function sendJSON(ws, json) {
    ws.send(JSON.stringify(json))
}