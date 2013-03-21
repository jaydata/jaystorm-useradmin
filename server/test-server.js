

var c = require('connect');
require('jaydata');
var jsu = require('./JaySvcUtil');
var app = c();

app.use(c.query());
app.use(c.logger());
app.use(function(req, res, next) {
    $data.service("http://localhost:8181/db/getContextJS", function(f, t) {
        var c = f();
        c.Databases.toArray( function(dbs) {
            console.dir(dbs);
        })
    });
});

app.listen(8282);