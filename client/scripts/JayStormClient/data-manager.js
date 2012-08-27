
function DataManagerModel() {

    var self = this;
    self.databases = ['/db','' +
        '              /db2'];

    self.visible = ko.observable(false);

    self.show = function() {
        self.visible(true);
    };

    self.hide = function() {
        self.visible(false);
//        self.context ( null );
//        self.collection ( null );
    };

    self.factory = ko.observable();

    self.serviceUrlSelected = ko.observable();
    self.serviceUrlSelected.subscribe( function( value ) {
        $data.MetadataLoader.load(value, function(factory) {
            self.factory(factory);
        });
    })
    self.context = ko.observable();

    self.factory.subscribe( function(value) {
        self.context( value() );
    });


    self.entitySets = ko.computed( function() {
        var result = [];
        for(var name in this.context()) {
            //do not filter for ownProperties - they are not own
            if (this.context()[name] instanceof $data.EntitySet) {
                result.push(this.context()[name]);
            }
        }
        return result;
    }, this);

    self.selectSet = function(eSet) {
        self.collection(eSet);
    }

    self.esPageSize = ko.observable(30);
    self.collection = ko.observable();
}