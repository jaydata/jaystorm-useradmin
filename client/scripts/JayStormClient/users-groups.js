$data.JayStormUI.AdminModel.extend("$data.JayStormClient.UserManager", {

    constructor: function (apiContextFactory) {
        var self = this;

        self.Users = ko.observable();
        self.Groups = ko.observable();

        self.context(apiContextFactory());

        self.allGroups = ko.observableArray([]);

        self.allGroups.subscribe = function () {
            console.log("allGroups changed");
        }

        self.show = function () {
            self.visible(true);
            self.Users(apiContextFactory().Users);
            self.Groups(apiContextFactory().Groups);
        };

        self.hide = function () {
            self.visible(false);
            self.Users(null);
            self.Groups(null);
        }

        self.extendUserItem = function (koItem) {
            console.log("extend user item");

            var itemGroups = koItem.Groups() || [];
             
            koItem.memberGroups = function () {
                return ko.observableArray([]);
            };

            koItem.nonmemberGroups = ko.observableArray([]);

            self.allGroups().forEach(function (group) {
                var gid = group.GroupID();
                var groupCollection = (itemGroups.indexOf(gid) > -1) ? koItem.memberGroups : koItem.nonmemberGroups;
                groupCollection.push(group);
            });

            //koItem.addToGroup = function (g) {

            //}
        }

        self.addUserToGroup = function (user, group) {
            var g = user.Groups() || [];
            g.push(group.GroupID());
            user.Groups(g);
            console.log(user.Groups().length);
        }


    }
});
