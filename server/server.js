#!/usr/bin/node-dev

/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/12/12
 * Time: 4:20 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/12/12
 * Time: 1:15 PM
 * To change this template use File | Settings | File Templates.
 */

require('connect');
require('jaydata');
require('q');


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


$data.Entity.extend('$data.JayStormAPI.EntityBase', {
    'Id':{ key:true, type:'id', nullable:false, computed:true },
    'creationDate': { type: 'date', $ui_visible:false },
    constructor: function() {
        this.creationDate = new Date();
    }
});

$data.Entity.extend('$data.JayStormAPI.Entity', {
    EntityID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    FullName: { type: 'string', required: true },
    Namespace: { type: 'string' },
    Fields: { type: 'Array', elementType: '$data.JayStormAPI.EntityField' },
    CreationDate: { type: 'date', computed: true },
    DatabaseID: {type: 'id', required: true}
});


$data.JayStormAPI.Entity.extend('$data.JayStormAPI.ComplexType', { });

$data.Entity.extend('$data.JayStormAPI.EntityField', {
    EntityFieldID: { type: 'id', key: true, computed: true },
    EntityID: { type: 'id', required: true },
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
    ExtensionAttributes: { type: 'Array', elementType: '$data.JayStormAPI.KeyValuePair' },
    DatabaseID: {type: 'id', required: true}
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
    //Parameters: { type: 'Array', elementType: '$data.ContextAPI.ServiceOperationParameter' },
    Method: { type: 'string' },
    Returns: { type: '$data.JayStormAPI.ServiceOperationReturnType' },
    Promise: { type: 'bool' },
    Publish: { type: 'bool' }
});

$data.Entity.extend('$data.JayStormAPI.EventHandler', {
    EventHandlerID: { type: 'id', key: true, computed: true },
    Type: { type: 'string', required: true },
    Handler: { type: 'string', required: true }/*,
     EntitySet: { type: '$data.ContextAPI.EntitySet', inverseProperty: 'EventHandlers', required: true }*/
});


$data.Entity.extend('$data.JayStormAPI.Database', {
    DatabaseID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    Publish: { type: 'bool' }
});

$data.Entity.extend('$data.JayStormAPI.EntitySet', {
    EntitySetID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    ElementType: { type: 'string', required: true },
    //ElementTypeID: { type: 'id', required: true },
    TableName: { type: 'string' },
    //EventHandlers: { type: 'Array', elementType: '$data.ContextAPI.EventHandler' },
    //ElementType: { type: '$data.ContextAPI.Entity', required: true },
    Publish: { type: 'bool' },
    DatabaseID: {type: 'id', required: true}
});

/*$data.Entity.extend('$data.ContextAPI.EntityContext', {
 EntityContextID: { type: 'id', key: true, computed: true },
 FullName: { type: 'string' },
 EntitySetID: { type: 'id' },
 EntitySet: { type: 'string' }
 })*/


$data.Class.define('$data.JayStormAPI.User', $data.Entity, null, {
    UserID: { type: 'id', key: true, computed: true },
    Login: { type: 'Edm.String' },
    Age: { type: 'Edm.Int32', required: true },
    FirstName: { type: 'Edm.String' },
    LastName:  { type: 'Edm.String' },
    Enabled: { type: 'Edm.Boolean' },
    Password: { type: 'Edm.String' },
    Roles: { type: 'Array', elementType: 'string', $source: 'Groups', $field: 'GroupID' },
    CreationDate: { type: 'date'}
});

$data.Class.define('$data.JayStormAPI.Group', $data.Entity, null , {
    GroupID: { type: 'id', key: true, computed: true },
    Name: { type: 'Edm.String' },
    Database: { type : 'string', require: true},
    CreationDate: { type: 'date', computed: true },
    constructor: function() {
        this.CreationDate = new Date();
    }
});




$data.Class.defineEx('$data.JayStormAPI.Context', [$data.EntityContext, $data.ServiceBase], null, {

    constructor: function() {
      this.EntitySets.beforeCreate = function() {
          console.dir(arguments[0]);
      }
    },

    Databases: { type: $data.EntitySet, elementType: $data.JayStormAPI.Database},
    Entities: { type: $data.EntitySet, elementType: $data.JayStormAPI.Entity },
    EntityFields: { type: $data.EntitySet, elementType: $data.JayStormAPI.EntityField },
    EventHandlers: { type: $data.EntitySet, elementType: $data.JayStormAPI.EventHandler },
    EntitySets: { type: $data.EntitySet, elementType: $data.JayStormAPI.EntitySet },
    ServiceParameters: { type: $data.EntitySet, elementType: $data.JayStormAPI.ServiceOperationParameter },
    ServiceOperations: { type: $data.EntitySet, elementType: $data.JayStormAPI.ServiceOperation },

    Users: {type: $data.EntitySet, elementType: $data.JayStormAPI.User},

    Groups: { type: $data.EntitySet, elementType: $data.JayStormAPI.Group},


    getGroups: $data.JayService.serviceFunction()
        .param("userID", "Edm.String")
        .returns("Edm.String")
        (
            function(userID, password) { }
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




$data.Class.define('$data.DB2.User', $data.Entity, null, {
    UserID: { type: 'id', key: true, computed: true },
    Login: { type: 'Edm.String' },
    Age: { type: 'Edm.Int32', required: true },
    FirstName: { type: 'Edm.String' },
    LastName:  { type: 'Edm.String' },
    Enabled: { type: 'Edm.Boolean' },
    Password: { type: 'Edm.String' },
    Roles: { type: 'Array', elementType: 'string', $source: 'Groups', $field: 'GroupID' },
    CreationDate: { type: 'date'}
});

$data.Class.define('$data.DB2.Account', $data.Entity, null, {
    UserID: { type: 'id', key: true, computed: true },
    Login: { type: 'Edm.String' },
    FirstName: { type: 'Edm.String' },
    LastName:  { type: 'Edm.String' },
    Roles: { type: 'Array', elementType: 'string', $source: 'Groups', $field: 'GroupID' },
    CreationDate: { type: 'date'}
});

$data.Class.defineEx('$data.DB2.Context', [$data.EntityContext, $data.ServiceBase], null, {
   Users: { type: $data.EntitySet, elementType: $data.DB2.User },
   Accounts: { type: $data.EntitySet, elementType: $data.DB2.Account }
});

//
//$data.EntityContext.extend('My.Context', {
//   Ents: {type: $data.EntitySet, elementType: My.Entity }
//});

//
//
//var context = new JayStormApplication.Context({name: "mongoDB", databaseName:"ApplicationDB"});
//
//context.onReady( function() {
//    context.Users.add({login: "zpace"});
//    context.saveChanges(function() {
//        console.log("done");
//        context.Users.length( function(x) {
//            console.log("Total items: " + x);
//        })
//    })
//});

var c = require('connect');
var app = c();

app.use(c.query());
//app.use(function(req, res, next) {
//   console.log("!!!");
//    console.dir(req);
//   next();
//});
app.use("/db", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/db", $data.JayService.createAdapter($data.JayStormAPI.Context, function() {
    return new $data.JayStormAPI.Context({name: "mongoDB", databaseName:"ApplicationDB"});
}));

app.use("/db2", $data.JayService.OData.BatchProcessor.connectBodyReader);
app.use("/db2", $data.JayService.createAdapter($data.DB2.Context, function() {
    return new $data.DB2.Context({name: "mongoDB", databaseName:"DB2"});
}));


app.use("/", c.static("../client"));
app.listen(8080);
console.log("end");
