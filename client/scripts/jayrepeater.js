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
    templateEngine.addTemplate("Edm.String-editor", '<input data-bind="value: value" />');
    templateEngine.addTemplate("Edm.Boolean-editor", '<input type="checkbox" data-bind="checked: value" />');
    templateEngine.addTemplate("Edm.DateTime-editor", '<input type="datetime" data-bind="value: value" />');


    templateEngine.addTemplate("jay-property-editor",
        "<form>\
            !!!<fieldset data-bind='with: $data'>\
                <div data-bind='foreach: getProperties()'>\
                    <div class='input-unit'>\
                        <div data-bind='text: name'></div>\
                        <div data-bind='template: { name: type + \'-editor\' }></div>\
                    </div>\
                </div>\
                <input type='submit' value='Save'/>\
                <input type='button' value='Cancel' />\
            </fieldset>\
         </form>");



    ko.bindingHandlers.jayPropertyEditor = {

        init: function() {
            return { 'controlsDescendantBindings': true };
        },

        update: function(element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();
            while(element.firstChild) {
                ko.removeNode(element.firstChild);
            };

            var controlTemplate = allBindings.gridTemplate || "jay-property-editor";
            var container = element.appendChild( document.createElement("div"));

            ko.renderTemplate(  controlTemplate,
                                viewModel,
                                {templateEngine: templateEngine},
                                container,
                                "replaceNode");

//            var source = null, fields = [];
//
//
//            if (viewModel instanceof $data.EntitySet || viewModel instanceof $data.Queryable) {
//                source = viewModel;
//            } else {
//                source = viewModel.source;
//            };
//
//
//            fields = viewModel.fields || [];
//
//
//            var model = {
//                columns: getColumnsMetadata(source, fields, {}),
//                items: ko.observableArray([]),
//                selectedItem: ko.observable()
//            }
//
//            var receiveEvents = viewModel.receiveEvents !== false;
//
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
//
//            }
//
//

//
//            var gridTemplateName = allBindings.gridTemplate || "jay-data-grid";
//
//            var container = element.appendChild( document.createElement("div"));
//
//            ko.renderTemplate(  gridTemplateName,
//                                model,
//                                {templateEngine: templateEngine},
//                                container,
//                                "replaceNode");
//
//            source.toArray(model.items);
        }

    }

})();