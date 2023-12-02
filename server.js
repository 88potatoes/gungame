const express = require('express');
const { send } = require('vite');
const { WebSocketServer } = require('ws')
const { sendJSON } = require('./ws-helpers');

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

function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

/**
 * 
 * TUG OF WAR
 * on /tugofwar
 */


const tugsockserver = new WebSocketServer({ port: 8081})

let pos = 10;
let puller = null;
let pusher = null;
let ingame = false;
// const tugclients = [];

const registered_events_tug = {}

function handle_event_tug(event, callback) {
    registered_events_tug[event] = callback;
}

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

function send_init_state(ws) {
    sendJSON
}

handle_event_tug('push', () => {
    if (!ingame) {
        return;
    }
    pos += 1;
    tugsockserver.clients.forEach(client => {
        sendJSON(client, {command: "update", data: {"pos": pos}})
    })
    if (pos == 20) {
        let winner = 'puller';
        tugsockserver.clients.forEach(client => {
            sendJSON(client, {command: "notify", data: {"event": "winner", value: winner}})
            sendJSON(client, {command: "activateButton", data: {"event": "activate", role: "newgamebutton"}})
        })
    }
})

handle_event_tug('pull', () => {
    if (!ingame) {
        return;
    }
    pos -= 1;
    tugsockserver.clients.forEach(client => {
        sendJSON(client, {command: "update", data: {"pos": pos}})
    })
    if (pos == 0) {
        let winner = 'puller';
        tugsockserver.clients.forEach(client => {
            // sendJSON(client, {command: "notify", data: {"event": "winner", value: winner}})
            // sendJSON(client, {command: "activateButton", data: {"event": "activate", role: "newgamebutton"}})
        })
    }
})

handle_event_tug('setclient', (ws, data) => {
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
})

tugsockserver.on('connection', ws => {
    ws.clientNo = get_id();
    
    // tugclients.push(ws);

    ws.on('close', () => { 
        console.log('client disconnected'); 

        let doubledc = true;

        if (pusher == ws.clientNo) {
            pusher = null;

            tugsockserver.clients.forEach(client => {
                sendJSON(client, {"command": "setclient", data: {field: "pusher", "clientNo": -1 }})
            })

            for (let client of tugsockserver.clients) {
                if (client.clientNo == puller) {
                    doubledc = false;
                }
            }
        }
        if (puller == ws.clientNo) {
            puller = null;

            for (let client of tugsockserver.clients) {
                if (client.clientNo == pusher) {
                    doubledc = false;
                }
            }

            tugsockserver.clients.forEach(client => {
                sendJSON(client, {"command": "setclient", data: {field: "puller", "clientNo": -1 }})
            })
        }

        if (doubledc) {
            tugsockserver.clients.forEach(client => {
                sendJSON(client, {"command": "notify", data: {event: "doubledc"}})
                sendJSON(client, {command: "activateButton", data: {"event": "activate", role: "newgamebutton"}});
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

        if (command in registered_events_tug) {
            registered_events_tug[command](ws, data);
        }

            if (command == 'startgame') {
            if (ingame) {
                return;
            }
            if (puller == null || pusher == null) {
                return;
            }
            
            tugsockserver.clients.forEach(client => {
                sendJSON(client, {command: "activateButton", data: {"event": "deactivate", "role": "startbutton"}})
            })

            ingame = true;


        } else if (command == 'newgame') {

            startNewGame();
        }

    })

    sendJSON(ws, {"command": "update", "data": {"pos": pos}})
    let clientString = getClientString();

    tugsockserver.clients.forEach(client => {
        sendJSON(client, {"command": "join", "data": {"clientString": clientString}})
    })

    sendJSONs(ws, {
        "setclient": [
            {"clientNo": ws.clientNo, "field": 'currentclient'},
            {"clientNo": pusher == null ? -1 : pusher, "field" : 'pusher'},
            {"clientNo": puller == null ? -1 : puller, "field": 'puller'}
        ]
    })

    // sendJSON(ws, {"command": "setclient", "data": {"clientNo": ws.clientNo, "field": 'currentclient'}})
    // sendJSON(ws, {"command": "setclient", "data": {"clientNo": pusher == null ? -1 : pusher, "field": 'pusher'}})
    // sendJSON(ws, {"command": "setclient", "data": {"clientNo": puller == null ? -1 : puller, "field": 'puller'}})
    if (ingame) {
        sendJSON(ws, {command: "activateButton", data: {"event": "deactivate", "role": "startbutton"}})
    }
})

function startNewGame() {
    pos = 10;
    tugsockserver.clients.forEach(client => {
        // sendJSONs(client, {
        //     "update": {
        //         "pos": pos
        //     },
        //     "activateButton": [
        //         { "event": "activate", "role": "startbutton" },
        //         { "event": "deactivate", "role": "newgamebutton" }
        //     ],
        //     "setclient": [
        //         { "clientNo": -1, "field": "pusher" },
        //         { "clientNo": -1, "field": "puller" }
        //     ],
        //     "notify": {
        //         "event": "clear"
        //     }
        // })

        sendJSONs(client, 
            {command: "update", data: {"pos": pos}},
            {command: "activateButton", data: {"event": "activate", "role": "startbutton"}},
            {command: "activateButton", data: {"event": "deactivate", "role": "newgamebutton"}},
            {"command": "setclient", data: {"clientNo": -1, field: "pusher"}},
            {"command": "setclient", data: {"clientNo": -1, field: "puller"}},
            {command: "notify", data: {"event": "clear"}},
        )
        // sendJSON(client, {command: "update", data: {"pos": pos}})
        // sendJSON(client, {command: "activateButton", data: {"event": "activate", "role": "startbutton"}})
        // sendJSON(client, {command: "activateButton", data: {"event": "deactivate", "role": "newgamebutton"}})
        // sendJSON(client, {"command": "setclient", data: {"clientNo": -1, field: "pusher"}})
        // sendJSON(client, {"command": "setclient", data: {"clientNo": -1, field: "puller"}})
        // sendJSON(client, {command: "notify", data: {"event": "clear"}})

        // if (puller == client.clientNo) {
        //     sendJSON(client, {command: "activateButton", data: {"event": "deactivate", "role": "puller"}})
        // } else if (pusher == client.clientNo) {
        //     sendJSON(client, {command: "activateButton", data: {"event": "deactivate", "role": "pusher"}})
        // }
    })

    puller = null;
    pusher = null;
}