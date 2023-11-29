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
let puller = null;
let pusher = null;
// const tugclients = [];

function getClientString() {
    let clientString = "";
    for (let client of tugsockserver.clients) {
        
        clientString += client.clientNo + ' ';
    }
    return clientString;
}

function changeRopeLength(diff) {
    pos += diff;
}

tugsockserver.on('connection', ws => {
    ws.clientNo = get_id();
    
    // tugclients.push(ws);

    ws.on('close', () => { 
        console.log('client disconnected'); 

        if (pusher == ws.clientNo) {
            pusher = null;

            tugsockserver.clients.forEach(client => {
                sendJSON(client, {"command": "setclient", data: {field: "pusher", "clientNo": -1 }})
            })
        }
        if (puller == ws.clientNo) {
            puller = null;

            tugsockserver.clients.forEach(client => {
                sendJSON(client, {"command": "setclient", data: {field: "puller", "clientNo": -1 }})
            })
        }

        // removes client from tugclients 
        // const index = tugclients.indexOf(ws)
        // tugclients.splice(index, 1);
    })
    
    ws.on('error', () => {
        console.log('logwebsocket error');
    })
    
    ws.on('message', (json) => {
        console.log("json", JSON.parse(json))
        const [command, data] = parseJSON(json);

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
        } else if (command == 'setclient') {
            if (data.field == 'puller') {
                if (puller != null) {
                    return;
                }
                if (ws.clientNo == pusher) {
                    return;
                }

                puller = ws.clientNo;
                tugsockserver.clients.forEach(client => {
                    sendJSON(client, {"command": "setclient", data: {field: "puller", "clientNo": ws.clientNo }})
                })
                sendJSON(ws, {"command": "activateButton", data: {event: "activate", role: "puller"}})

            } else if (data.field == 'pusher') {
                if (pusher != null) {
                    return;
                }
                if (ws.clientNo == puller) {
                    return;
                }

                pusher = ws.clientNo;
                tugsockserver.clients.forEach(client => {
                    sendJSON(client, {"command": "setclient", data: {"clientNo": ws.clientNo, field: "pusher"}})
                })
                sendJSON(ws, {"command": "activateButton", data: {event: "activate", role: "pusher"}})
            } else if (data.field == 'spectator') {
                if (puller == ws.clientNo) {
                    puller = null;
                    tugsockserver.clients.forEach(client => {
                        sendJSON(client, {"command": "setclient", data: {"clientNo": -1, field: "puller"}})
                    })

                    sendJSON(ws, {"command": "activateButton", data: {"event": "deactivate", role: "puller"}})
                } else if (pusher == ws.clientNo) {
                    pusher = null;
                    tugsockserver.clients.forEach(client => {
                        sendJSON(client, {"command": "setclient", data: {"clientNo": -1, field: "pusher"}})
                    })
                    sendJSON(ws, {"command": "activateButton", data: {"event": "deactivate", role: "pusher"}})
                }
            }
        }

    })

    sendJSON(ws, {"command": "update", "data": {"pos": pos}})
    let clientString = getClientString();

    tugsockserver.clients.forEach(client => {
        sendJSON(client, {"command": "join", "data": {"clientString": clientString}})
    })

    sendJSON(ws, {"command": "setclient", "data": {"clientNo": ws.clientNo, "field": 'currentclient'}})
    sendJSON(ws, {"command": "setclient", "data": {"clientNo": pusher == null ? -1 : pusher, "field": 'pusher'}})
    sendJSON(ws, {"command": "setclient", "data": {"clientNo": puller == null ? -1 : puller, "field": 'puller'}})
})