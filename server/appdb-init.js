var store = require('./storeContext.js');

store.storeContext({
    providerConfiguration: {
        name: 'mongoDB',
        databaseName: 'ApplicationDB',
        address: '127.0.0.1',
        port: 27017
    },
    databaseName: 'ApplicationDB',
    type: $data.JayStormAPI.Context
}, function(ctx){
    var adminGroup = new $data.JayStormAPI.Group({ Name: 'admin' });
    var anonymousGroup = new $data.JayStormAPI.Group({ Name: 'anonymous' });
    
    ctx.Groups.add(adminGroup);
    ctx.Groups.add(anonymousGroup);
    ctx.saveChanges(function(){
        var admin = new $data.JayStormAPI.User({ Login: 'admin', Password: 'admin', Groups: [adminGroup.GroupID] });
        var anonymous = new $data.JayStormAPI.User({ Login: 'anonymous', Groups: [anonymousGroup.GroupID] });
        
        ctx.Users.add(admin);
        ctx.Users.add(anonymous);
        
        for (var i = 0; i < ctx.SystemTypes.length; i++){
            ctx.TypeTemplates.add(new $data.JayStormAPI.TypeTemplate(ctx.SystemTypes[i]));
        }
        
        ctx.saveChanges(function(){
            console.log('end.');
        });
    });
});
