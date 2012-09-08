$data.Class.define("$data.JayStormClient.EditorModelBase", null, null, {
    getModel: function (columnInfo) {

        var typeName = Container.resolveName(columnInfo.metadata.type)
        if (typeName in this) {
            return this[typeName].call(this, columnInfo);
        }

        return {};
    },

    '$data.Integer': function (columnInfo) {
        var model = {
            Value: ko.observable(columnInfo.value()),
            templateName: 'jay-data-grid-$data.Integer-default'
        }

        model.Value.subscribe(function (val) {
            columnInfo.Value(parseInt(val));
        });

        return model;
    },
    '$data.Date': function (columnInfo) {
        var dateVal = columnInfo.value() || new Date(0);
        var dateStr = dateVal.getFullYear() + "/" + (dateVal.getMonth() + 1) + "/" + dateVal.getDate();
        var timeStr = dateVal.getHours() + ":" + dateVal.getMinutes() + ":" + dateVal.getSeconds() + "." + dateVal.getMilliseconds();


        var model = {
            Date: ko.observable(dateStr),
            Time: ko.observable(timeStr),
            templateName: 'jay-data-grid-$data.Date-default'
        }

        model.Date.subscribe(function (val) {
            var date = new Date(val);
            columnInfo.value(date);
        });

        model.Time.subscribe(function (val) {
            var time = new Date('0001/01/01 ' + val);
            var date = columnInfo.value();

            date.setHours(time.getHours());
            date.setMinutes(time.getMinutes());
            date.setSeconds(time.getSeconds());
            date.setMilliseconds(time.getMilliseconds());

            columnInfo.value(date);
        });

        return model;
    },
    '$data.Geography': function (columnInfo) {
        var geoVal = columnInfo.value() || new $data.Geography(0,0);
        var model = {
            Longitude: ko.observable(geoVal.longitude),
            Latitude: ko.observable(geoVal.latitude),
            templateName: 'jay-data-grid-$data.Integer-default'
        }

        model.Longitude.subscribe(function (val) {
            var geo = columnInfo.value();
            geo.longitude = parseFloat(val);
            columnInfo.value(geo);
        });
        model.Latitude.subscribe(function (val) {
            var geo = columnInfo.value();
            geo.latitude = parseFloat(val);
            columnInfo.value(geo);
        });

        return model;
    }
});