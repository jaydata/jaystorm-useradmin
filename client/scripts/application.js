$data.pushState = function( fn, title, url) {
    $data.navigationStates = $data.navigationStates || [];
    var key = Math.random().toString().replace(".","").replace(",",0);
    $data.navigationStates[key] = fn;
    window.history.pushState( { key: key }, title, url);
}

window.onpopstate = function(data) {
    console.dir(data);
    if (data && data.state && data.state.key) {
    $data.navigationStates[data.state.key]();
    }
//delete $data.navigationStates[data.state.key];
}


$(function() {

    $data.MetadataLoader.load('/db', function (factory) {

        var context = factory();

        function userManagerModel(context) {
            var self = this;

            self.visible = ko.observable(false);


            self.Users = context.Users;

            self.Groups = context.Groups;

            self.groups = ko.observableArray([]);

            self.selectedObject = ko.observable();

            self.selectObjectCommand = function(o) {
                self.selectedObject(o);
                self.propEditorVisible(true);
            };

self.editObject = function(o) {
    self.selectedObject(o);
    self.propEditorVisible(true);
    };
self.editObject.displayName = 'Edit';

this.propEditorVisible = ko.observable(false);

self.editObjectCommand = {
    execute: function(o) {
    self.selectedObject(o);
    self.propEditorVisible(true);
    },
displayName : 'Edit'
};

self.removeObjectCommand = {
    execute: function(o) {
    self.selectedObject(o);
    self.propEditorVisible(true);
    },
displayName : 'Remove'
};

self.saveObjectCommand = ko.observable({
    method: function() { }
});

self.addNew = function(entitySet, model, event) {
    var o = new entitySet.createNew().asKoObservable();
    self.selectedObject(o);
    self.propEditorVisible(true);
    console.log(arguments);
    self.saveObjectCommand({
    method: function() {
    entitySet.add(o);
    entitySet.entityContext.saveChanges( function() {
    self.propEditorVisible(false);
    });
}
});
}

self.removeObject = function(o) {

    }


}

function dataManagerModel(context) {

    var self = this;
    dmContext = context;
    self.context = context;

    self.entitySets = function() {
    var result = [];
    for(var name in context) {
    if (context[name] instanceof $data.EntitySet) {
    result.push(context[name]);
    }
}
return result;
};

self.selectSet = function(eSet) {
    //self.order('');
    $data.pushState( function() {
        self.collection(eSet);
    })
self.collection(eSet);
}

self.esPageSize = ko.observable(30);
self.collection = ko.observable();
self.visible = ko.observable(false);

}

function schemaManagerModel( appdbContext ) {
    var self = this;

    smContext = appdbContext;

    self.context = ko.observable(false);
    self.visible = ko.observable(false);

    self.databases = ko.observableArray([]);
    appdbContext.Databases.toArray(self.databases);
    self.currentDatabase = ko.observable();

    self.currentDatabaseID = ko.observable();

    self.selectDatabase = function(db) {
    self.currentDatabase(db);
    var dbID= ko.utils.unwrapObservable(db.DatabaseID);
    self.currentDatabaseID(dbID);
    self.entitySets( context.EntitySets);
    };




var executing;

self.tableCommands = [{

    displayName: 'Manage fields',
    commandName: 'manageFields',

    visible: function( item ) {
    return true;
    //return self.objectsInEditMode.indexOf(item) < 0;
    },


execute: function( item ) {
    var c = factory();
    tmpContext = c;
    var elementName = ko.utils.unwrapObservable(item.ElementType);
    var ents = c.Entities.filter("it.Name == this.ename", { ename: elementName }).toArray(
function(items)  {
    if ( items.length < 1 ) {
    console.log("execute new item!");
    var dbID = ko.utils.unwrapObservable(self.currentDatabaseID);
    var newEnt = new c.Entities.createNew({
    Name: elementName,
    DatabaseID: dbID,
    FullName: 'NAMESPACE.' + elementName,
    Namespace: 'NAMESPACE'
    });

c.Entities.add(newEnt);

c.saveChanges(function() {
    console.log("new enty saved!");
    var idField = new c.EntityFields.createNew({
    EntityID: newEnt.EntityID,
    DatabaseID: newEnt.DatabaseID,
    Name: 'ID',
    Type: 'id',
    Computed: true,
    Key: true
    });
c.add(idField);
c.saveChanges(function() {
    console.dir("Field:ID created");
    self.selectedEntity(newEnt.asKoObservable());
    self.currentEntityID(newEnt.EntityID);

    });
});

console.log(elementName + " " + dbID);
console.log(items);

} else {

    self.selectedEntity(items[0].asKoObservable());
    self.currentEntityID(items[0].EntityID);

    console.log("alread!");
    }
});

}
}];

self.entitySets = ko.observable(context.EntitySets);
self.eSetsPageSize = 50;


self.saveEntity = function() {
    alert("not implemented");
    }

self.selectedEntity = ko.observable();

self.currentEntityID = ko.observable();

self.entityFields = ko.observable(context.EntityFields);



}

function serviceManagerModel (contextFactory ) {
    var self = this;

    self.context = ko.observable(false);
    self.visible = ko.observable(false);





    self.allDatabases = ko.observableArray([]);
    contextFactory().Databases.toArray(self.allDatabases);

    self.selectedService = ko.observable();


    self.checkBoxStates = ko.observableArray([]);

    self.check = function() {
        console.log("checking!");
        self.checkBoxStates.push({});
    }

    self.selectService = function(item) {

        self.selectedService(item);
        self.checkBoxStates.removeAll();

        (item.Sets() || []).forEach(function(item) {
            self.checkBoxStates.push(item);
        });
    }



}
var svcMan = new serviceManagerModel(factory);
ko.applyBindings(svcMan, document.getElementById("ServiceManagerUI"));

//var userManagerModel = new userManagerModel(context);
var databaseManagerModel = new dataManagerModel(context);
var schemaManagerModel = new schemaManagerModel(context);

//ko.applyBindings(userManagerModel, document.getElementById("UserManagerUI"));
ko.applyBindings(databaseManagerModel, document.getElementById("DataManagerUI"));
ko.applyBindings(schemaManagerModel, document.getElementById("DatabaseManagerUI"));

function MenuModel(items) {
    var self = this;
    self.items = items;

    self.show = function(item) {

    $data.pushState( function() {
    self.items.forEach( function(item) {
    item.Model.visible(false);
    });
item.Model.visible(true);
});


self.items.forEach( function(item) {
    item.Model.visible(false);
    });


item.Model.visible(true);
item.Model.context( new factory());
}

$data.pushState( function() {
    self.items.forEach( function(item) {
        item.Model.visible(false);

        console.log("set");
    });
})

}

var items = [];
var sections =
[{ Title: 'Show tables', Model: databaseManagerModel },
                                { Title: 'Manage Schema', Model: schemaManagerModel },
                                {Title: 'Manage Services', Model: svcMan}];
ko.applyBindings(new MenuModel(sections), document.getElementById("MenuUI"));


//loadUserManagerUI(context);
});

})
