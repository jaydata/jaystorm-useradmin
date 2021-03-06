﻿function clientApplication() {

    var self = this;
    self.applications = ko.observableArray([]);
    self.currentApplication = ko.observable();
    self.currentApplication.subscribe(function (app) {
        self.collection(null);

        $data.service(getServiceUrl(app, 'ApplicationDB'), function (factory) {
            self.services.removeAll();
            var c = factory();
            c.prepareRequest = function (req) {
                req[0].headers = req[0].headers || {};
                req[0].headers['X-Domain'] = 'jokerStorm';
                req[0].headers['Authorization'] = globalAuthorization;
            };
            c.Services.filter(function(it){ return it.DatabaseID != null }).toArray(self.services).then(function(value){
                var appdb = value.filter(function(it){ return it.Name == 'ApplicationDB' || it.Name == 'User' });
                if (window.opener.editDataService){
                    //self.currentService(self.services().filter(function(it){ return it.ServiceID() == this.db; }, { db: window.opener.editDataService })[0]);
                    (document.querySelector('*[data-serviceid="' + window.opener.editDataService + '"]') ||
                     document.querySelector('*[data-databaseid="' + window.opener.editDataService + '"]') ||
                     { click: function(){} }).click();
                     
                     window.opener.editDataService = undefined;
                }else{
                    var db = document.querySelector('*[data-serviceid]' + appdb.map(function(it){ return ':not([data-serviceid="' + it.ServiceID + '"])'; }).join(''));
                    if (db){
                        db.click();
                        return;
                    }
                    
                    (document.querySelector('*[data-serviceid]') ||
                     document.querySelector('*[data-databaseid]') ||
                     { click: function(){} }).click();
                }
            });
        }, { httpHeaders: { 'Authorization': globalAuthorization, 'X-Domain': 'jokerStorm' } });
    });

    self.start = function () {
        getAuthroization();
        return this;
    }
    function getServiceUrl(app, store) {
        return app.url + store;
    }

    self.services = ko.observableArray([]);
    self.currentService = ko.observable();

    self.currentService.subscribe(function (service) {
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
    });


    var globalAuthorization;

    function getAuthroization(succ, err) {
        if (window.opener && window.opener.stormApplications && window.opener.globalAuthorization) {
            window.opener.stormApplications.forEach(function (app) {
                self.applications.push(app);
                if (succ) { succ(); }
            });
            globalAuthorization = window.opener.globalAuthorization;
            var app = window.opener.adminApiClient.currentApplication();
            if (app) self.currentApplication(app);
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
                                            url: item.url + '/' || 'https://' + item.appid + '.jaystack.net/',
                                            title: item.name,
                                            isfreeapp: item.isfreeapp
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


    self.currentContextFactory = ko.observable();
    self.context = ko.observable();
    self.entitySets = ko.observableArray([]);
    self.IsApplicationDB = ko.observable(false);

    self.currentContextFactory.subscribe(function (cf) {
        var c = cf();
        self.IsApplicationDB(c.getType().name === 'contextType_ApplicationDB');
        self.context(c);
        self.entitySets.removeAll();
        for (var name in c) {
            //do not filter for ownProperties - they are not own
            if (c[name] instanceof $data.EntitySet) {
                self.entitySets.push(c[name]);
            }
        }
        
        document.querySelector(window.opener.editDataTable ? '#table-' + window.opener.editDataTable : '#tables li a').click();
        if (window.opener.editDataTable) window.opener.editDataTable = undefined;
    })

    self.esPageSize = ko.observable(30);
    self.collection = ko.observable();
}

//alert(window.opener);

