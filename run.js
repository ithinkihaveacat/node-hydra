//
// Requirements:
// 
// Clone these into the parent directory:
//
//   * http://github.com/ithinkihaveacat/node-scylla.git
//   * http://github.com/LearnBoost/Socket.IO-node.git
//   * http://github.com/LearnBoost/Socket.IO.git
//
// Example client request:
//
//   {type:"request",method:"GET",url:"http://beebo.org/",id:"jjjj"}
//
// Example server request:
//
//   $ http_proxy=http://127.0.0.1:8081/ wget -q -S -O - http://client5f99eaa4/
//
// ... leading to the client response:
//
//   {"type":"response",body:"jjjj","id":"36057424"}

require.paths.unshift("../node-scylla/lib");
require.paths.unshift("lib");

DEBUG = true;

var sys = require("sys"),
    http = require("http"),
    hydra = require("hydra"),
    Server = require("hydra/static");

var external = http.createServer();
external.on('request', new Server(["htdocs", "../Socket.IO"]).adapter('nodejs'));
external.listen(8080);
sys.puts("External Httpd listening at http://127.0.0.1:8080/");

var internal = http.createServer();
internal.listen(8081);
sys.puts("Internal Proxy listening at http://127.0.0.1:8081/");

hydra.listen(external, internal);
