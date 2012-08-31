$data.JayStormUI.AdminModel.extend("$data.JayStormClient.ServiceManager", {

    constructor: function( apiContextFactory )
     {

         var self = this;
         self.allDatabases = ko.observableArray([]);
        apiContextFactory().Databases.toArray(self.allDatabases);
        
        self.allServices = ko.observableArray([]);
        apiContextFactory().Services.toArray(self.allServices);
        
        self.allServices.subscribe(function(value){
            console.log(value);
        });

        self.selectedService = ko.observable();

        self.selectService = function(item) {

            self.selectedService(item);
            //self.checkBoxStates.removeAll();

        };
        
        self.codeHighlight = function(el, value){
            new $data.JayStormUI.CodeHighlight(el, value);
        };
        
        self.editingSource = ko.observable(false);
        self.currentService = ko.observable();
        
        self.editSource = function(owner, value){
            self.currentService(owner);
            self.editingSource(true);
            setTimeout(function(){
                if (!value()) value('$data.ServiceBase.extend("' + self.currentService().Name() + '", {\n    \n});\n\n' + self.currentService().Name() + '.annotateFromVSDoc();');
                new $data.JayStormUI.CodeMirror('service-codemirror', value);
            }, 1);
        };
        
        self.serviceSourceTypes = ko.observableArray([{
            name: 'Git URL',
            type: 'git'
        }, {
            name: 'Script source',
            type: 'script'
        }]);
     }
});
