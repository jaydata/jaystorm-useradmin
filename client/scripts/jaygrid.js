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


    templateEngine.addTemplate("jay-data-grid-header-cell", "<td data-bind='text: name'></td>");


    templateEngine.addTemplate("jay-data-grid-head", "<thead class='jay-data-grid-columns'>\
                                                            <tr class='jay-data-grid-columns-row' \
                                                            data-bind=\"template: { name: 'jay-data-grid-header-cell', foreach: columns}\"\
                                                            </tr>\
                                                         </thead>");

    templateEngine.addTemplate("jay-data-grid-row", "<tr  data-bind='foreach: $parent.columns'>\
                                                        <td data-bind='text: $parent[name]'></td>\
                                                    </tr>");

    templateEngine.addTemplate("jay-data-grid-body", "<tbody data-bind=\"template: {name: 'jay-data-grid-row', foreach: items}\">\
                                                     </tbody>");

    templateEngine.addTemplate("jay-data-grid", "<table class='jay-data-grid' border='1'> \
                                                    <!-- ko template: { name: 'jay-data-grid-head' } --> \
                                                    <!-- /ko -->\
                                                    <!-- ko template: { name: 'jay-data-grid-body' } --> \
                                                    <!-- /ko -->\
                                                </table>");

//    templateEngine.addTemplate("jay-data-grid", "<table class='jay-data-grid' border='1'> \
//                                                    <!-- ko template: { name: 'jay-data-grid-columns' } --> \
//                                                    <!-- /ko -->\
//                                                 </table>");

//    <thead>\
//        <tr><th>A</th><th>B</th></tr>\
//    </thead>\

    function getColumnsMetadata(source, fields, showItemControls) {
        var entityType = null;

        if (source instanceof $data.EntitySet) {
            entityType = source.elementType;
        } else if (source instanceof $data.Queryable ) {
            entityType = source._defaultType;
        }
        var props = entityType.memberDefinitions.getPublicMappedProperties();
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

//        if (showItemControls) {
//            var meta = {
//                isVirtual : true,
//                name: 'controls',
//                type: 'itemControls'
//            };
//            props.push(meta);
//        }

        return props;
    };

    ko.bindingHandlers.jayGrid = {

        init: function() {
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


            fields = viewModel.fields || [];


            var model = {
                columns: getColumnsMetadata(source, fields, {}),
                items: ko.observableArray([]),
                selectedItem: ko.observable()
            }

            var receiveEvents = viewModel.receiveEvents !== false;

            if (source instanceof $data.EntitySet && receiveEvents) {
                source.entityContext.addEventListener("added", function(sender, itemInfo) {
                    if (itemInfo.data instanceof source.createNew) {
                        model.items.push( itemInfo.data.asKoObservable());
                    }
                });
                source.entityContext.addEventListener("deleted", function(sender, itemInfo) {
                    if (itemInfo.data instanceof source.createNew) {
                        model.items.remove( function(item) {
                            return item.innerInstance.equals(itemInfo.data);
                        });
                    }
                })

            }


            while(element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            var gridTemplateName = allBindings.gridTemplate || "jay-data-grid";

            var container = element.appendChild( document.createElement("div"));

            ko.renderTemplate(  gridTemplateName,
                                model,
                                {templateEngine: templateEngine},
                                container,
                                "replaceNode");

            source.toArray(model.items);
        }

    }

})();