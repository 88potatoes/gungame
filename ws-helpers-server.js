const {WebSocketServer} = require('ws')
const {
    sendJSON,
    handle_event,
    parseJSON,
    get_id,
    ws_send
} = require('./ws-helpers')
const useragent = require('express-useragent')

class XSocketServer extends WebSocketServer {
    constructor(...options) {
        super(...options)
        this.phone_events = {};
        this.phone_connections = {};
        this.desk_events = {};
        this.desk_connections = {};
        this.latent_players = {};
        this.state = {}
        this.onclose_extra = null;

        // custom on-connect functionality
        this.onconnect = null;

        this.on('connection', (ws, req) => {
            ws.id = get_id();
            ws.ip = req.socket.remoteAddress;
            ws.alreadyConnected = false;
            ws.device = useragent.parse(req.headers['user-agent']).isMobile ? "phone" : "desktop";

            if (ws.device === 'phone') {
                this.phone_connections[ws.id] = ws;
            } else {
                this.desk_connections[ws.id] = ws;
            }

            if (this.onconnect != null) {
                this.onconnect(ws, req)
            }

            // to determine device - is set in 'desktop_join' and 'phone_join' event
            console.log('connected', ws.ip, ws.id);

            ws.onclose = () => {
                console.log('disconnected', ws.id)
                if (this.onclose_extra != null) {
                    this.onclose_extra(ws);
                }
            }

            ws.onerror = () => {
                console.log("websocket error")
            }

            ws.onmessage = (message) => {
                const [command, data] = parseJSON(message.data)
                
                if (ws.device === 'phone') {
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
    }

    register_event(device, event, callback) {
        if (device === 'phone') {
            this.phone_events[event] = callback;
        } else if (device === 'desktop') {
            this.desk_events[event] = callback;
        }
    }

    broadcast_desktops(event, data) {
        for (let desktop of Object.values(this.desk_connections)) {
            ws_send(desktop, event, data)
        }
    }

    broadcast_phones(event, data) {
        for (let phone of Object.values(this.phone_connections)) {
            ws_send(phone, event, data)
        }

        
    }
    
}

module.exports = {
    XSocketServer
}