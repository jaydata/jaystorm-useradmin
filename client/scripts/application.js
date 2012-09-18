var globalAuthorization;
var adminApiClient;

$(function () {

    //$data.service('/db',
    //function (factory, type) {

        //var context = factory();



    function ClientApplication() {
        var self = this;
        
        self.adminApi = ko.observable();
        
        $data.service("/adminapi", function (f) {
            self.adminApi(f());
        });

        self.authorization = ko.observable();

        function getAuthroization(succ, err) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "getAuthorization", true);
            xhr.onerror = function () {
                alert("could not connect to dashboard.jaystack.net for authorization");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var result = JSON.parse(xhr.responseText);
                        if (!(result.authorization && result.apps)) {
                            alert("invalid authorization result");
                        }
                        self.authorization(result.authorization);
                        globalAuthorization = result.authorization;
                        var apps = result.apps
                                        .filter(function(item) { return item.status != 'Cancelled'})
                                        .map(function (item) {
                                                return {
                                                    appid: item.appid,
                                                    url: 'http://' + item.appid + '.jaystack.net/',
                                                    title: item.name
                                                }
                                        });
                        window["stormApplications"] = apps;
                        self.applications(apps);
                        self.currentApplication(apps[0]);

                    } else {
                        alert("not ok (200) response from getAuthorization:" + xhr.responseText);
                    }
                }
            }
            xhr.send();
        }
        getAuthroization();
        self.applications = ko.observableArray([]);
        self.currentApplication = ko.observable();
        self.applicationToAdd = ko.observable();
        self.launchFinished = ko.observable();
        self.addApp = function () {
            value = self.applicationToAdd();
            self.applications.push({ url: value, title: value });
            self.applicationToAdd(null);
        }

        function syncAppItemsWithDatabases(appDBFactory) {
            console.log("syncAppItems");
            var c = appDBFactory();
            var items = c.AppItems.filter("it.Type == 'QueryableDB'").toArray();
            var dbs = c.Databases.toArray();
            Q.allResolved([items, dbs]).then(function () {
                console.log("sync app items loaded...");
                
                var i = items.valueOf();
                console.log(i.length);
                var ds = dbs.valueOf();
                var syncOps = [];
                var nuDbs = [];
                var _c = appDBFactory();
                for (var j = 0; j < i.length; j++) {
                    var item = i[j];
                    console.log("processing appitem: " + item.Id);
                    var dbName = item.Data.dbname;
                    var hasDbRecord = ds.some(function (db) { return db.Name == dbName; });
                    if (!hasDbRecord) {
                        var newDbRecord = new c.Databases.createNew({ Name: dbName, Namespace: dbName, Published: true });
                        nuDbs.push(newDbRecord);
                        _c.add(newDbRecord);
                    }
                };
                
                if (nuDbs.length > 0) {
                    _c.saveChanges()
                        .then(function () {
                            var nuServices = [];
                            nuDbs.forEach( function(nuDB)  {
                                var service = new _c.Services.createNew({ 
                                    DatabaseID: nuDB.DatabaseID, 
                                    Name: nuDB.Name,
                                    Published: true,
                                    AllowAnonymous: true,
                                    AllowAllOrigins: false,
                                    UseDefaultPort: true,
                                    UseSSL: true,
                                    AllowAllIPs: false
                                });
                                _c.add(service);
                                nuServices.push(service);
                            });
                            _c.saveChanges()
                                .then(function () { console.log("   services initialized"); })
                                .fail(function () { console.log("   could not initialize services:", arguments); });
                        }).fail(function () { alert("could not sync db records!"); });
                }

                Q.allResolved(syncOps).then(function () {
                    if (nuDbs.length > 0) {
                        console.log("  syncing service records");
                        nuDbs.forEach(function (nuDB) {
                            console.dir(nuDB);
                        });
                    }
                });

            });

        };

        self.currentApplication.subscribe(function (value) {

            var serviceUri = value.url.trim() + "ApplicationDB";
            var serviceUri = serviceUri; //serviceUri.replace("http://", "");
            
            $data.service(serviceUri, {
                success: function (factory) {
                    var appDBFactory = function () {
                        var c = factory.apply({}, arguments);
                        c.prepareRequest = function (req) {
                            req[0].headers = req[0].headers || {};
                            req[0].headers['X-Domain'] = 'jokerStorm';
                            req[0].headers['Authorization'] = self.authorization();
                        }
                        return c;
                    }
                    syncAppItemsWithDatabases(appDBFactory);
                    self.currentAppDBContextFactory(appDBFactory);
                },
                error: function () {
                    setTimeout(function () {
                        if (value === self.currentApplication()) {
                            window.location.href = 'http://test.jaystack.com/your-jaystorm-app-is-ready?appId=' + self.currentApplication().appid;
                        }
                    }, 5000);
                }
            }, { httpHeaders: { 'Authorization': self.authorization(), 'X-Domain': 'jokerStorm' } }
            );
        });

        self.currentAppDBContextFactory = ko.observable();

        var modules = [
            { type: $data.JayStormClient.SchemaManager, ui: "SchemaManagerUI", title: 'Schemas', path: '/Schema' },
            { type: $data.JayStormClient.ServiceManager, ui: "ServiceManagerUI", title: 'Services', path: '/Services' },
            { type: $data.JayStormClient.SecurityManager, ui: "SecurityManagerUI", title: 'Security', path: '/Security' },
            { type: $data.JayStormClient.AccessManager, ui: "AccessManagerUI", title: 'Access Control', path: '/Access' },
            { type: $data.JayStormClient.StaticFileManager, ui: "StaticFileUI", title: 'Files', path: '/FileManager' },
            { type: $data.JayStormClient.UserManager, ui: "UserManagerUI", title: 'Users', path: '/Users' },
            { type: $data.JayStormClient.DeploymentManager, ui: "DeploymentUI", title: 'Publish', path: '/Publish' },
            { type: $data.JayStormClient.DataManager, ui: "DataManagerUI", title: 'Edit data', path: '/Databases' }
        ];

        modules.forEach(function (module) {
            ko.applyBindings(module.Model = new module.type(self), document.getElementById(module.ui));
        })

        self.menuItems = modules;

        self.show = function (item) {
            //self.menuItems.forEach(function (item) {
            //    item.Model.hide();
            //});

            item.Model.show();
        }
        self.launchResult = ko.observable();
        function launchApplication(appid, ondone) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "launch", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onerror = function () {
                alert("could not connect to dashboard.jaystack.net for launch");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        self.launchResult(xhr.responseText);
                        self.launchFinished(new Date());
                    } else {
                        alert("not ok (200) response from getAuthorization:" + xhr.responseText);
                    }
                }
            }
            xhr.send(JSON.stringify({appid: appid}));
        }

        self.launchCurrentApplication = function () {
            var appid = self.currentApplication().appid;
            launchApplication(appid);
        }

        self.cryptData = function (str, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "crypt", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onerror = function () {
                callback({ message: 'error'});
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        callback(xhr.responseText);
                    } else {
                        callback({ message: "not ok (200) response from crypt: " + xhr.responseText });
                    }
                }
            }
            xhr.send(JSON.stringify({ plain: str }));
        }
        
        self.createHelloWorld = function(){
            var factory = self.currentAppDBContextFactory();
            if (factory){
                var context = factory();
                context.Services.add(new context.Services.elementType({
                    Name: 'HelloWorld',
                    Published: true,
                    ServiceSourceType: 'script',
                    ServiceSource: ''
                }));
            }
        };

    }


    ko.applyBindings(adminApiClient = new ClientApplication(), document.getElementById("AppUI"));

});

$data.pushState = function( fn, title, url) {
    $data.navigationStates = $data.navigationStates || [];
    var key = Math.random().toString().replace(".","").replace(",",0);
    $data.navigationStates[key] = fn;
    window.history.pushState( { key: key }, title, url);
};

window.onpopstate = function(data) {
    console.dir(data);
    if (data && data.state && data.state.key) {
        $data.navigationStates[data.state.key]();
    }
};

