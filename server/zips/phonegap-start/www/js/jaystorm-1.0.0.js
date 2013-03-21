var oldServiceMethod = $data.service;
                                
$data.initService = function(apiKey, options) {
    var d = new $.Deferred();
    if (typeof options === 'function') {
      cbWithDatabase = options;
      options = undefined;
    };
    
    with(apiKey) {
        var url = "https://open.jaystack.net/" + ownerId + "/" + appId + "/api/" + serviceName;
    };
    
    var cb = {
        success: function(f, t) {
            var rd = f().onReady();
            rd.then(function(db) {
              d.resolve(db,f, t);
            }).fail(function(err) { d.reject(err); });
        },
        error: function(err) {
            d.reject(err);
        }
    }
        
    oldServiceMethod(url, cb, options);
    return d.promise();
}

$data.EntitySet.prototype.update = function(key, update) {
    var item = new this.elementType(key);
    this.attach(item);
    for(var fld in update) {
      item[fld] = update[fld];
    }
    return item;
}

$data.EntitySet.prototype.saveChanges = function() {
   return this.entityContext.saveChanges.apply(this.entityContext, arguments);
}
 
    $data.EntitySet.prototype.addComputedField = function(name, getter, setter) {
        var pd = {
            get: getter,
            set: setter
        };
        Object.defineProperty(this.elementType.prototype, name, pd);
    }