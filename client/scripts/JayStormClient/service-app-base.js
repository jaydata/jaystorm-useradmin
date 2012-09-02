/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/29/12
 * Time: 11:37 PM
 * To change this template use File | Settings | File Templates.
 */
$data.Base.extend("$data.JayStormUI.AdminModel",  {
    constructor: function (application) {

        var apiContextFactory = application.currentAppDBContextFactory;


        console.log("admin context:" + this.getType().fullName + " starting");
        var self = this;

        self.application = application;

        self.context = ko.observable();

        if (apiContextFactory()) {
            self.context(apiContextFactory()());
        }

        self.contextFactory = apiContextFactory;

        self.contextFactory.subscribe(function (value) {
            self.context(value());
        });

        self.createContext = function () {
            if (self.contextFactory()) {
                return self.contextFactory()();
            }
            return null;
        }


        //var factory = apiContextFactory ;

        self.show = function () {
            if (self.contextFactory()) {
                self.context( self.createContext() );
            }
            self.visible(true);
        };

        self.hide = function () {
            self.visible(false);
            self.context ( null );
        }

        self.context = ko.observable();
        self.visible = ko.observable(false);
    }
})