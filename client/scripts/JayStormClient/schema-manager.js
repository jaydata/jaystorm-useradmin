function SchemaManagerModel( contextFactory ) {
    var self = this;

    var factory = contextFactory;


    self.show = function() {
        self.context( factory() );
    };

    self.hide = function () {
        self.context(null);
    };

    self.context = ko.observable();

    self.databases = ko.observableArray([]);

    self.eventTypes = ko.observableArray([{
        name: 'beforeCreate',
        type: 'beforeCreate'
    }, {
        name: 'beforeRead',
        type: 'beforeRead'
    }, {
        name: 'beforeUpdate',
        type: 'beforeUpdate'
    }, {
        name: 'beforeDelete',
        type: 'beforeDelete'
    }, {
        name: 'afterCreate',
        type: 'afterCreate'
    }, {
        name: 'afterRead',
        type: 'afterRead'
    }, {
        name: 'afterUpdate',
        type: 'afterUpdate'
    }, {
        name: 'afterDelete',
        type: 'afterDelete'
    }]);
    self.codeMirror = function(el, value){
        setTimeout(function(){
            if (!value()) value('function(items){\n  // code here...\n}');
            var editor = CodeMirror(document.getElementById(el), {
                value: value(),
                mode: 'javascript',
                lineNumbers: true,
                theme: "night",
                extraKeys: {
                    'Ctrl-Space': 'autocomplete',
                    "F11": function(cm) {
                        setFullScreen(cm, !isFullScreen(cm));
                    },
                    "Esc": function(cm) {
                        if (isFullScreen(cm)) setFullScreen(cm, false);
                    }
                },
                onChange: function(editor){
                    console.log(editor.getValue());
                    value(editor.getValue());
                },
                onCursorActivity: function() {
                    editor.setLineClass(hlLine, null, null);
                    hlLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
                    editor.matchHighlight("CodeMirror-matchhighlight");
                }
            });
            var hlLine = editor.setLineClass(0, "activeline");
        }, 1);
    };
    self.codeHighlight = function(el, value){
        setTimeout(function(){
            if (!value()) value('function(items){\n  // code here...\n}');
            CodeMirror.runMode(value(), 'text/javascript', document.getElementById(el));
        }, 1);
    };

    self.context.subscribe( function(value) {
        if (value) {
            value.Databases.toArray(self.databases);
            console.dir(value.EntityFields);
        } else {
            self.databases.removeAll();
        }
    });

    self.visible = ko.observable(false);

    self.currentDatabase = ko.observable();
    self.currentDatabaseID = ko.observable();
    self.currentDatabaseName = ko.observable();

    self.selectDatabase = function(db) {
        self.currentDatabase(db);
        self.currentDatabaseID(ko.utils.unwrapObservable(db.DatabaseID));
        self.currentDatabaseName(ko.utils.unwrapObservable(db.Name));
    };

    self.beforeDatabaseSave = function(set) {
        //upon new table/entityset creation we provision a new entity as the item type
        //of the new entityset. also and id field is created
        //this would need much less code with relations support in v1.1

        var tracks = set.entityContext.stateManager.trackedEntities;
        var newEntities = { };
        var dbs = [];
        var c = contextFactory();
        for(var i = 0; i < tracks.length; i++) {
            var database = tracks[i].data;

            if (database instanceof set.createNew) {
                if ( !(database.ElementTypeID) ) {
                    dbs.push(database);
                    var namespace = self.currentDatabase().Name(),
                        name = database.Name.singularize().valueOf(),
                        fullName = namespace + "." + name;

                    var elementType = new c.Entities.createNew({
                        Name : name,
                        DatabaseID : self.currentDatabaseID(),
                        Namespace : namespace,
                        FullName : fullName
                    });
                    //pin the new entity objects with their container name for later rematch
                    newEntities[database.Name] = elementType;
                    c.add(elementType);
                }
            }
        };
        function result(ok, error) {
            c.saveChanges( function() {
                for(var i = 0; i < dbs.length; i++) {
                    var db = dbs[i];

                    db.ElementTypeID = newEntities[db.Name].EntityID;

                    var field = new c.EntityFields.createNew({
                        Name : 'id',
                        Type : 'id',
                        Key : true,
                        Index: -10,
                        TypeTemplate: 'Object identifier',
                        DatabaseID : self.currentDatabaseID(),
                        Computed : true,
                        EntityID : db.ElementTypeID
                    });
                    set.entityContext.add(field);
                }
                console.dir(dbs);
                ok();
            })
        }
        return result;
    };

    self.afterAddNewEntityField = function( item, gridModel) {
        item.Index( gridModel.items().length );
    };

    self.currentEntitySet = ko.observable();
    self.currentEntitySetID = ko.observable();
    self.currentEntitySetName = ko.observable();

    self.setCurrentEntitySet = function(item) {
        self.currentEntitySet(item);
        self.currentEntitySetID(ko.utils.unwrapObservable(item.EntitySetID));
        self.currentEntitySetName(ko.utils.unwrapObservable(item.Name));
    }

    self.selectedEntity = ko.observable();
    self.currentEntityID = ko.observable();

    self.showTriggerManager = ko.observable(false);

    self.setCurrentEntity = function(entity) {
        self.selectedEntity(entity);
        self.currentEntityID(entity.EntityID());

    }
    self.tableCommands =
        [
            {
                displayName: 'Manage fields',
                commandName: 'manageFields',
                visible: function( item ) {
                    return true;
                },
                execute: function( item ) {
                    var entity = contextFactory().Entities.find(item.ElementTypeID());
                    entity.then(function(e) { self.setCurrentEntity(e.asKoObservable()) });
                }
            },
            {
                displayName: 'Edit ServerEvents',
                commandName: 'editEvents',
                visible: function( item ) {
                    return true;
                },
                execute: function( item ) {
                    self.setCurrentEntitySet( item );
                    self.showTriggerManager( true );
                }
            },

        ];


    self.eSetsPageSize = 50;


    self.saveEntity = function() {
        alert("not implemented");
    }


    self.typeTemplates = ko.observableArray([]);

    var primitiveTypes  = { 'string' : 1,'number' :1,'boolean':1,'id':1,'date':1};

    self.elementTypes = ko.computed(function() {
        return self.typeTemplates().filter( function(item) {
            return item.TypeDescriptor().Type in primitiveTypes;
        })
    })

    contextFactory().TypeTemplates.toArray(self.typeTemplates);

    

    var c = factory();
    c.EntityFields.defaultType.instancePropertyChanged = c.EntityFields.defaultType.instancePropertyChanged || new $data.Event("changed");
    c.EntityFields.defaultType.instancePropertyChanged.attach( function(holder, prop) {
        if ('TypeTemplate' == prop.propertyName ) {
            console.log("Template changed!");
            var ttname = prop.newValue;
            //console.log(id);

            for(var i = 0; i < self.typeTemplates().length;i++) {
                var t = self.typeTemplates()[i];
                if (t.Name() == ttname) {

                    for(var s in t.TypeDescriptor()) {
                        holder[s] = t.TypeDescriptor()[s];
                    }

                }
            }
        }
    })
}
