
$data.Class.define('$data.storageProviders.Facebook.FacebookProvider', $data.StorageProviderBase, null,
{
    constructor: function (cfg) {
        var provider = this;
        this.SqlCommands = [];
        this.context = {};
        this.providerConfiguration = $data.typeSystem.extend({
            FQLFormat: "format=json",
            FQLQueryUrl: "https://graph.facebook.com/fql?q="
        }, cfg);
        this.initializeStore = function (callBack) {
            callBack = $data.typeSystem.createCallbackSetting(callBack);
            callBack.success(this.context);
        };

    },
    AuthenticationProvider: { dataType: '$data.Authentication.AuthenticationBase', enumerable: false },
    supportedDataTypes: { value: [$data.Integer, $data.Number, $data.Date, $data.String, $data.Boolean, $data.Blob, $data.Array], writable: false },
    supportedFieldOperations: {
        value: {
            'contains': {
                dataType: $data.String,
                allowedIn: $data.Expressions.FilterExpression,
                mapTo: "strpos",
                parameters: [{ name: "@expression", dataType: $data.String }, { name: "strFragment", dataType: $data.String }],
                rigthValue: ') >= 0'
            },
            'startsWith': {
                dataType: $data.String,
                allowedIn: $data.Expressions.FilterExpression,
                mapTo: "strpos",
                parameters: [{ name: "@expression", dataType: $data.String }, { name: "strFragment", dataType: $data.String }],
                rigthValue: ') = 0'
            },
            'strpos': {
                dataType: $data.String,
                allowedIn: [$data.Expressions.FilterExpression, $data.Expressions.ProjectionExpression],
                mapTo: "strpos",
                parameters: [{ name: "@expression", dataType: $data.String }, { name: "strFragment", dataType: $data.String }]
            },
            'substr': {
                dataType: $data.String,
                allowedIn: [$data.Expressions.FilterExpression, $data.Expressions.ProjectionExpression],
                mapTo: "substr",
                parameters: [{ name: "@expression", dataType: $data.String }, { name: "startIdx", dataType: $data.Number }, { name: "length", dataType: $data.Number }]
            },
            'strlen': {
                dataType: $data.String,
                allowedIn: [$data.Expressions.FilterExpression, $data.Expressions.ProjectionExpression],
                mapTo: "strlen",
                parameters: [{ name: "@expression", dataType: $data.String }]
            }

        },
        enumerable: true,
        writable: true
    },
    supportedBinaryOperators: {
        value: {
            equal: { mapTo: ' = ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            notEqual: { mapTo: ' != ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            equalTyped: { mapTo: ' = ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            notEqualTyped: { mapTo: ' != ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            greaterThan: { mapTo: ' > ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            greaterThanOrEqual: { mapTo: ' >= ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },

            lessThan: { mapTo: ' < ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            lessThenOrEqual: { mapTo: ' <= ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            or: { mapTo: ' OR ', dataType: $data.Boolean, allowedIn: $data.Expressions.FilterExpression },
            and: { mapTo: ' AND ', dataType: $data.Booleanv },
            'in': { mapTo: ' IN ', dataType: $data.Boolean, resolvableType: [$data.Array, $data.Queryable], allowedIn: $data.Expressions.FilterExpression }
        }
    },
    supportedUnaryOperators: {
        value: {}
    },
    fieldConverter: {
        value: {
            fromDb: {
                '$data.Number': function (value) { return typeof value === "number" ? value : parseInt(value); },
                '$data.Integer': function (value) { return typeof value === "number" ? value : parseFloat(value); },
                '$data.String': function (value) { return value; },
                '$data.Date': function (value) { return new Date(typeof value === "string" ? parseInt(value) : value); },
                '$data.Boolean': function (value) { return !!value },
                '$data.Blob': function (value) { return value; },
                '$data.Array': function (value) { if (value === undefined) { return new $data.Array(); } return value; }
            },
            toDb: {
                '$data.Number': function (value) { return value; },
                '$data.Integer': function (value) { return value; },
                '$data.String': function (value) { return "'" + value + "'"; },
                '$data.Date': function (value) { return value ? value.valueOf() : null; },
                '$data.Boolean': function (value) { return value },
                '$data.Blob': function (value) { return value; },
                '$data.Array': function (value) { return '(' + value.join(', ') + ')'; }
            }
        }
    },
    supportedSetOperations: {
        value: {
            filter: {},
            map: {},
            forEach: {},
            toArray: {},
            single: {},
            take: {},
            skip: {},
            orderBy: {},
            orderByDescending: {},
            first: {}
        },
        enumerable: true,
        writable: true
    },
    executeQuery: function (query, callBack) {
        callBack = $data.typeSystem.createCallbackSetting(callBack);

        if (!this.AuthenticationProvider)
            this.AuthenticationProvider = new $data.Authentication.Anonymous({});

        var sql;
        try {
            sql = this._compile(query);
        } catch (e) {
            callBack.error(e);
            return;
        }

        var schema = query.defaultType;
        var ctx = this.context;

        var includes = [];
        if (!sql.selectMapping)
            this._discoverType('', schema, includes);

        var requestData = {
            url: this.providerConfiguration.FQLQueryUrl + encodeURIComponent(sql.queryText) + "&" + this.providerConfiguration.FQLFormat,
            dataType: "JSON",
            success: function (data, textStatus, jqXHR) {
                query.rawDataList = data.data;
                var compiler = Container.createModelBinderConfigCompiler(query, []);
                compiler.Visit(query.expression);
                callBack.success(query);
            },
            error: function (jqXHR, textStatus, errorThrow) {
                var errorData = {};
                try {
                    errorData = JSON.parse(jqXHR.responseText).error;
                } catch (e) {
                    errorData = errorThrow + ': ' + jqXHR.responseText;
                }
                callBack.error(errorData);
            }
        };

        this.context.prepareRequest.call(this, requestData);
        this.AuthenticationProvider.CreateRequest(requestData);
    },
    _discoverType: function (dept, type, result) {
        type.memberDefinitions.getPublicMappedProperties().forEach(function (memDef) {
            var type = Container.resolveType(memDef.dataType);

            if (type.isAssignableTo || type == Array) {
                var name = dept ? (dept + '.' + memDef.name) : memDef.name;

                if (type == Array || type.isAssignableTo($data.EntitySet)) {
                    if (memDef.inverseProperty)
                        type = Container.resolveType(memDef.elementType);
                    else
                        return;
                }

                result.push({ name: name, type: type })
                this._discoverType(name, type, result);
            }
        }, this);
    },
    _compile: function (query) {
        var sqlText = Container.createFacebookCompiler().compile(query);
        return sqlText;
    },
    getTraceString: function (query) {
        if (!this.AuthenticationProvider)
            this.AuthenticationProvider = new $data.Authentication.Anonymous({});

        var sqlText = this._compile(query);
        return sqlText;
    },
    setContext: function (ctx) {
        this.context = ctx;
    },
    saveChanges: function (callBack) {
        Guard.raise(new Exception("Not implemented", "Not implemented"));
    }
}, null);

$data.StorageProviderBase.registerProvider("Facebook", $data.storageProviders.Facebook.FacebookProvider);
