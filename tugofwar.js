const rope = document.querySelector('#rope');
// rope.setAttribute('style', `width: ${pos}rem;`)

function changeRopeLength(length, diff=null) {
    rope.setAttribute('style', `width: ${pos}rem;`);
}

const websocket = new WebSocket('ws://localhost:8081')

websocket.onmessage = (json) => {
    const info = JSON.parse(json.data);
    const command = info.command;
    const data = info.data;
    // console.log(data);

    if (command == 'update') {
        rope.setAttribute('style', `width: ${data.pos}rem;`);
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