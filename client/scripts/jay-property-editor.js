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
    templateEngine.addTemplate("Edm.DateTime-editor", '<input type="datetime-local" data-bind="value: value" />');
    templateEngine.addTemplate("Array-editor", '<select data-bind="options: value"></select>');


    templateEngine.addTemplate("jay-property-editor",
        "<form data-bind='submit: save'>\
            <fieldset data-bind='with: objectToEdit'>\
                <div data-bind='foreach: getProperties()'>\
                    <div class='input-unit'>\
                        <div data-bind='text: name'></div>\
                        <div data-bind='template: { name: type + \"-editor\"}'></div>\
                    </div>\
                </div>\
            </fieldset>\
            \
                <input type='submit' value='Save'/>\
                <input type='button' value='Cancel' data-bind='click: cancel' />\
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

            var model = {
                save: viewModel.submitCommand().method,

                commands: viewModel.commands,

                objectToEdit : viewModel.objectToEdit,

                cancel: function() { allBindings.visible(false); }
            };

            ko.renderTemplate(  controlTemplate,
                                model,
                                {templateEngine: templateEngine},
                                container,
                                "replaceNode");

        }

    }

})();