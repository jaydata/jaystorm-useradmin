(function ($data) {

    $data.jayGrid = $data.jayGrid || {};

    window['GroupEditor'] = function (viewModel) {
        var self = this;
        console.dir("groupEditor created");
        $data.typeSystem.extend(this, viewModel);
        self.Groups = ko.observableArray([]);

        var currentList = self.value() || [];
        viewModel.context().Groups.forEach(function (item) {
            item.selected = ko.observable(currentList.indexOf(item.GroupID) > -1);
            item.selected.subscribe(function (value) {
                var list = self.value() || [];
                if (value) {
                    list.push(item.GroupID);
                } else {
                    list.splice(list.indexOf(item.GroupID), 1);
                }
                self.value(list);
            });
            self.Groups.push(item);
        });

    };

    var templateEngine = new ko.nativeTemplateEngine();

    var i = 0;

    if (! ($data.EntitySet.prototype.toKoArray) ) {


        $data.EntitySet.prototype.toKoArray = function() {
            if (this._cached_ko_array) {
                return this._cached_ko_array;
            }
            var z = this._cached_ko_array = ko.observableArray([]);
            this.toArray( function(items) {
                items.forEach(function(item) {
                    z.push(item);
                })
            });
            return z;
        }
     }

    templateEngine.addTemplate = function(templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    //todo displayName

    function regiserTemplates(templates) {
        for(var i = 0; i < templates.length; i++) {
            templateEngine.addTemplate(templates[i][0], templates[i][1]);
        }
    }


    regiserTemplates($data.jayGridTemplates.tableTemplate);

    function getColumnsMetadata(source, fields, itemCommands) {
        var entityType = null;

        source = ko.utils.unwrapObservable(source);
        if (source instanceof $data.EntitySet) {
            entityType = source.elementType;
        } else if (source instanceof $data.Queryable ) {
            entityType = source._defaultType;
        }
        var props = [].concat(entityType.memberDefinitions.getPublicMappedProperties());
        if (fields.length > 0) {
            var res = [];
            for (var i = 0; i < fields.length; i++) {
                var prop = null;
                var propname = fields[i];
                if (typeof propname === 'string') {
                    j = 0;
                    while (!prop && j < props.length) {
                        if (props[j].name === propname) {
                            prop = props[j];
                        }
                        j++;
                    }
                } else {
                    //if object then is a memDef
                    console.log("fakefield");
                    if (fields[i].isVirtual) {
                        prop = fields[i];
                    } else {
                        var propname = fields[i].name;
                        var j = 0;
                        while (!prop && j < props.length) {
                            if (props[j].name === propname) {
                                prop = props[j];
                            }
                            j++;
                        }
                        if (prop) {
                            $data.typeSystem.extend(fields[i], prop);
                        }
                        prop = fields[i];
                    }
                }
                if (prop) {
                    res.push(prop);
                }
            }
            props = res;
        }

        if (itemCommands.length > 0) {
            var meta = {
                isVirtual : true,
                name: 'controls',
                type: 'itemCommands',
                itemCommands: itemCommands
            };
            props.push(meta);
        }

        return props;
    };

    ko.bindingHandlers['readValue'] = {
        'update': function (element, valueAccessor) {
            var v = valueAccessor();
            var eset = ko.utils.unwrapObservable(v.source);

            var key = ko.utils.unwrapObservable(v.key);
            if (!key) {
                return;
            }

                var field = ko.utils.unwrapObservable(v.field);
            var keyField = eset.createNew.memberDefinitions.getKeyProperties()[0].name;


            eset.filter("it." + keyField.toString() + " == this.value", { value: key})
                .map("it." + field)
                .forEach(function(item) {
                    ko.utils.setTextContent(element, item);
                }
            );

        }
    };

    ko.bindingHandlers.jayGrid = {

        init: function() {
            return { 'controlsDescendantBindings': true };
        },

        update: function (element, viewModelAccessor, allBindingsAccessor, vModel) {
            this.x = this.x || 1;
            this.x += 1;
            console.dir(this);
            //console.dir(vModel);
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            var source = null, fields = [];


            if (viewModel instanceof $data.EntitySet || viewModel instanceof $data.Queryable) {
                source = viewModel;
            } else {
                source = viewModel.source;
            };

            source = ko.isObservable(source) ? source: ko.observable(source);

            var fieldTemplates = {};


            if (! element.typeTemplates) {
                element.typeTemplates = {};
                var children = element.childNodes;
                for(var i = 0; i < children.length; i++) {
                    var child = children[i];
                    var tmpName = undefined;
                    if (child.nodeType == 1) {
                        tmpName = child.getAttribute("data-type-template");
                        if (tmpName) {
                            var rndId = Math.random().toString().replace(".", "").replace(",", "");

                            child.setAttribute("id", rndId);
                            element.typeTemplates[tmpName] = rndId;
                            document.body.appendChild(child);
                            console.log("template registered:" + tmpName );
                        }
                    }
                }
            }


            if (! element.nameTemplates) {
                element.nameTemplates = {};
                var children = element.childNodes;
                for(var i = 0; i < children.length; i++) {
                    var child = children[i];
                    var tmpName = undefined;
                    if (child.nodeType == 1) {
                        tmpName = child.getAttribute("data-name-template");
                        if (tmpName) {
                            var rndId = Math.random().toString().replace(".","").replace(",","");
                            child.setAttribute("id", rndId);
                            element.nameTemplates[tmpName] = rndId;
                            document.body.appendChild(child);
                            console.log("template registered:" + tmpName );
                        }
                    }
                }
            }
            fields = viewModel.fields || [];


            console.dir(element);
            function _model(container) {
                
                for(var j in viewModel) {
                    this[j] = viewModel[j];
                };

                for (var j in vModel) {
                    this[j] = vModel[j];
                };

                console.log("Grid model created");
                var self = this;

                self.pageSize = ko.isObservable(viewModel.pageSize) ?
                                viewModel.pageSize : ko.observable(viewModel.pageSize || 10);

                self.itemCount = ko.observable();


                self.currentPage = ko.observable(0);

                self.source = source;



                //self.source.subscribe( function(){
                //    self.sortColumn('');
                //}, 'beforeChange');

                if (viewModel.items) {
                    console.log("replacing items");
                }
                self.items =  viewModel.items || ko.observableArray([]);

                if (self.monitorItems) {
                    self.monitorItems(self.items);
                }

                self.objectsToDelete = ko.observableArray([]);
                self.objectsInEditMode = ko.observableArray([]);

                self.saving = ko.observable(false);

                self.save =  function() {

                    console.dir("Saving changes: " + arguments);
                    self.saving(true);
                    var source = ko.utils.unwrapObservable(self.source);
                    console.log("Items in tracker:" + source.entityContext.stateManager.trackedEntities.length);
                    ccc = source.entityContext;
                    for(var i = 0; i < self.objectsToDelete().length; i++) {
                        console.log("items found");
                        var item = self.objectsToDelete()[i];
                        source.remove(item);
                    }
                    function doSave() {
                        source.entityContext.saveChanges( function() {
                            console.log("Items in tracker #2:" + source.entityContext.stateManager.trackedEntities.length);
                            if (self.objectsToDelete().length > 0) {
                                self.refresh(Math.random());
                            }
                            self.objectsToDelete.removeAll();
                            self.objectsInEditMode.removeAll();
                            self.saving(false);

                        }).fail( function() { console.dir(arguments); })
                    }

                    if (self.beforeSave) {
                        var r = self.beforeSave(source);
                        if (typeof r === 'function') {
                            r(
                                function() {
                                    doSave();
                                },
                                function() {
                                    console.log("aborted by client code");
                                }
                            )
                        } else {
                            doSave();
                        }

                    } else {
                        doSave();
                    }
                };


                self.showNewCommand = ("showNewCommand" in self) ? self.showNewCommand : ko.observable(true);
                self.showNewCommandTop = ("showNewCommandTop" in self) ? self.showNewCommandTop : ko.observable(true);
                self.showNewCommandBottom = ("showNewCommandBottom" in self) ? self.showNewCommandBottom : ko.observable(true);
                self.showRemoveAllCommand = ("showRemoveAllCommand" in self) ? self.showRemoveAllCommand : ko.observable(true);
                self.showSaveCommand = ("showSaveCommand" in self) ? self.showSaveCommand : ko.observable(false);
                self.showSort = ("showSort" in self) ? self.showSort: ko.observable(true);


                self.pendingChanges = ko.computed( function() {
                    return this.objectsToDelete().length > 0 ||
                        this.objectsInEditMode().length > 0;
                }, this);

                self.pendingStatusInfo = function() {
                    var es = ko.utils.unwrapObservable(self.source);
                    if (!es) { return "-" };
                    return "Number of tracked changes: " + es.entityContext.stateManager.trackedEntities.length;
                }

                self.removeAll = function() {
                    var entitySet = ko.utils.unwrapObservable(self.source);
                    entitySet.removeAll(function () {
                        self.refresh(Math.random());
                    })

                    //var keyname = entitySet.defaultType.memberDefinitions.getKeyProperties()[0].name;
                    //entitySet.map("it." + keyname).toArray(function(ids) {
                    //    ids.forEach( function(id) {
                    //        var obj = { };
                    //        obj[keyname] = id;
                    //        entitySet.remove(obj);
                    //    });
                    //    entitySet.entityContext.saveChanges( function() {
                    //        self.refresh(Math.random());
                    //    })
                    //});
                    //alert("it." + );
                };

                self.addNew = function() {
                    var es = ko.utils.unwrapObservable(self.source);
                    var o = new es.createNew();
                    o = o.asKoObservable();
                    var idx = self.items().length;


                    self.extendItem(o);

                    var v = ko.utils.unwrapObservable(self.discriminatorValue),
                        f = ko.utils.unwrapObservable(self.discriminatorColumn);
                    if (v && f) {
                        console.log(f + ":" + v);
                        o[f](v);
                    }
                    if (self.defaultValues) {
                        for(var m in self.defaultValues) {
                            console.log("setting default: " + m +" " + self.defaultValues[m]);
                            o[m](ko.utils.unwrapObservable(self.defaultValues[m]));
                        }
                    }
                    self.objectsInEditMode.push(o);
                    ko.utils.unwrapObservable(source).add(o);

                    if (self.afterAddNew) {
                        var r = self.afterAddNew( o, self );
                        if (typeof r === 'function') {
                            r(function(ok) {
                               ok(self.items.push(o));
                            });
                        } else {
                            self.items.push(o);
                        }
                    } else {
                        self.items.push(o);

                    }


                };



                var itemCommands = [
                    {
                        displayName: 'Edit',
                        commandName: 'edit',

                        visible: function( item ) {
                            return self.objectsInEditMode.indexOf(item) < 0;
                        },

                        execute: function( item ) {
                            var es = ko.utils.unwrapObservable(self.source);
                            es.attach(item);
                            self.objectsInEditMode.push(item);
                        }
                    },
                    {
                        displayName: 'Revert',
                        commandName: 'revert',

                        visible: function( item ) {
                            return self.objectsInEditMode.indexOf(item) > -1;
                        },

                        execute: function( item ) {
                            var es = ko.utils.unwrapObservable(self.source);
                            es.detach(item);
                            self.objectsInEditMode.remove(item);
                        }
                    },
                    {
                        displayName: 'Delete',
                        commandName : 'delete',

                        execute: function( item ) {
                            self.objectsToDelete.push(item);
                        },

                        visible: function( item ) {
                            return self.objectsToDelete.indexOf(item) < 0;
                        }


                    },
                    {
                        displayName: 'Undo delete',
                        commandName : 'undelete',

                        execute: function( item ) {
                            self.objectsToDelete.remove(item);
                        },

                        visible: function( item ) {
                            return self.objectsToDelete.indexOf(item) > -1;
                        }


                    }
                ].concat(viewModel.itemCommands || []);


                var cols = [];
                var sortColName = '';

                var srcval = ko.utils.unwrapObservable(self.source);
                if ( srcval !== undefined && srcval !== null)
                {
                    cols = getColumnsMetadata(srcval, fields, itemCommands);
                    sortColName = cols[0].name;
                };

                self.columns = ko.observableArray(cols);

                //a micro viewmodel for the cells, all necessary data collected
                function getKoItemColumns(rowIndex) {
                    var self2 = this;
                    var result = [];
                    for (var i = 0; i < self.columns().length; i++) {
                        var col = {
                            rowIndex: rowIndex,
                            columnIndex: i,
                            value: this[self.columns()[i].name],
                            name: self.columns()[i].name,
                            metadata: self.columns()[i],
                            owner: this,
                            itemCommands: itemCommands
                        }
                        col.showControls = (function(i, col) { 
                            return function (template, viewModelType, viewModelData) {
                                self2.showControlBox(i, col, template, viewModelType, viewModelData);
                            }})(i, col)

                        result.push(col);
                    }
                    
                    return result;
                }

                self.extendItem = function (koItem) {
                    
                    koItem.getColumns = getKoItemColumns;
                    var koCells = ko.observableArray([]);
                    koItem.getControlCells = koCells;
                    koItem.showControlBox = function (index, data, template, viewModelType, viewModelData) {
                        koCells.removeAll();
                        console.log("showControlBox");
                        viewModelData.closeControlBox = function () {
                            koCells.removeAll();
                        };
                        var vm = new viewModelType(viewModelData);
                        var colcount = self.columns().length;
                        for (var i = 0; i < colcount; i++) {
                            var item = { index : i, asked: index };
                            item.colspan = 1;
                            item.templateName = undefined;
                            item.viewModel = {};
                            item.data = {};
                            if (index == i) {
                                item.colspan = 2;
                                item.templateName = template;
                                item.data = data;
                                item.viewModel = vm;
                                i++;
                            }
                            koCells.push(item);
                        }
                        console.log(koCells().length);
                        
                    }

                    if (self.itemExtender) {
                        self.itemExtender( koItem );
                    }
                }

                self.sortColumn = ko.observable(sortColName);
                self.sortDirection = ko.observable(true);


                self.defaultValues = viewModel.defaultValues;

                self.columnNames = ko.computed( function() {
                    return this.columns().map( function(memDef) { return memDef.name });
                }, this);

                self.selectedItem = ko.observable();

                self.pages = ko.computed( function() {
                    return ko.utils.range(0, this.itemCount() / this.pageSize());
                }, this);

                self.goToNextPage = function() {
                    self.currentPage( self.currentPage() + 1);
                };

                self.goToPreviousPage = function() {
                    self.currentPage( self.currentPage() - 1);
                }

                //console.log("model builder:" + viewModel.discriminatorColumn);
                self.discriminatorColumn = viewModel.discriminatorColumn; // || ko.observable();
                self.discriminatorValue = viewModel.discriminatorValue; //|| ko.observable();

                self.refresh = viewModel.refresher || ko.observable();

                //self.filter = ko.isObservable(viewModel.filter) ? viewModel.filter : ko.observable(viewModel.filter);
                


                self.itemsTrigger = ko.computed({
                    disposeWhenNodeIsRemoved: container,

                    read: function () {
                        if (ko.utils.unwrapObservable(this.source) == null) {
                            return;
                        }
                        var q = this.source();

                        var ref = this.refresh();
                        var column = ko.utils.unwrapObservable(this.discriminatorColumn);
                        var value = ko.utils.unwrapObservable(this.discriminatorValue);

                        if (column && !(value) ) {
                            return;
                        }

                        if (value  && column) {
                            q = q.filter("it." + column + " == '" + value + "'");
                        }

                        //var sortColumn = this.sortColumn();

                        //if (!q.defaultType.memberDefinitions["$" + sortColumn]) {
                        //    sortColumn = '';
                        //}
                        //q.length(function (x) {
                        //    self.itemCount(x);
                        //});

                        if (self.filter) {
                            q = q.filter(ko.utils.unwrapObservable(self.filter));
                        };
                        q = //q.order(sortColumn)
                            q
                            .skip(this.pageSize() * this.currentPage())
                            .take(this.pageSize());

                            q.toArray(
                            function (entities) {
                                $data.trace(1, "JayGrid data received:", entities);
                                self.items.removeAll();
                                for(var i = 0; i < entities.length; i++) {
                                    var item = entities[i];
                                    var koItem = item.asKoObservable();
                                    self.extendItem(koItem);
                                    self.items.push( koItem );
                                }
                                $data.trace(1, "JayGrid data pushed to grid:", self.items());

                            }
                        );
                    }
                }
                , this);



                self.getTemplate =  function(propertyOwner, metadata) {
                    var nameSuffix = '';

                    if (! (metadata.resolvedName && metadata.stringName)) {
                        metadata.stringName = Container.getName(metadata.type);
                        metadata.resolvedName = Container.resolveName(metadata.type);
                    };

                    if (self.objectsInEditMode.indexOf(propertyOwner) > -1 && metadata['$editable'] !== false) {
                        var templateId;
                        var result = element.nameTemplates[metadata.name + "-editor"] ||
                            element.typeTemplates[metadata.stringName + "-editor"] ||
                            element.typeTemplates[metadata.resolvedName + "-editor"] ||
                            (metadata['$sourceTable']  ? 'jay-data-grid-bound-field-editor' :
                                    (document.getElementById('jay-data-grid-' + metadata.resolvedName + '-editor') ?
                                            'jay-data-grid-' + metadata.resolvedName + '-editor' :
                                            'jay-data-grid-generic-editor'));
                        return result;
                        //nameSuffix = '-editor';
                    } else {

                    };



                    var named = metadata.name + '-display';
                    var f = element.nameTemplates[named] || 'xxx';

                    var result = element.nameTemplates[metadata.name + '-display'] ||
                                 element.typeTemplates[metadata.stringName + '-display'] ||
                                 element.typeTemplates[metadata.resolvedName + '-display'] ||
                                 (metadata['$sourceTable']  ? 'jay-data-grid-bound-field-display' :
                                 (document.getElementById('jay-data-grid-' + metadata.resolvedName + '-display') ?
                                'jay-data-grid-' + metadata.resolvedName + '-display' : 'jay-data-grid-generic-display'));

                    return result;

                }



            }


            var receiveEvents = viewModel.receiveEvents !== false;


            while(element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            var gridTemplateName = allBindings.gridTemplate || "jay-data-grid";

            var container = element.appendChild( document.createElement("div"));

            ko.renderTemplate(  gridTemplateName,
                                new _model(container),
                                {templateEngine: templateEngine},
                                container,
                                "replaceNode");



            //source.take(200).toArray(model.items);
        }

    }

})($data);
