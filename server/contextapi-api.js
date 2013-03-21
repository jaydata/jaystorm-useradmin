var q = require('q');
$data.ServiceBase.extend('$data.JayStormAPI.ServiceFunctions', {

    getContext: (function(db){
        return function(success, error){
            var self = this;
            var nsContext;
            var context = {};
            var entities = [];
            var entityIds = [];
            var entitySets = {};
            var sets = [this.context.Entities,
                        this.context.EntitySets,
                        this.context.Databases,
                        this.context.ComplexTypes];

            var self = this;

            function setPreloader(sets) {
                var d = q.defer();
                var parray = [];
                var resultps = {};
                for(var i = 0; i < sets.length; i++) {
                    sets[sets[i].tableName] = sets[i];
                    parray.push(resultps[sets[i].tableName] = sets[i].toArray());
                }

                q.allResolved(parray).then(function() {
                    for(var key in resultps) {
                        resultps[key] =resultps[key].valueOf();
                        var keyField = sets[key].defaultType.memberDefinitions.getKeyProperties()[0].name;
                        for(var i = 0; i < resultps[key].length; i++) {
                            resultps[key][resultps[key][i][keyField]] = resultps[key][i];
                        }
                    }
                    d.resolve(resultps);
                });
                return d.promise;
            }

            var loadedSets = setPreloader(sets);

            q.when(loadedSets)
                .then(function(ls){
                    for(var key in ls) {
                        console.log(key + " " + ls[key].length);
                        console.dir(Object.keys(ls[key]));
                    }
                    loadedSets = ls;
                    
                    self.context.Databases.single(function(it){ return it.Name == this.db; }, { db: db }, function(db){
                        nsContext = db.Namespace + '.Context';
                        context.ContextName = nsContext;
                        self.context.EntitySets
                            .filter(function(it){ return it.DatabaseID == this.db; }, { db: db.DatabaseID })
                            .toArray({
                                success: function(result){
                                    var ret = {};
                                    for (var i = 0; i < result.length; i++){
                                        var r = result[i];
                                        ret[r.Name] = {
                                            type: '$data.EntitySet',
                                            elementType: loadedSets["Entities"][r.ElementTypeID].FullName
                                        };
                                        if (r.TableName) ret[r.Name].tableName = r.TableName;
                                        entitySets[r.EntitySetID] = ret[r.Name];
                                        //entities.push(r.ElementType);
                                    }
                                    context[nsContext] = ret;
                                    //console.log(entities);
                                },
                            error: self.error
                        }).then(function(){
                            self.context.Entities.filter(function(it){ return it.DatabaseID == this.db; }, { db: db.DatabaseID }) /*.filter(function(it){ return it.FullName in this.entities; }, { entities: entities })*/.toArray({
                                success: function(result){
                                    entities = result;
                                    self.context.ComplexTypes.filter(function(it){ return it.DatabaseID == this.db; }, { db: db.DatabaseID }).toArray(function(result){
                                        if (result.length) entities = entities.concat(result);
                                        entityIds = entities.map(function(it){ return it.EntityID; });
                                        /*for (var i = 0; i < result.length; i++){
                                            var r = result[i];
                                            //entityIds.push(r.EntityID);
                                            context[r.FullName] = {};
                                            
                                            for (var j = 0; j < r.Fields.length; j++){
                                                var rf = r.Fields[j];
                                                var f = {};
                                                        
                                                f.type = rf.Type;
                                                if (rf.ElementType) f.elementType = rf.ElementType;
                                                if (rf.InverseProperty) f.inverseProperty = rf.InverseProperty;
                                                if (rf.Key) f.key = true;
                                                if (rf.Computed) f.computed = true;
                                                if (rf.Nullable !== undefined && r.Nullable !== null) f.nullable = !!rf.Nullable;
                                                if (rf.Required) f.required = true;
                                                if (rf.CustomValidator) f.customValidator = rf.CustomValidator;
                                                if (rf.MinValue !== undefined && rf.MinValue !== null) f.minValue = rf.MinValue;
                                                if (rf.MaxValue !== undefined && rf.MaxValue !== null) f.maxValue = rf.MaxValue;
                                                if (rf.MinLength !== undefined && rf.MinLength !== null) f.minLength = rf.MinLength;
                                                if (rf.MaxLength !== undefined && rf.MaxLength !== null) f.maxLength = rf.MaxLength;
                                                if (rf.Length !== undefined && rf.Length !== null) f.length = rf.Length;
                                                if (rf.RegExp) f.regex = rf.RegExp;
                                                if (rf.ExtensionAttributes && rf.ExtensionAttributes.length){
                                                    for (var k = 0; k < rf.ExtensionAttributes.length; k++){
                                                        var kv = rf.ExtensionAttributes[k];
                                                        f[kv.Key] = kv.Value;
                                                    }
                                                }
                                                
                                                context[r.FullName][rf.Name] = f;
                                            }
                                        }
                                        
                                        self.success(context);*/
                                        
                                        self.context.EntityFields.filter(function(it){ return it.EntityID in this.entityid && it.DatabaseID == this.db; },
                                                    { db: db.DatabaseID, entityid: entityIds }).toArray({
                                            success: function(result){
                                                for (var i = 0; i < result.length; i++){
                                                    var r = result[i];
                                                    var e = entities.filter(function(it){ return it.EntityID === r.EntityID; })[0];
                                                    
                                                    var f = {};
                                                    if (!context[e.FullName || ((e.Namespace || db.Namespace) + e.Name)]) context[e.FullName || ((e.Namespace || db.Namespace) + e.Name)] = {};
                                                    
                                                    f.type = r.Type;
                                                    if (r.ElementType) f.elementType = r.ElementType;
                                                    if (r.InverseProperty) f.inverseProperty = r.InverseProperty;
                                                    if (r.Key) f.key = true;
                                                    if (r.Computed) f.computed = true;
                                                    if (r.Nullable !== undefined && r.Nullable !== null && r.Nullable) f.nullable = !!r.Nullable;
                                                    if (r.Required) f.required = true;
                                                    if (r.CustomValidator) f.customValidator = r.CustomValidator;
                                                    if (r.MinValue !== undefined && r.MinValue !== null) f.minValue = r.MinValue;
                                                    if (r.MaxValue !== undefined && r.MaxValue !== null) f.maxValue = r.MaxValue;
                                                    if (r.MinLength !== undefined && r.MinLength !== null) f.minLength = r.MinLength;
                                                    if (r.MaxLength !== undefined && r.MaxLength !== null) f.maxLength = r.MaxLength;
                                                    if (r.Length !== undefined && r.Length !== null) f.length = r.Length;
                                                    if (r.RegExp) f.regex = r.RegExp;
                                                    
                                                    context[e.FullName || ((e.Namespace || db.Namespace) + e.Name)][r.Name] = f;
                                                }
                                                
                                                self.context.EventHandlers.filter(function(it){ return it.DatabaseID == this.db; }, { db: db.DatabaseID }).toArray({
                                                    success: function(result){
                                                        for (var i = 0; i < result.length; i++){
                                                            var r = result[i];
                                                            entitySets[r.EntitySetID][r.Type] = r.Handler;
                                                        }
                                                        self.success(context);
                                                    },
                                                    error: self.error
                                                });
                                            },
                                            error: self.error
                                        });
                                    });
                                },
                                error: self.error
                            });
                        });
                    });
                //self.success({});
            }).fail(function() { error("") });
        };

    }).toServiceOperation().params([{ name: 'db', type: 'string' }]).returns($data.Object),
    getContextJS: (function(db){
        return function(success, error){
            var self = this;
            this.context.getContext.asFunction(db).apply({
                context: this.context,
                success: function(context){
                    var js = '';
                    var events = {
                        afterCreate: true,
                        afterRead: true,
                        afterUpdate: true,
                        afterDelete: true,
                        beforeCreate: true,
                        beforeRead: true,
                        beforeUpdate: true,
                        beforeDelete: true
                    };
                    for (var i in context){
                        var c = context[i];
                        if (i != context.ContextName && i != 'ContextName'){
                            js += '$data.Entity.extend("' + i + '", {\n';
                            var trim = false;
                            for (var prop in c){
                                var p = c[prop];
                                js += '    ' + prop + ': { ';
                                for (var attr in p){
                                    js += attr + ': ' + JSON.stringify(p[attr]) + ', ';
                                }
                                var lio = js.lastIndexOf(', ');
                                js = js.substring(0, lio);
                                js += ' },\n';
                                trim = true;
                            }
                            if (trim){
                                var lio = js.lastIndexOf(',');
                                js = js.substring(0, lio);
                            }
                            js += '\n});\n\n';
                        }
                    }
                    var c = context[context.ContextName];
                    js += '$data.EntityContext.extend("' + context.ContextName + '", {\n';
                    for (var i in c){
                        var es = c[i];
                        js += '    ' + i + ': { type: $data.EntitySet, elementType: ' + es.elementType + (es.tableName ? ', tableName: "' + es.tableName + '" ' : '');
                        for (var e in events){
                            console.log(i, e, es[e]);
                            if (es[e]) js += (',\n        ' + e + ': ' + es[e]);
                        }
                        js += ' },\n';
                    }
                    var lio = js.lastIndexOf(',');
                    js = js.substring(0, lio);
                    js += '\n});';
                    console.log(js);
                    self.success(js);
                },
                error: this.error
            }, success, error);
        };
    }).toServiceOperation().params([{ name: 'db', type: 'string' }]).returns('string')
});
