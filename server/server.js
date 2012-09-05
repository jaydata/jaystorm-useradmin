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
var http = require('https');

var settings = {
    node_port: process.argv[2] || 3000,
    uploadpath: __dirname + '/uploads/',
    file1Extract: __dirname + '/uploads/package1',
    file2Extract: __dirname + '/uploads/package2'
};

passport.use(new BasicStrategy({
},
  function (username, password, done) {

      process.nextTick(function () {
          var get_options = {
              host: 'dashboard.jaystack.com',
              port: 443,
              path: '/auth.axd',
              method: 'GET',
              headers: {
                  Authorization: 'Basic ' + new Buffer(username + ":" + password).toString('base64')
              }
          };

          //console.dir(get_options);
          var webReq = http.request(get_options, function (res) {
              console.log("auth1");
              res.setEncoding('utf8');
              if (res.statusCode == 200) {
                  console.log("auth2");
                  done(null, { 'username': username, 'email': password });
              } else {
                  console.log("auth3");
                  done(null, null);
              }

          });
          webReq.end();
          console.log("auth-1");
          //console.dir(req);
      });
  }
));

var app = c();
app.use(c.compress());

app.use(c.query());
app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, MaxDataServiceVersion, DataServiceVersion');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, MERGE, DELETE');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.end();
    } else {
        next();
    }
});
passport.serializeUser(function (user, done) {
    console.log("serialize user:" + user.username);
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    console.log("deserialize user");
    done(null, { username: username, email: 'foobar' });
});

app.use(c.bodyParser());

app.use(c.cookieParser());
app.use(c.session({ secret: 'keyboard cat' }));
app.use(c.methodOverride());
app.use($data.JayService.OData.Utils.simpleBodyReader());
app.use(passport.initialize());
app.use(passport.authenticate('basic', { session: false }));

app.get('/getAuthorization', passport.authenticate('basic', { session: true }));


// Route that takes the post upload request and sends the server response
app.post('/fileUpload', function(req, res) {
    var callback = function(data) {
        if(data.success)
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    };
    uploadFile(req, settings.uploadpath, req.query.type==1?settings.file1Extract:settings.file2Extract, callback);
});


// Mainfunction to recieve and process the file upload data asynchronously
var uploadFile = function(req, targetdir, extractDir, callback) {

    // Moves the uploaded file from temp directory to it's destination
    // and calls the callback with the JSON-data that could be returned.
    var moveToDestination = function(sourcefile, targetfile) {
        moveFile(sourcefile, targetfile, function(err) {
            if(!err){

                ///unzip file
                var command = "unzip -o "+targetfile+' -d '+extractDir;
                var cp = childProc.exec;
                cp(command, function(error, stdout, stderr){
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                    callback({success: true});
                });
            }
            else{
                callback({success: false, error: err});
            }
        });
    };

    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr) {
        var fname = req.header('x-file-name');

        // Be sure you can write to '/tmp/'
        var tmpfile = '/tmp/'+uuid();

        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);
        ws.on('error', function(err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({success: false, error: "Sorry, could not open writestream."});
        });
        ws.on('close', function(err) {
            moveToDestination(tmpfile, targetdir+fname);
        });

        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });
        req.on('end', function() {
            ws.end();
        });
    }

    // Old form-based upload
    else {
        moveToDestination(req.files.qqfile.path, targetdir+req.files.qqfile.name);
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


app.use('/debug', function(req, res){
    res.write('DEBUG');
    res.end();
});

app.use('/logout', function(req, res){
    if (req.logOut){
        req.logOut();
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="' + 'JayStorm API' + '"');
        res.write('Logout was successful.');
    }else res.write('Logout failed.');
    res.end();
});

app.use('/getAuthorization', function (req, res) {
    res.setHeader("Content-Type", "text/plain;charset=UTF-8");
    res.end(req.headers.Authorization || req.headers.authorization);
})
var db2Svc = require('./dbtypes/DB2Context.js').serviceType;

//app.use("/dbz", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/dbz", $data.JayService.createAdapter(db2Svc, function (req, res) {
    return new db2Svc({
        name: "mongoDB", databaseName: "ApplicationDBX",
    });
}));
 
var appdbSvc = require('./dbtypes/ApplicationDBContext.js').serviceType;


//app.use("/ApplicationDB", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/ApplicationDB", $data.JayService.createAdapter(appdbSvc, function (req, res) {
    return new appdbSvc({ name: "mongoDB", databaseName: "ApplicationDB"  });
}));


var provSvc = require('./dbtypes/AWSBroker.js').serviceType;


app.use("/stormaws", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/stormaws", $data.JayService.createAdapter(provSvc, function (req, res) {
    return new provSvc({
        name: "mongoDB", databaseName: "SystemDB",
        responseLimit: -1, user: req.getUser ? req.getUser() : undefined, checkPermission: req.checkPermission
    });
}));
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


app.use("/", c.static(__dirname + "/../client"));
app.use(c.errorHandler());
c.errorHandler.title = 'JayStorm API';
app.listen(8000);
//console.log(app);
console.log("end");
