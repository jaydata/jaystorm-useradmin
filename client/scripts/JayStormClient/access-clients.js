$data.JayStormUI.AdminModel.extend("$data.JayStormClient.AccessClients", {
    constructor: function () {
        var self = this;

        self.services = ko.observableArray([]);
        self.clickDb = function(){
            setTimeout(function(){ (document.querySelector('#AccessClientsUI .nav.nav-tabs li a:not([data-servicename="ApplicationDB"])') || { click: function(){} }).click(); }, 0);
        };
        
        self.visible.subscribe(function(value){
            if (value && self.services().length){
                self.clickDb();
            }
        });
        
        self.data = ko.observable();
        self.embedTemplates = ko.observableArray([]);
        
        self.currentService = ko.observable();
        self.currentService.subscribe(function(value){
            self.data.owner = value;
            //setTimeout(function(){
                EmbedServiceModel.call(self, {
                    service: value,
                    factory: self.contextFactory
                });
                /*if (!self.model){
                    ko.applyBindings(self.model = new EmbedServiceModel({
                        service: value,
                        factory: self.contextFactory
                    }), document.querySelector('#AccessClientsUI #embed'));
                }else{
                    self.model.data = value;
                }*/
            //}, 0);
        });
        
        self.context.subscribe(function (value) {
            if (value) {
                value.Services.toArray(self.services).then(function(value){
                    self.clickDb();
                });
            } else {
                self.services.removeAll();
            }
        });

        /*self.show = function () {
            self.visible(true);

            var appid = self.application.currentApplication().appid;
        };

        self.hide = function () {
            self.visible(false);
        }*/
    }
});
