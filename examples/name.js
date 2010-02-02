var sys = require('sys'),
    http = require('http'),
    url = require('url'),
    events = require('events'),
    router = require('../lib/router'),
    ejsgi = require('../../ejsgi/lib/ejsgi');

function NameDemo(name) {
    router.Base.call(this);
    this.name = name;
}

NameDemo.prototype = Object.create(router.Base.prototype);

process.mixin(NameDemo.prototype, {

    send: function(req) {

        var body = JSON.stringify(this.name) + "\n";

        var res = {
            status: 200,
            headers: {
                "content-type": "application/json",
                "content-length": body.length
            },
            body: new req.jsgi.stream()
        };
        res.body.write(body); // TODO what to do with encoding?
        res.body.close();

        return res;
    },

    // curl -i -s http://127.0.0.1:8000/name

    "GET /name": function(req) {
        return this.send(req);
    },

    // curl -i -s -X PUT -d '"Michael"' http://127.0.0.1:8000/name

    "PUT /name": function(req) {

        var body = "", self = this, promise = new events.Promise();

        req.input.addListener("data", function(s) {
            body += s;
        });
        
        req.input.addListener("end", function() {
            self.name = JSON.parse(body); // Assumes body is JSON
            sys.debug("Setting name to " + self.name);
            promise.emitSuccess(self.send(req));
        });

        return promise;

    }

});

ejsgi.Server(new NameDemo("Clem").dispatcher(), "localhost", 8000).start();

sys.puts('Server running at http://127.0.0.1:8000/');
sys.puts('');
sys.puts('Examples:');
sys.puts('');
sys.puts('  $ curl -i -s -X GET http://127.0.0.1:8000/name');
sys.puts('  $ curl -i -s -X PUT -d \'"Michael"\' http://127.0.0.1:8000/name');
