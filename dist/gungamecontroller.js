(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{}]},{},[1]);
