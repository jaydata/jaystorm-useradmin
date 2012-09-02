require('jaydata');
require('./dbtypes/ApplicationDBContext.js');

function storeContext(config, callback){
    if (!config){
        console.warn('ApplicationDB initialization config missing.');
        console.warn('Using default 127.0.0.1:27017/ApplicationDB');
        config = {
            providerConfiguration: {
                name: 'mongoDB',
                databaseName: 'ApplicationDB',
                address: '127.0.0.1',
                port: 27017
            },
            databaseName: 'ApplicationDB',
            type: $data.JayStormAPI.Context
        };
    }
    
    var getNamespace = function(type){
        return type.fullName.substring(0, type.fullName.lastIndexOf(type.name) - 1);
    };
    
    var context = new $data.JayStormAPI.Context(config.providerConfiguration);
    context.onReady(function(db){
        var database = new $data.JayStormAPI.Database({
            Name: config.databaseName,
            Namespace: getNamespace(config.type)
        });
        db.Databases.add(database);
        db.saveChanges(function(){
            var contextMemDefs = config.type.memberDefinitions.getPublicMappedProperties();
            var i = 0;
            
            var fn = function(){
                var cmd = contextMemDefs[i];
                if (!cmd.elementType){
                    i++;
                    if (i < contextMemDefs.length) fn();
                    else{
                        db.Services.add(new $data.JayStormAPI.Service({
                            Name: config.type.name,
                            DatabaseID: database.DatabaseID
                        }));
                        db.saveChanges(function(){
                            if (callback) callback();
                        });
                    }
                    return;
                }
                var entity = new $data.JayStormAPI.Entity({
                    Name: cmd.elementType.name,
                    FullName: cmd.elementType.fullName,
                    Namespace: getNamespace(cmd.elementType),
                    DatabaseID: database.DatabaseID
                });
                db.Entities.add(entity);
                db.saveChanges(function(){
                    var entityMemDefs = cmd.elementType.memberDefinitions.getPublicMappedProperties();
                    for (var j = 0; j < entityMemDefs.length; j++){
                        var emd = entityMemDefs[j];
                        db.EntityFields.add(new $data.JayStormAPI.EntityField({
                            EntityID: entity.EntityID,
                            Index: j,
                            Name: emd.name,
                            Type: Container.resolveName(emd.type),
                            ElementType: emd.elementType ? Container.resolveName(emd.elementType) : null,
                            Key: !!emd.key,
                            Computed: !!emd.computed,
                            Nullable: !!emd.nullable,
                            Required: !!emd.required,
                            CustomValidator: typeof emd.customValidator !== 'undefined' ? emd.customValidator.toString() : null,
                            MinValue: typeof emd.minValue !== 'undefined' ? emd.minValue.toString() : null,
                            MaxValue: typeof emd.maxValue !== 'undefined' ? emd.maxValue.toString() : null,
                            MinLength: emd.minLength,
                            MaxLength: emd.maxLength,
                            Length: emd.length,
                            RegExp: typeof emd.regExp !== 'undefined' ? emd.regExp.toString() : null,
                            DatabaseID: database.DatabaseID
                        }));
                    }
                    
                    db.EntitySets.add(new $data.JayStormAPI.EntitySet({
                        Name: cmd.name,
                        ElementType: cmd.elementType.fullName,
                        ElementTypeID: entity.EntityID,
                        TableName: cmd.tableName,
                        DatabaseID: database.DatabaseID
                    }));
                    
                    db.saveChanges(function(){
                        i++;
                        if (i < contextMemDefs.length) fn();
                        else{
                            db.Services.add(new $data.JayStormAPI.Service({
                                Name: type.name,
                                DatabaseID: database.DatabaseID
                            }));
                            db.saveChanges(function(){
                                if (callback) callback();
                            });
                        }
                    });
                });
            };
            
            fn();
        });
    });
}

exports = module.exports = {
    storeContext: storeContext
};
