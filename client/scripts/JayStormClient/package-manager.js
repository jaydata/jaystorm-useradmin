$data.JayStormUI.AdminModel.extend("$data.JayStormClient.PackageManager", {
    constructor:function () {
        var self = this;
        
        self.packages = ko.observableArray([]);
        self.notsupported = ko.observable();
         
        //apiContextFactory().Databases.toArray(self.allDatabases);
        
        function initState(cf) {
            var cntx = cf();
            if (cntx.Packages) cntx.Packages.toArray(self.packages);
            else self.notsupported(true);
            self.context(cf());
        }

        self.contextFactory.subscribe(function (value) {
            if (value) {
                initState(value);
            }
        });

        self.show = function () {
            self.visible(true);
            initState(self.contextFactory());
        };
        
        self.visible.subscribe(function(value){
            if (!value){
                self.packages([]);
            }
        });

        if (self.contextFactory()) {
            initState(self.contextFactory());
        }
        
        /*self.beforeSave = function (es) {
            var tracked = es.entityContext.stateManager.trackedEntities;
            for (var i = 0; i < tracked.length; i++) {
                var item = tracked[i];
                if (item.entitySet === es) {
                    item.data.HasChanges = true;
                }
            }
        }*/
    }
});
