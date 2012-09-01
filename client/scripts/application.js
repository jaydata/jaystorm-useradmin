$(function() {

    $data.service('/db',
        function (factory, type) {


        var context = factory();

        var modules = [
            { type: $data.JayStormClient.UserManager, ui: "UserManagerUI", title: 'Manage Users', path:'/Users' },
            { type: $data.JayStormClient.ServiceManager, ui: "ServiceManagerUI", title: 'Service Manager', path:'/Services' },
            //{ type:$data.JayStormClient.DataManager, ui: "DataManagerUI", title:'Manage Data', path:'/Databases' },
            { type:$data.JayStormClient.SchemaManager, ui: "SchemaManagerUI", title:'Manage Schema', path:'/Schema' },
            { type:$data.JayStormClient.SecurityManager, ui: "SecurityManagerUI",title:'Manage Security', path:'/Security' },
            { type:$data.JayStormClient.AccessManager, ui: "AccessManagerUI", title:'Manage Access', path:'/Access' }];


        modules.forEach(function(module) {
            ko.applyBindings(module.Model = new module.type( factory ), document.getElementById(module.ui));
        })

        function MenuModel(items) {
            var self = this;
            self.items = items;
            self.show = function(item) {
                self.items.forEach( function(item) {
                    item.Model.hide();
                });

                item.Model.show();
            }
        };



        ko.applyBindings(new MenuModel(modules), document.getElementById("MenuUI"));
    } );
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

