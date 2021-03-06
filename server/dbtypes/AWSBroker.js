﻿require('jaydata');
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

$data.Entity.extend("JayStorm.Provision.CuInventory", {
    Id: { type: "id", key: true, computed: true },
    AppId: { type: "string" },
    PublicAddress: { type: "string" },
    AppItemId: { type: "string" },
    //ex-awsid defalt ures, awsid ha kiesett
    AWSId: { type: "string" },
    ExAWSId: { type: "string" },
    Size: { type: "string" }, // micro
    Type: { type: "string" }, // reserved, ondemand, spot
    Used: { type: "boolean" },
    LastModified: { type: "datetime" }
});


$data.ServiceBase.extend("FuubarService", {

    myfunky: function () {
        return 5;
    }
});
//    MyFunction: $data.JayService.serviceFunction()
//                                .param("a","number")
//                                .returns("number")
//                                (function (a) {
//                                    var self = this;
//                                    return function (result, error) {
//                                        console.log(this);
//                                        self.CuInventories.add({ Type: 'adsasdasd' });
//                                        self.saveChanges().then(function () {
//                                            this.success(a);
//                                        }).fail(function() {
//                                            this.successerror("!");
//                                        });
//                                    }
//                                })
   
//});

