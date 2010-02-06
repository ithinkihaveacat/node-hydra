# Hydra

Double-headed HTTP

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

At the moment, HTTP requests can be passed back and forth, but there's no
way to parse and handle the requests on the client side. WebSocket-tunnelled
HTTP requests can't be chunked or streamed (in either direction), though the
client can respond out of order (messages have an id).

## Installation

For the server:

  1. Download and install [NodeJS](http://nodejs.org/#download).
  1. Download and install [node.ws.js](http://github.com/ncr/node.ws.js) (a
  server-side WebSockets implementation for NodeJS) to the parent directory
  of `node-hydra`. 
  1. Download and install [ejsgi](http://github.com/isaacs/ejsgi) (a
  standard for connecting applications to web servers) to the parent
  directory of `node-hydra`. 
  1. Start the server:

        $ node run.js 
        Static Httpd listening at http://127.0.0.1:8080/
        Hydra: WebSocket server listening at http://127.0.0.1:8082
        Hydra: Httpd server listening at http://127.0.0.1:8081

For the client:

  1. Download and install
  [web-socket-js](http://github.com/gimite/web-socket-js) (an implementation
  of WebSockets that uses native WebSockets where available, falling back to
  Flash if not) to the parent directory of `node-hydra`.
  1. Load <http://127.0.0.1:8080/> in a browser.
  1. In the browser you should see a simple input box, plus a status message
  giving you your client id.  (Various message should appear as you start up
  and shut down the server.)
  1. On the server, you should see a message indicating that a client has
  connected.
  
## Examples

Client-initiated requests:

  1. In the input box, enter

        {"type":"request","method":"GET","url":"http://www.google.com/robots.txt"}

  1. You should see the Google's `robots.txt`.

Server-initiated requests:

  1. On the server, enter

        $ http_proxy=http://127.0.0.1:8000/ wget -q -S -O - http://client5f99eaa4/

    where `client5f99eaa4` is the client id.
  1. A message will appear in the client showing that a request has been
  received.  The request will include a request id.  To send a response, enter the
  following in the input box 

        {"type":"response","body":"Hello, World","id":"7d87e74"}

  where `id` is equal to the request id.  (Not the client id!)
  1. `Hello, World` should appear on the server.
