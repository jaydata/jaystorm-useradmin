﻿$data.Class.define('$data.JayStorm.ServiceDefinitionXml', null, null, {
    constructor: function (config) {
        this.cfg = $data.typeSystem.extend({

            xmlns: 'http://www.w3.org/2007/app',
            atomNs: 'http://www.w3.org/2005/Atom',
            appNs: 'http://www.w3.org/2007/app',

            xmlHead: '<?xml version="1.0" encoding="iso-8859-1" standalone="yes" ?>',

        }, config);

    },
    convertToResponse: function (contextInstance, requestUrl) {

        var xml = new $data.GenxXMLCreator();

        var xmlResult = this.cfg.xmlHead;
        xml.writer.on('data', function (data) {
            xmlResult += data;
        });

        xml.startDocument();
        
        var service = xml.declareElement('service');
        xml.startElement(service);

        //atom
        var atomNs = xml.declareNamespace(this.cfg.atomNs, 'atom');
        var source = xml.declareAttribute(atomNs, 'source');
        xml.addAttribute(source, 'JayStrom');

        //app
        var appNs = xml.declareNamespace(this.cfg.appNs, 'app');
        var application = xml.declareAttribute(appNs, 'application');
        xml.addAttribute(application, contextInstance.getType().name);

        //xmlns
        var xmlns = xml.declareAttribute('xmlns');
        xml.addAttribute(xmlns, this.cfg.xmlns);

        //base
        var base = xml.declareAttribute('xml__base');
        xml.addAttribute(base, requestUrl + '/');

        this._buildWorkspaces(xml, contextInstance, atomNs);

        xml.endElement();
        xml.endDocument();

        return xmlResult.replace('xml__base', 'xml:base');

    },
    _buildWorkspaces: function (xml, context, atomNs) {
        var workspace = xml.declareElement('workspace');
        xml.startElement(workspace);

        //Default
        var title = xml.declareElement(atomNs, 'title');
        xml.startElement(title).addText('Default').endElement();

        for (var esName in context._entitySetReferences) {
            var entitySet = context._entitySetReferences[esName];
            if (entitySet instanceof $data.EntitySet) {
                this._buildCollection(xml, entitySet, atomNs);
            }
        }

        xml.endElement();
    },
    _buildCollection: function (xml, entitySet, atomNs) {
        var href = xml.declareAttribute('href');
        var collection = xml.declareElement('collection');
        xml.startElement(collection)
            .addAttribute(href, entitySet.collectionName);

        var title = xml.declareElement(atomNs, 'title');
        xml.startElement(title).addText(entitySet.collectionName).endElement();

        xml.endElement();
    }
});