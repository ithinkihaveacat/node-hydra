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

require.paths.unshift("../node-scylla/lib"); // http://github.com/ithinkihaveacat/node-scylla
require.paths.unshift("../ejsgi/lib");       // http://github.com/isaacs/ejsgi
require.paths.unshift("../node.ws.js");      // http://github.com/ncr/node.ws.js
require.paths.unshift("lib");

DEBUG = true;

var sys = require('sys'),
    http = require('http'),
    ejsgi = require("ejsgi"),
    ws = require("ws"), 
    hydra = require("hydra"),
    Server = require("hydra/static");

// The static webserver.

ejsgi.Server(new Server(["htdocs", "../web-socket-js"]).adapter('ejsgi'), "localhost", 8080).start();
sys.puts("Static Httpd listening at http://127.0.0.1:8080/");

// The WebSockets server.  This requires two ports: one to initiate the connection,
// and another to handle the socket communication itself.

hydra.create(http.createServer, ws.createServer).listen(8081, 8082);