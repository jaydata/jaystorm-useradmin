/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/12/12
 * Time: 11:40 PM
 * To change this template use File | Settings | File Templates.
 */

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

function NewGroupModel(context) {

    var self = this;
    self.notify = function() { };

    self.visible = ko.observable(false);
    self.hide = function() { self.visible(false) }
    self.show = function() { self.visible(true); }


    self.name = ko.observable();


    self.closeOnCreate = ko.observable(false);

    self.closeOnCreate(false);

    self.createGroup = function() {
        self.visible(! self.closeOnCreate());
        var group = new JayStormApplication.Group();
        group.name = self.name();
        context.Groups.add(group);
        context.saveChanges( function( item ) {
            self.notify(group);
        })
    }
}

function ManageGroupsModel(context, newGroupModel) {
    var self = this;

    self.groups = ko.observableArray([]);
    context.Groups.toArray(self.groups);

    self.newGroupModel = newGroupModel;

    self.newGroupModel.notify = function(group) {
        self.groups.push(group.asKoObservable());
    };

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

    self.newUserModel.notify = function(user) {
        self.userList.push(user);
    }

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

function NewUserModel(context) {
    var self = this;
    self.notify = function() { };

    self.visible = ko.observable(false);
    self.hide = function() {
        self.user(null);
        self.visible(false);
    }

    self.show = function() {
        var u = new JayStormApplication.User();
        self.user(u.asKoObservable());
        self.visible(true);
    }

    self.user = ko.observable();

    self.createUser = function() {
        context.Users.add(self.user());
        context.saveChanges( function() {
            self.notify(self.user());
            self.hide();
        });

    }
};

$(function() {
    $data.MetadataLoader.xsltRepoUrl = '/scripts/';
    $data.MetadataLoader.load('/db/$metadata', function () {

        var context = JayStormApplication.context;

        var newGroupModel = new NewGroupModel(context);
        ko.applyBindings(newGroupModel,document.getElementById('addGroupUI') )

        var manageGroupsModel = new ManageGroupsModel(context, newGroupModel);
        ko.applyBindings(manageGroupsModel, document.getElementById("manageGroupsUI"));

        var spModel = new SetPasswordModel(context);
        ko.applyBindings(spModel, document.getElementById("changePasswordUI"));

        var newUserModel = new NewUserModel(context);
        ko.applyBindings(newUserModel, document.getElementById("addUserUI"));

        var manageUsersModel = new ManageUsersModel(context, spModel, manageGroupsModel, newUserModel);
        ko.applyBindings(manageUsersModel, document.getElementById("adminUI"));
    });
})
