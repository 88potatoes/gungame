const express = require('express')
const { WebSocketServer } = require('ws')

let clientno = 0;


const webserver = express()
webserver.use((req, res) => {
    res.sendFile('/websocket-client.html', { root: __dirname })
})

webserver.listen(8080, console.log(`Listening on port ${8080}`))

const sockserver = new WebSocketServer({ port: 443 })

sockserver.on('connection', ws => {
    console.log('New connection!')
    ws.clientNo = clientno;
    ws.channel = null;
    clientno += 1;

    // console.log(ws);

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
        // console.log(data)
        ws.channel = data.channel;
    })

    ws.on('message', dat => {
        const info = JSON.parse(dat);
        console.log(info)
        const command = info.command;
        const data = info.data;

        if (command in registered_events) {
            registered_events[command](ws, data);
        }

        // if (info.command == 'subscribe') {
        //     ws.channel = info.channel;
        // } else if (info.command == 'publish') {
        //     if (ws.channel == null) {
        //         return;
        //     }
        //     sockserver.clients.forEach(client => {
        //         if (client.channel == ws.channel) {
        //             client.send(JSON.stringify({"command": "publish", "data": info.data}))
        //         }
        //     })
        // }

    })

    ws.onerror = function () {
        console.log('websocket error')
    }
})

function handle_event(event, callback) {
    registered_events[event] = callback;
}