
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

module.exports = {
    sendJSON,
    handle_event
}