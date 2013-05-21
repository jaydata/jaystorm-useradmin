$data.JayStormUI.AdminModel.extend("$data.JayStormClient.AccessClients", {
    constructor: function () {
        var self = this;

        self.services = ko.observableArray([]);
        self.clickDb = function(){
            setTimeout(function(){
                var el = ((adminApiClient.apiAccessTutorial
                    ? document.querySelector('#AccessClientsUI .nav.nav-tabs li a[data-servicename="' + adminApiClient.apiAccessTutorial + '"]')
                    : document.querySelector('#AccessClientsUI .nav.nav-tabs li a:not([data-servicename="ApplicationDB"])')));
                if (el && el.parentNode.className != 'active'){
                    el.click();
                    el.parentNode.className = 'active';
                }
            }, 100);
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
                /*var alreadyVisible = self.visible() || self.services().length === 0;
                value.Services.toArray(self.services).then(function (value){
                    if (!(!alreadyVisible && self.visible())) {
                        self.clickDb();
                    } else {
                        var el = document.querySelector('#AccessClientsUI .nav.nav-tabs li a[data-servicename="' + adminApiClient.apiAccessTutorial || self.currentService().Name() + '"]');
                        if (el) {
                            el.parentNode.className = 'active';
                        }
                    }
                });*/
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
