$data.JayStormUI.AdminModel.extend("$data.JayStormClient.DataManager", {

    constructor: function () {
        ///gets an ApplicationDB contexFactory
        ///lists databases 
        var self = this;

        //self.databases = ['/db','/db2'];

        self.visible = ko.observable(false);
        self.databases = ko.observableArray([]);

        function initState(cf) {
            console.log("db init state", self.application.currentApplication().url);
            var c = cf();
            self.databases.removeAll();
            c.Databases.forEach(function (db) {
                var appUrl = self.application.currentApplication().url;
                appUrl = appUrl + db.Name;
                self.databases.push(appUrl);
            });
        }

        self.contextFactory.subscribe(function (value) {
            initState(value);
        });

        if (self.contextFactory()) {
            initState(self.contextFactory());
        }

        self.dbContextFactory = ko.observable();
        self.dbContext = ko.observable();
        self.dbContextFactory.subscribe(function (value) {
            self.dbContext(value());
        });


        self.serviceUrlSelected = ko.observable();
        self.serviceUrlSelected.subscribe(function (value) {
            $data.MetadataLoader.load(value, function (factory) {
                var appDBFactory = function () {
                    var c = factory.apply({}, arguments);
                    c.prepareRequest = function (req) {
                        req[0].headers = req[0].headers || {};
                        req[0].headers['X-Domain'] = 'jokerStorm';
                        req[0].headers['Authorization'] = globalAuthorization;
                    }
                    return c;
                }

                self.dbContextFactory(appDBFactory);

            });
        })




        self.entitySets = ko.computed( function() {
            var result = [];
            for (var name in this.dbContext()) {
                //do not filter for ownProperties - they are not own
                if (this.dbContext()[name] instanceof $data.EntitySet) {
                    result.push(this.dbContext()[name]);
                }
            }
            return result;
        }, this);

        self.selectSet = function(eSet) {
            self.collection(eSet);
        }

        self.esPageSize = ko.observable(30);
        self.collection = ko.observable();
    }
});
