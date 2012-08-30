$data.JayStormUI.AdminModel.extend("$data.JayStormClient.SecurityManager", {

    constructor: function( apiContextFactory )
    {
        var self = this;

        self.groups = ko.observableArray([]);
    self.databases = ko.observableArray([]);

    self.rf = ko.observable({});

    var c = apiContextFactory();
    c.Databases.toArray(self.databases);
    c.Groups.toArray(self.groups);


    self.tablePermissions = [
        {
            name: 'Read',
            value: ko.observable()
        },
        {
            name: 'Delete',
            value: ko.observable()
        },
        {
            name: 'Update',
            value: ko.observable()
        },
        {
            name: 'Create',
            value: ko.observable()
        },
        {
            name: 'Delete in a batch',
            value: ko.observable()
        },
        {
            name: 'Manage',
            value: ko.observable()
        }

    ];

    self.selectedDatabase = ko.observable();

    self.tables = ko.observableArray([]);

    self.selectedDatabase.subscribe(function(value) {
        console.log(value);
        var id = value.DatabaseID();
        apiContextFactory().EntitySets
            .filter(function(it) { return it.DatabaseID == this.id }, {id: id })
            .toArray(self.tables);
    });

    self.selectedTable = ko.observable();
    self.selectedGroup = ko.observable();

    self.permissionRefresh = ko.observable();

    self.addPermission = function() {
        //console.dir(p);
        var c = apiContextFactory();

        var dbIDs = self.selectedDatabase() ? [self.selectedDatabase().DatabaseID() ] :
                                              self.databases().map( function(db) { return db.DatabaseID() });
        var setIDs = self.selectedTable() ?
                            Q.fcall(function() { return [{setID: self.selectedTable().EntitySetID(), dbID: dbIDs[0] }] }):
                            c.EntitySets.filter("it.DatabaseID in this.ids",{ids: dbIDs}).map("{ setID: it.EntitySetID, dbID: it.DatabaseID}").toArray();

        var groupIDs = self.selectedGroup() ? [self.selectedGroup().GroupID()] :
            self.groups().map( function(group) { return group.GroupID() });

        self.items = ko.observableArray([]);


        var permissions = [];
        Q.when(setIDs).then(function(setIDs) {
            console.log(dbIDs, setIDs, groupIDs);
            for(var j = 0; j < dbIDs.length; j++) {
                for(var k = 0; k < setIDs.length; k++) {
                    if (setIDs[k].dbID == dbIDs[j]) {
                        for(var l = 0; l < groupIDs.length; l++) {
                            var p = new c.Permissions.createNew({
                                DatabaseID: dbIDs[j],
                                EntitySetID: setIDs[k].setID,
                                GroupID: groupIDs[l]
                            });
                            for(var z = 0; z < self.tablePermissions.length;z++) {
                                p[self.tablePermissions[z].name] = self.tablePermissions[z].value();
                            }
                            c.add(p);
                            var koItem = p.asKoObservable();
                            self.items.push(koItem);
                            console.log("pushdone");
                        }
                    }
                }
            }
            c.saveChanges( function() {
                self.rf(Math.random());
                console.log("saved!");
            })
        })


    }

}
});