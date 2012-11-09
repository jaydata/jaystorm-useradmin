$data.JayStormUI.AdminModel.extend("$data.JayStormClient.ServiceManager", {

    constructor: function()
     {

         var self = this;
         self.allDatabases = ko.observableArray([]);
         self.allServices = ko.observableArray([]);

         
         //apiContextFactory().Databases.toArray(self.allDatabases);
        
         function initState(cf) {
             var cntx = cf();
             cntx.Databases.toArray(self.allDatabases);
             cntx.Services.toArray(self.allServices);
             self.context(cf());
        }

         self.contextFactory.subscribe(function (value) {
             if (value) {
                 initState(value);
             }
         });

         self.show = function () {
             self.visible(true);
             initState(self.contextFactory());
         };

         if (self.contextFactory()) {
             initState(self.contextFactory());
        }


        self.selectedService = ko.observable();

        self.selectService = function(item) {

            self.selectedService(item);
            //self.checkBoxStates.removeAll();

        };
        
        self.codeHighlight = function(el, value){
            new $data.JayStormUI.CodeHighlight(el, value);
        };
        
        self.error = ko.observable(false);
        self.editingSource = ko.observable(false);
        self.currentService = ko.observable();
        
        self.editSource = function(owner, value, error){
            if (!window.serviceEditSource) window.serviceEditSource = {};
            var t = 'edit' + new Date().getTime();
            window.serviceEditSource[t] = {
                service: owner,
                value: value
            };
            window.open('code.html?' + t, t);
            /*self.currentService(owner);
            self.editingSource(true);
            setTimeout(function(){
                if (!value()) value('$data.ServiceBase.extend("' + self.currentService().Name() + '", {\n    \n});\n\n' + self.currentService().Name() + '.annotateFromVSDoc();');
                new $data.JayStormUI.CodeMirror('service-codemirror', value, error);
            }, 1);*/
        };
        
        self.serviceSourceTypes = ko.observableArray([/*{
            name: 'Git URL',
            type: 'git'
        },*/ {
            name: 'Script',
            type: 'script'
        }, {
            name: 'Static',
            type: 'static'
        }]);
        
        self.beforeSave = function (es) {
            var tracked = es.entityContext.stateManager.trackedEntities;
            for (var i = 0; i < tracked.length; i++) {
                var item = tracked[i];
                if (item.entitySet === es) {
                    item.data.HasChanges = true;
                }
            }
        }
     }
});

function EmbedServiceModel(vm){
    var self = this;
    this.data = vm.service;
    
    self.jsContext = ko.observable();
    self.tsContext = ko.observable();
    self.html = ko.observable();
    
    self.contextGenerator = new $data.MetadataLoaderClass();
    self.contextGenerator.debugMode = true;
    
    self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), function(f, t, s){
        self.jsContext(s.replace('JaySvcUtil.exe', 'JayStorm Admin'));
        setTimeout(function(){
            var el = document.getElementById('service-jscontext-' + self.data.owner.Name());
            el.style.height = el.scrollHeight + 'px';
        });
    }, {
        AutoCreateContext: true,
        DefaultNamespace: '',
        //ContextInstanceName: self.data.owner.Name(),
        httpHeaders: { 'Authorization': adminApiClient.authorization(), 'X-Domain': 'jokerStorm' }
    });
    
    self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), function(f, t, s){
        self.tsContext(s.replace('JaySvcUtil.exe', 'JayStorm Admin'));
        setTimeout(function(){
            var el = document.getElementById('service-tscontext-' + self.data.owner.Name());
            el.style.height = el.scrollHeight + 'px';
        });
    }, {
        AutoCreateContext: true,
        DefaultNamespace: '',
        typeScript: true,
        //ContextInstanceName: self.data.owner.Name(),
        httpHeaders: { 'Authorization': adminApiClient.authorization(), 'X-Domain': 'jokerStorm' }
    });
    
    self.html(new EJS({url: '/scripts/service-template.ejs'}).render({ metadataUri: adminApiClient.currentApplication().url + self.data.owner.Name() }));
    setTimeout(function(){
        var el = document.getElementById('service-html-' + self.data.owner.Name());
        el.style.height = el.scrollHeight + 'px';
    });
    
    self.openHtml = function(){
        window.open('data:text/html;base64,' + btoa(self.html()), '_blank', '');
    };
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    }
}
