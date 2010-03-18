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

Static.prototype = scylla.inherit(scylla.Base.prototype, {

    "GET /$": function(req, res) {
        req.url += "index.html";
        return this.dispatch(req, res);
    },

    'GET (.*)': function(req, res, matches) {

        function notFound() {

            res.writeHeader(404, { });
            res.close();

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

            fs.stat(filename, function (error, stat) {

                if (error) {

                    // filename doesn't exist (in this directory), try the next
                    // one.

                    search(dirs.slice(1));
                    return;

                }

                if (stat.isFile()) {

                    // File exists, try to read it

                    var contentType = mime.extToType(path.extname(filename));
                    var encoding = contentType.slice(0, 4) !== "text" ? "binary" : "utf8"; // TODO Not reliable!

                    fs.readFile(filename, encoding, function (error, body) {

                        if (error) {

                            // Couldn't return cat() file (unreadable?), return 404.

                            notFound();
                            return;

                        }

                        res.writeHeader(200, {
                            "content-type": contentType,
                            "content-length": body.length
                        });

                        res.write(body, encoding);
                        res.close();

                    });

                } else {

                    // Exists, but not a file (directory?).  Return 404.

                    notFound();
                    return;

                }

            });

            return;

        }

        search(this.docroot.slice(0));

    }

});

module.exports = Static;

