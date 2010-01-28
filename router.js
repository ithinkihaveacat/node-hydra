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

    return function(req, res) {

        var i, l, m = matchers[req.method], parts;

        for (i = 0, l = m.length; i < l; i++) {
            if ((parts = url.parse(req.url).pathname.match(m[i][0]))) {
//                sys.debug(req.method + " " + req.url + " OK");
                m[i][1].call(rules, req, res, parts);
                return;
            }
        }

//        sys.debug(req.method + " " + req.url + " Not Found");

        res.sendHeader(404);
        res.finish();

        return;
        
    }

};