// Client request:
// 
// {type:"request",method:"GET",url:"http://beebo.org/"}
//
// Response:
//
// {"type":"response",body:"jjjj","id":"36057424"}

var sys = require('sys'), events = require('events');

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

HydraResponse.prototype.sendHeader = function(headers) {
	this.headers = headers;
};

HydraResponse.prototype.sendBody = function(body) {
	this.body = body.substr(0, 20) + "...";
};

HydraResponse.prototype.finish = function() {
	this.emitSuccess(this);
};

function Hydra(http, ws) {
	this.http = http;
	this.ws = ws;
}

Hydra.prototype = Object.create(events.EventEmitter.prototype);

Hydra.prototype.TIMEOUT = 60000;

Hydra.prototype.listen = function(http_port, ws_port) {
	
	var self = this;
	
	this.httpd = this.http(function(request, response) {

		self.serverRequest(request, response);

	});

	this.wsd = this.ws(function(ws) {
		
		var clientid = Math.floor(Math.random() * 4294967296).toString(16);
		clientid = "qqqqqq";
		
		var requestHandler = function(message, responsePromise) {

			message.id = Math.floor(Math.random() * 4294967296).toString(16);

			sys.debug("Sending message: " + JSON.stringify(message));
			
			self.addTimedListener("response:" + message.id, responsePromise);
			
			ws.send(JSON.stringify(message));
			
		};
		
		self.addListener("request:" + clientid, requestHandler);
		
		ws.addListener("close", function() {
			self.removeListener("request:" + clientid, requestHandler);
		});
		
		ws.addListener("connect", function(resource) { 
			ws.send(JSON.stringify({
				type: "status",
				message: "Client id is: " + clientid
			}));
		});

		ws.addListener("receive", function(data) {
			
			sys.debug("Received: " + data);

			var message;
			
			try {
				message = JSON.parse(data);
			} catch (e) {
				ws.send(JSON.stringify({
					type: "error",
					message: e.message
				}));
				return;
			}
			
			message.clientid = clientid;
			
			if (message.type == "response") {
				
				// It's a response
				
				// TODO Check if anything's listening--if not, then
				// perhaps client has been too slow in replying, or
				// trying to spoof responses.
			
				self.emit("response:" + message.id, message);
				
			} else if (message.type == "request") {
				
				// It's a request
				
				var response = new HydraResponse();
				response.addListener("success", function() { 
					ws.send(JSON.stringify({
						type: "response",
						clientid: clientid,
						headers: response.header,
						body: response.body
					}));
				});
				response.timeout(TIMEOUT);

				self.clientRequest(message, response);
				
			}
			
		});
		
	});
	
	this.wsd.listen(ws_port);
	sys.puts("Websocket server listening at http://127.0.0.1:" + ws_port);
	
	this.httpd.listen(http_port);
	sys.puts("Httpd server listening at http://127.0.0.1:" + http_port);

};

Hydra.prototype.clientRequest = function(request, response) {
	
	sys.debug("In clientRequest");
	
	// request is not a http.ServerRequest, but it must have the same properties as one
	// response is not a http.ServerResponse either, it's a HydraResponse but which behaves the same
	
	var part = require('url').parse(request.url);
	part.port = part.port || 80;
	
	sys.debug("Client wants:");
	sys.debug(sys.inspect(part));
	
	var http = require('http').createClient(part.port, part.hostname);

	var req = http.request(
		request.method, 
		part.pathname + (part.search || ""), 
		{ "Host": part.hostname } // nodejs's client issues HTTP 1.1 requests, so Host is mandatory
	);
	
	req.finish(function(res) {
		
		var data = "";

		res.addListener("body", function(s) {
			data += s;
		});

		res.addListener("complete", function() {
			// TODO Split data into header and body, and
			// sendHeader() and sendBody() separately
			response.sendBody(data);
			response.finish();
		});

	});
	
}

Hydra.prototype.serverRequest = function(request, response) {
	
	var self = this;
		
	sys.debug("In serverRequest");
	
	var clientid = require('url').parse(request.url).hostname;
	clientid = "qqqqqq";
	
	// Issue the request to the client
	
	var message = {
		type: "request",
		url: request.url,
		id: request.id,
		method: request.method,
		headers: request.headers,
		body: request.body,
		clientid: clientid
	};
	
	var promise = new events.Promise();

	promise.addListener("success", function(message) {
		// message is the response generated by the client, which needs a bit
		// of massaging to be turned into a real http.ServerResponse.
		response.sendHeader(200, message.headers || {});
		response.sendBody(message.body || "");
		response.finish();
	});
	promise.addListener("error", function() { 
		sys.debug("Client timed out");
		response.sendHeader(504, { "Content-Type": "text/plain" });
		response.sendBody("Client timed out");
		response.finish();
	});
	promise.timeout(TIMEOUT);
	
	// TODO Check whether there actually are any listeners.  (Will
	// eventually time out, though...)

	self.emit("request:" + clientid, message, promise);

};

exports.create = function(http, ws) {
	return new Hydra(http, ws);
}
