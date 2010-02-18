// A simple static webserver to be used with Hydra.

var path = require('path'),
    mime = require('mime'),
    events = require('events'),
    sys = require('sys'),
    fs = require('fs'),
    scylla = require('scylla');

/**
 * @param {array|string} docroot If multiple directories are provided, each is searched in turn.
 */

function Static(docroot) {

    scylla.Base.call(this);

    if (typeof docroot === "string") {
        docroot = [ docroot ];
    }

    this.docroot = docroot.map(function(dir) {
        return path.join(process.cwd(), dir);
    });

}

Static.prototype = Object.create(scylla.Base.prototype);

process.mixin(Static.prototype, {

    "GET /$": function(req) {
        req.url += "index.html";
        return this.dispatch(req);
    },

    'GET (.*)': function(req, matches) {

        var promise = new events.Promise();

        function notFound() {

            var res = {
                status: 404,
                headers: { },
                body: new req.jsgi.stream()
            };
            res.body.close();

            promise.emitSuccess(res);

            if (DEBUG) { sys.debug(req.method + " " + req.url + " NOT FOUND"); }

        }

        function search(dirs) {

            if (dirs.length == 0) {

                // Can't find matches[1] in any of the this.docroot directories,
                // return 404.

                notFound();
                return;

            }

            var filename = path.join(dirs[0], matches[1]);

            if (filename.indexOf(dirs[0]) !== 0) {

                // Hack attempt; docroot is not a parent of the requested file,
                // return 404.

                notFound();
                return;

            }

            var exists = fs.stat(filename);

            exists.addListener("success", function (stat) {

                if (stat.isFile()) {

                    // File exists, try to read it

                    var contentType = mime.extToType(path.extname(filename));
                    var encoding = contentType.slice(0, 4) !== "text" ? "binary" : "utf8"; // TODO Not reliable!

                    fs.readFile(filename, encoding).addCallback(function(body) {

                        if (body) {

                            var res = {
                                status: 200,
                                headers: {
                                    "content-type": contentType,
                                    "content-length": body.length
                                },
                                body: new req.jsgi.stream()
                            };
                            res.body.write(body, encoding);
                            res.body.close();

                            promise.emitSuccess(res);

                        } else {

                            // Couldn't return cat() file (unreadable?), return 404.

                            notFound();

                        }

                    });

                } else {

                    // Exists, but not a file (directory?).  Return 404.

                    notFound();

                }

            });

            exists.addListener("error", function () {

                // filename doesn't exist (in this directory), try the next
                // one.

                search(dirs.slice(1));

            });

            return;

        }

        // It's possible that this call will promise.emitSuccess()
        // more or less immediately, but this is okay even though the
        // caller is yet to receive the promise because: "The listener
        // is executed right away if the promise has already fired."
        // http://nodejs.org/api.html#_events

        search(this.docroot.slice(0));

        return promise;

    }

});

module.exports = Static;

