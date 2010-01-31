// Client request:
//
//   {type:"request",method:"GET",url:"http://beebo.org/",id:"jjjj"}
//
// Server request:
//
//   $ http_proxy=http://127.0.0.1:8000/ wget -q -S -O - http://client5f99eaa4/
//
// ... client response:
//
//   {"type":"response",body:"jjjj","id":"36057424"}

var http = require("http"),
    ws = require("./lib/ws"), // Get ws.js from http://github.com/ncr/node.ws.js
    hydra = require("./lib/hydra");

var server = hydra.create(http.createServer, ws.createServer);

server.listen(8000, 8080);