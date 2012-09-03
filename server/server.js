process.env.NODE_ENV = 'test';

//require('connect');
var c = require('express');
var passport = require('passport');
require('jaydata');
require('q');
//require('./contextapi-api.js');


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
app.use(c.bodyParser());
app.use(c.cookieParser());
app.use(c.methodOverride());
//app.use(c.session({ secret: 'keyboard cat' }));
app.use($data.JayService.Middleware.appID({ appid: '' }));
app.use($data.JayService.Middleware.superadmin({ superadmin: true }));
app.use($data.JayService.Middleware.databaseConnections({
    ApplicationDB: [{
        address: '127.0.0.1',
        port: 27017
    }]
}));

//app.use($data.JayService.Middleware.cache());
app.use(passport.initialize());

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

app.use($data.JayService.Middleware.authentication());
app.use($data.JayService.Middleware.authenticationErrorHandler);

//app.use($data.JayService.Middleware.ensureAuthenticated({ message: 'JayStorm API' }));
/*app.use($data.JayService.Middleware.authorization({ databaseName: 'ApplicationDB' }));*/


var db2Svc = require('./dbtypes/DB2Context.js').serviceType;

app.use("/dbz", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/dbz", $data.JayService.createAdapter(db2Svc, function (req, res) {
    return new db2Svc({
        name: "mongoDB", databaseName: "ApplicationDBX",
    });
}));
 
var appdbSvc = require('./dbtypes/ApplicationDBContext.js').serviceType;


app.use("/ApplicationDB", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/ApplicationDB", $data.JayService.createAdapter(appdbSvc, function (req, res) {
    return new appdbSvc({name: "mongoDB", databaseName:"ApplicationDB",
        responseLimit:-1, user: req.getUser ? req.getUser() : undefined, checkPermission: req.checkPermission });
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
app.listen(8181);
//console.log(app);
console.log("end");
