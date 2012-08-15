/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/12/12
 * Time: 11:40 PM
 * To change this template use File | Settings | File Templates.
 */
$data.Base.extend("ViewModels.Showable", {
    constructor: function() {
        //var self = this;

        this.visible = ko.observable(false);
    },

    visible: { },

    hide: function() {
        this.visible(false)
    },
    show: function() {
        this.visible(true);
    }
});

$data.Base.extend("ViewModels.EventSource", {
    constructor: function() {
        this.eventClasses = [];
    },

    fireEvent: function(event, data) {
        var subs = (this.eventClasses[event] || []).concat(this.eventClasses["*"] || []) ;
        for(var i = 0; i < subs.length; i++) {
            subs[i].apply(this, Array.prototype.slice.call(arguments,1));
        }
    },

    attach: function(event, fn) {
        if (arguments.length < 2) {
            fn = event;
            event = "*";
        }

        (this.eventClasses[event] = this.eventClasses[event] || []).push(fn);
    },

    detach: function(event, fn) {
        throw "NOT IMPLEMENTED";
        //this.visible(true);
    }
});

function SetPasswordModel(context) {
    var self = this;

    self.user = ko.observable();

    self.user.subscribe(function(value) {
        self.password(null);
        self.password2(null);
    });

    self.password = ko.observable();
    self.password2 = ko.observable();

    self.progressText = ko.observable();

    self.changePassword = function() {

        if (! (self.password() && self.password2())) {
            alert("password field is empty");
            return;
        }
        if (self.password() !== self.password2()) {
            alert("password dont match");
            return;
        }

        context.setPassword(self.user().Id(), self.password(), function() {
            self.user(null);
        });
    }

}



$data.Class.defineEx("ViewModels.NewGroup", [ViewModels.Showable, ViewModels.EventSource], null, {
    constructor: function(context) {
        var self = this;

        self.name = ko.observable();

        self.closeOnCreate = ko.observable(false);

        self.createGroup = function() {
            self.visible(! self.closeOnCreate());
            var group = new context.Groups.createNew();
            group.name = self.name();
            context.Groups.add(group);
            context.saveChanges( function( item ) {
                self.fireEvent("newGroup", group);
            })
        }
    }
});

function ManageGroupsModel(context, newGroupModel) {
    var self = this;

    self.groups = ko.observableArray([]);
    context.Groups.toArray(self.groups);

    self.newGroupModel = newGroupModel;

    self.newGroupModel.attach(function(group) {
        self.groups.push(group.asKoObservable());
    });

    self.selectedGroup = ko.observable();

    self.removeGroup = function(group) {
        context.Groups.remove(group.innerInstance);
        context.saveChanges( function() {
           self.groups.remove(group);
        });
    };


};

function ManageUsersModel(context, spModel, groupsModel, newUserModel) {
    var _context = context;

    var self = this;

    self.groupsModel = groupsModel;
    self.newUserModel = newUserModel;

    self.newUserModel.attach(function(user) {
        self.userList.push(user);
    });

    self.userCount = ko.observable();
    self.userList = ko.observableArray([]);



    self.changePassword = function(user) {
        console.dir(user.login());
        spModel.user(user);
    }

    self.removeUser = function(user) {
        _context.Users.remove(user.innerInstance);
        _context.saveChanges( function() {
            self.userList.remove(user);
        });
        //alert();
    }

    _context.Users.toArray(self.userList);

}

$data.Class.defineEx("ViewModels.NewUser", [ViewModels.Showable, ViewModels.EventSource], null, {
    constructor: function (context) {
        var self = this;

        self.hide = function() {
            self.user(null);
            ViewModels.Showable.prototype.hide.apply(this, arguments);
        }

        self.show = function() {
            var u = new context.Users.createNew();
            self.user(u.asKoObservable());
            ViewModels.Showable.prototype.show.apply(this, arguments);
        }

        self.user = ko.observable();

        self.createUser = function() {
            context.Users.add(self.user());
            context.saveChanges( function() {
                self.fireEvent("newUser", self.user());
                self.hide();
            });

        }
    }
});



$(function() {

    function loadUserManagerUI(context) {
        var newGroupModel = new ViewModels.NewGroup(context);
        ko.applyBindings(newGroupModel,document.getElementById('addGroupUI') )

        var manageGroupsModel = new ManageGroupsModel(context, newGroupModel);
        ko.applyBindings(manageGroupsModel, document.getElementById("manageGroupsUI"));

        var spModel = new SetPasswordModel(context);
        ko.applyBindings(spModel, document.getElementById("changePasswordUI"));

        var newUserModel = new ViewModels.NewUser(context);
        ko.applyBindings(newUserModel, document.getElementById("addUserUI"));

        var manageUsersModel = new ManageUsersModel(context, spModel, manageGroupsModel, newUserModel);
        ko.applyBindings(manageUsersModel, document.getElementById("adminUI"));

    };

    $data.MetadataLoader.xsltRepoUrl = '/scripts/';
    $data.MetadataLoader.load('/db/$metadata', function () {

        var context = JayStormApplication.context;
        loadUserManagerUI(context);
    });
})
