$(function() {

    //$data.service('/db',
    //function (factory, type) {

        //var context = factory();



    function ClientApplication() {
        var self = this;
        
        self.applications = [{ title: 'App1', url: 'http://jay.local:2001' },
                        { title: 'App2', url: 'http://jay.local:2002' },
                        { title: 'MainApp', url: ' http://jay.local:8181' }];



        self.currentApplication = ko.observable();
        self.currentApplication.subscribe(function (value) {
            $data.service(value.url.trim() + "/ApplicationDB", function (factory) {
                self.currentAppDBContextFactory(factory);
            });
        });

        self.currentAppDBContextFactory = ko.observable();

        var modules = [
            { type: $data.JayStormClient.UserManager, ui: "UserManagerUI", title: 'Manage Users', path: '/Users' },
            { type: $data.JayStormClient.ServiceManager, ui: "ServiceManagerUI", title: 'Service Manager', path: '/Services' },
            { type: $data.JayStormClient.DataManager, ui: "DataManagerUI", title: 'Manage Data', path: '/Databases' },
            { type: $data.JayStormClient.SchemaManager, ui: "SchemaManagerUI", title: 'Manage Schema', path: '/Schema' },
            { type: $data.JayStormClient.SecurityManager, ui: "SecurityManagerUI", title: 'Manage Security', path: '/Security' },
            { type: $data.JayStormClient.AccessManager, ui: "AccessManagerUI", title: 'Manage Access', path: '/Access' }];

        

        modules.forEach(function (module) {
            ko.applyBindings(module.Model = new module.type(self), document.getElementById(module.ui));
        })

        self.menuItems = modules;

        self.show = function (item) {
            self.menuItems.forEach(function (item) {
                item.Model.hide();
            });

            item.Model.show();
        }

    }


    ko.applyBindings(new ClientApplication(), document.getElementById("AppUI"));

});

$data.pushState = function( fn, title, url) {
    $data.navigationStates = $data.navigationStates || [];
    var key = Math.random().toString().replace(".","").replace(",",0);
    $data.navigationStates[key] = fn;
    window.history.pushState( { key: key }, title, url);
};

window.onpopstate = function(data) {
    console.dir(data);
    if (data && data.state && data.state.key) {
        $data.navigationStates[data.state.key]();
    }
};

