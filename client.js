const channelNotifier = document.querySelector('#channelNotifier');
function changeChannel(channel) {
    channelNotifier.innerText = `You're now on channel ${channel}`
}

const websocket = new WebSocket('ws://localhost:443')
let clientNo = null;

document.querySelector("#channel1").addEventListener('click', () => {
    console.log("channel1 connected")
    websocket.send(JSON.stringify({'command': 'subscribe', 'channel': 'channel1'}))
    changeChannel(1)
})

document.querySelector("#channel2").addEventListener('click', () => {
    console.log("channel2 connected")
    websocket.send(JSON.stringify({'command': 'subscribe', 'channel': 'channel2'}))
    changeChannel(2)
})

document.querySelector('#textInput').addEventListener('submit', (event) => {
    event.preventDefault();
    console.log(event)
})

const messagebox = document.querySelector('#messagebox');

websocket.onmessage = (event) => {
    const info = JSON.parse(event.data)

    if (info.command == "fetchClientNo") {
        clientNo = info.clientNo;
        console.log("clientNo:", clientNo)
    }
}