$data.JayStormUI.AdminModel.extend("$data.JayStormClient.UserManager", {

    constructor: function () {
        console.log("UserManager context:" + this.getType().fullName + " starting");
        var self = this;

        self.Users = ko.observable();
        self.Groups = ko.observable();

        self.allGroups = ko.observableArray([]);

        self.allGroups.subscribe = function () {
            console.log("allGroups changed");
        }


        //override base show
        self.show = function () {
            self.context(self.createContext());
            self.Users(self.createContext().Users);
            self.Groups(self.createContext().Groups);
            self.visible(true);
        };

        self.hide = function () {
            self.visible(false);
            self.Users(null);
            self.Groups(null);
        }

        self.extendUserItem = function (koItem) {
            console.log("extend user item");

            var itemGroups = koItem.Groups() || [];
             
            koItem.memberGroups =  ko.observableArray([]);
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
