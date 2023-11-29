const express = require('express');
const { send } = require('vite');
const { WebSocketServer } = require('ws')

let clientno = 0;


const webserver = express()
// webserver.use((req, res) => {
//     res.sendFile('/websocket-client.html', { root: __dirname })
// })

webserver.get('/dist/output.css', (req, res) => {
    res.sendFile('/dist/output.css', { root: __dirname });
})
webserver.get('/tugofwar.js', (req, res) => {
    res.sendFile('/tugofwar.js', { root: __dirname });
})

webserver.get('/', (req, res) => {
    res.sendFile('/websocket-client.html', { root: __dirname })
})
webserver.get('/tugofwar', (req, res) => {
    res.sendFile('/tugofwar.html', { root: __dirname })
})

webserver.listen(8080, console.log(`Listening on port ${8080}`))

const sockserver = new WebSocketServer({ port: 443 })
const id_generator = create_id_generator();

function get_id() {
    return id_generator.next().value;
}

const registered_events = {}

sockserver.on('connection', ws => {
    ws.clientNo = get_id();
    console.log('New connection: id = %s', ws.clientNo)

    ws.on('close', () => console.log('Client has disconnected'))

    handle_event('publish', (ws, data) => {
        if (ws.channel == null) {
            return;
        }
        sockserver.clients.forEach(client => {
            if (client.channel == ws.channel) {
                sendJSON(client, {"command": "publish", "data": data.message})
            }
        })
    })

    handle_event('subscribe', (ws, data) => {
        ws.channel = data.channel;
    })

    ws.on('message', json => {
        const [command, data] = parseJSON(json);

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

function sendJSON(client, json) {
    client.send(JSON.stringify(json))
}

function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

const tugsockserver = new WebSocketServer({ port: 8081})

let pos = 10;

function changeRopeLength(diff) {
    pos += diff;
}

tugsockserver.on('connection', ws => {
    ws.clientNo = get_id();
    
    
    ws.on('close', () => { console.log('client disconnected'); })
    
    ws.on('error', () => {
        console.log('logwebsocket error');
    })
    
    ws.on('message', (json) => {
        console.log("json", JSON.parse(json))
        const [command, data] = parseJSON(json);

        // if (command == 'push') {
        //     tugsockserver.clients.forEach((client) => {
        //         sendJSON(client, {"command": "push", data: {"pos": pos}})
        //     })
        // } else if (command == 'pull') {
        //     tugsockserver.clients.forEach((client) => {
        //         sendJSON(client, {"command": "pull"})
        //     })
        // }

        if (command == 'push' || command == 'pull') {
            if (command == 'push') {
                pos += 1;
            } else {
                pos -= 1;
            }
            if (pos > 20) {
                pos = 20;
            } else if (pos < 0) {
                pos = 0;
            }

            tugsockserver.clients.forEach(client => {
                sendJSON(client, {command: "update", data: {"pos": pos}})
            })
        }

    })

    sendJSON(ws, {"command": "update", "data": {"pos": pos}})
})