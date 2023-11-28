const express = require('express')
const { WebSocketServer } = require('ws')

let clientno = 0;


const webserver = express()
webserver.use((req, res) => {
    res.sendFile('/websocket-client.html', { root: __dirname })
})

webserver.listen(8080, console.log(`Listening on port ${8080}`))

const sockserver = new WebSocketServer({ port: 443 })
const id_generator = create_id_generator();

function get_id() {
    return id_generator.next().value;
}

sockserver.on('connection', ws => {
    ws.clientNo = get_id();
    console.log('New connection: id = %s', ws.clientNo)

    registered_events = {}

    ws.on('close', () => console.log('Client has disconnected'))

    handle_event('publish', (ws, data) => {
        if (ws.channel == null) {
            return;
        }
        sockserver.clients.forEach(client => {
            if (client.channel == ws.channel) {
                client.send(JSON.stringify({"command": "publish", "data": data.message}))
            }
        })
    })

    handle_event('subscribe', (ws, data) => {
        ws.channel = data.channel;
    })

    ws.on('message', dat => {
        const info = JSON.parse(dat);
        const command = info.command;
        const data = info.data;

        if (command in registered_events) {
            registered_events[command](ws, data);
        }
    })

    ws.onerror = function () {
        console.log('websocket error')
    }
})

function handle_event(event, callback) {
    registered_events[event] = callback;
}

// generates a maximum of 1000 ids
function* create_id_generator() {
    let i = 0;
    while (i < 1000) {
        yield i;
        i++;
    }
}