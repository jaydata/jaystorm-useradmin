/**
 * Created with JetBrains WebStorm.
 * User: peterzentai
 * Date: 8/16/12
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */
(function() {
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function(templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    //todo displayName


    templateEngine.addTemplate("jay-data-grid-Edm.String-editor", "<input  \
                                                                   data-bind='value: $parent[name], attr: { required: $data[\"required\"] }, css: { verror: $parent.ValidationErrors }' />");


    templateEngine.addTemplate("jay-data-grid-Edm.Int32-editor", "<input  type='range' min=1 max=10 \
                                                                   data-bind='value: $parent[name], attr: { required: $data[\"required\"] }, css: { verror: $parent.ValidationErrors }' />");

    templateEngine.addTemplate("jay-data-grid-Edm.String-editor", "<input  patten: \"asd\" \
                                                                   data-bind='value: $parent[name], attr: { required: $data[\"required\"] }, css: { verror: $parent.ValidationErrors }' />");

    templateEngine.addTemplate("jay-data-grid-header-cell", "<td data-bind='text: name'></td>");

    templateEngine.addTemplate("jay-data-grid-control-cell", "<td>\
                                                                <div  data-bind='foreach: data'>\
                                                                    <span data-bind='with: $parents[1]'>\
                                                                        <a href='#' data-bind='click: $parent.execute, text: $parent.displayName || \"command\"'></a> \
                                                                    </span>\
                                                                </div>\
                                                              </td>");

    templateEngine.addTemplate("jay-data-text-cell", "<span data-bind='text: $parent[name]'></span>");

    templateEngine.addTemplate("jay-data-grid-data-cell", "<td data-bind='template: $root.getTemplate($parent,$data)'></td>");

//    templateEngine.addTemplate("jay-data-grid-data-cell", "<td>text</td>");

    templateEngine.addTemplate("jay-data-grid-head", "<thead class='jay-data-grid-columns'>\
                                                            <tr class='jay-data-grid-columns-row' \
                                                            data-bind=\"template: { name: 'jay-data-grid-header-cell', foreach: columns}\"\
                                                            </tr>\
                                                         </thead>");

//    <td data-bind='text: $parent[name]'></td>\
//                                                        <td data-bind='if: isVirtual === \"true\"'></td>  \
    templateEngine.addTemplate("jay-data-grid-row", "<tr  data-bind='foreach: $parent.columns'>\
                                                            <!-- ko template: { name: ($data[\"isVirtual\"] ? 'jay-data-grid-control-cell' : 'jay-data-grid-data-cell') } -->\
                                                            <!-- /ko -->\
                                                        </tr>");

    templateEngine.addTemplate("jay-data-grid-body", "<tbody data-bind=\"template: {name: 'jay-data-grid-row', foreach: items}\">\
                                                     </tbody>");

//    templateEngine.addTemplate("jay-data-grid-body", "<tbody>\
//                                                            <tr><td data-bind='foreach: items()'>!!!!</td></tr>\
//                                                     </tbody>");

    templateEngine.addTemplate("jay-data-grid", "<form data-bind='submit:save'><table data-bind='visible: source' class='jay-data-grid' border='1'> \
                                                    <thead>\
                                                    <td data-bind='attr: {colspan: columns().length}'>\
                                                        <a href='#' data-bind='click: addNew, text: \"New \" '/> \
                                                        <a href='#' data-bind='click: save'>Save</a>\
                                                        Sort: <select data-bind='options: columns, optionsValue: \"name\", optionsText: \"name\", value: sortColumn'></select>\
                                                    </td>\
                                                    </thead>\
                                                    <!-- ko template: { name: 'jay-data-grid-head' } --> \
                                                    <!-- /ko -->\
                                                    <!-- ko template: { name: 'jay-data-grid-body' } --> \
                                                    <!-- /ko -->\
                                                    <tbody>\
                                                    <td data-bind='attr: {colspan: columns().length}'>\
                                                        <a href='#' data-bind='click: addNew, text: \"New \" '/> \
                                                        <input type='submit' value='Save' />\
                                                        <select data-bind='options: ko.utils.range(1,50), value: pageSize, visible: pageSize() > 0'></select>\
                                                        <a hef='#' data-bind='click:goToPreviousPage'> < </a>\
                                                        <select data-bind='options: pages, value: currentPage'></select>\
                                                        <a hef='#' data-bind='click:goToNextPage'> > </a>\
                                                    </td>\
                                                    </tbody>\
                                                </table></form>");


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
            for(var i = 0; i < fields.length; i++) {
                var propname = fields[i].name || fields[i];
                var prop = null;
                j = 0;
                while(!prop && j < props.length) {
                    if (props[j].name === propname) {
                        prop = props[j];
                    }
                    j++;
                }
                if (prop) {
                    res.push(prop);
                }
            }
            props = res;
        }
        props.push( {
            name: 'ValidationErrors',
            type: 'Array'
        });
        props.push( {
            name: 'entityState',
            type: 'int'
        });
        if (itemCommands.length > 0) {
            var meta = {
                isVirtual : true,
                name: 'controls',
                type: 'itemCommands',
                data: itemCommands
            };
            props.push(meta);
        }

        return props;
    };

    ko.bindingHandlers.jayGrid = {

        init: function() {
            this.finishInit = false;
            return { 'controlsDescendantBindings': true };

        },

        update: function(element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            var source = null, fields = [];


            if (viewModel instanceof $data.EntitySet || viewModel instanceof $data.Queryable) {
                source = viewModel;
            } else {
                source = viewModel.source;
            };

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
                            var rndId = Math.random().toString().replace(".","").replace(",","");
                            child.setAttribute("id", rndId);
                            element.typeTemplates[tmpName] = rndId;
                            document.body.appendChild(child);
                            console.log("template registered:" + tmpName );
                        }
                    }
                }
            }


            fields = viewModel.fields || [];

            var itemCommands = viewModel.itemCommands || [];


            function _model() {
                console.log("Grid model created");
                var self = this;

                self.pageSize = ko.isObservable(viewModel.pageSize) ? viewModel.pageSize : ko.observable(viewModel.pageSize || 10);

                self.itemCount = ko.observable(100);

                self.currentPage = ko.observable(0);

                self.source = source;

                self.source.subscribe( function(){
                    self.sortColumn('');
                }, 'beforeChange');


                var cols = getColumnsMetadata(source, fields, itemCommands);
                this.cols = cols;

                self.columns = ko.observableArray(cols);
                self.sortColumn = ko.observable(cols[0].name);

                self.sortDirection = ko.observable(true);


                self.save =  function() {
                  ko.utils.unwrapObservable(source).entityContext.saveChanges( function() {
                      console.log("saved");
                      self.objectsInEditMode.removeAll()
                  })
                };

                self.objectsInEditMode = ko.observableArray([]);

                self.addNew = function() {
                    var es = new ko.utils.unwrapObservable(self.source);
                    var o = new es.createNew();

                    //console.dir(o);
                    o = o.asKoObservable();
                    self.objectsInEditMode.push(o);
                    ko.utils.unwrapObservable(source).add(o);
                    self.items.push(o);
                };

                self.columnNames = ko.computed( function() {
                    return this.columns().map( function(memDef) { return memDef.name });
                }, this);

                self.selectedItem = ko.observable();

                self.items =  ko.observableArray([]);
//            if (source instanceof $data.EntitySet && receiveEvents) {
//                source.entityContext.addEventListener("added", function(sender, itemInfo) {
//                    if (itemInfo.data instanceof source.createNew) {
//                        model.items.push( itemInfo.data.asKoObservable());
//                    }
//                });
//                source.entityContext.addEventListener("deleted", function(sender, itemInfo) {
//                    if (itemInfo.data instanceof source.createNew) {
//                        model.items.remove( function(item) {
//                            return item.innerInstance.equals(itemInfo.data);
//                        });
//                    }
//                })
//            }
                self.pages = ko.computed( function() {
                    return ko.utils.range(0, this.itemCount() / this.pageSize());
                }, this);

                self.goToNextPage = function() {
                    self.currentPage( self.currentPage() + 1);
                };

                self.goToPreviousPage = function() {
                    self.currentPage( self.currentPage() - 1);
                }

                self.itemsTrigger = ko.computed( function(){
                    if (ko.utils.unwrapObservable(this.source) == null) {
                        return;
                    }
                    return this.source()
                        .order(this.sortColumn())
                        .skip(this.pageSize() * this.currentPage())
                        .take(this.pageSize())
                        .toArray(self.items);
                }, this);



                self.getTemplate =  function(propertyOwner, metadata) {
                    var nameSuffix = '';
                    if (self.objectsInEditMode.indexOf(propertyOwner) > -1) {
                        return 'jay-data-grid-Edm.String-editor';
                        //nameSuffix = '-editor';
                    } else {

                    };

                    if (! (metadata.resolvedName && metadata.stringName)) {
                        metadata.stringName = Container.getName(metadata.type);
                        metadata.resolvedName = Container.resolveName(metadata.type);
                    };

                    if (metadata.stringName in element.typeTemplates) {
                        return element.typeTemplates[metadata.stringName];
                    }
                    //console.dir(arguments);
                    return 'jay-data-text-cell';
                }
            }


            var receiveEvents = viewModel.receiveEvents !== false;

//            if (source instanceof $data.EntitySet && receiveEvents) {
//                source.entityContext.addEventListener("added", function(sender, itemInfo) {
//                    if (itemInfo.data instanceof source.createNew) {
//                        model.items.push( itemInfo.data.asKoObservable());
//                    }
//                });
//                source.entityContext.addEventListener("deleted", function(sender, itemInfo) {
//                    if (itemInfo.data instanceof source.createNew) {
//                        model.items.remove( function(item) {
//                            return item.innerInstance.equals(itemInfo.data);
//                        });
//                    }
//                })
//            }
//


            while(element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            var gridTemplateName = allBindings.gridTemplate || "jay-data-grid";

            var container = element.appendChild( document.createElement("div"));

            ko.renderTemplate(  gridTemplateName,
                                new _model(),
                                {templateEngine: templateEngine},
                                container,
                                "replaceNode");



            //source.take(200).toArray(model.items);
        }

    }

})();