$data.Class.define('$data.StorageModel', null, null, {
    constructor: function () {
        ///<field name="LogicalType" type="$data.Entity">User defined type</field>
        this.ComplexTypes = [];
        this.Associations = [];
    },
    LogicalType: {},
    LogicalTypeName: {},
    PhysicalType: {},
    PhysicalTypeName: {},
    EventHandlers: {},
    TableName: {},
    ComplexTypes: {},
    Associations: {},
    EntitySetReference: {}
}, null);
$data.Class.define('$data.Association', null, null, {
    constructor: function (initParam) {
        if (initParam) {
            this.From = initParam.From;
            this.FromType = initParam.FromType;
            this.FromMultiplicity = initParam.FromMultiplicity;
            this.FromPropertyName = initParam.FromPropertyName;
            this.To = initParam.To;
            this.ToType = initParam.ToType;
            this.ToMultiplicity = initParam.ToMultiplicity;
            this.ToPropertyName = initParam.ToPropertyName;
        }
    },
    From: {},
    FromType: {},
    FromMultiplicity: {},
    FromPropertyName: {},
    To: {},
    ToType: {},
    ToMultiplicity: {},
    ToPropertyName: {},
    ReferentialConstraint: {}
}, null);
$data.Class.define('$data.ComplexType', $data.Association, null, {}, null);

$data.Class.define('$data.EntityContext', null, null,
{
    constructor: function (storageProviderCfg){
        /// <description>Provides facilities for querying and working with entity data as objects.</description>
        ///<param name="storageProviderCfg" type="Object">Storage provider specific configuration object.</param>

        //Initialize properties
        this.lazyLoad = false;
        this.trackChanges = false;
        this._entitySetReferences = {};
        this._storageModel = [];

        var ctx = this;
        this._storageModel.getStorageModel = function (typeName) {
            var resolvedType = Container.resolveType(typeName);

            for (var i = 0; i < ctx._storageModel.length; i++) {
                var s = ctx._storageModel[i];
                if (s.LogicalType === resolvedType)
                    return s;
            }

            //return ctx._storageModel.filter(function (s) { return s.LogicalType === resolvedType; })[0];
        };
        if (typeof storageProviderCfg.name === 'string') {
            var tmp = storageProviderCfg.name;
            storageProviderCfg.name = [tmp];
        }
        var i = 0, providerType;
        var providerList = [].concat(storageProviderCfg.name);
        var callBack = $data.typeSystem.createCallbackSetting({ success: this._successInitProvider });
        $data.StorageProviderLoader.load(providerList, {
            success: function (providerType) {
                ctx.storageProvider = new providerType(storageProviderCfg, ctx);
                ctx.storageProvider.setContext(ctx);
                ctx.stateManager = new $data.EntityStateManager(ctx);

                if (storageProviderCfg.name in ctx.getType()._storageModelCache) {
                    ctx._storageModel = ctx.getType()._storageModelCache[storageProviderCfg.name];
                } else {
                    ctx._initializeStorageModel();
                    ctx.getType()._storageModelCache[storageProviderCfg.name] = ctx._storageModel;
                }

                ctx._initializeEntitySets(ctx.constructor);
                if (storageProviderCfg && storageProviderCfg.user) Object.defineProperty(ctx, 'user', { value: storageProviderCfg.user, enumerable: true });
                if (storageProviderCfg && storageProviderCfg.checkPermission) Object.defineProperty(ctx, 'checkPermission', { value: storageProviderCfg.checkPermission, enumerable: true });

                ctx._isOK = false;
                if (ctx.storageProvider) {
                    ctx.storageProvider.initializeStore(callBack);
                }
            },
            error: function () {
                callBack.error('Provider fallback failed!');
            }
        });



        this.addEventListener = function(eventName, fn) {
            var delegateName = "on" + eventName;
            if (!(delegateName in this)) {
                this[delegateName] = new $data.Event(eventName, this);
            }
            this[delegateName].attach(fn);
        };

        this.removeEventListener = function(eventName, fn) {
            var delegateName = "on" + eventName;
            if (!(delegateName in this)) {
                return;
            }
            this[delegateName].attach(fn);
        };

        this.raiseEvent = function(eventName, data) {
            var delegateName = "on" + eventName;
            if (!(delegateName in this)) {
                return;
            }
            this[delegateName].fire(data);
        };
        /*
        while (!(providerType = $data.StorageProviderBase.getProvider(storageProviderCfg.name[i])) && i < storageProviderCfg.name.length) i++;
        if (providerType){
            this.storageProvider = new providerType(storageProviderCfg, this);
            this.storageProvider.setContext(this);
            this.stateManager = new $data.EntityStateManager(this);

            if (storageProviderCfg.name in this.getType()._storageModelCache){
                this._storageModel = this.getType()._storageModelCache[storageProviderCfg.name];
            }else{
                this._initializeStorageModel();
                this.getType()._storageModelCache[storageProviderCfg.name] = this._storageModel;
            }
        }else{
            Guard.raise(new Exception("Provider fallback failed!", "Not Found"));
        }
        this._initializeEntitySets(this.constructor);
        this._user = (storageProviderCfg && storageProviderCfg.user) || user;

        this._isOK = false;
        var callBack = $data.typeSystem.createCallbackSetting({ success: this._successInitProvider });
        if (this.storageProvider){
            this.storageProvider.initializeStore(callBack);
        }
        */
    },
    getDataType: function (dataType) {
        // Obsolate
        if (typeof dataType == "string") {
            var memDef_dataType = this[dataType];
            if (memDef_dataType === undefined || memDef_dataType === null) { memDef_dataType = eval(dataType); }
            return memDef_dataType;
        }
        return dataType;
    },
    _initializeEntitySets: function (ctor) {
        /*if (ctor.inheritsFrom !== null && ctor.inheritsFrom !== undefined) {
            this._initializeEntitySets(ctor.inheritsFrom);
        }*/
        //this._storageModel.forEach(function (storageModel) {
        for (var i = 0, l = this._storageModel.length; i < l; i++){
            var storageModel = this._storageModel[i];
            this[storageModel.ItemName] = new $data.EntitySet(storageModel.LogicalType, this, storageModel.ItemName, storageModel.EventHandlers);
            var sm = this[storageModel.ItemName];
            sm.name = storageModel.ItemName;
            sm.tableName = storageModel.TableName;
            sm.eventHandlers = storageModel.EventHandlers;
            this._entitySetReferences[storageModel.LogicalType.name] = sm;

            storageModel.EntitySetReference = sm;
        }
        //}, this);
    },
    _initializeStorageModel: function () {

        //this.getType().memberDefinitions.asArray().forEach(function (item) {
        var _memDefArray = this.getType().memberDefinitions.asArray();
        for (var i = 0; i < _memDefArray.length; i++) {
            var item = _memDefArray[i];



            if ('dataType' in item) {
                var itemResolvedDataType = Container.resolveType(item.dataType);
                if (itemResolvedDataType && itemResolvedDataType.isAssignableTo && itemResolvedDataType.isAssignableTo($data.EntitySet)) {
                    var storageModel = new $data.StorageModel();
                    storageModel.TableName = item.tableName || item.name;
                    storageModel.ItemName = item.name;
                    storageModel.LogicalType = Container.resolveType(item.elementType);
                    storageModel.LogicalTypeName = storageModel.LogicalType.name;
                    storageModel.PhysicalTypeName = $data.EntityContext._convertLogicalTypeNameToPhysical(storageModel.LogicalTypeName);
                    if (item.beforeCreate) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.beforeCreate = item.beforeCreate;
                    }
                    if (item.beforeRead) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.beforeRead = item.beforeRead;
                    }
                    if (item.beforeUpdate) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.beforeUpdate = item.beforeUpdate;
                    }
                    if (item.beforeDelete) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.beforeDelete = item.beforeDelete;
                    }
                    if (item.afterCreate) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.afterCreate = item.afterCreate;
                    }
                    if (item.afterRead) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.afterRead = item.afterRead;
                    }
                    if (item.afterUpdate) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.afterUpdate = item.afterUpdate;
                    }
                    if (item.afterDelete) {
                        if (!storageModel.EventHandlers) storageModel.EventHandlers = {};
                        storageModel.EventHandlers.afterDelete = item.afterDelete;
                    }
                    this._storageModel.push(storageModel);
                }
            }
        }
        //}, this);

        if (typeof intellisense !== 'undefined')
            return;

        //this._storageModel.forEach(function (storageModel) {
        for (var i = 0; i < this._storageModel.length; i++) {
            var storageModel = this._storageModel[i];

            ///<param name="storageModel" type="$data.StorageModel">Storage model item</param>
            var dbEntityInstanceDefinition = {};

            storageModel.Associations = storageModel.Associations || [];
            storageModel.ComplexTypes = storageModel.ComplexTypes || [];
            //storageModel.LogicalType.memberDefinitions.getPublicMappedProperties().forEach(function (memDef) {
            for (var j = 0; j < storageModel.LogicalType.memberDefinitions.getPublicMappedProperties().length; j++) {
                var memDef = storageModel.LogicalType.memberDefinitions.getPublicMappedProperties()[j];
                ///<param name="memDef" type="MemberDefinition">Member definition instance</param>

                var memDefResolvedDataType = Container.resolveType(memDef.dataType);

                if ((this.storageProvider.supportedDataTypes.indexOf(memDefResolvedDataType) > -1) && Object.isNullOrUndefined(memDef.inverseProperty)) {
                    //copy member definition
                    var t = JSON.parse(JSON.stringify(memDef));
                    //change datatype to resolved type
                    t.dataType = memDefResolvedDataType;
                    dbEntityInstanceDefinition[memDef.name] = t;
                    continue;
                }

                this._buildDbType_navigationPropertyComplite(memDef, memDefResolvedDataType, storageModel);



                //var memDef_dataType = this.getDataType(memDef.dataType);
                if ((memDefResolvedDataType === $data.Array || (memDefResolvedDataType.isAssignableTo && memDefResolvedDataType.isAssignableTo($data.EntitySet))) && (memDef.inverseProperty && memDef.inverseProperty !== '$$unbound')) {
                    this._buildDbType_Collection_OneManyDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                } else {
                    if (memDef.inverseProperty) {
                        if (memDef.inverseProperty === '$$unbound') {
                            //member definition is navigation but not back reference
                            if (memDefResolvedDataType === $data.Array) {
                                this._buildDbType_Collection_OneManyDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                            } else {
                                this._buildDbType_ElementType_OneManyDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                            }
                        } else {
                            //member definition is navigation property one..one or one..many case
                            var fields = memDefResolvedDataType.memberDefinitions.getMember(memDef.inverseProperty);
                            if (fields) {
                                if (fields.elementType) {
                                    //member definition is one..many connection
                                    var referealResolvedType = Container.resolveType(fields.elementType);
                                    if (referealResolvedType === storageModel.LogicalType) {
                                        this._buildDbType_ElementType_OneManyDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                                    } else {
                                        if (typeof intellisense === 'undefined') {
                                            Guard.raise(new Exception('Inverse property not valid, refereed item element type not match: ' + storageModel.LogicalTypeName, ', property: ' + memDef.name));
                                        }
                                    }
                                } else {
                                    //member definition is one..one connection
                                    this._buildDbType_ElementType_OneOneDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                                }
                            } else {
                                if (typeof intellisense === 'undefined') {
                                    Guard.raise(new Exception('Inverse property not valid'));
                                }
                            }
                        }
                    } else {
                        //member definition is a complex type
                        this._buildDbType_addComplexTypePropertyDefinition(dbEntityInstanceDefinition, storageModel, memDefResolvedDataType, memDef);
                    }
                }
            }
            //}, this);
            this._buildDbType_modifyInstanceDefinition(dbEntityInstanceDefinition, storageModel, this);
            var dbEntityClassDefinition = {};
            dbEntityClassDefinition.convertTo = this._buildDbType_generateConvertToFunction(storageModel, this);
            this._buildDbType_modifyClassDefinition(dbEntityClassDefinition, storageModel, this);

            //create physical type
            storageModel.PhysicalType = $data.Class.define(storageModel.PhysicalTypeName, $data.Entity, null, dbEntityInstanceDefinition, dbEntityClassDefinition);
        }
        //}, this);
    },
    _buildDbType_navigationPropertyComplite: function (memDef, memDefResolvedDataType, storageModel) {
        if (!memDef.inverseProperty) {
            var refMemDefs = null;
            if (memDefResolvedDataType === $data.Array || (memDefResolvedDataType.isAssignableTo && memDefResolvedDataType.isAssignableTo($data.EntitySet))) {
                var refStorageModel = this._storageModel.getStorageModel(Container.resolveType(memDef.elementType));
                if (refStorageModel) {
                    refMemDefs = [];
                    var pubDefs = refStorageModel.LogicalType.memberDefinitions.getPublicMappedProperties();
                    for (var i = 0; i < pubDefs.length; i++) {
                        var m = pubDefs[i];
                        if ((m.inverseProperty == memDef.name) && (Container.resolveType(m.dataType) === Container.resolveType(storageModel.LogicalType)))
                            refMemDefs.push(m);
                    }

                    //refMemDefs = refStorageModel.LogicalType.memberDefinitions.getPublicMappedProperties().filter(function (m) {
                    //    return ((m.inverseProperty == memDef.name) && (Container.resolveType(m.dataType) === Container.resolveType(storageModel.LogicalType)))
                    //});
                }
            } else {
                var refStorageModel = this._storageModel.getStorageModel(memDefResolvedDataType);
                if (refStorageModel) {
                    refMemDefs = [];
                    var pubDefs = refStorageModel.LogicalType.memberDefinitions.getPublicMappedProperties();
                    for (var i = 0; i < pubDefs.length; i++) {
                        var m = pubDefs[i];
                        if(m.elementType && ((m.inverseProperty == memDef.name) && (Container.resolveType(m.elementType) === storageModel.LogicalType)))
                            refMemDefs.push(m);
                        else if ((m.inverseProperty == memDef.name) && (Container.resolveType(m.dataType) === storageModel.LogicalType))
                            refMemDefs.push(m);
                    }


                    //refMemDefs = refStorageModel.LogicalType.memberDefinitions.getPublicMappedProperties().filter(function (m) {
                    //    if (m.elementType) {
                    //        return ((m.inverseProperty == memDef.name) && (Container.resolveType(m.elementType) === storageModel.LogicalType))
                    //    } else {
                    //        return ((m.inverseProperty == memDef.name) && (Container.resolveType(m.dataType) === storageModel.LogicalType))
                    //    }

                    //});
                }
            }
            if (refMemDefs) {
                if (refMemDefs.length > 1) {
                    if (typeof intellisense !== 'undefined') {
                        Guard.raise(new Exception('More than one inverse property refer to this member definition: ' + memDef.name + ', type: ' + Container.resolveName(storageModel.LogicalType)));
                    }
                }
                var refMemDef = refMemDefs.pop();
                if (refMemDef) {
                    memDef.inverseProperty = refMemDef.name;
                }
            }
        } else {
            var refStorageModel = null;
            if (memDefResolvedDataType === $data.Array || (memDefResolvedDataType.isAssignableTo && memDefResolvedDataType.isAssignableTo($data.EntitySet))) {
                refStorageModel = this._storageModel.getStorageModel(Container.resolveType(memDef.elementType));

            } else {
                refStorageModel = this._storageModel.getStorageModel(memDefResolvedDataType);
            }

            var p = refStorageModel.LogicalType.memberDefinitions.getMember(memDef.inverseProperty);
            if (p) {
                if (p.inverseProperty) {
                    if (p.inverseProperty != memDef.name) {
                        if (typeof intellisense === 'undefined') {
                            Guard.raise(new Exception('Inverse property mismatch'));
                        }
                    }
                } else {
                    p.inverseProperty = memDef.name;
                }
            }

        }
    },
    _buildDbType_generateConvertToFunction: function (storageModel) { return function (instance) { return instance; }; },
    _buildDbType_modifyInstanceDefinition: function (instanceDefinition, storageModel) { return; },
    _buildDbType_modifyClassDefinition: function (classDefinition, storageModel) { return; },
    _buildDbType_addComplexTypePropertyDefinition: function (dbEntityInstanceDefinition, storageModel, memDef_dataType, memDef) {
        this._addNavigationPropertyDefinition(dbEntityInstanceDefinition, memDef, memDef.name, $data.MemberTypes.complexProperty);
        var complexType = this._createComplexElement(storageModel.LogicalType, "", memDef.name, memDef_dataType, "", "");
        storageModel.ComplexTypes[memDef.name] = complexType;
        storageModel.ComplexTypes.push(complexType);
    },
    _buildDbType_Collection_OneManyDefinition: function (dbEntityInstanceDefinition, storageModel, memDef_dataType, memDef) {
        var refereedType = Container.resolveType(memDef.elementType);
        if (refereedType === undefined || refereedType === null) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("Element type definition error", "Field definition", memDef));
            }
        }
        var refereedStorageModel;
        for (var i = 0; i < this._storageModel.length; i++) {
            var s = this._storageModel[i];
            if (s.LogicalType === refereedType) {
                refereedStorageModel = s;
                break;
            }
        }
        //var refereedStorageModel = this._storageModel.filter(function (s) { return s.LogicalType === refereedType; })[0];
        if (!refereedStorageModel) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("No EntitySet definition for the following element type", "Field definition", memDef));
            }
        }

        this._addNavigationPropertyDefinition(dbEntityInstanceDefinition, memDef, memDef.name);
        var associationType = memDef.inverseProperty === '$$unbound' ? '$$unbound' : '0..1';
        var association = this._addAssociationElement(storageModel.LogicalType, associationType, memDef.name, refereedStorageModel.LogicalType, "*", memDef.inverseProperty);
        storageModel.Associations[memDef.name] = association;
        storageModel.Associations.push(association);
    },
    _buildDbType_ElementType_OneManyDefinition: function (dbEntityInstanceDefinition, storageModel, memDef_dataType, memDef) {
        var refereedType = Container.resolveType(memDef.dataType);
        if (refereedType === undefined || refereedType === null) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("Element type definition error", "Field definition", memDef));
            }
        }
        var refereedStorageModel;
        for (var i = 0; i < this._storageModel.length; i++) {
            var s = this._storageModel[i];
            if (s.LogicalType === refereedType) {
                refereedStorageModel = s;
                break;
            }
        }
        //var refereedStorageModel = this._storageModel.filter(function (s) { return s.LogicalType === refereedType; })[0];
        if (!refereedStorageModel) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("No EntitySet definition for the following element type", "Field definition", memDef));
            }
        }

        this._addNavigationPropertyDefinition(dbEntityInstanceDefinition, memDef, memDef.name);
        var associationType = memDef.inverseProperty === '$$unbound' ? '$$unbound' : '*';
        var association = this._addAssociationElement(storageModel.LogicalType, associationType, memDef.name, refereedStorageModel.LogicalType, "0..1", memDef.inverseProperty);
        storageModel.Associations[memDef.name] = association;
        storageModel.Associations.push(association);
    },
    _buildDbType_ElementType_OneOneDefinition: function (dbEntityInstanceDefinition, storageModel, memDef_dataType, memDef) {
        var refereedType = Container.resolveType(memDef.dataType);
        if (refereedType === undefined || refereedType === null) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("Element type definition error", "Field definition", memDef));
            }
        }
        var refereedStorageModel;
        for (var i = 0; i < this._storageModel.length; i++) {
            var s = this._storageModel[i];
            if (s.LogicalType === refereedType) {
                refereedStorageModel = s;
                break;
            }
        }
        //var refereedStorageModel = this._storageModel.filter(function (s) { return s.LogicalType === refereedType; })[0];
        if (!refereedStorageModel) {
            if (typeof intellisense === 'undefined') {
                Guard.raise(new Exception("No EntitySet definition following element type", "Field definition", memDef));
            }
        }

        var refereedMemberDefinition = refereedStorageModel.LogicalType.memberDefinitions.getMember(memDef.inverseProperty);
        if (!refereedMemberDefinition.required && !memDef.required) { if (typeof intellisense === 'undefined') { if (typeof intellisense === 'undefined') { Guard.raise(new Exception('In one to one connection, one side must required!', 'One to One connection', memDef)); } } }

        this._addNavigationPropertyDefinition(dbEntityInstanceDefinition, memDef, memDef.name);

        association = this._addAssociationElement(storageModel.LogicalType,
                                                 memDef.required ? "0..1" : "1",
                                                 memDef.name,
                                                 refereedStorageModel.LogicalType,
                                                 memDef.required ? "1" : "0..1",
                                                 memDef.inverseProperty);
        storageModel.Associations[memDef.name] = association;
        storageModel.Associations.push(association);
    },
    _addNavigationPropertyDefinition: function (definition, member, associationName, kind) {
        var t = JSON.parse(JSON.stringify(member));
        t.dataType = $data.EntitySet;
        t.notMapped = true;
        t.kind = kind ? kind : $data.MemberTypes.navProperty;
        t.association = associationName;
        definition[member.name] = t;
    },
    _addAssociationElement: function (fromType, fromMultiplicity, fromPropName, toType, toMultiplicity, toPropName) {
        return new $data.Association({
            From: fromType.name,
            FromType: fromType,
            FromMultiplicity: fromMultiplicity,
            FromPropertyName: fromPropName,
            To: toType.name,
            ToType: toType,
            ToMultiplicity: toMultiplicity,
            ReferentialConstraint: [],
            ToPropertyName: toPropName
        });
    },
    _createComplexElement: function (fromType, fromMultiplicity, fromPropName, toType, toMultiplicity, toPropName) {
        return new $data.ComplexType({
            From: fromType.name,
            FromType: fromType,
            FromMultiplicity: fromMultiplicity,
            FromPropertyName: fromPropName,
            To: toType.name,
            ToType: toType,
            ToMultiplicity: toMultiplicity,
            ReferentialConstraint: [],
            ToPropertyName: toPropName
        });
    },

    _successInitProvider: function (result) {
        if (result != undefined && result._isOK != undefined) {
            result._isOK = true;
            if (result.onReadyFunction) {
                result.onReadyFunction(result);
            }
        }

    },
    onReady: function (fn) {
        /// <signature>
        ///     <summary>
        ///         Sets the callback function to be called when the initialization of the EntityContext has successfully finished.
        ///     </summary>
        ///     <param name="successCallback" type="Function">
        ///         <summary>Success callback</summary>
        ///         <param name="entityContext" type="$data.EntityContext">Current entityContext object</param>
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Sets the callback functions to be called when the initialization of the EntityContext has finished.
        ///     </summary>
        ///     <param name="callbacks" type="Object">
        ///         Success and error callbacks definition.
        ///         Example: [code]{ success: function(db) { .. }, error: function() { .. } }[/code]
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        var pHandler = new $data.PromiseHandler();
        var callBack = pHandler.createCallback(fn);
        this.onReadyFunction = callBack.success;
        if (this._isOK) {
            callBack.success(this);
        }
        return pHandler.getPromise();
    },
    getEntitySetFromElementType: function (elementType) {
        /// <signature>
        ///     <summary>Gets the matching EntitySet for an element type.</summary>
        ///     <param name="elementType" type="Function" />
        ///     <returns type="$data.EntitySet" />
        /// </signature>
        /// <signature>
        ///     <summary>Gets the matching EntitySet for an element type.</summary>
        ///     <param name="elementType" type="String" />
        ///     <returns type="$data.EntitySet" />
        /// </signature>
        var result = this._entitySetReferences[elementType];
        if (!result) {
            try {
                result = this._entitySetReferences[eval(elementType).name];
            } catch (ex) { }
        }
        return result;
    },
    executeQuery: function (queryable, callBack) {
        var query = new $data.Query(queryable.expression, queryable.defaultType, this);
        callBack = $data.typeSystem.createCallbackSetting(callBack);
        var that = this;
        var clbWrapper = {};
        clbWrapper.success = function (query) {
            query.buildResultSet(that);
            var successResult;
            
            if (query.expression.nodeType === $data.Expressions.ExpressionType.Single ||
                query.expression.nodeType === $data.Expressions.ExpressionType.Count ||
                query.expression.nodeType === $data.Expressions.ExpressionType.BatchDelete ||
                query.expression.nodeType === $data.Expressions.ExpressionType.Some ||
                query.expression.nodeType === $data.Expressions.ExpressionType.Every) {
                if (query.result.length !== 1) {
                    callBack.error(new Exception('result count failed'));
                    return;
                }

                successResult = query.result[0];
            } else if (query.expression.nodeType === $data.Expressions.ExpressionType.First) {
                if (query.result.length === 0) {
                    callBack.error(new Exception('result count failed'));
                    return;
                }

                successResult = query.result[0];
            } else {
                successResult = query.result;
            }
            
            var readyFn = function(){
                callBack.success(successResult);
            };
            
            var i = 0;
            var sets = query.getEntitySets();
            
            var callbackFn = function(){
                var es = sets[i];
                if (es.afterRead){
                    i++;
                    var r = es.afterRead.call(this, successResult, sets, query);
                    if (typeof r === 'function'){
                        r.call(this, i < sets.length ? callbackFn : readyFn, successResult, sets, query);
                    }else{
                        if (i < sets.length){
                            callbackFn();
                        }else readyFn();
                    }
                }else readyFn();
            }
            
            if (sets.length) callbackFn();
            else readyFn();
        };
        
        clbWrapper.error = callBack.error;
        var sets = query.getEntitySets();
        
        var authorizedFn = function(){
            var ex = true;
            var wait = false;
            var ctx = that;
            
            var readyFn = function(cancel){
                if (cancel === false) ex = false;
                
                if (ex) ctx.storageProvider.executeQuery(query, clbWrapper);
                else{
                    query.rawDataList = [];
                    query.result = [];
                    clbWrapper.success(query);
                }
            };
            
            var i = 0;
            var callbackFn = function(cancel){
                if (cancel === false) ex = false;
                
                var es = sets[i];
                if (es.beforeRead){
                    i++;
                    var r = es.beforeRead.call(this, sets, query);
                    if (typeof r === 'function'){
                        r.call(this, (i < sets.length && ex) ? callbackFn : readyFn, sets, query);
                    }else{
                        if (r === false) ex = false;
                        
                        if (i < sets.length && ex){
                            callbackFn();
                        }else readyFn();
                    }
                }else readyFn();
            };
            
            if (sets.length) callbackFn();
            else readyFn();
        };
        
        if (this.user && this.checkPermission){
            this.checkPermission(query.expression.nodeType === $data.Expressions.ExpressionType.BatchDelete ? $data.Access.DeleteBatch : $data.Access.Read, this.user, sets, {
                success: authorizedFn,
                error: clbWrapper.error
            });
        }else authorizedFn();
    },
    saveChanges: function (callback) {
        /// <signature>
        ///     <summary>
        ///         Saves the changes made to the context.
        ///     </summary>
        ///     <param name="successCallback" type="Function">
        ///         <summary>Success callback</summary>
        ///         <param name="entityContext" type="$data.EntityContext">Current entityContext object</param>
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Saves the changes made to the context.
        ///     </summary>
        ///     <param name="callbacks" type="Object">
        ///         Success and error callbacks definition.
        ///         Example: [code]{ success: function(db) { .. }, error: function() { .. } }[/code]
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        var changedEntities = [];
        var trackedEntities = this.stateManager.trackedEntities;
        var pHandler = new $data.PromiseHandler();
        var clbWrapper = pHandler.createCallback(callback);
        var pHandlerResult = pHandler.getPromise();

        var skipItems = [];
        while (trackedEntities.length > 0) {
            var additionalEntities = [];
            //trackedEntities.forEach(function (entityCachedItem) {
            for (var i = 0; i < trackedEntities.length; i++) {
                var entityCachedItem = trackedEntities[i];

                var sModel = this._storageModel.getStorageModel(entityCachedItem.data.getType());
                if (entityCachedItem.data.entityState == $data.EntityState.Unchanged) {
                    entityCachedItem.skipSave = true;
                    skipItems.push(entityCachedItem.data);
                } else {
                    if (entityCachedItem.data.entityState == $data.EntityState.Modified) {
                        if (entityCachedItem.data.changedProperties) {
                            var changeStoredProperty = entityCachedItem.data.changedProperties.some(function (p) {
                                var pMemDef = sModel.PhysicalType.memberDefinitions.getMember(p.name);
                                if (pMemDef.kind == $data.MemberTypes.navProperty) {
                                    var a = sModel.Associations[pMemDef.association];
                                    var multiplicity = a.FromMultiplicity + a.ToMultiplicity;
                                    return ((multiplicity == '*0..1') || (multiplicity == '0..11'))
                                }
                                return true;
                            });
                            if (!changeStoredProperty) {
                                entityCachedItem.skipSave = true;
                                skipItems.push(entityCachedItem.data);
                            }
                        }
                    }
                }

                var navigationProperties = [];
                var smPhyMemDefs = sModel.PhysicalType.memberDefinitions.asArray();
                for (var ism = 0; ism < smPhyMemDefs.length; ism++) {
                    var p = smPhyMemDefs[ism];
                    if (p.kind == $data.MemberTypes.navProperty)
                        navigationProperties.push(p);
                }
                //var navigationProperties = sModel.PhysicalType.memberDefinitions.asArray().filter(function (p) { return p.kind == $data.MemberTypes.navProperty; });
                //navigationProperties.forEach(function (navProp) {
                for (var j = 0; j < navigationProperties.length; j++) {
                    var navProp = navigationProperties[j];

                    var association = sModel.Associations[navProp.name]; //eg.:"Profile"
                    var name = navProp.name; //eg.: "Profile"
                    var navPropertyName = association.ToPropertyName; //eg.: User

                    var connectedDataList = [].concat(entityCachedItem.data[name]);
                    //connectedDataList.forEach(function (data) {
                    for (var k = 0; k < connectedDataList.length; k++) {
                        var data = connectedDataList[k];

                        if (data) {
                            var value = data[navPropertyName];
                            var associationType = association.FromMultiplicity + association.ToMultiplicity;
                            if (association.FromMultiplicity === '$$unbound') {
                                if (data instanceof $data.Array) {
                                    entityCachedItem.dependentOn = entityCachedItem.dependentOn || [];
                                    //data.forEach(function (dataItem) {
                                    for (var l = 0; l < data.length; l++) {
                                        var dataItem = data[l];

                                        if ((entityCachedItem.dependentOn.indexOf(data) < 0) && (data.skipSave !== true)) {
                                            entityCachedItem.dependentOn.push(data);
                                        }
                                    }
                                    //}, this);
                                } else {
                                    entityCachedItem.dependentOn = entityCachedItem.dependentOn || [];
                                    if ((entityCachedItem.dependentOn.indexOf(data) < 0) && (data.skipSave !== true)) {
                                        entityCachedItem.dependentOn.push(data);
                                    }
                                }
                            } else {
                                switch (associationType) {
                                    case "*0..1": //Array
                                        if (value) {
                                            if (value instanceof Array) {
                                                if (value.indexOf(entityCachedItem.data) == -1) {
                                                    value.push(entityCachedItem.data);
                                                }
                                            } else {
                                                if (typeof intellisense === 'undefined') {
                                                    Guard.raise("Item must be array or subtype of array");
                                                }
                                            }
                                        } else {
                                            data[navPropertyName] = [entityCachedItem.data];
                                        }
                                        break;
                                    default: //Item
                                        if (value) {
                                            if (value !== entityCachedItem.data) {
                                                if (typeof intellisense === 'undefined') {
                                                    Guard.raise("Integrity check error! Item assigned to another entity!");
                                                }
                                            }
                                        } else {
                                            data[navPropertyName] = entityCachedItem.data; //set back reference for live object
                                        }
                                        break;
                                }
                                switch (associationType) {
                                    case "*0..1":
                                    case "0..11":
                                        entityCachedItem.dependentOn = entityCachedItem.dependentOn || [];
                                        if ((entityCachedItem.dependentOn.indexOf(data) < 0) && (data.skipSave !== true)) {
                                            entityCachedItem.dependentOn.push(data);
                                        }
                                        break;
                                }
                            }
                            if (!data.entityState) {
                                data.entityState = $data.EntityState.Added;
                            }
                            if (additionalEntities.indexOf(data) == -1) {
                                additionalEntities.push(data);
                            }
                        }
                    }
                    //}, this);
                }
                //}, this);
            }
            //}, this);

            //trackedEntities.forEach(function (entity) {
            for (var i = 0; i < trackedEntities.length; i++) {
                var entity = trackedEntities[i];

                if (entity.skipSave !== true) { changedEntities.push(entity); }
            }
            //});

            trackedEntities = [];
            //additionalEntities.forEach(function (item) {
            for (var i = 0; i < additionalEntities.length; i++) {
                var item = additionalEntities[i];

                if (!skipItems.some(function (entity) { return entity == item; })) {
                    if (!changedEntities.some(function (entity) { return entity.data == item; })) {
                        trackedEntities.push({ data: item, entitySet: this.getEntitySetFromElementType(item.getType().name) });
                    }
                }
            }
            //}, this);
        }


        //changedEntities.forEach(function (d) {
        for (var j = 0; j < changedEntities.length; j++) {
            var d = changedEntities[j];

            if (d.dependentOn) {
                var temp = [];
                for (var i = 0; i < d.dependentOn.length; i++) {
                    if (skipItems.indexOf(d.dependentOn[i]) < 0) {
                        temp.push(d.dependentOn[i]);
                    }
                }
                d.dependentOn = temp;
            }
        }
        //});
        skipItems = null;
        var ctx = this;
        if (changedEntities.length == 0) {
            this.stateManager.trackedEntities.length = 0;
            clbWrapper.success(0);
            return pHandlerResult;
        }

        //validate entities
        var errors = [];
        //changedEntities.forEach(function (entity) {
        for (var i = 0; i < changedEntities.length; i++) {
            var entity = changedEntities[i];

            if (entity.data.entityState === $data.EntityState.Added) {
                //entity.data.getType().memberDefinitions.getPublicMappedProperties().forEach(function (memDef) {
                for (var j = 0; j < entity.data.getType().memberDefinitions.getPublicMappedProperties().length; j++) {
                    var memDef = entity.data.getType().memberDefinitions.getPublicMappedProperties()[j];

                    if (memDef.required && !memDef.computed && !entity.data[memDef.name]) entity.data[memDef.name] = Container.getDefault(memDef.dataType);
                }
                //}, this);
            }
            if ((entity.data.entityState === $data.EntityState.Added || entity.data.entityState === $data.EntityState.Modified)
                && !entity.data.isValid()) {
                errors.push({ item: entity.data, errors: entity.data.ValidationErrors });
            }
        }
        //});
        if (errors.length > 0) {
            clbWrapper.error(errors);
            return pHandlerResult;
        }
        
        var access = $data.Access.None;
        
        var eventData = {};
        for (var i = 0; i < changedEntities.length; i++){
            var it = changedEntities[i];
            var n = it.entitySet.elementType.name;
            var es = this._entitySetReferences[n];
            if (es.beforeCreate || es.beforeUpdate || es.beforeDelete || (this.user && this.checkPermission)){
                if (!eventData[n]) eventData[n] = {};
                
                switch (it.data.entityState){
                    case $data.EntityState.Added:
                        access |= $data.Access.Create;
                        if (es.beforeCreate){
                            if (!eventData[n].createAll) eventData[n].createAll = [];
                            eventData[n].createAll.push(it);
                        }
                        break;
                    case $data.EntityState.Modified:
                        access |= $data.Access.Update;
                        if (es.beforeUpdate){
                            if (!eventData[n].modifyAll) eventData[n].modifyAll = [];
                            eventData[n].modifyAll.push(it);
                        }
                        break;
                    case $data.EntityState.Deleted:
                        access |= $data.Access.Delete;
                        if (es.beforeDelete){
                            if (!eventData[n].deleteAll) eventData[n].deleteAll = [];
                            eventData[n].deleteAll.push(it);
                        }
                        break;
                }
            }
        }
        
        var readyFn = function(cancel){
            if (cancel){
                cancelEvent = 'async';
                changedEntities.length = 0;
            }
            
            if (changedEntities.length){
                //console.log('changedEntities: ', changedEntities.map(function(it){ return it.data.initData; }));
                ctx.storageProvider.saveChanges({
                    success: function () {
                        ctx._postProcessSavedItems(clbWrapper, changedEntities);
                    },
                    error: clbWrapper.error
                }, changedEntities);
            }else if (cancelEvent){
                clbWrapper.error(new Exception('Cancelled event in ' + cancelEvent, 'CancelEvent'));
            }else clbWrapper.success(0);
            
            /*else if (cancelEvent) clbWrapper.error(new $data.Exception('saveChanges cancelled from event [' + cancelEvent + ']'));
            else Guard.raise('No changed entities');*/
        };
        
        var cancelEvent;
        var ies = Object.getOwnPropertyNames(eventData);
        var i = 0;
        var cmd = ['beforeUpdate', 'beforeDelete', 'beforeCreate'];
        var cmdAll = {
            beforeCreate: 'createAll',
            beforeDelete: 'deleteAll',
            beforeUpdate: 'modifyAll'
        };
        
        var callbackFn = function(cancel){
            if (cancel){
                cancelEvent = 'async';
                changedEntities.length = 0;
                
                readyFn(cancel);
                return;
            }
        
            var es = ctx._entitySetReferences[ies[i]];
            var c = cmd.pop();
            var ed = eventData[ies[i]];
            var all = ed[cmdAll[c]];
            
            if (all) {
                var m = [];
                for (var im = 0; im < all.length; im++) {
                    m.push(all[im].data);
                }
                //var m = all.map(function(it){ return it.data; });
                if (!cmd.length){
                    cmd = ['beforeUpdate', 'beforeDelete', 'beforeCreate'];
                    i++;
                }
                
                var r = es[c].call(ctx, m);
                if (typeof r === 'function'){
                    r.call(ctx, (i < ies.length && !cancelEvent) ? callbackFn : readyFn, m);
                }else if (r === false){
                    cancelEvent = (es.name + '.' + c);
                    //all.forEach(function (it) {
                    for (var index = 0; index < all.length; index++) {
                        var it = all[index];

                        var ix = changedEntities.indexOf(it);
                        changedEntities.splice(ix, 1);
                    }
                    //});
                    
                    readyFn();
                }else{
                    if (i < ies.length && !cancelEvent) callbackFn();
                    else readyFn();
                }
            }else{
                if (!cmd.length){
                    cmd = ['beforeUpdate', 'beforeDelete', 'beforeCreate'];
                    i++;
                }
                
                if (i < ies.length && !cancelEvent) callbackFn();
                else readyFn();
            }
        };
        
        if (this.user && this.checkPermission){
            this.checkPermission(access, this.user, ies, {
                success: function(){
                    if (i < ies.length) callbackFn();
                    else readyFn();
                },
                error: clbWrapper.error
            });
        }else{
            if (i < ies.length) callbackFn();
            else readyFn();
        }
        
        return pHandlerResult;
    },
    prepareRequest: function () { },
    _postProcessSavedItems: function (callBack, changedEntities) {
        if (this.ChangeCollector && this.ChangeCollector instanceof $data.Notifications.ChangeCollectorBase)
            this.ChangeCollector.processChangedData(changedEntities);

        var eventData = {};
        var ctx = this;
        //changedEntities.forEach(function (entity) {
        for (var i = 0; i < changedEntities.length; i++) {
            var entity = changedEntities[i];


            var oes = entity.data.entityState;
            
            entity.data.entityState = $data.EntityState.Unchanged;
            entity.data.changedProperties = [];
            entity.physicalData = undefined;
            
            var n = entity.entitySet.elementType.name;
            var es = ctx._entitySetReferences[n];


            var eventName = undefined;
            switch (oes) {
                case $data.EntityState.Added:
                    eventName  = 'added';
                    break;
                case $data.EntityState.Deleted:
                    eventName  = 'deleted';
                    break;
                case $data.EntityState.Modified:
                    eventName  = 'updated';
                    break;
            }
            if (eventName) {
                this.raiseEvent(eventName, entity);
            }

            if (es.afterCreate || es.afterUpdate || es.afterDelete){
                if (!eventData[n]) eventData[n] = {};
                    
                switch (oes){
                    case $data.EntityState.Added:
                        if (es.afterCreate){
                            if (!eventData[n].createAll) eventData[n].createAll = [];
                            eventData[n].createAll.push(entity);
                        }
                        break;
                    case $data.EntityState.Modified:
                        if (es.afterUpdate){
                            if (!eventData[n].modifyAll) eventData[n].modifyAll = [];
                            eventData[n].modifyAll.push(entity);
                        }
                        break;
                    case $data.EntityState.Deleted:
                        if (es.afterDelete){
                            if (!eventData[n].deleteAll) eventData[n].deleteAll = [];
                            eventData[n].deleteAll.push(entity);
                        }
                        break;
                }
            }
        }
        //});
        
        var ies = Object.getOwnPropertyNames(eventData);
        var i = 0;
        var ctx = this;
        var cmd = ['afterUpdate', 'afterDelete', 'afterCreate'];
        var cmdAll = {
            afterCreate: 'createAll',
            afterDelete: 'deleteAll',
            afterUpdate: 'modifyAll'
        };
        
        var readyFn = function(){
            if (!ctx.trackChanges) {
                ctx.stateManager.reset();
            }
            
            callBack.success(changedEntities.length);
        };
        
        var callbackFn = function(){
            var es = ctx._entitySetReferences[ies[i]];
            var c = cmd.pop();
            var ed = eventData[ies[i]];
            var all = ed[cmdAll[c]];
            if (all) {
                var m = [];
                for (var im = 0; im < all.length; im++) {
                    m.push(all[im].data);
                }
                //var m = all.map(function(it){ return it.data; });
                if (!cmd.length){
                    cmd = ['afterUpdate', 'afterDelete', 'afterCreate'];
                    i++;
                }
                
                var r = es[c].call(ctx, m);
                if (typeof r === 'function'){
                    r.call(ctx, i < ies.length ? callbackFn : readyFn, m);
                }else{
                    if (i < ies.length) callbackFn();
                    else readyFn();
                }
            }else{
                if (!cmd.length){
                    cmd = ['afterUpdate', 'afterDelete', 'afterCreate'];
                    i++;
                }
                
                if (i < ies.length) callbackFn();
                else readyFn();
            }
        };
        
        if (i < ies.length) callbackFn();
        else readyFn();
    },
    forEachEntitySet: function (fn, ctx) {
        /// <summary>
        ///     Iterates over the entity sets' of current EntityContext.
        /// </summary>
        /// <param name="fn" type="Function">
        ///     <param name="entitySet" type="$data.EntitySet" />
        /// </param>
        /// <param name="ctx">'this' argument for the 'fn' function.</param>
        for (var entitySetName in this._entitySetReferences) {
            var actualEntitySet = this._entitySetReferences[entitySetName];
            fn.call(ctx, actualEntitySet);
        }
    },

    loadItemProperty: function (entity, property, callback) {
        /// <signature>
        ///     <summary>Loads a property of the entity through the storage provider.</summary>
        ///     <param name="entity" type="$data.Entity">Entity object</param>
        ///     <param name="property" type="String">Property name</param>
        ///     <param name="callback" type="Function">
        ///         <summary>C  allback function</summary>
        ///         <param name="propertyValue" />
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        /// <signature>
        ///     <summary>Loads a property of the entity through the storage provider.</summary>
        ///     <param name="entity" type="$data.Entity">Entity object</param>
        ///     <param name="property" type="String">Property name</param>
        ///     <param name="callbacks" type="Object">
        ///         Success and error callbacks definition.
        ///         Example: [code]{ success: function(db) { .. }, error: function() { .. } }[/code]
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        /// <signature>
        ///     <summary>Loads a property of the entity through the storage provider.</summary>
        ///     <param name="entity" type="$data.Entity">Entity object</param>
        ///     <param name="property" type="MemberDefinition">Property definition</param>
        ///     <param name="callback" type="Function">
        ///         <summary>Callback function</summary>
        ///         <param name="propertyValue" />
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        /// <signature>
        ///     <summary>Loads a property of the entity through the storage provider.</summary>
        ///     <param name="entity" type="$data.Entity">Entity object</param>
        ///     <param name="property" type="MemberDefinition">Property definition</param>
        ///     <param name="callbacks" type="Object">
        ///         Success and error callbacks definition.
        ///         Example: [code]{ success: function(db) { .. }, error: function() { .. } }[/code]
        ///     </param>
        ///     <returns type="$.Deferred" />
        /// </signature>
        Guard.requireType('entity', entity, $data.Entity);

        var memberDefinition = typeof property === 'string' ? entity.getType().memberDefinitions.getMember(property) : property;

        if (entity[memberDefinition.name] != undefined) {
            var pHandler = new $data.PromiseHandler();
            callBack = pHandler.createCallback(callback);
            callback.success(entity[memberDefinition.name]);
            return pHandler.getPromise();
        }

        var isSingleSide = true;
        var storageModel = this._storageModel.getStorageModel(entity.getType().fullName);
        var elementType = Container.resolveType(memberDefinition.dataType);
        if (elementType === $data.Array || (elementType.isAssignableTo && elementType.isAssignableTo($data.EntitySet))) {
            elementType = Container.resolveType(memberDefinition.elementType);

            isSingleSide = false;

        } else {
            var associations;
            for (var i = 0; i < storageModel.Associations.length; i++) {
                var assoc = storageModel.Associations[i];
                if (assoc.FromPropertyName == memberDefinition.name) {
                    associations = assoc;
                    break;
                }
            }
            //var associations = storageModel.Associations.filter(function (assoc) { return assoc.FromPropertyName == memberDefinition.name; })[0];
            if (associations && associations.FromMultiplicity === "0..1" && associations.ToMultiplicity === "1")
                isSingleSide = false;
        }

        var keyProp = storageModel.LogicalType.memberDefinitions.getKeyProperties();
        if (isSingleSide === true) {
            //singleSide

            var filterFunc = "function (e) { return";
            var filterParams = {};
            //storageModel.LogicalType.memberDefinitions.getKeyProperties().forEach(function (memDefKey, index) {
            for (var index = 0; index < keyProp.length; index++) {
                var memDefKey = keyProp[index];

                if (index > 0)
                    filterFunc += ' &&';
                filterFunc += " e." + memDefKey.name + " == this.key" + index;
                filterParams['key' + index] = entity[memDefKey.name];
            }
            //});
            filterFunc += "; }"

            return storageModel.EntitySetReference
                .map('function (e) { return e.' + memberDefinition.name + ' }')
                .single(filterFunc, filterParams, callback);
        } else {
            //multipleSide

            var filterFunc = "function (e) { return"
            var filterParams = {};
            //storageModel.LogicalType.memberDefinitions.getKeyProperties().forEach(function (memDefKey, index) {
            for (var index = 0; index < keyProp.length; index++) {
                var memDefKey = keyProp[index];

                if (index > 0)
                    filterFunc += ' &&';
                filterFunc += " e." + memberDefinition.inverseProperty + "." + memDefKey.name + " == this.key" + index;
                filterParams['key' + index] = entity[memDefKey.name];
            }
            //});
            filterFunc += "; }"

            var entitySet = this.getEntitySetFromElementType(elementType);
            return entitySet
                .filter(filterFunc, filterParams)
                .toArray(callback);
        }

    },

    getTraceString: function (queryable) {
        /// <summary>
        /// Returns a trace string. Used for debugging purposes!
        /// </summary>
        /// <param name="queryable" type="$data.Queryable" />
        /// <returns>Trace string</returns>
        var query = new $data.Query(queryable.expression, queryable.defaultType, this);
        return this.storageProvider.getTraceString(query);
    },
    log: function (logInfo) {
        //noop as do nothing
    },

    resolveBinaryOperator: function (operator, expression, frameType) {
        return this.storageProvider.resolveBinaryOperator(operator, expression, frameType);
    },
    resolveUnaryOperator: function (operator, expression, frameType) {
        return this.storageProvider.resolveUnaryOperator(operator, expression, frameType);
    },
    resolveFieldOperation: function (operation, expression, frameType) {
        return this.storageProvider.resolveFieldOperation(operation, expression, frameType);
    },
    resolveSetOperations: function (operation, expression, frameType) {
        return this.storageProvider.resolveSetOperations(operation, expression, frameType);
    },
    _generateServiceOperationQueryable: function (functionName, returnEntitySet, arg, parameters) {
        if(typeof console !== 'undefined' && console.log)
            console.log('Obsolate: _generateServiceOperationQueryable, $data.EntityContext');

        var params = [];
        for (var i = 0; i < parameters.length; i++) {
            var obj = {};
            obj[parameters[i]] = Container.resolveType(Container.getTypeName(arg[i]));
            params.push(obj);
        }

        var tempOperation = $data.EntityContext.generateServiceOperation({ serviceName: functionName, returnType: $data.Queryable, elementType: this[returnEntitySet].elementType, params: params });
        return tempOperation.apply(this, arg);
    },
    attach: function (entity) {
        /// <summary>
        ///     Attaches an entity to its matching entity set.
        /// </summary>
        /// <param name="entity" type="$data.Entity" />
        /// <returns type="$data.Entity">Returns the attached entity.</returns>

        if (entity instanceof $data.EntityWrapper) {
            entity = entity.getEntity();
        }
        var entitySet = this.getEntitySetFromElementType(entity.getType());
        return entitySet.attach(entity);
    },
    attachOrGet: function (entity) {
        /// <summary>
        ///     Attaches an entity to its matching entity set, or returns if it's already attached.
        /// </summary>
        /// <param name="entity" type="$data.Entity" />
        /// <returns type="$data.Entity">Returns the entity.</returns>

        if (entity instanceof $data.EntityWrapper) {
            entity = entity.getEntity();
        }
        var entitySet = this.getEntitySetFromElementType(entity.getType());
        return entitySet.attachOrGet(entity);
    },
    add: function (entity) {
        /// <summary>
        ///     Adds a new entity to its matching entity set.
        /// </summary>
        /// <param name="entity" type="$data.Entity" />
        /// <returns type="$data.Entity">Returns the added entity.</returns>

        if (entity instanceof $data.EntityWrapper) {
            entity = entity.getEntity();
        }
        var entitySet = this.getEntitySetFromElementType(entity.getType());
        return entitySet.add(entity);
    },
    remove: function (entity) {
        /// <summary>
        ///     Removes an entity from its matching entity set.
        /// </summary>
        /// <param name="entity" type="$data.Entity" />
        /// <returns type="$data.Entity">Returns the removed entity.</returns>

        if (entity instanceof $data.EntityWrapper) {
            entity = entity.getEntity();
        }
        var entitySet = this.getEntitySetFromElementType(entity.getType());
        return entitySet.remove(entity);
    }
}, {
    generateServiceOperation: function (cfg) {

        var fn;
        if (cfg.serviceMethod) {
            var returnType = cfg.returnType ? Container.resolveType(cfg.returnType) : {};
            if (returnType.isAssignableTo && returnType.isAssignableTo($data.Queryable)) {
                fn = cfg.serviceMethod;
            } else {
                fn = function () {
                    var lastParam = arguments[arguments.length - 1];

                    var pHandler = new $data.PromiseHandler();
                    var cbWrapper;

                    var args = arguments;
                    if (typeof lastParam === 'function') {
                        cbWrapper = pHandler.createCallback(lastParam);
                        arguments[arguments.length - 1] = cbWrapper;
                    } else {
                        cbWrapper = pHandler.createCallback();
                        arguments.push(cbWrapper);
                    }

                    try {
                        var result = cfg.serviceMethod.apply(this, arguments);
                        if (result !== undefined)
                            cbWrapper.success(result);
                    } catch (e) {
                        cbWrapper.error(e);
                    }

                    return pHandler.getPromise();
                }
            }

        } else {
            fn = function () {

                var virtualEntitySet = cfg.elementType ? this.getEntitySetFromElementType(Container.resolveType(cfg.elementType)) : null;

                var paramConstExpression = null;
                if (cfg.params) {
                    paramConstExpression = [];
                    for (var i = 0; i < cfg.params.length; i++) {
                        //TODO: check params type
                        for (var name in cfg.params[i]) {
                            paramConstExpression.push(Container.createConstantExpression(arguments[i], Container.resolveType(cfg.params[i][name]), name));
                        }
                    }
                }

                var ec = Container.createEntityContextExpression(this);
                var memberdef = this.getType().getMemberDefinition(cfg.serviceName);
                var es = Container.createServiceOperationExpression(ec,
                        Container.createMemberInfoExpression(memberdef),
                        paramConstExpression,
                        cfg);

                //Get callback function
                var clb = arguments[arguments.length - 1];
                if (typeof clb !== 'function') {
                    clb = undefined;
                }

                if (virtualEntitySet) {
                    var q = Container.createQueryable(virtualEntitySet, es);
                    if (clb) {
                        es.isTerminated = true;
                        return q._runQuery(clb);
                    }
                    return q;
                }
                else {
                    var returnType = Container.resolveType(cfg.returnType);

                    var q = Container.createQueryable(this, es);
                    q.defaultType = returnType;

                    if (returnType === $data.Queryable) {
                        q.defaultType = Container.resolveType(cfg.elementType);
                        if (clb) {
                            es.isTerminated = true;
                            return q._runQuery(clb);
                        }
                        return q;
                    }
                    es.isTerminated = true;
                    return q._runQuery(clb);
                }
            };
        };

        var params = [];
        if (cfg.params) {
            for (var i = 0; i < cfg.params.length; i++) {
                var param = cfg.params[i];
                for (var name in param)
                {
                    params.push({
                        name: name,
                        type: param[name]
                    });
                }
            }
        }
        $data.typeSystem.extend(fn, cfg, { params: params });

        return fn;
    },
    _convertLogicalTypeNameToPhysical: function (name) {
        return name + '_$db$';
    },
    _storageModelCache: {
        get: function () {
            if (!this.__storageModelCache)
                this.__storageModelCache = {};
            return this.__storageModelCache;
        },
        set: function () {
            //todo exception
        }
    }
});
