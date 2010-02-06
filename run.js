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

require.paths.unshift("../node-scylla/lib");
require.paths.unshift("../ejsgi/lib");
require.paths.unshift("../node.ws.js"); // Get ws.js from http://github.com/ncr/node.ws.js
require.paths.unshift("lib");

var sys = require('sys'),
    http = require('http'),
    ejsgi = require("ejsgi"),
    ws = require("ws"), 
    hydra = require("hydra"),
    scylla = require("scylla"),
    Server = require("hydra/static");

ejsgi.Server(new Server(["../web-socket-js", "htdocs"]).adapter('ejsgi'), "localhost", 8080).start();
sys.puts("Static Httpd listening at http://127.0.0.1:8080/");

hydra.create(http.createServer, ws.createServer).listen(8081, 8082);