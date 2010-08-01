# Hydra

Double-headed HTTP, via NodeJS.

## Introduction

Hydra makes it possible to:

  * Make browser-initiated HTTP requests to the servers.
  * Make server-initiated HTTP requests to browsers.
  
i.e. both the client and server can both make, and respond to, HTTP requests.
In particular, HTTP clients running on the *server* can issue requests like

    DELETE http://client16b759c4/item/78

to a NodeJS-powered HTTP proxy, and have the request tunnelled to the browser
via a WebSocket.

## Status/TODO

At this point, Hydra is mostly a proof of concept.  HTTP requests can be
passed back and forth, and there's simple browser-based code for both HTTP
servers and HTTP clients.  WebSocket-tunnelled HTTP requests can't be chunked
or streamed (in either direction), though the client can respond out of order
(because messages have an id).

This has been tested in Chrome and Firefox.  Chrome supports WebSockets
natively; Firefox requires a Flash "shim".

## Demo

  1. Download and install [NodeJS](http://nodejs.org/#download).
  1. With [`npm`](http://github.com/isaacs/npm#readme), install the [`socket.io`](http://github.com/isaacs/Socket.IO-node)
     [`scylla`](http://github.com/ithinkihaveacat/node-scylla) packages:
          $ curl http://npmjs.org/install.sh | sh # If you don't already have npm
          $ npm install socket.io
          $ npm install scylla
  1. Start the server:
          $ node demo.js
          External Httpd listening at http://127.0.0.1:8080/
          Internal Proxy listening at http://127.0.0.1:8081/
          1 Aug 15:57:07 - socket.io ready - accepting connections
  1. Load <http://127.0.0.1:8080/>.  (Using Google Chrome might be best.)
  1. You should see a page explaining how to:
    * Initiate requests on the client
    * Start a HTTP server on the client

## Author

Michael Stillwell <mjs@beebo.org>
