var router = require('../lib/router'),
    ejsgi = require('../../ejsgi/lib/ejsgi'),
    sys = require('sys');

ejsgi.Server(new router.Static("htdocs").dispatcher(), "localhost", 8000).start();

sys.puts('Server running at http://127.0.0.1:8000/');
sys.puts('');
sys.puts('Example:');
sys.puts('');
sys.puts('  $ curl -i -s -X GET http://127.0.0.1:8000/');
