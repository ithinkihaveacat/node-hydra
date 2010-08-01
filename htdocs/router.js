DEBUG = typeof DEBUG == "undefined" ? false : DEBUG;

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

function Router() {

    var regexp = /^(\S+)\s(.+?)$/, parts = null;

    // Rules will almost certainly be processed in the order in
    // which they are defined (even though the JavaScript spec doesn't
    // require this) due to:
    //
    // http://code.google.com/p/chromium/issues/detail?id=883

    this.matchers = { };

    for (r in this) {

        if ((parts = r.match(regexp))) {

            if (!this.matchers[parts[1]]) {
                this.matchers[parts[1]] = [];
            }

            this.matchers[parts[1]].push([
                new RegExp(parts[2]),
                this[r]
            ]);

        }

    }

}

Router.prototype.dispatch = function(req) {

    if (DEBUG) { console.log("HTTP server: Request: " + req.url.href); }

    var i, l, parts, m = this.matchers[req.method] || [];

    for (i = 0, l = m.length; i < l; i++) {
        if ((parts = req.url.pathname.match(m[i][0]))) {
            if (DEBUG) { console.log(req.method + " " + req.url.pathname + " MATCHED"); }
            return m[i][1].call(this, req, parts);
        }
    }

    if (DEBUG) { console.log(req.method + " " + req.url.pathname + " NOT DISPATCHED"); }

    return {
        status: 404,
        headers: { },
        body: ""
    }

};

Router.prototype.adapter = function(req) {

    var self = this;

    return function(req, callback) {
        callback(self.dispatch(req));
    };

};