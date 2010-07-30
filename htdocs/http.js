DEBUG = typeof DEBUG == "undefined" ? false : DEBUG;

function Http(websocket) {
    
    var self = this;

    this.listeners = { };

    websocket.on('connect', function() {
        if (DEBUG) { console.log("WebSocket: connected"); }
    });
    
    websocket.on('disconnect', function() {
        if (DEBUG) { console.log("WebSocket: disconnected"); }
    });
    
    websocket.on('message', function(data) {
        if (DEBUG) { console.log("WebSocket: received [" + data + "]"); }

        var message;

        try {
            message = JSON.parse(data);
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
                        // send() seems to behave inconsistently...
                        websocket.send(JSON.stringify([res]));
                    });
                } else {
                    if (DEBUG) { console.log("WebSocket: no server for request: " + e.data); }
                }
                break;

            case message.type === "response":
                if (self.listeners[message.id]) {
                    self.listeners[message.id](message);
                    delete self.listeners[message.id];
                } else {
                    if (DEBUG) { console.log("WebSocket: no listener for response: " + e.data); }
                }
                break;

        }

    });

    this.websocket = websocket;

}

Http.prototype.addListener = function(id, callback) {
    this.listeners[id] = callback;
};

Http.prototype.createServer = function(server) {
    this.server = server;
};

Http.prototype.createClient = function(method, url, callback, args) {
    
    if (!args) {
        args = { };
    }

    var id = Math.floor(Math.random() * 4294967296).toString(16);

    this.addListener(id, callback);
    
    // send() seems to behave inconsistently
    
    this.websocket.send(JSON.stringify([{
        type: "request",
        id: id,
        method: method,
        url: url,
        headers: args.headers || null,
        body: args.body || null
    }]));

}
