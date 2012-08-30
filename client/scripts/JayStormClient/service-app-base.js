/**
 * Created with JetBrains WebStorm.
 * User: zpace
 * Date: 8/29/12
 * Time: 11:37 PM
 * To change this template use File | Settings | File Templates.
 */
$data.Base.extend("$data.JayStormUI.AdminModel",  {
    constructor: function( apiContextFactory ) {
        var self = this;

        var factory = apiContextFactory ;

        self.show = function() {
            self.context( factory() );
        };

        self.hide = function() {
            self.context ( null );
        }

        self.context = ko.observable();
        self.visible = ko.observable(false);
    }
})