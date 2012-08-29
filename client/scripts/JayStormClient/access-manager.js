function AccessManager(contextFactory) {

    var self = this;

    var factory = contextFactory;


    self.show = function() {
        self.context( factory() );
    };

    self.hide = function () {
        self.context(null);
    };

    self.context = ko.observable();



}