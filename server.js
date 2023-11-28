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

    ws.on('close', () => console.log('Client has disconnected'))

    ws.on('message', data => {
        info = JSON.parse(data)

        if (info.command == 'subscribe') {
            ws.channel = info.channel;
        } else if (info.command == 'publish') {
            if (ws.channel == null) {
                return;
            }
            sockserver.clients.forEach(client => {
                if (client.channel == ws.channel) {
                    client.send(JSON.stringify({"command": "publish", "data": info.data}))
                }
            })
        }

    })

    ws.onerror = function () {
        console.log('websocket error')
    }
})