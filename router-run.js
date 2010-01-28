var sys = require('sys'),
    http = require('http'),
    router = require('./router'),
    url = require('url');

function MyRouter(name) {
    this.name = name;
}

MyRouter.prototype = {

    send: function(res) {
        res.sendHeader(200, {"Content-Type": "application/json"});
        res.sendBody(JSON.stringify(this.name) + "\n");
        res.finish();
    },

    // curl -i -s http://127.0.0.1:8000/user/mjs

    "GET /user/(.*)": function(req, res, matches) {

        var body = "", self = this;

        req.addListener("body", function(s) {
            body += s;
        });

        req.addListener("complete", function() {
            self.send(res);
        });

    },

    // curl -i -s -X PUT -d '"Michael"' http://127.0.0.1:8000/user/mjs

    "PUT /user/(.*)": function(req, res, matches) {

        var body = "", self = this;

        req.addListener("body", function(s) {
            body += s;
        });
        
        req.addListener("complete", function() {
            self.name = JSON.parse(body); // Assumes body is JSON
            sys.debug("Setting name to " + self.name);
            self.send(res);
        });

    }

};

http.createServer(router.createSimple(new MyRouter("Clem"))).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');
