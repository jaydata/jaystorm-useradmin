$data.JayStormUI.AdminModel.extend("$data.JayStormClient.ServiceManager", {

    constructor: function()
     {

         var self = this;
         self.allDatabases = ko.observableArray([]);
         self.allServices = ko.observableArray([]);

         
         //apiContextFactory().Databases.toArray(self.allDatabases);
        
         function initState(cf) {
             var cntx = cf();
             cntx.Databases.toArray(self.allDatabases);
             cntx.Services.toArray(self.allServices);
             self.context(cf());
        }

         self.contextFactory.subscribe(function (value) {
             if (value) {
                 initState(value);
             }
         });

         if (self.contextFactory()) {
             initState(self.contextFactory());
        }

        
        
        
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
