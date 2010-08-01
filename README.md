# Hydra

Double-headed HTTP.

## Introduction

Hydra works, but is pretty rough and unfinished.  The the eventual aim is to
make it possible to:

  * Make browser-initiated HTTP requests to the servers.
  * Make server-initiated HTTP requests to browsers.
  
i.e. both the client and server can push and pull.  In particular, HTTP
clients running on the *server* can issue requests like

    DELETE http://client16b759c4/item/78

to a HTTP proxy running NodeJS, and have then tunnelled to the browser via a
WebSocket.

## Status/TODO

At the moment, HTTP requests can be passed back and forth, and there's
simple browser-based code for both HTTP servers and HTTP clients.
WebSocket-tunnelled HTTP requests can't be chunked or streamed (in either
direction), though the client can respond out of order (messages have an
id).

This has been tested in Chrome and Firefox on OS X.  Chrome supports
websockets natively; Firefox requires a Flash "shim".

## Installation

For the server:

  1. Download and install [NodeJS](http://nodejs.org/#download).
  1. Download and install the following projects into the parent directory of `node-hydra`:
    * <http://github.com/ithinkihaveacat/node-scylla.git> - Router for NodeJS
    * <http://github.com/LearnBoost/Socket.IO-node.git> - WebSocket server
    * <http://github.com/LearnBoost/Socket.IO.git> - WebSocket client
  1. Start the server:
          $ node run.js
          External Httpd listening at http://127.0.0.1:8080/
          Internal Proxy listening at http://127.0.0.1:8081/
          1 Aug 15:57:07 - socket.io ready - accepting connections

For the client:

  1. Load <http://127.0.0.1:8080/> in Google Chrome.
  1. Open up the JavaScript console.  You should see various message,
  include one giving you your client id.
  1. On the server, you should see a message indicating that a client has
  connected.
  
## Examples

Client-initiated requests:

  1. In Google Chrome, load <http://127.0.0.1:8080/>.
  2. In the JavaScript console, enter:
          http.createClient('GET', 'http://beebo.org/', function(res) {
              console.log(res); 
          });
     This arranges for the *server* to request <http://beebo.org>, and
     return the contents via the WebSocket.  The console should show the
     traffic moving back and forth.

Server-initiated requests:

  1. On the server, enter
          $ export CLIENTID="client611851c0"
          $ export http_proxy="http://127.0.0.1:8081/"
          $ curl -s -i -X GET "http://$CLIENTID/"
          $ curl -s -i -d 'Michael' -X PUT "http://$CLIENTID/"
          $ curl -s -i -X GET "http://$CLIENTID/"
     where `client611851c0` is the client id.
  1. The first command should return `Clem`, and the second and third should
  return `Michael`.  This uses the sample server in `hello.js`.
