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
    sys = require('sys'),
    ws = require("./lib/ws"), // Get ws.js from http://github.com/ncr/node.ws.js
    hydra = require("./lib/hydra"),
    router = require("./lib/router");

DEBUG = false;

http.createServer(router.create(new router.Static("htdocs"))).listen(8080);
sys.puts("Static Httpd listening at http://127.0.0.1:8080/");

hydra.create(http.createServer, ws.createServer).listen(8081, 8082);

