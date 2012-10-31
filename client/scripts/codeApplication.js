function clientApplication() {

    var self = this;
    self.applications = ko.observableArray([]);
    self.currentApplication = ko.observable();
    /*self.currentApplication.subscribe(function (app) {
        //self.collection(null);

        $data.service(getServiceUrl(app, 'ApplicationDB'), function (factory) {
            //self.services.removeAll();
            var c = factory();
            c.prepareRequest = function (req) {
                req[0].headers = req[0].headers || {};
                req[0].headers['X-Domain'] = 'jokerStorm';
                req[0].headers['Authorization'] = globalAuthorization;
            };
            //c.Services.toArray(self.services);
            c.Services.single(function(it){ return it.Name === this.service; }, { service: 'HelloWorld' }, function(it){ self.currentService(it.asKoObservable()); });
        }, { httpHeaders: { 'Authorization': globalAuthorization, 'X-Domain': 'jokerStorm' } });
    });*/

    self.start = function () {
        getAuthroization();
        return this;
    }
    function getServiceUrl(app, store) {
        return app.url + store;
    }

    //self.services = ko.observableArray([]);
    self.currentService = ko.observable();

    /*self.currentService.subscribe(function (service) {
        self.collection(null);

        var url = self.currentApplication().url + service.Name();
        $data.service(url, function (factory) {
            var f = function () {
                var c = factory();
                c.prepareRequest = function (req) {
                    req[0].headers = req[0].headers || {};
                    req[0].headers['X-Domain'] = 'jokerStorm';
                    req[0].headers['Authorization'] = globalAuthorization;
                };
                return c;
            };

            self.currentContextFactory(f);
        }, { httpHeaders: { 'Authorization': globalAuthorization, 'X-Domain': 'jokerStorm' } });
    });*/


    var globalAuthorization;
    var config;
    self.config = ko.observable({});
    var t;
    
    self.error = ko.observable([]);
    self.backup = '';
    self.source = ko.observable('');
    
    function getAuthroization(succ, err) {
        if (window.opener && window.opener.stormApplications && window.opener.globalAuthorization) {
            globalAuthorization = window.opener.globalAuthorization;
            t = window.location.href.split('?')[1];
            config = window.opener.serviceEditSource[t];
            self.currentService(config.service);
            
            self.backup = config.value();
            self.source(config.value());
            
            self.config(config);
            
            var app = window.opener.stormApplications.filter(function(it){ return it.appid === window.opener.adminApiClient.currentApplication().appid; })[0];
            self.applications.push(app);
            self.currentApplication(app);
            
            if (!self.source()){
                if (config.event){
                    self.source('function(items){\n    // code here...\n}');
                }else{
                    self.source('$data.ServiceBase.extend("' + self.currentService().Name() + '", {\n    \n});\n\n' + self.currentService().Name() + '.annotateFromVSDoc();');
                }
            }
            new $data.JayStormUI.CodeMirror('codemirror', self.source, self.error);
            
            if (succ) { succ(); }
            return;
        } else {
            window.location.href = 'https://dashboard.jaystack.com/';
            return;
        }

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
                                    .filter(function (item) { return item.status != 'Cancelled' })
                                    .map(function (item) {
                                        return {
                                            appid: item.appid,
                                            url: item.url + '/' || 'http://' + item.appid + '.jaystack.net/',
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
    
    self.dirty = ko.observable(false);

    self.source.subscribe(function (s) {
        if (self.source() != self.backup) self.dirty(true);
    });
    
    self.cancel = function(){
        //config.value(self.backup);
        window.close();
    };
    
    self.done = function(){
        //config.value(self.source());
        var app = self.currentApplication();
        $data.service(getServiceUrl(app, 'ApplicationDB'), function (factory) {
            //self.services.removeAll();
            var c = factory();
            c.prepareRequest = function (req) {
                req[0].headers = req[0].headers || {};
                req[0].headers['X-Domain'] = 'jokerStorm';
                req[0].headers['Authorization'] = globalAuthorization;
            };
            //c.Services.toArray(self.services);
            if (config.event){
            }else{
                var s = new c.Services.elementType(self.currentService().getEntity());
                c.Services.attach(s);
                s.ServiceSource = self.source();
                s.HasChanges = true;
                c.saveChanges(function(){
                    self.dirty(false);
                    config.value(self.source());
                });
            }
        }, { httpHeaders: { 'Authorization': globalAuthorization, 'X-Domain': 'jokerStorm' } });
    }

    self.esPageSize = ko.observable(30);
    self.collection = ko.observable();
}

//alert(window.opener);

