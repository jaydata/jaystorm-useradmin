var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , BasicStrategy = require('passport-http').BasicStrategy;



// Use the BasicStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.
passport.use(new BasicStrategy({
},
  function (username, password, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
          // Find the user by username.  If there is no user with the given
          // username, or the password is not correct, set the user to `false` to
          // indicate failure.  Otherwise, return the authenticated `user`.
          if (username[0] == '!') {
              return done(null, null);
          } else {
              return done(null, { username: username, email: 'asd' });
          }
      });
  }
));




var app = express();

// configure Express
app.configure(function () {
    app.use(express.logger());
    // Initialize Passport!  Note: no need to use session middleware when each
    // request carries authentication credentials, as is the case with HTTP Basic.
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.get('/',
  // Authenticate using HTTP Basic credentials, with session support disabled.
  passport.authenticate('basic', { session: false }), function (req, res) {
      res.json({ username: req.user.username, email: req.user.email });

  });

app.listen(3000);
