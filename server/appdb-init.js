var store = require('./storeContext.js');

store.storeContext({
    providerConfiguration: {
        name: 'mongoDB',
        databaseName: 'NTA0MzQ1MWY0ZjRiNGQyYzA3MDAwMDAz_ApplicationDB',
        address: '127.0.0.1',
        port: 27017,
        username: '5babb4f2-bd59-4096-bb5a-a249853fdb07',
        password: '5ebd8d4d-9c40-4181-9e26-3c064be03fa7'
        
    },
    databaseName: 'ApplicationDB',
    type: $data.JayStormAPI.Context
}, function(){
    console.log('end.');
});
