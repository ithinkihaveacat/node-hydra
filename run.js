// Client request:
//
//   {type:"request",method:"GET",url:"http://beebo.org/",id:"jjjj"}
//
// Server request:
//
//   $ http_proxy=http://127.0.0.1:8081/ wget -q -S -O - http://client5f99eaa4/
//
// ... client response:
//
//   {"type":"response",body:"jjjj","id":"36057424"}

DEBUG = true;

var sys = require('sys'),
    http = require('http'),
    ejsgi = require("../ejsgi/lib/ejsgi"),
    ws = require("./lib/ws"), // Get ws.js from http://github.com/ncr/node.ws.js
    hydra = require("./lib/hydra"),
    router = require("./lib/router");
    
ejsgi.Server(new router.Static("htdocs").dispatcher(), "localhost", 8080).start();
sys.puts("Static Httpd listening at http://127.0.0.1:8080/");

hydra.create(http.createServer, ws.createServer).listen(8081, 8082);