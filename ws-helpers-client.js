class XSocketClient extends WebSocket {
    constructor(type, ...args) {
        super(...args)
        console.assert(type == 'phone' || type == 'desktop')
        this.type = type;
        this.events = {}  
        this.onopen = () => {
            ws_send(this, "device_register", this.type)
        }
        this.onmessage = (event) => {
            const [command, data] = parseJSON(event)
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