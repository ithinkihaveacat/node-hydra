//
// This code has a dependency on Socket.IO-node; install it via:
//
//   $ npm install socket.io
//
// See
//
//   http://github.com/isaacs/npm#readme
//
// for more information on npm.

require.paths.unshift("lib");

DEBUG = true;

var sys = require("sys"),
    http = require("http"),
    hydra = require("hydra"),
    Server = require("hydra/static");

var external = http.createServer();
external.on('request', new Server(["htdocs"]).adapter('nodejs'));
external.listen(8080);
sys.puts("External Httpd listening at http://127.0.0.1:8080/");

var internal = http.createServer();
internal.listen(8081);
sys.puts("Internal Proxy listening at http://127.0.0.1:8081/");

hydra.listen(external, internal);
