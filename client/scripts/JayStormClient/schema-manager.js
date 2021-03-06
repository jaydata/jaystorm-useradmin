$data.JayStormUI.AdminModel.extend("$data.JayStormClient.SchemaManager", {

    constructor:function () {
        var self = this;

        self.databases = ko.observableArray([]);
        self.indicesNotSupported = ko.observable();
        self.lazyLoadNotSupported = ko.observable();
        //self.databases = ko.observable();

        self.clickDb = function(){
            setTimeout(function () {
                var el = document.querySelector('#SchemaManagerUI .nav.nav-tabs li a:not([data-dbname="ApplicationDB"])');
                if (el) {
                    el.click();
                }
            }, 100);
        };
        
        self.visible.subscribe(function(value){
            if (value && self.databases().length){
                self.clickDb();
            }
        });

        self.context.subscribe(function (value) {
            if (value) {
                var alreadyVisible = self.visible() || self.databases().length === 0;
                value.Databases.toArray(self.databases).then(function (value) {
                    if (!(!alreadyVisible && self.visible())) {
                        self.clickDb();
                    } else {
                        var el = document.querySelector('#SchemaManagerUI .nav.nav-tabs li a[data-dbname="' + self.currentDatabase().Name() + '"]');
                        if (el) {
                            el.parentNode.className = 'active';
                        }
                    }
                });
            } else {
                self.databases.removeAll();
            }
        });

        self.currentDatabase = ko.observable();
        self.currentDatabaseID = ko.observable();
        self.currentDatabaseName = ko.observable();
        
        self.tableListReceived = function (items) {
            console.log("items present: " + items.length);
            self.tableItemsPresent(true);
        }

        self.tableItemsPresent = ko.observable(false);
        self.tableItems = ko.observableArray([]);
        
        self.complexTypesReceived = function(items){
            console.log('complex types: ', items.length);
            self.complexTypesPresent(true);
        }
        
        self.complexTypesPresent = ko.observable(false);
        self.complexTypes = ko.observableArray([]);
        
        self.IsApplicationDB = ko.observable(true);
        self.currentDatabase.subscribe(function (db) {
            if (db) {
                self.currentDatabaseID(ko.utils.unwrapObservable(db.DatabaseID));
                self.currentDatabaseName(ko.utils.unwrapObservable(db.Name));
                self.IsApplicationDB(db.Name() === 'ApplicationDB');
                self.indicesNotSupported(!!adminApiClient.currentAppDBContextFactory()().Indices);
                self.lazyLoadNotSupported(!!adminApiClient.currentAppDBContextFactory()().EntityFields.createNew.memberDefinitions.getMember('LazyLoad'));
                
                self.typeTemplates([]);
                adminApiClient.currentAppDBContextFactory()().TypeTemplates.forEach(function(it){
                    self.typeTemplates.push(it.asKoObservable());
                    self.typeTemplates.sort(function(a, b){
                        var aName = a.Name().toLowerCase();
                        var bName = b.Name().toLowerCase();
                        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                    });
                });
                adminApiClient.currentAppDBContextFactory()().ComplexTypes.filter(function(it){ return it.DatabaseID == this.db; }, { db: self.currentDatabaseID() }).forEach(function(it){
                    self.typeTemplates.push({
                        Name: ko.observable(it.FullName),
                        TypeName: ko.observable(it.FullName),
                        TypeDescriptor: ko.observable({ Type: it.FullName }),
                        isComplexType: true
                    });
                    self.typeTemplates.sort(function(a, b){
                        var aName = a.Name().toLowerCase();
                        var bName = b.Name().toLowerCase();
                        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                    });
                });
                adminApiClient.currentAppDBContextFactory()().Entities.filter(function(it){ return it.DatabaseID == this.db; }, { db: self.currentDatabaseID() }).forEach(function(it){
                    self.typeTemplates.push({
                        Entity: it,
                        Name: ko.observable(it.FullName),
                        TypeName: ko.observable(it.FullName),
                        TypeDescriptor: ko.observable({ Type: it.FullName, InverseFieldID: it.EntityID }),
                        isNavigation: true
                    });
                    self.typeTemplates.sort(function(a, b){
                        var aName = a.Name().toLowerCase();
                        var bName = b.Name().toLowerCase();
                        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                    });
                });
            } else {
                self.currentDatabaseID(null);
                self.currentDatabaseName(null);
                self.IsApplicationDB(false);
            }
        });

        //todo rename to beforeTableChange
        self.beforeDatabaseSave = function(set) {
            //upon new table/entityset creation we provision a new entity as the item type
            //of the new entityset. also and id field is created
            //this would need much less code with relations support in v1.1
            adminApiClient.publishChanges(true);
            var tracks = set.entityContext.stateManager.trackedEntities;
            var newEntities = { };
            var dbs = [];
            var c = self.createContext();
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
                var saveFn = function(){
                    c.saveChanges( function() {
                        for(var i = 0; i < dbs.length; i++) {
                            var db = dbs[i];

                            db.ElementTypeID = newEntities[db.Name].EntityID;

                            var field = new c.EntityFields.createNew({
                                Name : 'id',
                                Type : 'id',
                                Key: true,
                                Nullable: false,
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
                    });
                };
                
                if (database.entityState == $data.EntityState.Deleted){
                    c.Entities.filter(function(it){ return it.EntityID == this.entityid; }, { entityid: database.ElementTypeID }).toArray(function(es){
                        for(var i = 0; i < es.length; i++){
                            c.Entities.remove(es[i]);
                        }
                        c.Permissions.filter(function(it){ return it.EntitySetID == this.entitysetid; }, { entitysetid: database.EntitySetID }).toArray(function(r){
                            for(var i = 0; i < r.length; i++){
                                c.Permissions.remove(r[i]);
                            }
                            saveFn();
                        });
                    });
                }else saveFn();
            };
            return result;
        };
        
        self.beforeComplexTypeSave = function(set){
            adminApiClient.publishChanges(true);
            var tracks = set.entityContext.stateManager.trackedEntities;
            tracks.forEach(function(complexType){
                complexType = complexType.data;
                complexType.FullName = self.currentDatabase().Name() + '.' + complexType.Name;
            });
        };

        if (window.hasChangeEvent) {
            window.hasChangeEvent.attach(function (s, values) {
                if (self.currentDatabase()) {
                    var dbChanges = values.filter(function (val) {
                        return val.CollectionName === 'Databases' && val.Items.filter(function (it) {
                            return it.Name() === self.currentDatabase().Name();
                        });
                    })
                    if (dbChanges.length >= 0)
                        self.currentDatabase().HasChanges(false);
                }
            });
        }

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


        //TODO refactor to fields editor!!!
        self.typeTemplates = ko.observableArray([]);
        
        /*self.typeTemplatesSorted = ko.computed(function(){
            return ko.observableArray(self.typeTemplates().map(function(it){ return it(); }));
        });*/

        var primitiveTypes  = { 'string' : 1,'number' :1,'boolean':1,'id':1,'date':1,'int':1};

        self.elementTypes = ko.computed(function() {
            return self.typeTemplates();/*.filter( function(item) {
                return item.TypeDescriptor().Type in primitiveTypes;
            })*/
        });

        //TODO refactor to fields editor!!!
        self.contextFactory.subscribe(function (value) {
            /*value().TypeTemplates.forEach(function(it){
                self.typeTemplates.push(it.asKoObservable());
                self.typeTemplates.sort(function(a, b){
                    var aName = a.Name().toLowerCase();
                    var bName = b.Name().toLowerCase();
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                });
            });*/

            var c = value();
            c.EntityFields.defaultType.instancePropertyChanged = c.EntityFields.defaultType.instancePropertyChanged || new $data.Event("changed");

            c.EntityFields.defaultType.instancePropertyChanged.attach(function (holder, prop) {
                if ('TypeTemplate' == prop.propertyName && (prop.oldValue !== undefined || !holder.EntityFieldID)) {
                    console.log("Template changed!");
                    var ttname = prop.newValue;
                    //console.log(id);

                    for (var i = 0; i < self.typeTemplates().length; i++) {
                        var t = self.typeTemplates()[i];
                        if (t.Name() == ttname) {
                            var td = t.TypeDescriptor();

                            for (var s in td) {
                                holder[s] = td[s];
                            }
                            
                            if (td.Type && td.Type != 'Array' && !t.isComplexType){
                                holder.ElementType = null;
                            }
                            
                            /*if (td.Type && t.isNavigation){
                                holder.InverseProperty = t.Entity.Name;
                            }*/
                        }
                    }
                }
            });
        });
        
        self.editData = function(item){
            //self.context().Services.first(function(it){ return it.DatabaseID == this.db; }, { db: self.currentDatabaseID() }, function(service){
                window.editDataService = item.owner.DatabaseID();
                window.editDataTable = item.owner.Name();
                if (typeof w === 'undefined') {
                    console.log("opening window");
                    w = window.open("data.html", "_dataui");
                } else {
                    w.close();
                    w = window.open("data.html", "_dataui");
                    console.log("Focus!");
                    w.focus();
                }
            //});
        };
    }
});

function EventHandlerCodeEditorModel(vm){
    var self = this;
    this.data = vm.eventHandler;
    
    self.error = ko.observable(false);
    /*self.codeMirror = function (el, value, error) {
        new $data.JayStormUI.CodeMirror(el, value, error);
    };*/
    
    //var h = self.data.owner.Handler();
    
    self.originalValue = self.data.owner.Handler();
    self.id = 'handler-code-editor-' + self.data.rowIndex();
    //if (!vm.parent.codeMirrorInstances[self.id]){
        setTimeout(function(){
            if (!self.data.owner.Handler()) self.data.owner.Handler(new EJS({ url: '/scripts/eventhandlersource-template.ejs' }).render({ event: self.data.owner.Type() }));
            //if (!vm.parent.codeMirrorInstances[self.id]){
            vm.parent.codeMirrorInstances[self.id] = new $data.JayStormUI.CodeMirror(self.id, self.data.owner.Handler, self.error);
            //}
        }, 100);
    //}
    
    this.saveHandler = function(){
        /*if (self.data.owner.Handler() != h){
            var f = adminApiClient.currentAppDBContextFactory();
            var c = f();
            
            c.onReady(function(db){
                db.EventHandlers.attach(self.data.owner);
                eh.Handler = 
            });
        }*/
        adminApiClient.publishChanges(true);
    };
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    };
    
    vm.parent.codeEditor.push(self);
}

function EventHandlersEditorModel(vm){
    var self = this;
    this.data = vm.entitySet;
    
    var entitySet = vm.entitySet.owner;
    var context = vm.factory()();
    var db = vm.currentDB();
    
    this.selectedEntitySet = ko.observable();
    
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
    
    self.error = ko.observable(false);
    self.codeMirror = function (el, value, error) {
        new $data.JayStormUI.CodeMirror(el, value, error);
    };

    self.codeHighlight = function(el, value){
        new $data.JayStormUI.CodeHighlight(el, value);
    };

    self.beforeSaveHandler = function () {
        //vm.closeControlBox();
        var tmp = self.codeEditor.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.codeEditor.length = 0;
        adminApiClient.publishChanges(true);
    };
    
    self.afterRevertHandler = function(item){
        var tmp = self.codeEditor.slice();
        
        var cb = tmp.filter(function(it){ return it.data.owner.EventHandlerID() === item.EventHandlerID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.codeEditor.splice(self.codeEditor.indexOf(cb), 1);
        delete self.codeMirrorInstances[cb.id];
        
        item.Handler(cb.originalValue);
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    self.codeEditor = [];
    self.codeMirrorInstances = {};
    
    self.editCode = function(e){
        e.showControls.bind({}, 'eventHandlerCodeEditor', EventHandlerCodeEditorModel, { eventHandler: e, parent: self });
    }

    context.EntitySets
        .single("it.EntitySetID == this.id", { id: entitySet.EntitySetID() }, ko.observableHere)
        .then(function (entityset) { console.log('ENTITYSET', entityset); self.selectedEntitySet(entityset.asKoObservable()) });
    
    /*self.editSource = function(owner, value, error){
        if (!window.serviceEditSource) window.serviceEditSource = {};
        var t = 'edit' + new Date().getTime();
        window.serviceEditSource[t] = {
            service: entitySet,
            owner: owner,
            value: owner.Handler,
            event: true,
            type: owner.Type
        };
        window.open('code.html?' + t, t);
    };*/
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    }
}

function FieldsEditorModel(vm) {
    console.log("!!!!!:", vm);
    var self = this;
    this.data = vm.entitySet;
    
    var entitySet = vm.entitySet.owner;
    var context = vm.factory()();
    var db = vm.currentDB();
    this.beforeSaveField = function (set) {
        var tmp = self.customize.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.customize.length = 0;
        
        context.attach(entitySet);
        entitySet.HasChanges(true);
        context.attach(self.selectedEntity());
        self.selectedEntity().HasChanges(true);
        context.attach(db);
        db.HasChanges(true);
        
        /*var tracks = set.entityContext.stateManager.trackedEntities.slice();
        return function(ok, error){
            var readyFn = function(){
                context.saveChanges();
            };
            
            var inverseFn = function(field){
                if (field.entityState == $data.EntityState.Added){
                    var c = vm.factory()();
                    c.EntityFields.add(new context.EntityFields.createNew({
                        EntityID: field.InverseFieldID,
                        InverseFieldID: field.En
                    }));
                }else if (field.entityState == $data.EntityState.Deleted){
                    
                }else if (field.entityState == $data.EntityState.Modified){
                    
                }
                
                if (tracks.length) inverseFn(tracks.shift().data);
            };
            
            if (tracks.length) inverseFn(tracks.shift().data);
        };*/
        context.saveChanges();
        adminApiClient.publishChanges(true);
    }
    this.selectedEntity = ko.observable();
    
    self.afterRevertHandler = function(item){
        var tmp = self.customize.slice();
        
        var cb = tmp.filter(function(it){ return it.data.EntityFieldID() === item.EntityFieldID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.customize.splice(self.customize.indexOf(cb), 1);
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    self.customize = [];

    context.Entities
        .single("it.EntityID == this.id", { id: entitySet.ElementTypeID() })
        .then(function (entity) { self.selectedEntity(entity.asKoObservable()) });

    this.closeControlBox = function () {
        vm.closeControlBox();
    }
}

function ComplexTypeEditorModel(vm) {
    console.log("!!!!!:", vm);
    var self = this;
    this.data = vm.entitySet;
    
    var entitySet = vm.entitySet.owner;
    var context = vm.factory()();
    var db = vm.currentDB();
    this.beforeSaveField = function () {
        /*var tmp = self.customize.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.customize.length = 0;
        
        context.attach(entitySet);
        entitySet.HasChanges(true);
        context.attach(self.selectedEntity());
        self.selectedEntity().HasChanges(true);
        context.attach(db);
        db.HasChanges(true);
        context.saveChanges();*/
        adminApiClient.publishChanges(true);
    }
    this.selectedEntity = ko.observable(vm.entity);
    
    self.afterRevertHandler = function(item){
        var tmp = self.customize.slice();
        
        var cb = tmp.filter(function(it){ return it.data.EntityFieldID() === item.EntityFieldID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.customize.splice(self.customize.indexOf(cb), 1);
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    self.customize = [];

    /*context.Entities
        .single("it.EntityID == this.id", { id: entitySet.ElementTypeID() })
        .then(function (entity) { self.selectedEntity(entity.asKoObservable()) });*/

    this.closeControlBox = function () {
        vm.closeControlBox();
    }
}

function FieldsCustomizeEditorModel(vm){
    var self = this;
    this.data = vm.field.owner;
    this.parent = vm.parent;
    
    this.parent.customize.push(this);
    
    this.closeControlBox = function () {
        vm.closeControlBox();
    }
}

function IndicesEditorModel(vm) {
    var self = this;
    
    var entitySet = vm.entitySet.owner;
    self.selectedEntitySet = ko.observable(entitySet);
    self.root = ko.observable(vm.root);
    self.selectedEntity = ko.observable();
    var context = vm.factory()();
    var db = vm.currentDB();
    this.beforeSaveField = function () {
        /*var tmp = self.customize.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.customize.length = 0;*/
        
        context.attach(entitySet);
        entitySet.HasChanges(true);
        context.attach(self.selectedEntity());
        self.selectedEntity().HasChanges(true);
        context.attach(db);
        db.HasChanges(true);
        context.saveChanges();
        adminApiClient.publishChanges(true);
    };
    
    self.afterRevertHandler = function(item){
        /*var tmp = self.customize.slice();
        
        var cb = tmp.filter(function(it){ return it.data.EntityFieldID() === item.EntityFieldID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.customize.splice(self.customize.indexOf(cb), 1);*/
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    //self.customize = [];

    context.Entities
        .single("it.EntityID == this.id", { id: entitySet.ElementTypeID() })
        .then(function (entity) { self.selectedEntity(entity.asKoObservable()) });

    this.closeControlBox = function () {
        vm.closeControlBox();
    }
}

function IndexKeysEditorModel(vm) {
    var self = this;
    
    /*var entitySet = vm.entitySet.owner;
    self.selectedEntitySet = ko.observable(entitySet);*/
    var context = vm.factory()();
    var entity = vm.entity;
    self.context = ko.observable(vm.factory()());
    self.currentDatabaseID = ko.observable(vm.currentDB().DatabaseID());
    self.selectedIndex = ko.observable(vm.index.owner);
    self.entityFields = ko.observableArray([]);
    var db = vm.currentDB();
    
    context.EntityFields
        .filter(function(it){ return it.EntityID == this.id; }, { id: entity.EntityID() })
        .toArray(self.entityFields);
    
    this.beforeSaveField = function () {
        /*var tmp = self.customize.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.customize.length = 0;*/
        
        /*context.attach(entitySet);
        entitySet.HasChanges(true);
        context.attach(self.selectedEntity());
        self.selectedEntity().HasChanges(true);
        context.attach(db);
        db.HasChanges(true);
        context.saveChanges();*/
        adminApiClient.publishChanges(true);
    };
    //this.selectedEntity = ko.observable();
    
    self.afterRevertHandler = function(item){
        /*var tmp = self.customize.slice();
        
        var cb = tmp.filter(function(it){ return it.data.EntityFieldID() === item.EntityFieldID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.customize.splice(self.customize.indexOf(cb), 1);*/
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    //self.customize = [];

    /*context.Entities
        .single("it.EntityID == this.id", { id: entitySet.ElementTypeID() })
        .then(function (entity) { self.selectedEntity(entity.asKoObservable()) });*/

    this.closeControlBox = function () {
        vm.closeControlBox();
    }
}
