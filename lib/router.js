var sys = require('sys'),
    url = require('url'),
    posix = require('posix'),
    path = require('path');

DEBUG = false;

// http.createServer(router.create(new router.Static("htdocs"))).listen(8000);

function Static(docroot) {
    this.count = {};
    this.docroot = path.normalize(docroot);
}

Static.prototype = {

    'log': function(path) {
        if (path in this.count) {
            this.count[path]++;
        } else {
            this.count[path] = 1;
        }
    },

    'GET (/status)': function(req, res, matches) {
        this.log(matches[1]);
        res.sendHeader(200, {"Content-Type": "text/plain"});
        res.sendBody(sys.inspect(this.count));
        res.finish();
    },

    "GET /$": function(req) {
        req.url += "index.html";
        req.redo();
    },

    'GET (.*)': function(req, res, matches) {

        var self = this;

        // Check that the docroot is a parent directory of the requested file.
        // i.e. prevent against http://foo/../../etc/passwd.

        if (path.normalize(this.docroot + matches[1]).indexOf(this.docroot) !== 0) {
            req.next();
        }

        var pos = req.url.lastIndexOf(".");
        var ext = pos < 0 ? "" : req.url.substring(pos);
        var contentType = mime.getTypeByExt(ext);
        var encoding = contentType.slice(0, 4) === "text" ? "utf8" : "binary";
        
        var promise = posix.cat(this.docroot + matches[1], encoding);

        promise.addCallback(function (body) {
            self.log(matches[1]);
            res.sendHeader(200, {
                "Content-Type": contentType,
                "Content-Length": body.length
            });
            res.sendBody(body, encoding);
            res.finish();
        });

        promise.addErrback(function () {
            req.next();
        });

    }

};

exports.Static = Static;

exports.create = function(rules) {

    var regexp = /^(\S+)\s(.+?)$/, parts = null, matchers = {};

    // Rules will almost certainly be processed in the order in
    // which they are defined (even though the JavaScript spec doesn't
    // require this) due to:
    //
    // http://code.google.com/p/chromium/issues/detail?id=883

    for (r in rules) {

        if ((parts = r.match(regexp))) {

            if (!matchers[parts[1]]) {
                matchers[parts[1]] = [];
            }

            matchers[parts[1]].push([
                new RegExp(parts[2]),
                rules[r]
            ]);

        }

    }

    return function(req, res) {

        var calls = 0;

        function dispatch(m) {

            if (calls > 10) {

                sys.debug("Probable recursive dispatch detected on [" + req.url + "]");
                res.sendHeader(500, {"Content-Type": "application/json"});
                res.sendBody(JSON.stringify({message: "Probable recursive dispatch detected"}));
                res.finish();

                return;

            }

            var i, l, parts;

            for (i = 0, l = m.length; i < l; i++) {

                if ((parts = url.parse(req.url).pathname.match(m[i][0]))) {

                    if (DEBUG) { sys.debug(req.method + " " + req.url + " MATCHED"); }

                    req.redo = function() {
                        calls++;
                        delete req.redo;
                        delete req.next;
                        dispatch(matchers[req.method] || [])
                    };

                    req.next = function() {
                        delete req.redo;
                        delete req.next;
                        dispatch(m.slice(i + 1));
                    }

                    m[i][1].call(rules, req, res, parts);

                    return;

                }

            }

            if (DEBUG) { sys.debug(req.method + " " + req.url + " NOT DISPATCHED"); }

            res.sendHeader(404);
            res.finish();

        }

        dispatch(matchers[req.method] || []);

    }

};

// From jack, via http://github.com/ry/node_chat/

var mime = {

  getTypeByExt: function(ext, fallback) {
    return mime.TYPES[ext.toLowerCase()] || fallback || 'application/octet-stream';
  },

  TYPES : {".3gp"   : "video/3gpp"
          , ".a"     : "application/octet-stream"
          , ".ai"    : "application/postscript"
          , ".aif"   : "audio/x-aiff"
          , ".aiff"  : "audio/x-aiff"
          , ".asc"   : "application/pgp-signature"
          , ".asf"   : "video/x-ms-asf"
          , ".asm"   : "text/x-asm"
          , ".asx"   : "video/x-ms-asf"
          , ".atom"  : "application/atom+xml"
          , ".au"    : "audio/basic"
          , ".avi"   : "video/x-msvideo"
          , ".bat"   : "application/x-msdownload"
          , ".bin"   : "application/octet-stream"
          , ".bmp"   : "image/bmp"
          , ".bz2"   : "application/x-bzip2"
          , ".c"     : "text/x-c"
          , ".cab"   : "application/vnd.ms-cab-compressed"
          , ".cc"    : "text/x-c"
          , ".chm"   : "application/vnd.ms-htmlhelp"
          , ".class"   : "application/octet-stream"
          , ".com"   : "application/x-msdownload"
          , ".conf"  : "text/plain"
          , ".cpp"   : "text/x-c"
          , ".crt"   : "application/x-x509-ca-cert"
          , ".css"   : "text/css"
          , ".csv"   : "text/csv"
          , ".cxx"   : "text/x-c"
          , ".deb"   : "application/x-debian-package"
          , ".der"   : "application/x-x509-ca-cert"
          , ".diff"  : "text/x-diff"
          , ".djv"   : "image/vnd.djvu"
          , ".djvu"  : "image/vnd.djvu"
          , ".dll"   : "application/x-msdownload"
          , ".dmg"   : "application/octet-stream"
          , ".doc"   : "application/msword"
          , ".dot"   : "application/msword"
          , ".dtd"   : "application/xml-dtd"
          , ".dvi"   : "application/x-dvi"
          , ".ear"   : "application/java-archive"
          , ".eml"   : "message/rfc822"
          , ".eps"   : "application/postscript"
          , ".exe"   : "application/x-msdownload"
          , ".f"     : "text/x-fortran"
          , ".f77"   : "text/x-fortran"
          , ".f90"   : "text/x-fortran"
          , ".flv"   : "video/x-flv"
          , ".for"   : "text/x-fortran"
          , ".gem"   : "application/octet-stream"
          , ".gemspec" : "text/x-script.ruby"
          , ".gif"   : "image/gif"
          , ".gz"    : "application/x-gzip"
          , ".h"     : "text/x-c"
          , ".hh"    : "text/x-c"
          , ".htm"   : "text/html"
          , ".html"  : "text/html"
          , ".ico"   : "image/vnd.microsoft.icon"
          , ".ics"   : "text/calendar"
          , ".ifb"   : "text/calendar"
          , ".iso"   : "application/octet-stream"
          , ".jar"   : "application/java-archive"
          , ".java"  : "text/x-java-source"
          , ".jnlp"  : "application/x-java-jnlp-file"
          , ".jpeg"  : "image/jpeg"
          , ".jpg"   : "image/jpeg"
          , ".js"    : "application/javascript"
          , ".json"  : "application/json"
          , ".log"   : "text/plain"
          , ".m3u"   : "audio/x-mpegurl"
          , ".m4v"   : "video/mp4"
          , ".man"   : "text/troff"
          , ".mathml"  : "application/mathml+xml"
          , ".mbox"  : "application/mbox"
          , ".mdoc"  : "text/troff"
          , ".me"    : "text/troff"
          , ".mid"   : "audio/midi"
          , ".midi"  : "audio/midi"
          , ".mime"  : "message/rfc822"
          , ".mml"   : "application/mathml+xml"
          , ".mng"   : "video/x-mng"
          , ".mov"   : "video/quicktime"
          , ".mp3"   : "audio/mpeg"
          , ".mp4"   : "video/mp4"
          , ".mp4v"  : "video/mp4"
          , ".mpeg"  : "video/mpeg"
          , ".mpg"   : "video/mpeg"
          , ".ms"    : "text/troff"
          , ".msi"   : "application/x-msdownload"
          , ".odp"   : "application/vnd.oasis.opendocument.presentation"
          , ".ods"   : "application/vnd.oasis.opendocument.spreadsheet"
          , ".odt"   : "application/vnd.oasis.opendocument.text"
          , ".ogg"   : "application/ogg"
          , ".p"     : "text/x-pascal"
          , ".pas"   : "text/x-pascal"
          , ".pbm"   : "image/x-portable-bitmap"
          , ".pdf"   : "application/pdf"
          , ".pem"   : "application/x-x509-ca-cert"
          , ".pgm"   : "image/x-portable-graymap"
          , ".pgp"   : "application/pgp-encrypted"
          , ".pkg"   : "application/octet-stream"
          , ".pl"    : "text/x-script.perl"
          , ".pm"    : "text/x-script.perl-module"
          , ".png"   : "image/png"
          , ".pnm"   : "image/x-portable-anymap"
          , ".ppm"   : "image/x-portable-pixmap"
          , ".pps"   : "application/vnd.ms-powerpoint"
          , ".ppt"   : "application/vnd.ms-powerpoint"
          , ".ps"    : "application/postscript"
          , ".psd"   : "image/vnd.adobe.photoshop"
          , ".py"    : "text/x-script.python"
          , ".qt"    : "video/quicktime"
          , ".ra"    : "audio/x-pn-realaudio"
          , ".rake"  : "text/x-script.ruby"
          , ".ram"   : "audio/x-pn-realaudio"
          , ".rar"   : "application/x-rar-compressed"
          , ".rb"    : "text/x-script.ruby"
          , ".rdf"   : "application/rdf+xml"
          , ".roff"  : "text/troff"
          , ".rpm"   : "application/x-redhat-package-manager"
          , ".rss"   : "application/rss+xml"
          , ".rtf"   : "application/rtf"
          , ".ru"    : "text/x-script.ruby"
          , ".s"     : "text/x-asm"
          , ".sgm"   : "text/sgml"
          , ".sgml"  : "text/sgml"
          , ".sh"    : "application/x-sh"
          , ".sig"   : "application/pgp-signature"
          , ".snd"   : "audio/basic"
          , ".so"    : "application/octet-stream"
          , ".svg"   : "image/svg+xml"
          , ".svgz"  : "image/svg+xml"
          , ".swf"   : "application/x-shockwave-flash"
          , ".t"     : "text/troff"
          , ".tar"   : "application/x-tar"
          , ".tbz"   : "application/x-bzip-compressed-tar"
          , ".tcl"   : "application/x-tcl"
          , ".tex"   : "application/x-tex"
          , ".texi"  : "application/x-texinfo"
          , ".texinfo" : "application/x-texinfo"
          , ".text"  : "text/plain"
          , ".tif"   : "image/tiff"
          , ".tiff"  : "image/tiff"
          , ".torrent" : "application/x-bittorrent"
          , ".tr"    : "text/troff"
          , ".txt"   : "text/plain"
          , ".vcf"   : "text/x-vcard"
          , ".vcs"   : "text/x-vcalendar"
          , ".vrml"  : "model/vrml"
          , ".war"   : "application/java-archive"
          , ".wav"   : "audio/x-wav"
          , ".wma"   : "audio/x-ms-wma"
          , ".wmv"   : "video/x-ms-wmv"
          , ".wmx"   : "video/x-ms-wmx"
          , ".wrl"   : "model/vrml"
          , ".wsdl"  : "application/wsdl+xml"
          , ".xbm"   : "image/x-xbitmap"
          , ".xhtml"   : "application/xhtml+xml"
          , ".xls"   : "application/vnd.ms-excel"
          , ".xml"   : "application/xml"
          , ".xpm"   : "image/x-xpixmap"
          , ".xsl"   : "application/xml"
          , ".xslt"  : "application/xslt+xml"
          , ".yaml"  : "text/yaml"
          , ".yml"   : "text/yaml"
          , ".zip"   : "application/zip"
          }
};