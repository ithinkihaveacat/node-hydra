# Hydra

Double-headed HTTP

## Introduction

This is pretty rough and unfinished, but the eventual aim is to make it
possible for:

  * HTTP clients running in the browser to make HTTP requests to servers
  accessible to the webserver (i.e. not much more than cross-domain Ajax;
  the only real difference is that they requests are tunnelled through a
  WebSocket)
  * HTTP clients running on the server to make HTTP requests to servers
  running in the browser
  
i.e. both the client and server can push and pull, though the second feature
is more interesting than the first.  When it's working, it'll be possible
for HTTP clients on the server to issue requests like

    DELETE http://client16b759c4/item/78

to a HTTP proxy running on NodeJS, and have then tunnelled to the browser
via a WebSocket.

## Status/TODO

At the moment, HTTP requests can be passed back and forth, but there's no
way to parse and handle the requests on the client side.
WebSocket-tunnelled HTTP requests can't be chunked (in either direction),
but the client can respond out of order (messages have an id).

## Installation

For the server:

  1. Download and install [NodeJS](http://nodejs.org/#download).
  1. Download [ws.js](http://github.com/ncr/node.ws.js/raw/master/lib/ws.js) from
    the [node.ws.js](http://github.com/ncr/node.ws.js) project.
  1. Start the server:

        $ node run.js 
        Websocket server listening at http://127.0.0.1:8080
        Httpd server listening at http://127.0.0.1:8000

For the client:

  1. Download [web-socket-js](http://github.com/gimite/web-socket-js).
  (This is an implementation of WebSockets that uses native WebSockets where
  available, falling back to Flash if not.)
  1. Modify `sample.html` so that the `new WebSocket(...)` line points to
  your WebSocket server.  (`http://127.0.0.1:8080` in the example above.)
  1. Load `sample.html` in a browser.
  1. In the browser you should see a simple input box, plus a status message
  giving you your client id.  (Various message should appear as you start up
  and shut down the server.)
  1. On the server, you should see a message indicating that a client has
  connected.
  
## Examples

Client-initiated requests:

  1. In the input box, enter

        {"type":"request","method":"GET","url":"http://www.google.com/robots.txt"}

  1. You should see the first few characters of Google's `robots.txt`.

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
