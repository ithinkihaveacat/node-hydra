var path = require('path'),
    mime = require('mime'),
    events = require('events'),
    posix = require('posix'),
    scylla = require('scylla');

function Static(docroot) {

    scylla.Base.call(this);

    this.docroot = path.join(process.cwd(), docroot);

}

Static.prototype = Object.create(scylla.Base.prototype);

process.mixin(Static.prototype, {

    "GET /$": function(req) {
        req.url += "index.html";
        return this.dispatch(req);
    },

    'GET (.*)': function(req, matches) {

        var self = this;

        // Check that the docroot is a parent directory of the requested file.
        // i.e. prevent against http://foo/../../etc/passwd.

        var filename = path.join(this.docroot, matches[1]);

        if (filename.indexOf(this.docroot) !== 0) {
            req.next();
        }

        var contentType = mime.extToType(path.extname(req.url));
        var encoding = contentType.slice(0, 4) === "text" ? "utf8" : "binary";

        var promise = new events.Promise();

        var cat = posix.cat(filename, encoding);

        cat.addCallback(function(body) {

            var res = {
                status: 200,
                headers: {
                    "content-type": contentType,
                    "content-length": body.length
                },
                body: new req.jsgi.stream()
            };
            res.body.write(body); // TODO what to do with encoding?
            res.body.close();

            promise.emitSuccess(res);

        });

        cat.addErrback(function() {

            var res = {
                status: 404,
                headers: { },
                body: new req.jsgi.stream()
            }
            res.body.close();

            promise.emitSuccess(res);

        });

        return promise;

    }

});

module.exports = Static;

