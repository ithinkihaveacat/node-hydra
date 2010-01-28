var sys = require('sys');
var url = require('url');

exports.createSimple = function(rules) {

    var regexp = /^\s*((\S*)\s+)?(\S*)\s*$/, parts = null, matchers = {};

    for (r in rules) {

        parts = r.match(regexp);

        if (!matchers[parts[2]]) {
            matchers[parts[2]] = [];
        }

        matchers[parts[2]].push([
            new RegExp(parts[3]),
            rules[r]
        ]);

    }

    function F() { }
    F.prototype = rules;
    router = new F();

    return function(req, res) {

        var obj = {
            req: req,
            res: res,
            method: req.method,
            url: url.parse(req.url, true)
        };

        var i, l, m = matchers[obj.method];

        for (i = 0, l = m.length; i < l; i++) {
            if ((obj.parts = obj.url.pathname.match(m[i][0]))) {
                sys.debug(obj.method + " " + obj.url.href + " OK");
                m[i][1].call(router, obj);
                return;
            }
        }

        sys.debug(obj.method + " " + obj.url.href + " Not Found");

        obj.res.sendHeader(404);
        obj.res.finish();

        return;
        
    }

};