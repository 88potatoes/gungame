const express = require('express');
const { tugofwarserver } = require('./tugwar');
const { gungameserver } = require('./gungame/gungameserver');
const useragent = require('express-useragent')

const webserver = express()

webserver.get('/dist/output.css', (req, res) => {
    res.sendFile('/dist/output.css', { root: __dirname });
})
// webserver.get('/dist/bundle.js', (req, res) => {
//     res.sendFile('/dist/bundle.js', { root: __dirname });
// })

webserver.get('/', (req, res) => {
    res.sendFile('/websocket-client.html', { root: __dirname })
})
// webserver.get('/tugofwar', (req, res) => {
//     res.sendFile('/tugofwar.html', { root: __dirname })
// })

webserver.get('/gungame', (req, res) => {
    const source = req.headers['user-agent']
    // console.log(`source: ${source}`)
    const ua = useragent.parse(source);
    // console.log(`ua: ${ua}`)
    const isMobile = ua.isMobile;
    // console.log(`isMobile: ${isMobile}`)

    console.log('reached server')

    if (isMobile) {
        res.sendFile('/gungame/gungamecontroller.html', { root: __dirname })
    } else {
        res.sendFile('/gungame/gungame.html', { root: __dirname })
    }
})
webserver.get('/gungame.js', (req, res) => {
    res.sendFile('./dist/gungame.js', { root: __dirname })
})

webserver.get('/dist/gungamecontroller.js', (req, res) => {
    res.sendFile('/dist/gungamecontroller.js', { root: __dirname });
})

webserver.listen(8080, process.env.IP_ADDRESS, () => {
    console.log(`listening on port ${8080}`)
});

// const sockserver = tugofwarserver();

gungameserver();