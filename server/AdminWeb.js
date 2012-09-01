var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , BasicStrategy = require('passport-http').BasicStrategy
  , http = require('http');



passport.use(new BasicStrategy({
},
  function (username, password, done) {
      // asynchronous verification, for effect...
      console.log("in pw check");
      process.nextTick(function () {
          var get_options = {
              host: 'localhost',
              port: '3000',
              path: '/',
              method: 'GET',
              headers: {
                  Authorization: 'Basic ' + new Buffer(username + ":" + password).toString('base64')
              }
          };

          console.dir(get_options);
          var req = http.request(get_options, function (res) {
              res.setEncoding('utf8');
              if (res.statusCode == 200) {
                  done(null, { 'username': username, 'email': password });
              } else {
                  done(null, null);
              }
              
          });
          req.end();
          console.dir(req);
          // Find the user by username.  If there is no user with the given
          // username, or the password is not correct, set the user to `false` to
          // indicate failure.  Otherwise, return the authenticated `user`.

      });
  }
));




var app = express();

app.configure(function () {
    app.use(express.logger());
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.get('/', passport.authenticate('basic', { session: false }));
app.use("/", function (req, res, next) {
    res.end("done");
});
app.listen(8080);
