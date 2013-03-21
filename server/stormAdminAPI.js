$data.ServiceBase.extend("JayStorm.AdminAPI", {

    crypt: function (clearText) {
        ///<param name='clearText' type='string' />
        ///<returns type='string' />
        var bc = require('bcrypt');
        return bc.hashSync(clearText, 8);
        //return
    }

});
JayStorm.AdminAPI.annotateFromVSDoc();