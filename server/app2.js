﻿//require('connect');
var c = require('express');
require('jaydata');
require('q');
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

var db2Svc = require('./dbtypes/DB2Context.js').serviceType;

app.use("/CustomDB", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/CustomDB", $data.JayService.createAdapter(db2Svc, function (req, res) {
    return new db2Svc({
        name: "mongoDB", databaseName: "app2_db2",
    });
}));

var appdbSvc = require('./dbtypes/ApplicationDBContext.js').serviceType;


app.use("/ApplicationDB", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/ApplicationDB", $data.JayService.createAdapter(appdbSvc, function (req, res) {
    return new appdbSvc({
        name: "mongoDB", databaseName: "app2_ApplicationDB",
        responseLimit: -1, user: req.getUser ? req.getUser() : undefined, checkPermission: req.checkPermission
    });
}));

app.use(c.errorHandler());
c.errorHandler.title = 'JayStorm API';
app.listen(2002);