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
            columnInfo.value(parseInt(val));
        });

        return model;
    },
    '$data.Number': function (columnInfo) {
        var model = {
            Value: ko.observable(columnInfo.value()),
            templateName: 'jay-data-grid-$data.Number-default'
        }

        model.Value.subscribe(function (val) {
            columnInfo.value(parseFloat(val));
        });

        return model;
    },
    '$data.Date': function (columnInfo) {
        var dateVal = columnInfo.value() || new Date();
        var dateStr = this.numComplete(dateVal.getFullYear()) + "-" + this.numComplete(dateVal.getMonth() + 1) + "-" + this.numComplete(dateVal.getDate());
        //var timeStr = this.numComplete(dateVal.getHours()) + ":" + this.numComplete(dateVal.getMinutes()) + ":" + this.numComplete(dateVal.getSeconds());
        var timeStr = dateVal.toLocaleTimeString();

        var dispDate = this.displayDate(dateVal);
        var model = {
            Date: ko.observable(dateStr),
            Time: ko.observable(timeStr),
            Display: {
                Date: ko.observable(dispDate.Date),
                Time: ko.observable(dispDate.Time),
                Offset: ko.observable(dispDate.Offset),
                OffsetPoz: ko.observable(dateVal.getTimezoneOffset() <= 0 ? '+' : '')
            },
            templateName: 'jay-data-grid-$data.Date-default'
        }

        columnInfo.value.subscribe(function (val) {
            var newDate = this.displayDate(val);
            model.Display.Date = ko.observable(newDate.Date);
            model.Display.Time = ko.observable(newDate.Time);
            model.Display.Offset = ko.observable(newDate.Offset);
            model.Display.OffsetPoz = ko.observable(val.getTimezoneOffset() <= 0 ? '+' : '');
        });

        model.Date.subscribe(function (val) {
            var date = columnInfo.value();
            var newdate = new Date(val);

            date.setYear(newdate.getFullYear());
            date.setMonth(newdate.getMonth());
            date.setDate(newdate.getDate());

            columnInfo.value(date);
        });

        model.Time.subscribe(function (val) {
            var time = new Date('0001/01/01 ' + val);
            var date = columnInfo.value();

            date.setHours(time.getHours());
            date.setMinutes(time.getMinutes());
            date.setSeconds(time.getSeconds());

            columnInfo.value(date);
        });

        return model;
    },
    numComplete: function (int) {
        switch (true) {
            case int < 10 && int >= 0:
                return '0' + int;
            case int > -10 && int < 0:
                return '-0' + int*(-1);
            default:
                return int;

        }
        return int < 10 ? '0' + int : int;
    },
    displayDate: function(date){
        return {
            Date: this.numComplete(date.getMonth() + 1) + "/" + this.numComplete(date.getDate()) + "/" + this.numComplete(date.getFullYear()),
            Time: date.toLocaleTimeString(),
            Offset: this.numComplete(Math.round(date.getTimezoneOffset() / -60)) + ":" + this.numComplete(date.getTimezoneOffset() % -60)
        }
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