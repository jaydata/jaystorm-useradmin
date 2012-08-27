function ServiceManagerModel (contextFactory ) {
    var self = this;

    var factory = contextFactory;
    self.show = function() {
        self.context( factory() );
    };

    self.hide = function() {
        self.context ( null );
    }

    self.context = ko.observable();
    self.visible = ko.observable(false);

    self.allDatabases = ko.observableArray([]);
    contextFactory().Databases.toArray(self.allDatabases);

    self.selectedService = ko.observable();


    self.checkBoxStates = ko.observableArray([]);

    self.check = function() {
        console.log("checking!");
        self.checkBoxStates.push({});
    }

    self.selectService = function(item) {

        self.selectedService(item);
        self.checkBoxStates.removeAll();

        (item.Sets() || []).forEach(function(item) {
            self.checkBoxStates.push(item);
        });
    }
}
