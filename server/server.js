process.env.NODE_ENV = 'test';

//require('connect');
var c = require('express');
var passport = require('passport');
require('jaydata');
require('q');
//require('./contextapi-api.js');


var app = c();

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
app.use(c.session({ secret: 'keyboard cat' }));

app.use($data.JayService.Middleware.appID({ appid: '' }));
app.use($data.JayService.Middleware.superadmin({ superadmin: true }));
app.use($data.JayService.Middleware.databaseConnections({
    ApplicationDB: [{
        address: '127.0.0.1',
        port: 27017
    }]
}));

app.use($data.JayService.Middleware.cache());
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


app.use("/db", $data.JayService.OData.Utils.simpleBodyReader());
app.use("/db", $data.JayService.createAdapter(appdbSvc, function(req, res) {
    return new appdbSvc({name: "mongoDB", databaseName:"ApplicationDB",
        responseLimit:-1, user: req.getUser ? req.getUser() : undefined, checkPermission: req.checkPermission });
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

app.use('/make', function(req, res, next){
    var json = (req.body && req.body.application) ? req.body : { application: {} };
    json.application.serviceLayer = {
        services: []
    };
    
    var context = new $data.JayStormAPI.Context({name: "mongoDB", databaseName:"ApplicationDB" });
    var Q = require('q');
    Q.allResolved([context.Services.toArray(), context.IngressIPRules.toArray(), context.IngressOriginRules.toArray(), context.Databases.toArray()]).then(function(v){
        var result = {
            Services: v[0].valueOf(),
            IngressRules: v[1].valueOf(),
            OutgressRules: v[2].valueOf(),
            Databases: v[3].valueOf()
        };
        for (var i = 0; i < result.Services.length; i++){
            var r = result.Services[i];
            var service = {
                type: 'service',
                allowAnonymous: r.AllowAnonymous,
                serviceName: r.Name,
                allowedSubPathList: r.Sets || ['*'],
                internalPort: 60000 + (r.Port || 80)
            };
            if (r.DatabaseID) service.database = result.Databases.filter(function(it){ return it.DatabaseID == r.DatabaseID; })[0].Name;
            if (r.BaseServiceID) service.extend = result.Services.filter(function(it){ return it.ServiceID == r.ServiceID; })[0].Name;
            if (r.ServiceSourceType && r.ServiceSource){
                service.sourceType = r.ServiceSourceType;
                service.source = r.ServiceSource;
            }
            var rules = result.IngressRules.filter(function(it){ return it.ObjectID == r.ServiceID; });
            if (rules.length || r.UseDefaultPort || r.UseSSL) service.ingress = [];
            if (r.AllowAllIPs){
                var ports = rules.map(function(it){ return it.Port; });
                var processedPorts = [];
                if (r.UseDefaultPort){
                    service.ingress.push({
                        type: 'allow',
                        address: '*',
                        port: 80
                    });
                    if (r.UseSSL){
                        service.ingress.push({
                            type: 'allow',
                            address: '*',
                            port: 443,
                            ssl: true
                        });
                    }
                }else{
                    for (var i = 0; i < ports.length; i++){
                        if (processedPorts.indexOf(ports[i]) < 0){
                            processedPorts.push(ports[i]);
                            service.ingress.push({
                                type: 'allow',
                                address: '*',
                                port: ports[i]
                            });
                        }
                    }
                }
            }else{
                for (var j = 0; j < rules.length; j++){
                    var ir = rules[j];
                    service.ingress.push({
                        type: 'allow',
                        address: ir.SourceAddress,
                        port: r.UseDefaultPort ? 80 : ir.Port,
                        ssl: ir.SSL
                    });
                    if (r.UseSSL){
                        service.ingress.push({
                            type: 'allow',
                            address: ir.SourceAddress,
                            port: 443,
                            ssl: true
                        });
                    }
                }
            }
            if (r.AllowAllOrigins){
                service.outgress = [{
                    type: 'allow',
                    origin: '*'
                }];
            }else{
                service.outgress = result.OutgressRules.map(function(it){
                    return {
                        type: 'allow',
                        origin: it.SourceOrigin,
                        method: it.Method || ['GET']
                    };
                });
                if (!service.outgress.length) delete service.outgress;
            }
            /*if (r.UseDefaultPort){
                service.ingress.push({
                    type: 'allow',
                    address: '*',
                    port: 80
                });
            }
            if (r.UseSSL){
                service.ingress.push({
                    type: 'allow',
                    address: '*',
                    port: 443,
                    ssl: true
                });
            }*/
            json.application.serviceLayer.services.push(service);
        }
        
        res.setHeader('content-type', 'application/json');
        res.write(JSON.stringify(json));
        res.end();
    }).fail(function(v){
        console.log(v);
        next('Make error.');
    });
});

app.use("/", c.static(__dirname + "/../client"));
app.use(c.errorHandler());
c.errorHandler.title = 'JayStorm API';
app.listen(8181);
//console.log(app);
console.log("end");
