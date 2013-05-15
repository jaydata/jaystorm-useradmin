$data.JayStormUI.AdminModel.extend("$data.JayStormClient.ServiceManager", {

    constructor: function()
     {

         var self = this;
         self.allDatabases = ko.observableArray([]);
         self.allServices = ko.observableArray([]);
         self.serviceOperationsNotSupported = ko.observable();
         
         //apiContextFactory().Databases.toArray(self.allDatabases);
        
         function initState(cf) {
             var cntx = cf();
             cntx.Databases.toArray(self.allDatabases);
             cntx.Services.toArray(self.allServices);
             self.serviceOperationsNotSupported(!!cntx.ServiceOperations);
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
            adminApiClient.publishChanges(true);
        };
        
        self.apiaccesstutorial = function(data){
            adminApiClient.apiAccessTutorial = data.value();
            $('#nav-2 #9').trigger('click');
            return false;
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
    if (self.data) self.data(vm.service);
    else this.data = vm.service;
    
    if (!self.embedTemplates) self.embedTemplates = ko.observableArray([]);
    self.embedTemplates([
        { name: 'html5', title: 'HTML5', template: '/scripts/templates/html5-template.ejs', cssclass: 'icon_32x32 html5' },
        { name: 'html5-static', title: 'HTML5 static schema', template: '/scripts/templates/html5-static-template.ejs', cssclass: 'icon_32x32 html5' },
        { name: 'phonegap-static', title: 'PhoneGap', template: '/scripts/templates/phonegap-template.ejs', cssclass: 'icon_32x32 phonegap' },
        { name: 'kendoui', title: 'Kendo UI', template: '/scripts/templates/kendoui-template.ejs', cssclass: 'icon_32x32 kendo' },
        { name: 'nodejs', title: 'node.js', template: '/scripts/templates/nodejs-template.ejs', cssclass: 'icon_32x32 nodejs' },
        { name: 'nodejs-static', title: 'node.js static schema', template: '/scripts/templates/nodejs-static-template.ejs', cssclass: 'icon_32x32 nodejs' },
        //{ name: 'jaydata-js', title: 'JayData JavaScript', template: '/scripts/templates/jaydata-js-template.ejs', cssclass: 'icon-remove' },
        { name: 'jaydata-ts', title: 'TypeScript', template: '/scripts/templates/jaydata-ts-template.ejs', cssclass: 'icon_32x32 typescript' },
        { name: 'csharp', title: '.NET C#', template: '/scripts/templates/csharp-template.ejs', cssclass: 'icon_32x32 csharp' },
        { name: 'office', title: 'MS Office', template: '/scripts/templates/office-template.ejs', cssclass: 'icon_32x32 office' },
        { name: 'lightswitch', title: 'LightSwitch', template: '/scripts/templates/lightswitch-template.ejs', cssclass: 'icon_32x32 lightswitch' },
        { name: 'java', title: 'Java', template: '/scripts/templates/java-template.ejs', cssclass: 'icon_32x32 java' },
        { name: 'ruby', title: 'Ruby', template: '/scripts/templates/ruby-template.ejs', cssclass: 'icon_32x32 ruby' },
        { name: 'php', title: 'PHP', template: '/scripts/templates/php-template.ejs', cssclass: 'icon_32x32 php' }
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
};

function ServiceOperationCodeEditorModel(vm){
    var self = this;
    this.data = vm.service;
    
    self.error = ko.observable(false);
    /*self.codeMirror = function (el, value, error) {
        new $data.JayStormUI.CodeMirror(el, value, error);
    };*/
    
    //var h = self.data.owner.Handler();
    
    self.originalValue = self.data.owner.FunctionBody();
    setTimeout(function(){
        if (!self.data.owner.FunctionBody()) self.data.owner.FunctionBody(new EJS({ url: '/scripts/serviceoperation-template.ejs' }).render({ name: self.data.owner.Name() }));
        new $data.JayStormUI.CodeMirror('serviceoperation-code-editor-' + self.data.rowIndex(), self.data.owner.FunctionBody, self.error);
    }, 1);
    
    this.saveHandler = function(){
        /*if (self.data.owner.Handler() != h){
            var f = adminApiClient.currentAppDBContextFactory();
            var c = f();
            
            c.onReady(function(db){
                db.EventHandlers.attach(self.data.owner);
                eh.Handler = 
            });
        }*/
        adminApiClient.publishChanges(true);
    };
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    };
    
    vm.parent.codeEditor.push(self);
}

function ServiceOperationsEditorModel(vm){
    var self = this;
    this.data = vm.service;
    
    var service = vm.service.owner;
    var context = vm.factory()();
        
    self.error = ko.observable(false);
    self.codeMirror = function (el, value, error) {
        new $data.JayStormUI.CodeMirror(el, value, error);
    };

    self.codeHighlight = function(el, value){
        new $data.JayStormUI.CodeHighlight(el, value);
    };

    self.beforeSaveHandler = function () {
        //vm.closeControlBox();
        var tmp = self.codeEditor.slice();
        
        tmp.forEach(function(it){
            if (it.closeControlBox){
                it.closeControlBox();
            }
        });
        
        self.codeEditor.length = 0;
        adminApiClient.publishChanges(true);
    };
    
    self.afterRevertHandler = function(item){
        var tmp = self.codeEditor.slice();
        
        var cb = tmp.filter(function(it){ return it.data.owner.ServiceID() === item.ServiceID() })[0];
        if (cb && cb.closeControlBox) cb.closeControlBox();
        
        self.codeEditor.splice(self.codeEditor.indexOf(cb), 1);
        
        item.FunctionBody(cb.originalValue);
        adminApiClient.publishChanges(adminApiClient.publishChanges() || false);
    };
    
    self.codeEditor = [];
    
    self.editCode = function(e){
        e.showControls.bind({}, 'serviceOperationCodeEditor', ServiceOperationCodeEditorModel, { service: self.data, serviceOperation: e, parent: self });
    };
    
    self.buildServiceSource = function(){
        if (confirm('Service source code will be rebuild from service operations. Are you sure you want to continue with build?')){
            context.ServiceOperations.filter(function(it){ return it.ServiceID == this.serviceid; }, { serviceid: service.ServiceID() }).toArray(function(r){
                context.Services.attach(service);
                service.ServiceSource(new EJS({ url: '/scripts/buildservice-template.ejs' }).render({ serviceName: service.Name(), serviceOperations: r }));
                context.saveChanges();
            });
        }
    };
    
    this.closeControlBox = function(){
        vm.closeControlBox();
    };
};
