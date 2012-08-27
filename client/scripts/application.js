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




$data.Entity.extend("$my.CommonBase", {
    someFunkyState: {
        type: 'string',
        set: function(value) {

            this._z = value;
        },
        get: function() {

            return this._z;
        }
    }
});

$(function() {


    $data.service('/db',
        function (factory, type) {


        var context = factory();

        var svcMan = new ServiceManagerModel(factory);
        ko.applyBindings(svcMan, document.getElementById("ServiceManagerUI"));

        var databaseManagerModel = new DataManagerModel(factory);
        var schemaManagerModel = new SchemaManagerModel(factory);

        ko.applyBindings(databaseManagerModel, document.getElementById("DataManagerUI"));
        ko.applyBindings(schemaManagerModel, document.getElementById("SchemaManagerUI"));

        function MenuModel(items) {
            var self = this;
            self.items = items;
            self.show = function(item) {

                self.items.forEach( function(item) {
                    item.Model.hide();
                });

                item.Model.show();
            }
        }

        var secMan = new SecurityManager( factory );
        ko.applyBindings(secMan, document.getElementById("SecurityManagerUI"));

        var items = [];
        var sections = [
            { Title: 'Manage data', Model: databaseManagerModel },
            { Title: 'Manage Schema', Model: schemaManagerModel },
            { Title: 'Manage Services', Model: svcMan },
            { Title: 'Manage Security', Model: secMan }
        ];

        ko.applyBindings(new MenuModel(sections), document.getElementById("MenuUI"));
    } );
});
