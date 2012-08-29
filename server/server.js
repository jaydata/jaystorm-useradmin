/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/12/12
 * Time: 4:20 PM
 * To change this template use File | Settings | File Templates.
 */


require('connect');
require('jaydata');
require('q');
require('./contextapi-api.js');

function registerEdmTypes() {

    function Edm_Boolean() {

    }

    $data.Container.registerType('Edm.Boolean', Edm_Boolean);
    $data.Container.mapType(Edm_Boolean, $data.Boolean);

    function Edm_Binary() {

    }

    $data.Container.registerType('Edm.Binary', Edm_Binary);
    $data.Container.mapType(Edm_Binary, $data.Blob);

    function Edm_DateTime() { };
    $data.Container.registerType('Edm.DateTime', Edm_DateTime);
    $data.Container.mapType(Edm_DateTime, $data.Date);

    function Edm_DateTimeOffset() { };
    $data.Container.registerType('Edm.DateTimeOffset', Edm_DateTimeOffset);
    $data.Container.mapType(Edm_DateTimeOffset, $data.Integer);

    function Edm_Time() { };
    $data.Container.registerType('Edm.Time', Edm_Time);
    $data.Container.mapType(Edm_Time, $data.Integer);

    function Edm_Decimal() { };
    $data.Container.registerType('Edm.Decimal', Edm_Decimal);
    $data.Container.mapType(Edm_Decimal, $data.Number);

    function Edm_Single() { };
    $data.Container.registerType('Edm.Single', Edm_Single);
    $data.Container.mapType(Edm_Single, $data.Number);

    function Edm_Double() { };
    $data.Container.registerType('Edm.Double', Edm_Double);
    $data.Container.mapType(Edm_Double, $data.Number);

    function Edm_Guid() { };
    $data.Container.registerType('Edm.Guid', Edm_Guid);
    $data.Container.mapType(Edm_Guid, $data.String);

    function Edm_Int16() { };
    $data.Container.registerType('Edm.Int16', Edm_Int16);
    $data.Container.mapType(Edm_Int16, $data.Integer);

    function Edm_Int32() { };
    $data.Container.registerType('Edm.Int32', Edm_Int32);
    $data.Container.mapType(Edm_Int32, $data.Integer);

    function Edm_Int64() { };
    $data.Container.registerType('Edm.Int64', Edm_Int64);
    $data.Container.mapType(Edm_Int64, $data.Integer);

    function Edm_Byte() { };
    $data.Container.registerType('Edm.Byte', Edm_Byte);
    $data.Container.mapType(Edm_Byte, $data.Integer);

    function Edm_String() { };
    $data.Container.registerType('Edm.String', Edm_String);
    $data.Container.mapType(Edm_String, $data.String);

};

registerEdmTypes();

$data.Entity.extend('$data.JayStormAPI.IngressIPRule', {
    ID: { type: 'id', key: true, computed: true },
    Name: { type: 'string' },
    ObjectID: { type: 'id',$sourceTable: 'Services', $sourceKey: 'ServiceID', $sourceDisplay: 'Name' },
    SourceAddress: { type: 'string' },      //--> ipadd or network
    Port: { type: 'int'  },
    SSL: { type: 'boolean' }
});

$data.Entity.extend('$data.JayStormAPI.IngressOriginRule', {
    ID: { type: 'id', key: true, computed: true },
    ObjectID: { type: 'id' },
    SourceOrigin: { type: 'string' },       //--> hostname or *
    Method: { type: 'Array', elementType:"string"}
});




$data.Entity.extend('$data.JayStormAPI.ApplicationMetadata', {
    ID: { type: 'id', key: true, computed: true },
    AppOwner: { type: 'string' },
    AppItems: {type: 'array', elementType: '$data.Object'}
});

$data.Entity.extend('$data.JayStormAPI.TypeTemplate', {
    'ID':{ key:true, type:'id', nullable:false, computed:true },
     Name: { type:'string', required: true },
     Description: {type: 'string' },
     TypeName: { type: 'string' },
     TypeDescriptor: {type: '$data.Object' },
     HasElementType: { type: 'boolean' }
});


$data.Entity.extend('$data.JayStormAPI.EntityBase', {
    'Id':{ key:true, type:'id', nullable:false, computed:true },
    'creationDate': { type: 'date', $ui_visible:false },
    constructor: function() {
        this.creationDate = new Date();
    }
});

$data.Entity.extend('$data.JayStormAPI.ObjectPointer', {
    Collection: { type: 'id' },
    ID: { type: 'id' },
    Database: { type: 'string' }
});

$data.Entity.extend('$data.JayStormAPI.Permission', {
    PermissionID: { type: 'id', key: true, computed: true },
    DatabaseID: { type: 'id', required: 'true', $sourceTable: 'Databases', $sourceValue: 'DatabaseID', $sourceText: 'Name' },
    EntitySetID: { type: 'id', required: 'true', $sourceTable: 'EntitySets', $sourceValue: 'EntitySetID', $sourceText: 'Name' },
    GroupID: { type: 'id', required: true,$sourceTable: 'Groups', $sourceValue: 'GroupID', $sourceText: 'Name' } ,
    Read: { type: 'boolean' },
    Create: { type: 'boolean' },
    Update: { type: 'boolean' },
    Delete: { type: 'boolean' },
    DeleteBatch: { type: 'boolean' },
    Execute: { type: 'boolean' },
    Manage: { type: 'boolean' },
    CreationDate: { type: 'date'  }
});

$data.Entity.extend('$data.JayStormAPI.Entity', {
    EntityID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    FullName: { type: 'string', required: true },
    Namespace: { type: 'string' },
    DatabaseID: {type: 'id', required: true}
});


$data.JayStormAPI.Entity.extend('$data.JayStormAPI.ComplexType', { });

$data.Entity.extend('$data.JayStormAPI.EntityField', {
    EntityFieldID: { type: 'id', key: true, computed: true },
    EntityID: { type: 'id', required: true },
    Index: { type: 'number' },
    Name: { type: 'string', required: true },
    Type: { type: 'string', required: true },
    ElementType: { type: 'string' },
    InverseProperty: { type: 'string' },
    Key: { type: 'bool' },
    Computed: { type: 'bool' },
    Nullable: { type: 'bool' },
    Required: { type: 'bool' },
    CustomValidator: { type: 'string' },
    MinValue: { type: 'string' },
    MaxValue: { type: 'string' },
    MinLength: { type: 'int' },
    MaxLength: { type: 'int' },
    Length: { type: 'int' },
    RegExp: { type: 'string' },
    TypeTemplate: { type: 'string' },
    DatabaseID: {type: 'id', required: true} /* ?? */
});

$data.Entity.extend('$data.JayStormAPI.KeyValuePair', {
    Key: { type: 'string' },
    Value: { type: 'string' }
});

$data.Entity.extend('$data.JayStormAPI.ServiceOperationReturnType', {
    ReturnType: { type: 'string', required: true },
    ElementType: { type: 'string' }
});

$data.Entity.extend('$data.JayStormAPI.ServiceOperationParameter', {
    ParameterID: { type: 'id', key: true, computed: true },
    Rank: { type: 'int', required: true },
    Name: { type: 'string', required: true },
    Type: { type: 'string', required: true }/*,
     ServiceOperation: { type: '$data.ContextAPI.ServiceOperation', inverseProperty: 'Parameters', required: true }*/
});

$data.Entity.extend('$data.JayStormAPI.ServiceOperation', {
    ServiceOperationID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    Method: { type: 'string' },
    Returns: { type: '$data.JayStormAPI.ServiceOperationReturnType' },
    Promise: { type: 'bool' },
    Publish: { type: 'bool' }
});

$data.Entity.extend('$data.JayStormAPI.EventHandler', {
    EventHandlerID: { type: 'id', key: true, computed: true },
    Name: {type: 'string', required: true },
    Type: { type: 'string', required: true },
    Handler: { type: 'string', required: true },
    EntitySetID: { type: 'id', required: true, $sourceTable: 'EntitySets', $sourceKey: 'EntitySetID', $sourceDisplay: 'Name'},
    DatabaseID: { type: 'id', required: true, $sourceTable: 'Databases', $sourceKey: 'DatabaseID', $sourceDisplay: 'Name'}
});


$data.Entity.extend('$data.JayStormAPI.Database', {
    DatabaseID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    Namespace: { type: 'string', required: true },
    Publish: { type: 'bool' }
});

$data.Entity.extend('$data.JayStormAPI.EntitySet', {
    EntitySetID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true, $displayName: 'Table name' },
    ElementType: { type: 'string' },
    ElementTypeID: { type: 'id', required: true},
    TableName: { type: 'string' },
    Publish: { type: 'bool' },
    DatabaseID: {type: 'id', required: true}
});

$data.Entity.extend('$data.JayStormAPI.Service', {
    ServiceID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true, $displayName: 'Service name' },
    DatabaseID: {type: 'id', $sourceTable: 'Databases', $sourceKey: 'DatabaseID', $sourceDisplay: 'Name' },
    BaseServiceID: { type: 'id' },
    Sets: { type: 'array', elementType: 'string' },
    Published: { type: 'bool' },
    ServiceSourceType: {type: 'string', $exclusiveValues: 'git; script; fuubar'},
    ServiceSource: { type: 'string' },
    AllowAnonymous: { type: 'boolean' },
    AllowAllIPs: { type: 'boolean'},
    AllowAllOrigins: { type: 'boolean' },
    UseDefaultPort: { type: 'boolean'},
    UseSSL: { type: 'boolean'}

});

$data.Entity.extend('$data.JayStormAPI.EntitySetPublication', {
    EntitySetPublicationID: { type: 'id', key: true, computed: true },
    ServiceID: { type: 'id' },
    EntitySetID: { type: 'id' }
});

$data.Class.define('$data.JayStormAPI.User', $data.Entity, null, {
    UserID: { type: 'id', key: true, computed: true },
    Login: { type: 'Edm.String' },
    Age: { type: 'Edm.Int32', required: true },
    FirstName: { type: 'Edm.String' },
    LastName:  { type: 'Edm.String' },
    Enabled: { type: 'Edm.Boolean' },
    Password: { type: 'Edm.String' },
    Groups: { type: 'Array', elementType: 'id', $source: 'Groups', $field: 'GroupID' },
    CreationDate: { type: 'date'}
});

$data.Class.define('$data.JayStormAPI.Group', $data.Entity, null , {
    GroupID: { type: 'id', key: true, computed: true },
    Name: { type: 'Edm.String' }
});


$data.Class.define('$data.JayStormAPI.Test', $data.Entity, null , {
    _id: { type: 'string', key: true },
    Name: { type: 'Edm.String' }
});


$data.Class.defineEx('$data.JayStormAPI.Context', [$data.EntityContext, $data.JayStormAPI.ServiceFunctions], null, {


    constructor: function() {
        var self = this;

        this.Databases.afterRead = function(items) {
            for(var i = 0; i < items.length; i++) {
                items[i].someFunkyState = "!!!";
            }
        };

        this.Databases.afterCreate = function(items) {

            for(var i = 0; i < items.length; i++) {
                var item = items[i];
                var svc = this.Services.add({
                    DatabaseID: item.DatabaseID,
                    Name: item.Name,
                    Published: true
                });
            };
            this.saveChanges();
        };

        this.EntitySets.afterCreate = function(entitySets) {
            var itemsToCreate = [];
            var itemIds = [];
            var dbID = entitySets[0].DatabaseID;
            if (entitySets.length > 1) {
                for(var i = 0; i < entitySets.length; i++) {
                    if (entitySets[i].DatabaseID !== dbID) {
                        console.log("Batch create EntitySets for different DB-s are not allowed");
                        return false;
                    }
                };
            }

            return function(cb) {
                self.Services.filter("it.DatabaseID == this.dbID",{dbID: dbID}).toArray(
                    function( services) {
                        services.forEach(function(service) {
                            entitySets.forEach( function(entitySet) {
                                self.add( new self.EntitySetPublications.createNew({
                                    ServiceID: service.ServiceID,
                                    EntitySetID: entitySet.EntitySetID,
                                    Name: entitySet.Name
                                }));
                            })

                        });
                        //todo replace to true
                        self.saveChanges( function() {
                            console.log('items saved');
                            cb(false);
                        })
                    }
                )
            }

        };

        this.Entities.afterDelete = function(items) {
        //TODO
        };

        this.Databases.beforeDelete = function(items) {
//            var itemIds = [];
//            for(var i = 0; i < items.length; i++) {
//            }
//            //TODO removeAll
//            this.Services.filter("it.DatabaseID in this.ids", { ids: itemIds}).removeAll();
        };

        this.Databases.afterDelete = function(items) {
            var itemIds = [];
            for(var i = 0; i < items.length; i++) {

            }
            //TODO removeAll
            this.Services
                .filter("it.DatabaseID in this.ids", { ids: itemIds})
                .forEach( function( service ) {
                    this.remove(service);
                });
        };

        this.Databases.beforeUpdate = function(items) {

        };


    },

    Tests: { type: $data.EntitySet, elementType: $data.JayStormAPI.Test},
    IngressIPRules: { type: $data.EntitySet, elementType: $data.JayStormAPI.IngressIPRule},
    Permissions: { type: $data.EntitySet, elementType: $data.JayStormAPI.Permission},
    Databases: { type: $data.EntitySet, elementType: $data.JayStormAPI.Database},
    ComplexTypes: { type: $data.EntitySet, elementType: $data.JayStormAPI.ComplexType },
    Entities: { type: $data.EntitySet, elementType: $data.JayStormAPI.Entity },
    EntityFields: { type: $data.EntitySet, elementType: $data.JayStormAPI.EntityField },
    EntitySets: { type: $data.EntitySet, elementType: $data.JayStormAPI.EntitySet },
    EntitySetPublications: { type: $data.EntitySet, elementType: $data.JayStormAPI.EntitySetPublication},
    EventHandlers: { type: $data.EntitySet, elementType: $data.JayStormAPI.EventHandler},
    Services: { type: $data.EntitySet, elementType: $data.JayStormAPI.Service },
    ServiceOperations: { type: $data.EntitySet, elementType: $data.JayStormAPI.ServiceOperation },
    TypeTemplates:  { type: $data.EntitySet, elementType: $data.JayStormAPI.TypeTemplate },
    Users: {type: $data.EntitySet, elementType: $data.JayStormAPI.User},

    Groups: { type: $data.EntitySet, elementType: $data.JayStormAPI.Group},

    SystemTypes : { value: [
        {
            Name: 'Object identifier',
            Description: 'A field that uniquely identifies an object',
            TypeName: 'id',
            TypeDescriptor: {
                Type: 'id',
                Key: true,
                Computed: true
            }

        },
        {
            Name: 'Short string',
            Description: 'A line of text (max 200 letters)',
            TypeName: 'string',
            TypeDescriptor: {
                Type: 'string',
                MaxLength: 200
            }
        },
        {
            Name: 'Long string',
            Description: 'A large block of text million',
            TypeName: 'string',
            TypeDescriptor: {
                Type: 'string'
            }
        },
        {
            Name: 'Reference',
            Description: 'A type to keep an id of another object',
            TypeName: 'id',
            TypeDescriptor: {
                Type: 'id'
            }

        },
        {
            Name: 'International date',
            Description: 'A datetime value stored in Zulu',
            TypeName: 'date',
            TypeDescriptor: {
                Type: 'date'
            }
        },

        {
            Name: 'Number',
            Description: 'A real number',
            TypeName: 'number',
            TypeDescriptor: {
                Type: 'number'
            }
        },
        {
            Name: 'Boolean',
            Description: 'A boolean field',
            TypeName: 'boolean',
            TypeDescriptor: {
                Type: 'boolean'
            }
        },
        {
            Name: 'Array',
            Description: 'A field for a collection of items of primitive and complex types',
            TypeName: 'Array',
            TypeDescriptor: {
                Type: 'Array'
            },
            HasElementType: true
        }
    ]},


    loadTypes: $data.JayService.serviceFunction()
        .returnsArrayOf("$data.JayStormAPI.TypeTemplate")
        (
            function() {
                return function(pass, fail) {
                    var self = this;
                    for(var i = 0; i < this.context.SystemTypes.length; i++) {
                        var tp = this.context.SystemTypes[i];
                        this.context.TypeTemplates.add(tp);
                    }

                    this.context.saveChanges(function() {
                        self.context.TypeTemplates.toArray( function(a) {
                            self.success(a);
                        })

                    });


                }
            }
        ),


    test: $data.JayService.serviceFunction()
        .returnsArrayOf("$data.JayStormAPI.Test")
        (
            function() {
                return function(succ, err) {

                    var s = this;
//                    this.context.Tests.add({_id:'1'});
//                    this.context.Tests.add({_id:'2'});
                    this.context.Tests.toArray(function(items) {
                        console.log("!");
                        s.success(items);
                    });
                }
            }
        ),


    setPassword: $data.JayService.serviceFunction()
        .param("userID", "Edm.String")
        .param("password", "Edm.String")
        .returns("Edm.String")
        (
            function(userID, password) {
                var uid = eval(userID), passwd = eval(password);
                return function() {
                    var self = this, context = this.context
                    var u = new JayStormApplication.User({ Id: uid});
                    context.Users.attach(u);
                    u.password = passwd;
                    context.saveChanges( function() {
                        self.success("OK");
                    });

                }

            }
        )

});



var c = require('express');
var app = c();

app.use(c.query());
app.use(c.logger());
app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, MaxDataServiceVersion, DataServiceVersion');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, MERGE, DELETE');
    if (req.method === 'OPTIONS') {
        res.end();
    } else {
        next();
    }
});

app.use(c.bodyParser());



app.use("/db", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/db", $data.JayService.createAdapter($data.JayStormAPI.Context, function() {
    return new $data.JayStormAPI.Context({name: "mongoDB", databaseName:"ApplicationDB", responseLimit:-1});
}));

app.use("/db2", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/db2", $data.JayService.createAdapter($data.JayStormAPI.Context, function() {
    return new $data.JayStormAPI.Context({name: "mongoDB", databaseName:"ApplicationDB", responseLimit:-1});
}));


app.use("/", c.static("/home/zpace/jaystorm-useradmin/client"));
app.listen(8181);
console.log("end");
