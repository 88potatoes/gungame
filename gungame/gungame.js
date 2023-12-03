const canvas = document.getElementById('canv');
const element = document.createElement('div');
const {} = require('../ws-helpers.js')
canvas.appendChild(element)
let posx = 10;
let posy = 60;
element.style = "position: absolute; background: red; width: 50px; height: 50px;"
element.style.left = `${posx}px`;
element.style.top = `${posy}px`;
let goup = false;
let godown = false;
let goright = false;
let goleft = false;

const websocket = new WebSocket('ws://localhost:8082')

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            goup = true;
            break;
        case 'a':
            goleft = true;
            break;
        case 's':
            godown = true;
            break;
        case 'd':
            goright = true;
            break;
    }
})

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            goup = false;
            break;
        case 'a':
            goleft = false;
            break;
        case 's':
            godown = false;
            break;
        case 'd':
            goright = false;
            break;
    }
})

const loop = () => {
    update();
    render();
    requestAnimationFrame(loop)
};

window.requestAnimationFrame(loop)

const vel = 6;
function update() {
    if (goup) {
        posy -= vel;
    }
    if (godown) {
        posy += vel;
    }
    if (goleft) {
        posx -= vel;
    }
    if (goright) {
        posx += vel;
    }
}

function render() {
    element.style.top = `${posy}px`;
    element.style.left = `${posx}px`;
}