var globalAuthorization;
var adminApiClient;

$(function () {

    //$data.service('/db',
    //function (factory, type) {

        //var context = factory();

    function ClientApplication() {
        var self = this;
        
        /*self.adminApi = ko.observable();
        
        $data.service("/adminapi", function (f) {
            self.adminApi(f());
        });*/

        self.authorization = ko.observable();

        function getAuthroization(succ, err) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "getAuthorization", true);
            xhr.onerror = function () {
                alert("could not connect to dashboard.jaystack.net for authorization");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var result = JSON.parse(xhr.responseText);
                        if (!(result.authorization && result.apps)) {
                            alert("invalid authorization result");
                        }
                        self.authorization(result.authorization);
                        globalAuthorization = result.authorization;
                        var apps = result.apps
                                        .filter(function(item) { return item.status != 'Cancelled'})
                                        .map(function (item) {
                                                return {
                                                    appid: item.appid,
                                                    url: item.url + '/' || 'https://' + item.appid + '.jaystack.net/',
                                                    title: item.name,
                                                    name: item.name,
                                                    isfreeapp: item.isfreeapp
                                                }
                                        });
                        window["stormApplications"] = apps;
                        self.applications(apps);
                        var appid = window.location.href.match(/appId=([^&]*)/);
                        if (appid){
                            var app = apps.filter(function(it){ return it.appid == appid[1]; });
                            if (app.length) self.currentApplication(app[0]);
                            else self.currentApplication(apps[0]);
                        }else self.currentApplication(apps[0]);

                    } else {
                        alert("not ok (200) response from getAuthorization:" + xhr.responseText);
                    }
                }
            }
            xhr.send();
        }
        getAuthroization();
        self.applications = ko.observableArray([]);
        self.currentApplication = ko.observable();
        self.applicationToAdd = ko.observable();
        self.launchFinished = ko.observable();
        self.publishSuccess = ko.observable(0);
        self.adminUpdate = ko.observable(false);
        
        self.publishSuccess.subscribe(function(value){
            console.log('publishSuccess', value);
            if (value){
                localStorage[self.currentApplication().appid] = value;
            }
        });
        
        self.addApp = function () {
            value = self.applicationToAdd();
            self.applications.push({ url: value, title: value });
            self.applicationToAdd(null);
        };
        
        self.freeApp = ko.observable(false);
        
        function updateVersion(appDBFactory){
            console.log('updateVersion');
            var c = appDBFactory();
            var update = false;
            
            c.AppItems.filter(function(it){ return it.AppId == this.appid && it.Type == this.update; }, {
                appid: adminApiClient.currentApplication().appid,
                update: 'ApplicationManagerUpdate'
            }).length(function(updates){
                if (updates){
                    adminApiClient.adminUpdate(true);
                }
            });
            
            c.Databases.single(function(it){ return it.Name == this.appdb; }, { appdb: 'ApplicationDB' }, function(appdb){
                var packageEntity, indexEntity, indexKeyEntity, serviceOperationEntity;
                
                c.Entities.single(function(it){
                    return it.FullName == this.entityfields &&
                        it.DatabaseID == this.appdb;
                }, {
                    entityfields: '$data.JayStormAPI.EntityField',
                    appdb: appdb.DatabaseID
                }, function(entityfieldEntity){
                    return c.EntityFields.filter(function(it){
                        return it.EntityID == this.entity &&
                            it.DatabaseID == this.appdb &&
                            (
                                it.Name == this.inversefieldid ||
                                it.Name == this.lazyload
                            );
                        }, {
                            entity: entityfieldEntity.EntityID,
                            appdb: appdb.DatabaseID,
                            inversefieldid: 'InverseFieldID',
                            lazyload: 'LazyLoad'
                        }).toArray(function(entityfield){
                            if (entityfield.length < 2){
                                if (!entityfield.filter(function(it){ return it.Name == 'InverseFieldID'; }).length){
                                    update = true;
                                    c.EntityFields.add(new c.EntityFields.createNew({
                                        Name: 'InverseFieldID',
                                        Type: 'id',
                                        TypeTemplate: 'Reference',
                                        Nullable: true,
                                        DatabaseID: appdb.DatabaseID,
                                        EntityID: entityfieldEntity.EntityID
                                    }));
                                }
                                
                                if (!entityfield.filter(function(it){ return it.Name == 'LazyLoad'; }).length){
                                    update = true;
                                    c.EntityFields.add(new c.EntityFields.createNew({
                                        Name: 'LazyLoad',
                                        Type: 'boolean',
                                        TypeTemplate: 'Boolean',
                                        Nullable: true,
                                        DatabaseID: appdb.DatabaseID,
                                        EntityID: entityfieldEntity.EntityID
                                    }));
                                }
                            }
                        });
                }).then(function(){
                    return c.TypeTemplates/*.filter(function(it){ return it.Name == this.geo; }, { geo: 'Geography' })*/.toArray(function(tt){
                        if (tt.filter(function(it){ return it.Name == 'Geography' }).length){
                            update = true;
                            c.TypeTemplates.remove(tt.filter(function(it){ return it.Name == 'Geography' })[0]);
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'GUID' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'GUID',
                                Description: 'Globally unique identifier',
                                TypeName: '$data.Guid',
                                TypeDescriptor: '{"Type":"$data.Guid","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography point' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography point',
                                Description: 'Spherical location point',
                                TypeName: '$data.GeographyPoint',
                                TypeDescriptor: '{"Type":"$data.GeographyPoint","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography line string' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography line string',
                                Description: 'Spherical line string',
                                TypeName: '$data.GeographyLineString',
                                TypeDescriptor: '{"Type":"$data.GeographyLineString","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography polygon' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography polygon',
                                Description: 'Spherical polygon',
                                TypeName: '$data.GeographyPolygon',
                                TypeDescriptor: '{"Type":"$data.GeographyPolygon","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography multi point' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography multi point',
                                Description: 'Spherical multi point',
                                TypeName: '$data.GeographyMultiPoint',
                                TypeDescriptor: '{"Type":"$data.GeographyMultiPoint","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography multi line string' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography multi line string',
                                Description: 'Spherical multi line string',
                                TypeName: '$data.GeographyMultiLineString',
                                TypeDescriptor: '{"Type":"$data.GeographyMultiLineString","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography multi polygon' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography multi polygon',
                                Description: 'Spherical multi polygon',
                                TypeName: '$data.GeographyMultiPolygon',
                                TypeDescriptor: '{"Type":"$data.GeographyMultiPolygon","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geography collection' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geography collection',
                                Description: 'Spherical collection',
                                TypeName: '$data.GeographyCollection',
                                TypeDescriptor: '{"Type":"$data.GeographyCollection","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry point' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry point',
                                Description: 'Euclidean location point',
                                TypeName: '$data.GeometryPoint',
                                TypeDescriptor: '{"Type":"$data.GeometryPoint","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry line string' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry line string',
                                Description: 'Euclidean line string',
                                TypeName: '$data.GeometryLineString',
                                TypeDescriptor: '{"Type":"$data.GeometryLineString","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry polygon' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry polygon',
                                Description: 'Euclidean polygon',
                                TypeName: '$data.GeometryPolygon',
                                TypeDescriptor: '{"Type":"$data.GeometryPolygon","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry multi point' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry multi point',
                                Description: 'Euclidean multi point',
                                TypeName: '$data.GeometryMultiPoint',
                                TypeDescriptor: '{"Type":"$data.GeometryMultiPoint","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry multi line string' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry multi line string',
                                Description: 'Euclidean multi line string',
                                TypeName: '$data.GeometryMultiLineString',
                                TypeDescriptor: '{"Type":"$data.GeometryMultiLineString","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry multi polygon' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry multi polygon',
                                Description: 'Euclidean multi polygon',
                                TypeName: '$data.GeometryMultiPolygon',
                                TypeDescriptor: '{"Type":"$data.GeometryMultiPolygon","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Geometry collection' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Geometry collection',
                                Description: 'Euclidean collection',
                                TypeName: '$data.GeometryCollection',
                                TypeDescriptor: '{"Type":"$data.GeometryCollection","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{}"}'
                            }));
                        }
                        
                        if (!tt.filter(function(it){ return it.Name == 'Binary' }).length){
                            update = true;
                            c.TypeTemplates.add(new c.TypeTemplates.createNew({
                                Name: 'Binary',
                                Description: 'Binary data',
                                TypeName: '$data.Blob',
                                TypeDescriptor: '{"Type":"$data.Blob","Key":false,"Computed":false,"Nullable":true,"MaxLength":null,"ExtendedProperties":"{\\"$contentType\\":\\"application/octet-stream\\"}"}'
                            }));
                        }
                    });
                }).then(function(){
                
                c.EntitySets.single(function(it){
                    return it.ElementType == this.elementType && it.DatabaseID == this.appdb;
                }, {
                    elementType: '$data.JayStormAPI.EntityField',
                    appdb: appdb.DatabaseID
                }, function(entitySet){
                    c.EventHandlers.filter(function(it){
                        return it.EntitySetID == this.entitySet && (it.Type == this.afterCreate || it.Type == this.afterDelete) && it.DatabaseID == this.appdb;
                    }, {
                        entitySet: entitySet.EntitySetID,
                        afterCreate: 'afterCreate',
                        afterDelete: 'afterDelete',
                        appdb: appdb.DatabaseID
                    }).toArray(function(handlers){
                        if (!handlers.filter(function(it){ return it.Type == 'afterCreate'; }).length){
                            update = true;
                            c.EventHandlers.add(new c.EventHandlers.createNew({
                                EntitySetID: entitySet.EntitySetID,
                                DatabaseID: appdb.DatabaseID,
                                Type: 'afterCreate',
                                Handler: new EJS({ url: '/scripts/entityfields-aftercreate-update.ejs' }).render({})
                            }));
                        }
                        
                        if (!handlers.filter(function(it){ return it.Type == 'afterDelete'; }).length){
                            update = true;
                            c.EventHandlers.add(new c.EventHandlers.createNew({
                                EntitySetID: entitySet.EntitySetID,
                                DatabaseID: appdb.DatabaseID,
                                Type: 'afterDelete',
                                Handler: new EJS({ url: '/scripts/entityfields-afterdelete-update.ejs' }).render({})
                            }));
                        }
                        
                        c.Entities.filter(function(it){
                            return (it.FullName == this.packageFullName ||
                                it.FullName == this.indexFullName ||
                                it.FullName == this.indexKeyFullName ||
                                it.FullName == this.serviceOperationFullName) && it.DatabaseID == this.appdb;
                        }, {
                            packageFullName: '$data.JayStormAPI.Package',
                            indexFullName: '$data.JayStormAPI.Index',
                            indexKeyFullName: '$data.JayStormAPI.IndexKey',
                            serviceOperationFullName: '$data.JayStormAPI.ServiceOperation',
                            appdb: appdb.DatabaseID
                        }).length(function(cnt){
                            if (!update && (cnt == 4)) return;
                            
                            if (!c.Packages){
                                update = true;
                                packageEntity = new c.Entities.createNew({
                                    Name: 'Package',
                                    FullName: '$data.JayStormAPI.Package',
                                    Namespace: '$data.JayStormAPI',
                                    DatabaseID: appdb.DatabaseID,
                                    HasChanges: true
                                });
                                c.Entities.add(packageEntity);
                            }
                            
                            if (!c.Indices){
                                update = true;
                                indexEntity = new c.Entities.createNew({
                                    Name: 'Index',
                                    FullName: '$data.JayStormAPI.Index',
                                    Namespace: '$data.JayStormAPI',
                                    DatabaseID: appdb.DatabaseID,
                                    HasChanges: true
                                });
                                c.Entities.add(indexEntity);
                            }
                            
                            if (!c.IndexKeys){
                                update = true;
                                indexKeyEntity = new c.Entities.createNew({
                                    Name: 'IndexKey',
                                    FullName: '$data.JayStormAPI.IndexKey',
                                    Namespace: '$data.JayStormAPI',
                                    DatabaseID: appdb.DatabaseID,
                                    HasChanges: true
                                });
                                c.Entities.add(indexKeyEntity);
                            }
                            
                            if (!c.ServiceOperations){
                                update = true;
                                serviceOperationEntity = new c.Entities.createNew({
                                    Name: 'ServiceOperation',
                                    FullName: '$data.JayStormAPI.ServiceOperation',
                                    Namespace: '$data.JayStormAPI',
                                    DatabaseID: appdb.DatabaseID,
                                    HasChanges: true
                                });
                                c.Entities.add(serviceOperationEntity);
                            }
                            
                            if (update){
                                c.saveChanges(function(){
                                    if (packageEntity){
                                        c.EntitySets.add(new c.EntitySets.createNew({
                                            Name: 'Packages',
                                            ElementType: packageEntity.FullName,
                                            ElementTypeID: packageEntity.EntityID,
                                            DatabaseID: appdb.DatabaseID,
                                            HasChanges: true
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Id',
                                            Type: 'id',
                                            Computed: true,
                                            Key: true,
                                            Nullable: false,
                                            TypeTemplate: 'Object identifier',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: packageEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Name',
                                            Type: 'string',
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: packageEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Status',
                                            Type: 'string',
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: packageEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'StdOut',
                                            Type: 'string',
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: packageEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'StdErr',
                                            Type: 'string',
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: packageEntity.EntityID
                                        }));
                                    }
                                    
                                    if (indexEntity){
                                        c.EntitySets.add(new c.EntitySets.createNew({
                                            Name: 'Indices',
                                            ElementType: indexEntity.FullName,
                                            ElementTypeID: indexEntity.EntityID,
                                            DatabaseID: appdb.DatabaseID,
                                            HasChanges: true
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'IndexID',
                                            Type: 'id',
                                            Computed: true,
                                            Key: true,
                                            Nullable: false,
                                            TypeTemplate: 'Object identifier',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'DatabaseID',
                                            Type: 'id',
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'EntitySetID',
                                            Type: 'id',
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Unique',
                                            Type: 'boolean',
                                            TypeTemplate: 'Boolean',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'ExpireAfterSeconds',
                                            Type: 'int',
                                            TypeTemplate: 'Integer',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexEntity.EntityID
                                        }));
                                    }
                                    
                                    if (indexKeyEntity){
                                        c.EntitySets.add(new c.EntitySets.createNew({
                                            Name: 'IndexKeys',
                                            ElementType: indexKeyEntity.FullName,
                                            ElementTypeID: indexKeyEntity.EntityID,
                                            DatabaseID: appdb.DatabaseID,
                                            HasChanges: true
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'IndexKeyID',
                                            Type: 'id',
                                            Computed: true,
                                            Key: true,
                                            Nullable: false,
                                            TypeTemplate: 'Object identifier',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'DatabaseID',
                                            Type: 'id',
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'IndexID',
                                            Type: 'id',
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'EntityFieldID',
                                            Type: 'id',
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Order',
                                            Type: 'int',
                                            Nullable: true,
                                            TypeTemplate: 'Integer',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Spatial',
                                            Type: 'boolean',
                                            TypeTemplate: 'Boolean',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: indexKeyEntity.EntityID
                                        }));
                                    }
                                    
                                    if (serviceOperationEntity){
                                        c.EntitySets.add(new c.EntitySets.createNew({
                                            Name: 'ServiceOperations',
                                            ElementType: serviceOperationEntity.FullName,
                                            ElementTypeID: serviceOperationEntity.EntityID,
                                            DatabaseID: appdb.DatabaseID,
                                            HasChanges: true
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'ServiceOperationID',
                                            Type: 'id',
                                            Computed: true,
                                            Key: true,
                                            Nullable: false,
                                            TypeTemplate: 'Object identifier',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: serviceOperationEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'ServiceID',
                                            Type: 'id',
                                            Nullable: false,
                                            TypeTemplate: 'Reference',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: serviceOperationEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'Name',
                                            Type: 'string',
                                            Nullable: false,
                                            Required: true,
                                            RegExp: '/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[A-Z\_a-z][A-Z\_a-z0-9]*$/',
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: serviceOperationEntity.EntityID
                                        }));
                                        
                                        c.EntityFields.add(new c.EntityFields.createNew({
                                            Name: 'FunctionBody',
                                            Type: 'string',
                                            Nullable: false,
                                            TypeTemplate: 'Long string',
                                            DatabaseID: appdb.DatabaseID,
                                            EntityID: serviceOperationEntity.EntityID
                                        }));
                                    }
                                    
                                    c.AppItems.add(new c.AppItems.createNew({
                                        Id: $data.Guid.NewGuid(),
                                        AppId: self.currentApplication().appid,
                                        Type: 'ApplicationManagerUpdate',
                                        Data: { version: 1.1 },
                                        CreationDate: new Date()
                                    }));
                                    
                                    c.saveChanges(function(){
                                        adminApiClient.adminUpdate(true);
                                        //alert('JayStorm updated to v1.1\n\nPlease publish your application and reload the Application Manager to apply.');
                                    }).fail(function(err){
                                        console.error(err);
                                        alert(err);
                                    });
                                });
                            }
                        });
                    }).fail(function(err){
                        console.error(err);
                        alert(err);
                    });
                }).fail(function(err){
                    console.error(err);
                    alert(err);
                });
                
                });
            });
        }

        function syncAppItemsWithDatabases(appDBFactory) {
            console.log("syncAppItems");
            var c = appDBFactory();
            var items = c.AppItems.filter("it.Type == 'QueryableDB' || it.Type == 'FreeQueryableDB'").toArray();
            var dbs = c.Databases.toArray();
            Q.allResolved([items, dbs]).then(function () {
                console.log("sync app items loaded...");
                
                var i = items.valueOf();
                console.log(i.length);
                var ds = dbs.valueOf();
                var syncOps = [];
                var nuDbs = [];
                var _c = appDBFactory();
                for (var j = 0; j < i.length; j++) {
                    var item = i[j];
                    console.log("processing appitem: " + item.Id);
                    var dbName = item.Data.dbname;
                    var hasDbRecord = ds.some(function (db) { return db.Name == dbName; });
                    if (!hasDbRecord) {
                        var newDbRecord = new c.Databases.createNew({ Name: dbName, Namespace: dbName, Published: true });
                        nuDbs.push(newDbRecord);
                        _c.add(newDbRecord);
                    }
                };
                
                if (nuDbs.length > 0) {
                    _c.saveChanges()
                        .then(function () {
                            var nuServices = [];
                            nuDbs.forEach( function(nuDB)  {
                                var service = new _c.Services.createNew({ 
                                    DatabaseID: nuDB.DatabaseID, 
                                    Name: nuDB.Name,
                                    ServiceSourceType: 'script',
                                    Published: true,
                                    AllowAnonymous: true,
                                    AllowAllOrigins: false,
                                    UseDefaultPort: true,
                                    UseSSL: true,
                                    AllowAllIPs: false
                                });
                                _c.add(service);
                                nuServices.push(service);
                            });
                            _c.saveChanges()
                                .then(function () { console.log("   services initialized"); })
                                .fail(function () { console.log("   could not initialize services:", arguments); });
                        }).fail(function () { alert("could not sync db records!"); });
                }

                Q.allResolved(syncOps).then(function () {
                    if (nuDbs.length > 0) {
                        console.log("  syncing service records");
                        nuDbs.forEach(function (nuDB) {
                            console.dir(nuDB);
                        });
                    }
                });

            });

        };

        self.currentApplication.subscribe(function (value) {
            self.navigationVisible(false);

            var serviceUri = value.url.trim() + "ApplicationDB";
            
            var serviceUri = serviceUri; //serviceUri.replace("http://", "");
            
            $data.MetadataLoader.factoryCache = undefined;
            $data.service(serviceUri, {
                success: function (factory) {
                    var appDBFactory = function () {
                        var c = factory.apply({}, arguments);
                        c.prepareRequest = function (req) {
                            req[0].headers = req[0].headers || {};
                            req[0].headers['X-Domain'] = 'jokerStorm';
                            req[0].headers['Authorization'] = self.authorization();
                        };
                        return c;
                    }
                    syncAppItemsWithDatabases(appDBFactory);
                    updateVersion(appDBFactory);
                    self.currentAppDBContextFactory(appDBFactory);
                    self.navigationVisible(true);
                    if (localStorage[value.appid]) self.publishSuccess(parseInt(localStorage[value.appid], 10));
                    else self.publishSuccess(0);
                },
                error: function () {
                    setTimeout(function () {
                        if (value === self.currentApplication()) {
                            window.location.href = 'http://www.jaystack.com/your-jaystorm-app-is-ready?appId=' + self.currentApplication().appid;
                        }
                    }, 5000);
                }
            }, { httpHeaders: { 'Authorization': self.authorization(), 'X-Domain': 'jokerStorm' } });
        });

        self.currentAppDBContextFactory = ko.observable();

        var modules = [
            { type: $data.JayStormClient.SchemaManager, ui: "SchemaManagerUI", title: 'Schemas', path: '/Schema', cssclass: '' },
            { type: $data.JayStormClient.ServiceManager, ui: "ServiceManagerUI", title: 'Services', path: '/Services', cssclass: '' },
            { type: $data.JayStormClient.SecurityManager, ui: "SecurityManagerUI", title: 'Security', path: '/Security', cssclass: '' },
            { type: $data.JayStormClient.AccessManager, ui: "AccessManagerUI", title: 'Access Control', path: '/Access', cssclass: '' },
            { type: $data.JayStormClient.PackageManager, ui: "PackageManagerUI", title: 'Packages', path: '/PackageManager', cssclass: '' },
            { type: $data.JayStormClient.StaticFileManager, ui: "StaticFileUI", title: 'Files', path: '/FileManager', cssclass: '' },
            { type: $data.JayStormClient.UserManager, ui: "UserManagerUI", title: 'Users', path: '/Users', cssclass: '' }
        ];
        var submodules = [
            { type: $data.JayStormClient.DeploymentManager, ui: "DeploymentUI", title: 'Publish', path: '/Publish', cssclass: 'after-icon star', id: '7' },
            { type: $data.JayStormClient.DataManager, ui: "DataManagerUI", title: 'Edit data', path: '/Databases', cssclass: 'after-icon edit', id: '8' },
            { type: $data.JayStormClient.AccessClients, ui: "AccessClientsUI", title: 'API access', path: '/AccessClients', cssclass: 'after-icon access', id: '9' }
        ];
        self.navigationVisible = ko.observable(false);


        modules.forEach(function (module) {
            ko.applyBindings(module.Model = new module.type(self), document.getElementById(module.ui));
        })
        submodules.forEach(function (module) {
            ko.applyBindings(module.Model = new module.type(self), document.getElementById(module.ui));
        })

        self.menuItems = modules;
        self.submenuItems = submodules;
        self.currentModel = null;

        self.show = function (item, event) {

            // HIDE PREVIOUS
            $(".tab-pane.active.in").removeClass("in").removeClass("active");
            $("#nav-1 li.active").removeClass("active");
            $("#nav-2 li.active").removeClass("active");

            if (self.currentModel){
                self.currentModel.hide();
            }
            
            self.currentModel = item.Model;

            // SHOW CURRENT
            item.Model.show();
            $("#" + item.ui).parent().addClass("in active");

            /*if (item.ui == "DeploymentUI" || item.ui == "DataManagerUI") {
                $(".main-tab.tabs-left > .nav > li.active").removeClass("active");
            }*/
        }
        self.launchResult = ko.observable();
        function launchApplication(appid, ondone) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "launch", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onerror = function () {
                alert("could not connect to dashboard.jaystack.net for launch");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        self.launchResult(xhr.responseText);
                        self.launchFinished(new Date());
                        
                        var c = self.currentAppDBContextFactory()();
                        c.onReady(function(){
                            var fn = function(){
                                c.AppItems.filter(function(it){ return it.AppId == this.appid && it.Type == this.update; }, {
                                    appid: adminApiClient.currentApplication().appid,
                                    update: 'ApplicationManagerUpdate'
                                }).toArray(function(updates){
                                    for (var i = 0; i < updates.length; i++){
                                        c.AppItems.remove(updates[i]);
                                    }
                                    
                                    c.saveChanges(function(){
                                        adminApiClient.adminUpdate(false);
                                    }).fail(function(err){
                                        alert(err);
                                    });
                                }).fail(function(){
                                    setTimeout(fn, 1000);
                                });
                            };
                            
                            fn();
                        }).fail(function(err){
                            alert(err);
                        });
                    } else {
                        alert("not ok (200) response from getAuthorization:" + xhr.responseText);
                    }
                }
            }
            xhr.send(JSON.stringify({appid: appid}));
        }

        self.launchCurrentApplication = function () {
            var appid = self.currentApplication().appid;
            launchApplication(appid);
        }

        self.cryptData = function (str, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "crypt", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onerror = function () {
                callback({ message: 'error'});
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        callback(xhr.responseText);
                    } else {
                        callback({ message: "not ok (200) response from crypt: " + xhr.responseText });
                    }
                }
            }
            xhr.send(JSON.stringify({ plain: str }));
        }

    }

    adminApiClient = new ClientApplication();
    var appui = document.querySelectorAll('.AppUI');
    for (var i = 0; i < appui.length; i++)
        ko.applyBindings(adminApiClient, appui[i]);

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

