const { WebSocketServer } = require('ws');
const { sendJSON, handle_event, get_id } = require('./ws-helpers');

function tugofwarserver() {
    const tugsockserver = new WebSocketServer({ port: 8081 })
    let pos = 10;
    let puller = null;
    let pusher = null;
    let ingame = false;
    const tugsockevents = {}

    function getClientString() {
        let clientString = "";
        for (let client of tugsockserver.clients) {
            
            clientString += client.clientNo + ' ';
        }
        return clientString;
    }

    handle_event(tugsockevents, 'push', () => {
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
                sendJSON(client, 
                    {command: "notify", data: {"event": "winner", value: winner}},
                    {command: "activateButton", data: {"event": "activate", role: "newgamebutton"}}
                )
            })
        }
    })

    handle_event(tugsockevents, 'pull', () => {
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

    handle_event(tugsockevents, 'setclient', (ws, data) => {
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

    handle_event('startgame', (ws) => {
        if (ingame) {
            return;
        }
        if (puller == null || pusher == null) {
            return;
        }
        
        tugsockserver.clients.forEach(client => {
            sendJSON(ws, {command: "activateButton", data: {"event": "deactivate", "role": "startbutton"}})
        })

        ingame = true;
    })

    handle_event('newgame', () => {
        pos = 10;
        tugsockserver.clients.forEach(client => {

            sendJSON(client, 
                {command: "update", data: {"pos": pos}},
                {command: "activateButton", data: {"event": "activate", "role": "startbutton"}},
                {command: "activateButton", data: {"event": "deactivate", "role": "newgamebutton"}},
                {"command": "setclient", data: {"clientNo": -1, field: "pusher"}},
                {"command": "setclient", data: {"clientNo": -1, field: "puller"}},
                {command: "notify", data: {"event": "clear"}},
            )
        })

        puller = null;
        pusher = null;
    })

    tugsockserver.on('connection', ws => {
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
                    sendJSON(client, 
                        {"command": "notify", data: {event: "doubledc"}},
                        {command: "activateButton", data: {"event": "activate", role: "newgamebutton"}}
                    );
                })

            }
        })
        
        ws.on('error', () => {
            console.log('logwebsocket error');
        })
        
        ws.on('message', (json) => {
            console.log("json", JSON.parse(json))
            const [command, data] = parseJSON(json);

            if (command in tugsockevents) {
                tugsockevents[command](ws, data);
            }

            if (command == 'newgame') {

                startNewGame();
            }

        })

        ws.clientNo = get_id();
        let clientString = getClientString();

        tugsockserver.clients.forEach(client => {
            sendJSON(client, {"command": "join", "data": {"clientString": clientString}})
        })

        sendJSON(ws, 
            { "command": "setclient", "data" : {"clientNo": ws.clientNo, "field": 'currentclient'}},
            { "command": "setclient", "data" : {"clientNo": pusher == null ? -1 : pusher, "field" : 'pusher'}},
            { "command": "setclient", "data" : {"clientNo": puller == null ? -1 : puller, "field": 'puller'}},
            {"command": "update", "data": {"pos": pos}}
        )

        if (ingame) {
            sendJSON(ws, {command: "activateButton", data: {"event": "deactivate", "role": "startbutton"}})
        }
    })

    function isDoubleDC() {
        return pusher == null && puller == null;
    }
}

module.exports = {
    tugofwarserver
}