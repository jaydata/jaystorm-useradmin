$data.JayStormUI.AdminModel.extend("$data.JayStormClient.ServiceManager", {

    constructor: function( apiContextFactory )
     {

         var self = this;
         self.allDatabases = ko.observableArray([]);
        apiContextFactory().Databases.toArray(self.allDatabases);

        self.selectedService = ko.observable();

        self.selectService = function(item) {

            self.selectedService(item);
            self.checkBoxStates.removeAll();

        }
     }
});
