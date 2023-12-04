const websocket = new WebSocket('ws://192.168.50.29:8082')

const upbutton = document.getElementById('upbutton');
upbutton.addEventListener('click', (e) => {
    e.preventDefault();
    websocket.send('hi')
})

const downbutton = document.getElementById('upbutton');
downbutton.addEventListener('click', (e) => {
    e.preventDefault();
})

const leftbutton = document.getElementById('upbutton');
leftbutton.addEventListener('click', (e) => {
    e.preventDefault();
})

const rightbutton = document.getElementById('upbutton');
rightbutton.addEventListener('click', (e) => {
    e.preventDefault();
})
console.log('connected')