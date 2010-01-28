// Client request:
//
// {type:"request",method:"GET",url:"http://beebo.org/",id:"jjjj"}
//
// Response:
//
// {"type":"response",body:"jjjj","id":"36057424"}

var http = require("http");

var ws = require("./ws"); // Get ws.js from http://github.com/ncr/node.ws.js

var hydra = require("./hydra");

var server = hydra.create(http.createServer, ws.createServer);

server.listen(8000, 8080);
