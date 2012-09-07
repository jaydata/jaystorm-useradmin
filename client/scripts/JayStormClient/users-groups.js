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


        function initState(cf) {
            var cntx = cf();
            self.Users(cf().Users);
            self.Groups(cf().Groups);
            self.context(cf());
        }

        self.contextFactory.subscribe(function (value) {
            if (value) {
                initState(value);
            }
        });

        if (self.contextFactory()) {
            initState(self.contextFactory());
        }
        //override base show
        self.show = function () {
            //self.context(self.createContext());
            //self.Users(self.createContext().Users);
            //self.Groups(self.createContext().Groups);
            self.visible(true);
        };

        self.hide = function () {
            self.visible(false);
            //self.Users(null);
            //self.Groups(null);
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

        }


        self.stress = function () {
            var c = self.createContext();
            for (var i = 0; i < 1000; i++) {
                c.Users.add({ Login: "User" + i.toString() });
            }
            c.saveChanges(function () {
                console.log("done");
            });
        }
        self.addUserToGroup = function (user, group) {
            var g = user.Groups() || [];
            g.push(group.GroupID());
            user.Groups(g);
            console.log(user.Groups().length);
        }


    }
});
