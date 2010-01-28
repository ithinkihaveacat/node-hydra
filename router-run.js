var sys = require('sys'),
    http = require('http'),
    router = require('./router'),
    url = require('url');

function MyRouter(obj, req, res) {
    sys.debug("obj = " + sys.inspect(obj));
    sys.debug("req = " + sys.inspect(req));
    sys.debug("res = " + sys.inspect(res));
    this.obj = obj;
    this.req = req;
    this.res = res;
    this.url = url.parse(req.url, true)
    sys.debug("this = " + sys.inspect(this));
}

MyRouter.prototype = {

    greet: function() {
        return "Hello, " + this.obj.name;
    },

    // curl -s http://127.0.0.1:8000/name

    "GET /name": function() {

        var body = "", self = this;

        self.req.addListener("body", function(s) {
            body += s;
        });

        self.req.addListener("complete", function() {
            self.res.sendHeader(200, {"Content-Type": "application/json"});
            self.res.sendBody(JSON.stringify(self.greet()) + "\n");
            self.res.finish();
        });

    },

    // curl -s -X PUT -d '"Michael"' http://127.0.0.1:8000/name

    "PUT /name": function() {

        var body = "", self = this;

        self.req.addListener("body", function(s) {
            body += s;
        });
        
        self.req.addListener("complete", function() {
            self.obj.name = JSON.parse(body); // Assumes body is JSON
            sys.debug("Setting name to " + self.obj.name);
            self.res.sendHeader(200, {"Content-Type": "application/json"});
            self.res.sendBody(JSON.stringify(self.greet()) + "\n");
            self.res.finish();
        });

    }

};

http.createServer(router.createSimple(MyRouter, {})).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');

