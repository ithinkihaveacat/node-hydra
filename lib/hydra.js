DEBUG = typeof DEBUG == "undefined" ? false : DEBUG;

var sys = require('sys'),
    url = require('url'),
    events = require('events'),
    io = require('socket.io');

events.Promise = require('./promise').Promise;

var TIMEOUT = 60000;

/**
 * Add a cheeky method to EventEmitter.  This is like addListener(), except that: 
 * (a) it takes a promise, instead of a function, and (2) it supports a timeout.  
 * (If the event has not fired before the timeout expires, the promise is sent
 * the error event.)  The event listener is always removed.
 */

events.EventEmitter.prototype.addTimedListener = function(event, promise, timeout) {
    
    timeout = timeout || TIMEOUT;
    
    var handler, p, self = this;
    
    handler = function(message) {
        p.emitSuccess(message);
    };
    
    p = new events.Promise();
    p.addListener("success", function() {
        promise.emitSuccess.apply(promise, arguments);
        self.removeListener(event, handler);
    });
    p.addListener("error", function() {
        promise.emitError.apply(promise, arguments);
        self.removeListener(event, handler);
    });
    p.timeout(timeout);
    
    self.addListener(event, handler);
    
};

function HydraResponse() {
    this.type = "response";
    this.headers = {};
    this.body = "";
}

HydraResponse.prototype = Object.create(events.Promise.prototype);

HydraResponse.prototype.writeHead = function(headers) {
    this.headers = headers;
};

HydraResponse.prototype.write = function(body) {
    this.body += body;
};

HydraResponse.prototype.end = function() {
    this.emitSuccess(this);
};

function Hydra(external, internal) {
    
    var self = this;

    // The WebSocket server listens to events emitted by the requestEmitter,
    // and writes responses to the responseEmitter.
    
    this.requestEmitter = new events.EventEmitter();
    this.responseEmitter = new events.EventEmitter();

    // Handle "internal" requests (i.e. from HTTP clients running on the server)

    internal.on("request", function(req, res) {
        self.serverRequest(req, res);
    });
    
    // Listen for WebSocket events on the external HTTP interface

    this.server = io.listen(external);

    this.server.on("connection", function(client) {

        var clientid = "client" + Math.floor(Math.random() * 4294967296).toString(16); // client.sessionId is similar
        //clientid = "foo";
        
        // Handler for "internal" requests

        function requestHandler(message, responsePromise) {

            message.id = Math.floor(Math.random() * 4294967296).toString(16);

            if (DEBUG) {sys.debug("Sending message: " + JSON.stringify(message));}

            self.responseEmitter.addTimedListener(message.id, responsePromise);

            client.send(JSON.stringify(message));

        }
        
        // Listen for "internal" requests

        self.requestEmitter.addListener(clientid, requestHandler);

        if (DEBUG) {sys.debug("Client " + clientid + " connected");}
        
        client.on("disconnect", function() {
            if (DEBUG) {sys.debug("Client " + clientid + " disconnected");}
            self.requestEmitter.removeListener(clientid, requestHandler);
        });

        client.on("message", function(data) {

            if (DEBUG) {sys.debug("Received: " + data);}

            var messages;

            try {
                messages = JSON.parse(data);
                // Have to do this transformation because of
                // http://github.com/LearnBoost/Socket.IO/issues/#issue/21
                if (Array.isArray(messages)) {
                    messages = messages.map(function(m) { return JSON.parse(m)[0]; });
                } else {
                    messages = [ messages ];
                }
            } catch (e) {
                client.send(JSON.stringify({
                    type: "error",
                    message: e.message
                }));
                return;
            }
            
            messages.forEach(function (message) {

                message.clientid = clientid;

                switch (message.type) {

                    case "response":

                        // It's a response

                        // TODO Check if anything's listening--if not, then
                        // perhaps client has been too slow in replying, or
                        // trying to spoof responses.

                        self.responseEmitter.emit(message.id, message);
                        break;

                    case "request":

                        // It's a request

                        var response = new HydraResponse();
                        response.addListener("success", function() {
                            client.send(JSON.stringify({
                                type: "response",
                                id: message.id, // client must generate ids
                                clientid: clientid,
                                headers: response.header,
                                body: response.body
                            }));
                        });
                        response.addListener("error", function() {
                            client.send(JSON.stringify({
                                type: "response",
                                id: message.id,
                                clientid: clientid,
                                status: 504,
                                headers: {"Content-Type": "text/plain"},
                                body: "Gateway Timeout"
                            }));
                        });
                        response.timeout(TIMEOUT);

                        self.clientRequest(message, response);
                        break;

                    default:

                        sys.error("Unknown message type " + JSON.stringify(message.type));
                        break;

                }
            
            });

        });

    });

};

/**
 * @param {Object} request not a http.ServerRequest, but pretends to be one
 * @param {HydraResponse} response not a http.ServerResponse, but pretends to be one
 */

Hydra.prototype.clientRequest = function(request, response) {

    sys.debug("Client request: " + request.method + " " + request.url);

    var part = require('url').parse(request.url);
    part.port = part.port || 80;
    
    var http = require('http').createClient(part.port, part.hostname);

    var req = http.request(
        request.method, 
        part.pathname + (part.search || ""), 
        {"Host": part.hostname} // NodeJS's client issues HTTP 1.1 requests, so Host is mandatory
    );

    req.addListener("response", function(res) {

        var data = "";

        res.addListener("data", function(s) {
            data += s;
        });

        res.addListener("end", function() {
            response.write(data);
            response.end();
        });

    });

    // TODO Add req.write() to take body from the client?
    
    req.end();
        
}

Hydra.prototype.serverRequest = function(request, response) {

    sys.debug("Server request: " + request.method + " " + request.url);

    var self = this, body = "";
        
    request.addListener("data", function(s) {
        body += s;
    });

    request.addListener("end", function() {

        var clientid = require('url').parse(request.url).hostname;

        // Issue the request to the client

        var message = {
            type: "request",
            url: url.parse(request.url),
            method: request.method,
            headers: request.headers,
            body: body,
            clientid: clientid
        };

        var promise = new events.Promise();

        promise.addListener("success", function(message) {
            // message is the response generated by the client, which needs a bit
            // of massaging to be turned into a real http.ServerResponse.
            response.writeHead(message.status, message.headers || {});
            response.write(message.body || "");
            response.end();
        });
        promise.addListener("error", function() {
            if (DEBUG) {sys.debug("Client timed out");}
            response.writeHead(504, {"Content-Type": "text/plain"});
            response.write("Client timed out");
            response.end();
        });
        promise.timeout(TIMEOUT);

        // TODO Check whether there actually are any listeners.  (Will
        // eventually time out, though...)

        self.requestEmitter.emit(clientid, message, promise);

    });

};

exports.listen = function(external, internal) {
    return new Hydra(external, internal);
}
