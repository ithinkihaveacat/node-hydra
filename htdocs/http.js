DEBUG = typeof DEBUG == "undefined" ? false : DEBUG;

function Http(websocket, onopen) {

    var http = this;

    websocket.listeners = { };

    websocket.onopen = function() {
        if (DEBUG) { console.log("WebSocket: opened"); }
        if (http.onopen) {
            http.onopen(http);
        }
    };
    
    websocket.onclose = function() {
        if (DEBUG) { console.log("WebSocket: closed"); }
    };
    
    websocket.onmessage = function(e) {
        if (DEBUG) { console.log("WebSocket: received [" + e.data + "]"); }

        var message;

        try {
            message = JSON.parse(e.data);
        } catch (exception) {
            throw exception; // Catch and immediate rethrow gives better stack trace in Chrome
        }

        switch (true) {

            case message.type === "request":
                if (http.server) {
                    http.server(message, function(res) {
                        res.id = message.id;
                        res.type = "response";
                        if (DEBUG) { console.log("WebSocket: sending: " + JSON.stringify(res)); }
                        websocket.send(JSON.stringify(res));
                    });
                } else {
                    if (DEBUG) { console.log("WebSocket: no server for request: " + e.data); }
                }
                break;

            case message.type === "response":
                if (this.listeners[message.id]) {
                    this.listeners[message.id](message);
                } else {
                    if (DEBUG) { console.log("WebSocket: no listener for response: " + e.data); }
                }
                break;

        }

    };

    websocket.addListener = function(id, callback) {
        this.listeners[id] = callback; // Handle more than one listener? It's not really useful...
    }

    this.websocket = websocket;
    this.onopen = onopen;
}

/**
 * @param {function} server takes a request object, and callback
 */

Http.prototype.createServer = function(server) {
    this.server = server;
};

Http.prototype.createClient = function(method, url, callback, args) {

    if (!args) {
        args = { };
    }

    var id = Math.floor(Math.random() * 4294967296).toString(16);

    this.websocket.addListener(id, callback);

    this.websocket.send(JSON.stringify({
        type: "request",
        id: id,
        method: method,
        url: url,
        headers: args.headers || null,
        body: args.body || null
    }));

}
