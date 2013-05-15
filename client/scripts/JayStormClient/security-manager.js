$data.JayStormUI.AdminModel.extend("$data.JayStormClient.SecurityManager", {
    constructor: function () {
        var self = this;

        self.groups = ko.observableArray([]);
        self.databases = ko.observableArray([]);

        self.rf = ko.observable({});

        function initState(cf) {
            var c = cf();
            c.Databases.toArray(self.databases);
            c.Groups.toArray(self.groups);
        }

        self.contextFactory.subscribe(function (value) {
            initState(value);
        });

        if (self.contextFactory()) {
            initState(self.contextFactory());
        }


        self.tablePermissions = [
            {
                name: 'Read',
                field: 'Read',
                value: ko.observable()
            },
            {
                name: 'Delete',
                field: 'Delete',
                value: ko.observable()
            },
            {
                name: 'Update',
                field: 'Update',
                value: ko.observable()
            },
            {
                name: 'Create',
                field: 'Create',
                value: ko.observable()
            },
            {
                name: 'Delete in a batch',
                field: 'DeleteBatch',
                value: ko.observable()
            }/*,
            {
                name: 'Manage',
                field: 'Manage',
                value: ko.observable()
            }*/

        ];

        self.selectedDatabase = ko.observable();

        self.tables = ko.observableArray([]);

        self.selectedDatabase.subscribe(function (value) {
            console.log(value);
            if (value){
            var id = value.DatabaseID();
            self.createContext().EntitySets
                .filter(function (it) { return it.DatabaseID == this.id }, { id: id })
                .toArray(self.tables);
            }else self.tables([]);
        });

        self.selectedTable = ko.observable();
        self.selectedGroup = ko.observable();
        
        self.addPermissionDisabled = ko.computed(function(){
            if (!self.selectedDatabase()) return true;
            if (!self.selectedTable()) return true;
            if (!self.selectedGroup()) return true;
            for (var i = 0; i < self.tablePermissions.length; i++){
                if (self.tablePermissions[i].value()) return false;
            }
            return true;
        }, self);

        self.permissionRefresh = ko.observable();

        self.addPermission = function () {
            //console.dir(p);
            var c = self.createContext();

            /*var dbIDs = self.selectedDatabase() ? [self.selectedDatabase().DatabaseID()] :
                                                  self.databases().map(function (db) { return db.DatabaseID() });


            var groupIDs = self.selectedGroup() ? [self.selectedGroup().GroupID()] :
                self.groups().map(function (group) { return group.GroupID() });

            self.items = ko.observableArray([]);


            var permissions = [];

            for (var j = 0; j < dbIDs.length; j++) {
                for (var l = 0; l < groupIDs.length; l++) {
                    var p = new c.Permissions.createNew({
                        DatabaseID: dbIDs[j],
                        EntitySetID: self.selectedTable().EntitySetID(),
                        GroupID: groupIDs[l]
                    });
                    for (var z = 0; z < self.tablePermissions.length; z++) {
                        p[self.tablePermissions[z].field] = self.tablePermissions[z].value();
                    }
                    c.add(p);
                    var koItem = p.asKoObservable();
                    self.items.push(koItem);
                    console.log("pushdone");
                }
            }*/
            //    }
            //}
            var p = new c.Permissions.createNew({
                DatabaseID: self.selectedDatabase() ? self.selectedDatabase().DatabaseID() : null,
                EntitySetID: self.selectedTable() ? self.selectedTable().EntitySetID() : null,
                GroupID: self.selectedGroup() ? self.selectedGroup().GroupID() : null
            });
            for (var z = 0; z < self.tablePermissions.length; z++) {
                p[self.tablePermissions[z].field] = self.tablePermissions[z].value();
            }
            c.add(p);
            c.saveChanges(function () {
                self.rf(+new Date());
                console.log("saved!");
                adminApiClient.publishChanges(true);
            }).fail(function(err){
                console.error(err);
            });
        };
        
        self.afterSave = function(){
            adminApiClient.publishChanges(true);
        };
    }
}
);
