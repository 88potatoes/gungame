const {WebSocketServer} = require('ws')
const {
    sendJSON,
    handle_event,
    parseJSON,
    get_id,
    ws_send
} = require('./ws-helpers')

class XSocketServer extends WebSocketServer {
    constructor(...options) {
        super(...options)
        this.phone_events = {};
        this.phone_connections = {};
        this.desk_events = {};
        this.desk_connections = {};
        this.latent_players = {};
        this.device_register_events = {
            'phone_join': function(ws) {
                ws.device = 'phone'
            },
            'desktop_join': function(ws) {
                ws.device = 'desktop'
            }
        };
        this.state = {}
        this.on('connection', (ws, req) => {
            ws.id = get_id();
            ws.ip = req.socket.remoteAddress;
            ws.alreadyConnected = false;
        
            // if (ws.ip in this.latent_players) {
            //     let player = this.latent_players[ws.ip]
            //     delete latent_players[ws.ip]
            //     players[player.id] = player;
            //     ws.id = player.id
            //     ws.alreadyConnected = true;
            // } else {
            //     ws.id = get_id();
            // }

            // to determine device - is set in 'desktop_join' and 'phone_join' event
            ws.device = null;
            console.log('connected', ws.ip, ws.id);

            ws.onclose = () => {
                console.log('disconnected', ws.id)
                // if (ws.device === 'phone') {
                //     latent_players[ws.ip] = players[ws.id]
                //     delete players[ws.id]
                // }
                // console.log(latent_players)
                // websocketserver.clients.forEach((client) => {
                //     sendJSON(client, {command: "disconnect", data: {player: ws.id}})
                // })
            }

            ws.onerror = () => {
                console.log("websocket error")
            }

            ws.onmessage = (message) => {
                const [command, data] = parseJSON(message.data)
                
                // if device is neither phone nor desktop then it doesn't do anything
                if (ws.device === null) {
                    // to register device
                    console.log(command)
                    this.device_register_events[command](ws, data);
                } else if (ws.device === 'phone') {
                    if (command in this.phone_events) {
                        this.phone_events[command](ws, data);
                    }
                } else if (ws.device === 'desktop') {
                    if (command in this.desk_events) {
                        this.desk_events[command](ws, data);
                    }
                }
            }
        })
        
        console.log(this)
    }

    register_events(device, event, callback) {
        if (device === 'phone') {
            this.phone_events[event] = callback;
        } else if (device === 'desktop') {
            this.desk_events[event] = callback;
        }
    }
    
}

module.exports = {
    XSocketServer
}