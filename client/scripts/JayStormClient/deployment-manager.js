﻿/**
 * Created with JetBrains WebStorm.
 * User: nochtap
 * Date: 9/2/12
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */

window.hasChangeEvent = new $data.Event('HasChangeEvent');

$data.JayStormUI.AdminModel.extend("$data.JayStormClient.DeploymentManager", {
    constructor: function () {
        console.log("UserManager context:" + this.getType().fullName + " starting");
        var self = this;

        self.changedObjects = ko.observableArray([]);
        self.hasChanges = ko.observable(false);
        self.launchDisabled = ko.observable(true);
        self.launching = ko.observable(false);
        self.launchingDone = ko.observable(false);

        self.appContext = ko.observable();

        function filterFn(e) { return e.HasChanges == true; };

        var counter = 0;
        function registerEntitySetWatch(entitySet) {
            var changes = {
                EntitySet: entitySet,
                CollectionName: entitySet.collectionName,
                Items: ko.observableArray()
            }
            self.changedObjects.push(changes);

            changes.Items.subscribe(function (values) {
                self.hasChanges(!self.hasChanges() ? (values.length > 0) : true);
            });
            
            entitySet.filter(filterFn).toArray(changes.Items).then(function () {
                counter++
                if (self.changedObjects().length === counter)
                    self.launchDisabled(false);
            });

        }

        self.appContext.subscribe(function (ctx) {
            if (ctx) {
                counter = 0;
                self.hasChanges(false);
                self.launchingDone(false);
                self.launchDisabled(true);
                self.changedObjects([]);

                var esReferences = ctx._entitySetReferences;
                for (var es in esReferences) {
                    var eSet = esReferences[es];
                    var changesDef = eSet.elementType.getMemberDefinition('HasChanges');
                    if (changesDef) {
                        registerEntitySetWatch(eSet);
                    }

                }
            }
        });

        var currentContext = ko.observable();
        self.contextFactory.subscribe(function (ctxFactory) {
            currentContext(ctxFactory());

            if(self.visible())
                self.appContext(currentContext());
        })

        self.show = function () {
            var arg = arguments;
            self.visible(true);
            self.appContext(currentContext());

        };

        self.hide = function () {
            self.visible(false);

        };

        self.launch = function () {
            self.launching(true);
            self.application.launchCurrentApplication();
        }

        self.application.launchFinished.subscribe(function (res) {
            //clear self.changedObjects
            var changeGroups = self.changedObjects();
            for (var i = 0; i < changeGroups.length; i++) {
                var changes = changeGroups[i];
                var items = changes.Items();
                for (var j = 0; j < items.length; j++) {
                    changes.EntitySet.attach(items[j]);
                    items[j].HasChanges(false);
                }
            }

            setTimeout(function () { 
                var context = self.appContext();
                context.saveChanges(function () {
                    //fire event
                    var aaa = arguments;
                    self.launching(false);
                    self.launchingDone(true);

                    window.hasChangeEvent.fire(changeGroups.map(function (cGroup) { return { EntitySet: cGroup.EntitySet, CollectionName: cGroup.CollectionName, Items: cGroup.Items() }; }));

                    self.hasChanges(false);
                });
            }, 3000);
        });
    }
});