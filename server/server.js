process.env.NODE_ENV = 'test';
var c = require('express');
var passport = require('passport');
require('jaydata');
require('q');
var uuid = require('node-uuid');
var BasicStrategy = require('passport-http').BasicStrategy;
var fs = require('fs');
var util = require('util');
var childProc = require('child_process');
var https = require('https');
var http = require('http');

var settings = {
    node_port: process.argv[2] || 3000,
    uploadpath: '/data/uploads/',
    file1Extract: '/data/filestore/',
    file2Extract: '/data/filestore/'
};

BasicStrategy.prototype.authenticate = function(req) {
  var authorization = req.headers['authorization'];
  if (!authorization) { return this.fail(this._challenge()); }
  
  var parts = authorization.split(' ')
  if (parts.length < 2) { return this.fail(400); }
  
  var scheme = parts[0]
    , credentials = new Buffer(parts[1], 'base64').toString().split(':');

  if (!/Basic/i.test(scheme)) { return this.fail(this._challenge()); }
  
  var userid = credentials[0];
  var password = credentials[1];
  /*if (!userid || !password) {
    return this.fail(400);
  }*/
  
  var self = this;
  this._verify(req, userid, password, function(err, user) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(self._challenge()); }
    self.success(user);
  });
};

var config = require('./configuration.js').config;

passport.use(new BasicStrategy ({
},
  function (req, username, password, done) {

      process.nextTick(function () {
          var get_options = {
              host: config.dashboard.url,
              port: config.dashboard.port,
              path: config.dashboard.auth,
              method: 'GET',
              headers: {
                  Authorization: 'Basic ' + new Buffer(username + ":" + password).toString('base64')
              }
          };

          //console.dir(get_options);
          var req = https.request(get_options, function (res) {
              res.setEncoding('utf8');
              if (res.statusCode == 200) {
                  var data = '';
                  res.on("data", function (d) {
                      data += d;
                      console.log('basic auth data', d);
                  });
                  res.on("end", function () {
                      var apps = JSON.parse(data);
                      console.log({ 'username': username, 'apps': apps.apps});
                      done(null, { 'username': username, 'apps': apps.apps});
                  });

              } else {
                  console.log('basic auth done null null');
                  done(null, null);
              }
              

          });
          
          req.on('error', function(err){
              console.log(err);
              done(null, null);
          })
          
          req.end();
          //console.dir(req);
      });
  }
));

var app = c();
app.use(c.compress());
app.use(c.query());
app.use(function (req, res, next) {

    /*res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, MaxDataServiceVersion, DataServiceVersion');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, MERGE, DELETE');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.end();
    } else {
        next();
    }*/
    
    var origin = req.headers["origin"];
    if (!origin){
        var referer = req.headers["referer"];
        if (referer){
            var m = referer.match(/(http:\/\/|https:\/\/)([a-zA-Z0-9-\.]+)/);
            if (m[2]) origin = m[2]; else origin = req.headers["host"] || "*";
        }else origin = req.headers["host"] || "*";
    }
    /*if ((req.isAdmin && req.isAdmin()) ||
        (["*"].indexOf(origin) >= 0) ||
        (["*"].indexOf("*") >= 0) ||
        (req.method == "OPTIONS")){*/
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, MaxDataServiceVersion, DataServiceVersion, Authorization, X-Domain, X-Requested-With");
        res.setHeader("Access-Control-Allow-Method", req.headers["access-control-allow-method"] || req.method);
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, HEAD, POST, MERGE, PATCH, DELETE, PUT");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        if (req.method === "OPTIONS"){
            res.end();
            return;
        }
    //}
    next();
});
passport.serializeUser(function (user, done) {
    //console.log("serialize user:" + user.username);
    done(null, user.username);
});
passport.deserializeUser(function (username, done) {
    //console.log("deserialize user");
    done(null, { username: username, email: 'foobar' });
});
app.use(c.bodyParser());
app.use(c.cookieParser());
//app.use(c.session({ secret: 'keyboard cat' }));
app.use(c.methodOverride());

app.use('/getAuthorization', function(req, res, next){
    //console.log('passport init', req);
    passport.initialize()(req, res, function(){
        //console.log('passport auth', req);
        passport.authenticate('basic', { session: false })(req, res, next);
    });
});
/*app.use('/getAuthorization', function(err, req, res, next) {
    res.statusCode = res.statusCode != 401 ? err.status || 500 : res.statusCode;
    next(err);
});*/
app.use('/getAuthorization', function (req, res) {
    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    var result = {
        authorization: req.headers.Authorization || req.headers.authorization,
        apps: req.user.apps
    };
    res.end(JSON.stringify(result));
});

app.use('/launch', passport.initialize());
app.use('/launch', passport.authenticate('basic', { session: false }));
app.use('/launch', function (req, res, next) {
    var appId = req.body.appid;
    var get_options = {
        host: config.admin.url,
        port: config.admin.port,
        path: config.admin.launch,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    //console.dir(get_options);
    var launchReq = http.request(get_options, function (launchRes) {
        launchRes.setEncoding('utf8');
        if (launchRes.statusCode == 200) {
            var data = '';
            launchRes.on("data", function (d) {
                data += d;
                console.log('launch data', d);
            });
            launchRes.on("end", function () {
                console.dir("launch finished");
                console.log('launch data', data);
                res.end(data);
            });

        } else {
            console.log('launch done null null');
            done(null, null);
            res.end();
        }


    });
    console.log("sending: " + JSON.stringify(req.body));
    
    launchReq.on('error', function(err){
        console.log(err);
        res.end();
    });
    
    launchReq.end(JSON.stringify(req.body));
});

app.use('/crypt', passport.initialize());
app.use('/crypt', passport.authenticate('basic', { session: false }));
app.use('/crypt', function (req, res) {
    res.setHeader("Content-Type", "text/html;charset=UTF-8");
    var bc = require('bcrypt');
    res.end(bc.hashSync(req.body.plain, 8));
});

//app.get('/getAuthorization', passport.authenticate('basic', { session: true }));


// Route that takes the post upload request and sends the server response
app.post('/fileUpload', function(req, res) {
    var callback = function(data) {
        if(data.success)
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    };
    uploadFile(req, settings.uploadpath, req.query.type == 1 ? settings.file1Extract : settings.file2Extract, req.query.type, req.query.appid, callback);

});


// Mainfunction to recieve and process the file upload data asynchronously
var uploadFile = function (req, targetdir, extractDir, type, appid, callback) {
    console.log(extractDir);
    // Moves the uploaded file from temp directory to it's destination
    // and calls the callback with the JSON-data that could be returned.
    var moveToDestination = function (sourcefile, targetfile) {
        moveFile(sourcefile, targetfile, function (err) {
            if (!err) {

                ///unzip file
                var extractDir2 = extractDir + appid + (type == 1 ? "/static" : "/js");
                // TODO clear folder before unzip
                console.log(extractDir2);
                var command = "rm -rf "+extractDir2+"; mkdir -p " + extractDir2 + " ; unzip -o " + targetfile + ' -d ' + extractDir2;
                var cp = childProc.exec;
                cp(command, function (error, stdout, stderr) {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    callback({ success: true });
                });
            }
            else {
                callback({ success: false, error: err });
            }
        });
    };


    // Direct async xhr stream data upload, yeah baby.
    if (req.xhr) {
        var fname = req.header('x-file-name');

        // Be sure you can write to '/tmp/'
        var tmpfile = '/data/tmp/' + uuid();

        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);
        ws.on('error', function (err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({ success: false, error: "Sorry, could not open writestream." });
        });

        ws.on('close', function (err) {
            console.log(tmpfile, targetdir + fname);
            moveToDestination(tmpfile, targetdir + fname);
        });

        // Writing filedata into writestream
        req.on('data', function (data) {
            ws.write(data);
        });
        req.on('end', function () {
            ws.end();
        });
    }

        // Old form-based upload
    else {
        moveToDestination(req.files.qqfile.path, targetdir + req.files.qqfile.name);
    }
};


// Moves a file asynchronously over partition borders
var moveFile = function(source, dest, callback) {
    var is = fs.createReadStream(source)

    is.on('error', function(err) {
        console.log('moveFile() - Could not open readstream.');
        callback('Sorry, could not open readstream.')
    });

    is.on('open', function() {
        if(fs.existsSync(dest)){
            fs.unlinkSync(dest);
        }
        var os = fs.createWriteStream(dest);

        os.on('error', function(err) {
            console.log('moveFile() - Could not open writestream.');
            callback('Sorry, could not open writestream.');
        });

        os.on('open', function() {

            util.pump(is, os, function() {
                fs.unlinkSync(source);
            });

            callback();
        });
    });
};

app.use('/removeFiles', function(req, res){
    var type = req.body.type;
    var appId = req.body.appid;
    var removeDir = type == 1 ? settings.file1Extract : settings.file2Extract
    removeDir += appId + (type == 1 ? "/static" : "/js");
    var cmd = 'rm -rf '+removeDir;
    console.log('command: '+cmd);
    var cp = childProc.exec;
    cp(cmd, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
            res.send(JSON.stringify({ok:false}), {'Content-Type': 'text/plain'}, 404);
        }
        res.send(JSON.stringify({ok:false}), {'Content-Type': 'text/plain'}, 200);
    });
});

app.use('/debug', function(req, res){
    res.write('DEBUG');
    res.end();
});

app.use('/logout', passport.initialize());
app.use('/logout', passport.authenticate('basic', { session: false }));
app.use('/logout', function(req, res){
    if (req.logOut){
        req.logOut();
        res.statusCode = 200;
        res.setHeader('WWW-Authenticate', 'Basic realm="' + 'JayStorm API' + '"');
        res.write('Logout was successful.');
    }else res.write('Logout failed.');
    res.end();
});


/*var db2Svc = require('./dbtypes/DB2Context.js').serviceType;
require('./stormAdminAPI');
app.use('/adminapi', passport.initialize());
app.use('/adminapi', passport.authenticate('basic', { session: false }));
app.use("/adminapi", $data.JayService.createAdapter(JayStorm.AdminAPI));*/

 
//var provSvc = require('./dbtypes/AWSBroker.js').serviceType;
//app.use("/stormaws", $data.JayService.OData.Utils.simpleBodyReader());
//app.use("/stormaws", $data.JayService.createAdapter(provSvc, function (req, res) {
//    return new provSvc({
//        name: "mongoDB", databaseName: "SystemDB",
//        responseLimit: -1, user: req.getUser ? req.getUser() : undefined, checkPermission: req.checkPermission
//    });
//}));

/*app.use("/db2", $data.JayService.Middleware.cache());
app.use("/db2", $data.JayService.Middleware.authentication());
app.use("/db2", $data.JayService.Middleware.authorization());
app.use("/db2", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/db2", $data.JayService.createAdapter($data.JayStormAPI.Context, function(req, res) {
    return new $data.JayStormAPI.Context({name: "mongoDB", databaseName:"ApplicationDB", responseLimit:-1, user: req.getUser(), isAuthorized: req.isAuthorized });
}));*/

app.use('/eval', function(req, res){
    var js = '';
    js += 'process.on("uncaughtException", function(err){\n';
    js += '    process.send(err.toString());\n';
    js += '    process.exit(0);\n';
    js += '});\n\n';
    
    js += req.body.js;
    
    js += '\n\n';
    js += 'process.on("message", function(msg){\n';
    js += '    process.send({ serviceTypes: exports.serviceTypes });\n';
    js += '    process.exit(0);\n';
    js += '});\n';
    
    try{
        var script = vm.createScript(js);
        var tmp = __dirname + '/tmp-' + uuid.v4() + '.js';
        fs.writeFile(tmp, js, 'utf8', function(err){
            if (err) throw err;
            var child = child_process.fork(tmp);
            
            child.on('message', function(msg){
                fs.unlink(tmp, function(err){
                    if (err) throw err;
                    res.write(JSON.stringify(msg));
                    res.end();
                });
            });
            
            child.send({});
        });
    }catch(err){
        res.write(JSON.stringify(err.toString()));
        res.end();
    }
});

var processors = [];
processors['echo'] = function(req,res) {
  res.end(req.body.context);
};
/*
require('node-zip')();
processors['zipszar'] = function(req,res) {
  var zip = new JSZip();
console.log('zips/'+req.query.z+'.zip');
  zip.load('zips/'+req.query.z+'.zip');
console.log(zip);
  //folder.file(req.query.f, req.query.context);
  return zip.generate({base64:true});
};
*/

var fs = require('fs');
function mkdirsSync(pathname) {
    try {
    if (!fs.statSync(pathname).isDirectory())
        throw new Error('Unable to create directory at: ' + pathname);
    } catch (e) {
        if (e.code === 'ENOENT') {
            mkdirsSync(path.dirname(pathname));
            fs.mkdirSync(pathname);
    } else
            throw e;
    }
}

var spawn = require('child_process').spawn;
var path = require('path');
var uuid = require('node-uuid');
processors['zip'] = function(req,res) {
  var z = path.basename(req.body.z);
  var tmp = uuid.v4();
  fs.mkdirSync('zips/'+tmp);
  fs.mkdirSync('zips/'+tmp+'/'+z);
  var i=1;
  while(req.body['f'+i] && req.body['c'+i]) {
   var fn = 'zips/'+tmp+'/'+z+'/'+req.body['f'+i];
   mkdirsSync(path.dirname(fn));
   fs.writeFileSync(fn, req.body['c'+i]);
   i = i + 1;
  }
  var zip = spawn('./dynzip.sh', [ z, tmp ], { cwd: 'zips' });
  zip.stdout.on('data', function (data) {
    res.write(data);
  });
  zip.stderr.on('data', function (data) {
  });
  zip.on('exit', function (code) {
    if(code !== 0) {
      res.statusCode = 500;
      console.log('zip process exited with code ' + code);
    }
    res.end();
   });
}

app.use('/download', function(req, res){
  var processor = processors[req.body.p];
  if (!processor) { 
    res.status(500);
    res.end('invalid processor');
    return;
  } 
  res.header('Content-Type','application/octet-stream');
  res.header('Content-Disposition','attachment; filename="'+req.body.filename+'"');
  processor(req,res);
});

app.use("/", c.static(__dirname + "/../client"));
app.use(c.errorHandler());
c.errorHandler.title = 'JayStorm API';
app.listen(60443);
//console.log(app);
console.log("end");
