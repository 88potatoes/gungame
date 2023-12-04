(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { sendJSON } = require('../ws-helpers')
const websocket = new WebSocket('ws://192.168.50.29:8082')

websocket.onopen = () => {
    sendJSON(websocket, {command: 'phone_join'})
    console.log('phone_join event')
}

const upbutton = document.getElementById('upbutton');
upbutton.addEventListener('click', (e) => {
    e.preventDefault();
    sendJSON(websocket, {command: 'move-up'})
})

const downbutton = document.getElementById('downbutton');
downbutton.addEventListener('click', (e) => {
    sendJSON(websocket, {command: 'move-down'})
    e.preventDefault();
})

const leftbutton = document.getElementById('leftbutton');
leftbutton.addEventListener('click', (e) => {
    e.preventDefault();
    sendJSON(websocket, {command: 'move-left'})
})

const rightbutton = document.getElementById('rightbutton');
rightbutton.addEventListener('click', (e) => {
    sendJSON(websocket, {command: 'move-right'})
    e.preventDefault();
})
console.log('connected')
},{"../ws-helpers":2}],2:[function(require,module,exports){

/**
 * Send JSON(s) through websocket
 * @param {WebSocket} ws 
 * @param {Array || Object} messages 
 */
function sendJSON(ws, ...messages) {
    for (let message of messages) {
        ws.send(JSON.stringify(message));
    }
}

function handle_event(event_dict, event, callback) {
    event_dict[event] = callback;
}

function parseJSON(json) {
    const info = JSON.parse(json);
    const command = info.command;
    const data = info['data'] || null;

    return [command, data];
}

function* create_id_generator() {
    let i = 0;
    while (i < 1000) {
        yield i;
        i++;
    }
}

const id_generator = create_id_generator();

function get_id() {
    return id_generator.next().value;
}

module.exports = {
    sendJSON,
    handle_event,
    parseJSON,
    get_id
}
},{}]},{},[1]);
