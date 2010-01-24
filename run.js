var http = require("http");

var ws = require("./ws"); // The ws.js from http://github.com/ncr/node.ws.js

var hydra = require("./hydra");

var server = hydra.create(http.createServer, ws.createServer);

server.listen(8000, 8080);
