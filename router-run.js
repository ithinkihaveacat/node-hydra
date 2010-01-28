var sys = require('sys'),
    http = require('http'),
    router = require('./router');

var handle = router.createSimple({

    name: "Clem",

    greet: function() {
        return "Hello, " + this.name;
    },

    // curl -s http://127.0.0.1:8000/name

    "GET /name": function(obj) {

        var body = "", self = this;

        obj.req.addListener("body", function(s) {
            body += s;
        });

        obj.req.addListener("complete", function() {
            obj.res.sendHeader(200, {"Content-Type": "application/json"});
            obj.res.sendBody(JSON.stringify(self.greet()) + "\n");
            obj.res.finish();
        });

    },

    // curl -s -X PUT -d '"Michael"' http://127.0.0.1:8000/name

    "PUT /name": function(obj) {

        var body = "", self = this;

        obj.req.addListener("body", function(s) {
            body += s;
        });
        
        obj.req.addListener("complete", function() {
            self.name = JSON.parse(body); // Assumes body is JSON
            sys.debug("Setting name to " + self.name);
            obj.res.sendHeader(200, {"Content-Type": "application/json"});
            obj.res.sendBody(JSON.stringify(self.greet()) + "\n");
            obj.res.finish();
        });

    }

});

http.createServer(function (req, res) {
    handle(req, res);
}).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');

