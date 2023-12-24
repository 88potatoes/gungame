function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

class XSocketClient extends WebSocket {
    constructor(type, ...args) {
        super(...args)
        console.assert(type == 'phone' || type == 'desktop')
        this.type = type;
        this.events = {}  
        this.onmessage = (event) => {
            const [command, data] = parseJSON(event.data)
            if (command in this.events) {
                this.events[command](data)
            }

        }      
    }   

    register_event = (event, callback) => {
        this.events[event] = callback;
    }
}

module.exports = {
    XSocketClient
}