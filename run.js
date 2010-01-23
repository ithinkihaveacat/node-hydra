var http = require("http");
var ws = require("./ws");

var hydra = require("./hydra");

var server = hydra.create(http.createServer, ws.createServer);

server.listen(8000, 8080);
