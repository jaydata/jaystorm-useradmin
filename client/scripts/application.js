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

        function getAuthroization() {
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
        self.addApp = function () {
            value = self.applicationToAdd();
            self.applications.push({ url: value, title: value });
            self.applicationToAdd(null);
        }

        self.currentApplication.subscribe(function (value) {
            $data.service(value.url.trim() + "ApplicationDB", function (factory) {
                var appDBFactory = function () {
                    var c = factory.apply({}, arguments);
                    c.prepareRequest = function (req) {
                        req[0].headers = req[0].headers || {};
                        req[0].headers['X-Domain'] = 'jokerStorm';
                        req[0].headers['Authorization'] = self.authorization();
                    }
                    return c;
                }
                self.currentAppDBContextFactory(appDBFactory);
            }
            //, { user: 'guest', password: 'guest' }
            , { httpHeaders: { 'Authorization': self.authorization(), 'X-Domain': 'jokerStorm' } }
            );
        });

        self.currentAppDBContextFactory = ko.observable();

        var modules = [
            { type: $data.JayStormClient.UserManager, ui: "UserManagerUI", title: 'Manage Users', path: '/Users' },
            { type: $data.JayStormClient.ServiceManager, ui: "ServiceManagerUI", title: 'Service Manager', path: '/Services' },
            { type: $data.JayStormClient.DataManager, ui: "DataManagerUI", title: 'Manage Data', path: '/Databases' },
            { type: $data.JayStormClient.SchemaManager, ui: "SchemaManagerUI", title: 'Manage Schema', path: '/Schema' },
            { type: $data.JayStormClient.SecurityManager, ui: "SecurityManagerUI", title: 'Manage Security', path: '/Security' },
            { type: $data.JayStormClient.AccessManager, ui: "AccessManagerUI", title: 'Manage Access', path: '/Access' },
            { type: $data.JayStormClient.StaticFileManager, ui: "StaticFileUI", title: 'Manage Static files', path: '/FileManager' }];

        

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
        function launchApplication( appid, ondone ) {
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

