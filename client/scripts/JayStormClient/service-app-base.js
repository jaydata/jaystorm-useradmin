/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/29/12
 * Time: 11:37 PM
 * To change this template use File | Settings | File Templates.
 */
$data.Base.extend("$data.JayStormUI.AdminModel",  {
    constructor: function (application) {
        var self = this;
        var apiContextFactory = application.currentAppDBContextFactory;

        self.context = ko.observable();
        self.visible = ko.observable(false);
        
        self.show = function () {
            if (self.onVisible) {
                console.log("executing delayed setContext###");
                self.onVisible();
                self.onVisible = null;
            }
            self.visible(true);
        };

        self.hide = function () {
            self.visible(false);
        }


        console.log("admin context:" + this.getType().fullName + " starting");


        self.application = application;

        self.context = ko.observable();

        if (apiContextFactory()) {
console.log("eary init");
            var setContext = function () {
                self.context(apiContextFactory()());
            };
            if (self.visible()) {
                setContext();
            } else {
                self.onVisible = setContext;
            }
        }

        self.contextFactory = apiContextFactory;

        self.onVisible = null;
        
        self.isfreeapp = ko.observable(false);
        self.contextFactory.subscribe(function(value){
            self.isfreeapp(adminApiClient.currentApplication().isfreeapp);
        });

        self.contextFactory.subscribe(function (value) {
console.log("app-base: context change");
            var contextChanged = function () {
//console.log("constext changed fired:" + this.getType().fullName);
                self.context(value());
            };

            if (self.visible()) {
console.log("immediate fire");
                contextChanged();
            } else {
console.log("stashed for later");
                self.onVisible = contextChanged;
            }

        });

        self.createContext = function () {
            if (self.contextFactory()) {
                return self.contextFactory()();
            }
            return null;
        }
    }
})
