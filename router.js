var sys = require('sys');
var url = require('url');

exports.createSimple = function(rules) {

    var regexp = /^\s*((\S*)\s+)?(\S*)\s*$/, parts = null, matchers = {};

    args = Array.prototype.slice.call(arguments, 1);

    for (r in rules.prototype) {

//        sys.debug("r = " + r);

        parts = r.match(regexp);

//        sys.debug(sys.inspect(parts));

        if (!matchers[parts[2]]) {
            matchers[parts[2]] = [];
        }

        matchers[parts[2]].push([
            new RegExp(parts[3]),
            rules.prototype[r]
        ]);

    }

    return function(req, res) {

        var i, l, m = matchers[req.method], parts;

        for (i = 0, l = m.length; i < l; i++) {
            if ((parts = url.parse(req.url).pathname.match(m[i][0]))) {
                sys.debug(req.method + " " + req.url + " OK");

                sys.debug("a = " + sys.inspect(rules.prototype.constructor.toString()));
                var r = rules.prototype.constructor.apply(null, args.concat(req, res));
                                
//                new rules(req, res, parts);


                sys.debug(sys.inspect(m[i]));
                m[i][1].call(r);
                return;
            }
        }

        sys.debug(req.method + " " + req.url + " Not Found");

        res.sendHeader(404);
        res.finish();

        return;
        
    }

};