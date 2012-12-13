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
         
         self.visible.subscribe(function(value){
            if (!value){
                self.allDatabases([]);
                self.allServices([]);
            }
         });

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
        };
        
        self.editData = function(item){
            window.editDataService = item.owner.ServiceID();
            window.editDataTable = undefined;
            if (typeof w === 'undefined') {
                console.log("opening window");
                w = window.open("data.html", "_dataui");
            } else {
                w.close();
                w = window.open("data.html", "_dataui");
                console.log("Focus!");
                w.focus();
            }
        };
     }
});

function EmbedServiceModel(vm){
    var self = this;
    this.data = vm.service;
    
    self.embedTemplates = ko.observableArray([
        { name: 'html5', title: 'HTML5', template: '/scripts/templates/html5-template.ejs', cssclass: 'icon-start' },
        { name: 'html5-static', title: 'HTML5 static schema', template: '/scripts/templates/html5-static-template.ejs', cssclass: 'icon-start' },
        { name: 'phonegap-static', title: 'PhoneGap', template: '/scripts/templates/phonegap-template.ejs', cssclass: 'icon-start' },
        { name: 'kendoui', title: 'Kendo UI', template: '/scripts/templates/kendoui-template.ejs', cssclass: 'icon-start' },
        { name: 'nodejs', title: 'node.js', template: '/scripts/templates/nodejs-template.ejs', cssclass: 'icon-start' },
        { name: 'nodejs-static', title: 'node.js static schema', template: '/scripts/templates/nodejs-static-template.ejs', cssclass: 'icon-start' },
        //{ name: 'jaydata-js', title: 'JayData JavaScript', template: '/scripts/templates/jaydata-js-template.ejs', cssclass: 'icon-stop' },
        { name: 'jaydata-ts', title: 'TypeScript', template: '/scripts/templates/jaydata-ts-template.ejs', cssclass: 'icon-stop' },
        { name: 'csharp', title: '.NET C#', template: '/scripts/templates/csharp-template.ejs', cssclass: 'icon-stop' },
        { name: 'office', title: 'MS Office', template: '/scripts/templates/office-template.ejs', cssclass: 'icon-stop' },
        { name: 'lightswitch', title: 'LightSwitch', template: '/scripts/templates/lightswitch-template.ejs', cssclass: 'icon-stop' },
        { name: 'java', title: 'Java', template: '/scripts/templates/java-template.ejs', cssclass: 'icon-stop' },
        { name: 'ruby', title: 'Ruby', template: '/scripts/templates/ruby-template.ejs', cssclass: 'icon-stop' },
        { name: 'php', title: 'PHP', template: '/scripts/templates/php-template.ejs', cssclass: 'icon-stop' }
    ]);
    
    setTimeout(function(){ document.querySelector('#embed-service-' + self.data.owner.ServiceID() + ' li a').click(); }, 0);
    
    self.contextGenerator = new $data.MetadataLoaderClass();
    self.contextGenerator.debugMode = true;
    
    self.jsContext = ko.observable();
    self.tsContext = ko.observable();
    self.phpContext = ko.observable();
    self.serviceType = ko.observable();
    
    self.renderTemplate = function(el, name, tmpl){
        if (self.serviceType()){
            document.getElementById(el).innerHTML = new EJS({
                url: tmpl.template
            }).render({
                template: tmpl,
                serviceType: self.serviceType(),
                app: adminApiClient.currentApplication(),
                service: self.data.owner.innerInstance,
                jsContext: self.jsContext(),
                tsContext: self.tsContext(),
                phpContext: self.phpContext()
            });
        }else{
            self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), {
                success: function(f, t, s){
                    self.serviceType(t);
                    self.jsContext(s.replace('JaySvcUtil.exe', 'JayStorm Admin'));
                    
                    self.contextGenerator.factoryCache = {};
                    
                    self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), function (tf, tt, ts) {
                        self.tsContext(ts.replace('JaySvcUtil.exe', 'JayStorm Admin'));

                        self.contextGenerator.factoryCache = {};

                        self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), function (phpf, phpt, phps) {
                            self.phpContext(phps);

                            document.getElementById(el).innerHTML = new EJS({
                                url: tmpl.template
                            }).render({
                                template: tmpl,
                                serviceType: self.serviceType(),
                                app: adminApiClient.currentApplication(),
                                service: self.data.owner.innerInstance,
                                jsContext: self.jsContext(),
                                tsContext: self.tsContext(),
                                phpContext: self.phpContext()
                            });
                        }, {
                            AutoCreateContext: true,
                            DefaultNamespace: '',
                            mode: '_metadataPHPConverterXSLT',
                            //ContextInstanceName: self.data.owner.Name(),
                            httpHeaders: { 'Authorization': adminApiClient.authorization(), 'X-Domain': 'jokerStorm' }
                        });
                    }, {
                        AutoCreateContext: true,
                        DefaultNamespace: '',
                        mode: '_metadataTypeScriptConverterXSLT',
                        //ContextInstanceName: self.data.owner.Name(),
                        httpHeaders: { 'Authorization': adminApiClient.authorization(), 'X-Domain': 'jokerStorm' }
                    });
                },
                error: function(err){
                    document.getElementById(el).innerHTML = new EJS({
                        url: tmpl.template
                    }).render({
                        template: tmpl,
                        serviceType: self.serviceType(),
                        app: adminApiClient.currentApplication(),
                        service: self.data.owner.innerInstance,
                        jsContext: self.jsContext(),
                        tsContext: self.tsContext(),
                        phpContext: self.phpContext()
                    });
                }
            }, {
                AutoCreateContext: true,
                DefaultNamespace: '',
                //ContextInstanceName: self.data.owner.Name(),
                httpHeaders: { 'Authorization': adminApiClient.authorization(), 'X-Domain': 'jokerStorm' }
            });
        }
    };
    
    /*self.jsContext = ko.observable();
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
    });*/
    
    /*self.contextGenerator.load(adminApiClient.currentApplication().url + self.data.owner.Name(), function(f, t, s){
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
    };*/
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    }
}
