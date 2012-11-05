$data.JayStormUI.AdminModel.extend("$data.JayStormClient.AccessManager", {

    constructor:function () {
        var self = this;

        self.beforeSave = function (es) {
            var tracked = es.entityContext.stateManager.trackedEntities;
            for (var i = 0; i < tracked.length; i++) {
                var item = tracked[i];
                if (item.entitySet === es) {
                    item.data.HasChanges = true;
                }
            }
        }
    }




});
