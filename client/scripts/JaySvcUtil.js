
$data.Class.define('$data.MetadataLoaderClass', null, null, {
    load: function (metadataUri, callBack, config) {
        
        var cnf = {
            EntityBaseClass: '$data.Entity',
            ContextBaseClass: '$data.EntityContext',
            AutoCreateContext: false,
            DefaultNamespace: ('ns' + Math.random()).replace('.', '') + metadataUri.replace(/[^\w]/g, "_"),
            ContextInstanceName: 'context',
            EntitySetBaseClass: '$data.EntitySet',
            CollectionBaseClass: 'Array',
            url: metadataUri,
            user: undefined,
            password: undefined,
            withCredentials: undefined,
            mode: '_metadataConverterXSLT'
        };

        $data.typeSystem.extend( cnf, config || {});

        if (cnf.DefaultNamespace && cnf.DefaultNamespace.lastIndexOf('.') !== (cnf.DefaultNamespace.length - 1))
            cnf.DefaultNamespace += '.';

        this.factoryCache = this.factoryCache || {};
        callBack = $data.typeSystem.createCallbackSetting(callBack);

        if (metadataUri in this.factoryCache) {

            /*console.log("served from cache");
            console.dir(this.factoryCache[metadataUri]);*/
            callBack.success.apply({}, this.factoryCache[metadataUri]);
            return;
        }




        var metadataUri;
        if (cnf.url) {
            cnf.SerivceUri = cnf.url.replace('/$metadata', '');
            if (cnf.url.indexOf('/$metadata') === -1) {
                cnf.metadataUri = cnf.url.replace(/\/+$/, '') + '/$metadata';
            } else {
                cnf.metadataUri = cnf.url;
            }
        } else {
            callBack.error('metadata url is missing');
        }

        var self = this;
        self._loadXMLDoc(cnf, function (xml, response) {
            if (response.statusCode < 200 || response.statusCode > 299) {
                callBack.error(response);
                return;
            }

            var versionInfo = self._findVersion(xml);
            if (self.xsltRepoUrl) {
                console.log('XSLT: ' + self.xsltRepoUrl + self._supportedODataVersionXSLT[versionInfo.version])
                self._loadXMLDoc({ 
                    metadataUri: self.xsltRepoUrl + self._supportedODataVersionXSLT[versionInfo.version],
                    user: cnf.user,
                    password: cnf.password,
                    headers: cnf.headers
                }, function (xsl, response) {
                    if (response.statusCode < 200 || response.statusCode > 299) {
                        callBack.error(response);
                        return;
                    }

                    self._transform(callBack, versionInfo, xml, xsl, cnf);
                });
            } else {
                self._transform(callBack, versionInfo, xml, undefined, cnf);
            }

        });
    },
    debugMode: { type: 'bool', value: false },
    xsltRepoUrl: { type: 'string', value: '' },

    createFactoryFunc: function (ctxType, cnf) {
        var self = this;
        return function (config) {
            if (ctxType) {
                var cfg = $data.typeSystem.extend({
                    name: 'oData',
                    oDataServiceHost: cnf.SerivceUri,
                    //maxDataServiceVersion: '',
                    user: cnf.user,
                    password: cnf.password,
                    withCredentials: cnf.withCredentials
                }, config)


                return new ctxType(cfg);
            } else {
                return null;
            }
        }
    },

    _transform: function (callBack, versionInfo, xml, xsl, cnf) {
        var self = this;
        var codeText = self._processResults(cnf.url, versionInfo, xml, xsl, cnf);
        if (cnf.mode !== '_metadataConverterXSLT') {
            if (self.debugMode)
                callBack.success(undefined, undefined, codeText);
        }else{
            eval(codeText);
            var ctxType = $data.generatedContexts.pop();
            var factoryFn = self.createFactoryFunc(ctxType, cnf);
            this.factoryCache[cnf.url] = [factoryFn, ctxType];
            
            if (self.debugMode)
                callBack.success(factoryFn, ctxType, codeText);
            else
                callBack.success(factoryFn, ctxType);
        }
    },
    _loadXMLDoc: function (cnf, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", cnf.metadataUri, true);
        if (cnf.httpHeaders) {
            Object.keys(cnf.httpHeaders).forEach(function (header) {
                xhttp.setRequestHeader(header, cnf.httpHeaders[header]);
            });
        }
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState === 4) {
                var response = { requestUri: cnf.metadataUri, statusCode: xhttp.status, statusText: xhttp.statusText };
                callback(xhttp.responseXML || xhttp.responseText, response);
            }
        };

        if (cnf.user && cnf.password && (!cnf.httpHeaders || (cnf.httpHeaders && !cnf.httpHeaders['Authorization'])))
            xhttp.setRequestHeader("Authorization", "Basic " + this.__encodeBase64(cnf.user + ":" + cnf.password));

        xhttp.send("");
    },
    _processResults: function (metadataUri, versionInfo, metadata, xsl, cnf) {
        var transformXslt = this.getCurrentXSLTVersion(versionInfo, metadata, cnf);

        if (window.ActiveXObject) {
            var xslt = new ActiveXObject("Msxml2.XSLTemplate.6.0");
            var xsldoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument.6.0");
            var xslproc;
            xsldoc.async = false;
            if (xsl)
                xsldoc.load(xsl);
            else
                xsldoc.loadXML(transformXslt);
            if (xsldoc.parseError.errorCode != 0) {
                var myErr = xsldoc.parseError;
            } else {
                xslt.stylesheet = xsldoc;
                var xmldoc = new ActiveXObject("Msxml2.DOMDocument.6.0");
                xmldoc.async = false;
                xmldoc.load(metadata);
                if (xmldoc.parseError.errorCode != 0) {
                    var myErr = xmldoc.parseError;
                } else {
                    xslproc = xslt.createProcessor();
                    xslproc.input = xmldoc;

                    xslproc.addParameter('SerivceUri', cnf.SerivceUri);
                    xslproc.addParameter('EntityBaseClass', cnf.EntityBaseClass);
                    xslproc.addParameter('ContextBaseClass', cnf.ContextBaseClass);
                    xslproc.addParameter('AutoCreateContext', cnf.AutoCreateContext);
                    xslproc.addParameter('ContextInstanceName', cnf.ContextInstanceName);
                    xslproc.addParameter('EntitySetBaseClass', cnf.EntitySetBaseClass);
                    xslproc.addParameter('CollectionBaseClass', cnf.CollectionBaseClass);
                    xslproc.addParameter('DefaultNamespace', cnf.DefaultNamespace);


                    xslproc.transform();
                    return xslproc.output;
                }
            }
            return '';
        } else if (typeof document !== 'undefined' && document.implementation && document.implementation.createDocument) {
            var xsltStylesheet;
            if (xsl) {
                xsltStylesheet = xsl;
            } else {
                var parser = new DOMParser();
                xsltStylesheet = parser.parseFromString(transformXslt, "text/xml");
            }

            var xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xsltStylesheet);
            xsltProcessor.setParameter(null, 'SerivceUri', cnf.SerivceUri);
            xsltProcessor.setParameter(null, 'DefaultServiceURI', cnf.SerivceUri);
            xsltProcessor.setParameter(null, 'EntityBaseClass', cnf.EntityBaseClass);
            xsltProcessor.setParameter(null, 'ContextBaseClass', cnf.ContextBaseClass);
            xsltProcessor.setParameter(null, 'AutoCreateContext', cnf.AutoCreateContext);
            xsltProcessor.setParameter(null, 'ContextInstanceName', cnf.ContextInstanceName);
            xsltProcessor.setParameter(null, 'EntitySetBaseClass', cnf.EntitySetBaseClass);
            xsltProcessor.setParameter(null, 'CollectionBaseClass', cnf.CollectionBaseClass);
            xsltProcessor.setParameter(null, 'DefaultNamespace', cnf.DefaultNamespace);
            resultDocument = xsltProcessor.transformToFragment(metadata, document);

            return resultDocument.textContent;
        } else if (typeof module !== 'undefined' && typeof require !== 'undefined') {
            var xslt = require('node_xslt');
            var libxml = require('libxmljs');

            return xslt.transform(xslt.readXsltString(transformXslt), xslt.readXmlString(metadata), [
                'SerivceUri', "'" + cnf.SerivceUri + "'",
                'EntityBaseClass', "'" + cnf.EntityBaseClass + "'",
                'ContextBaseClass', "'" + cnf.ContextBaseClass + "'",
                'AutoCreateContext', "'" + cnf.AutoCreateContext + "'",
                'ContextInstanceName', "'" + cnf.ContextInstanceName + "'",
                'EntitySetBaseClass', "'" + cnf.EntitySetBaseClass + "'",
                'CollectionBaseClass', "'" + cnf.CollectionBaseClass + "'",
                'DefaultNamespace', "'" + cnf.DefaultNamespace + "'"
            ]);
        }
    },
    _findVersion: function (metadata) {
        if (typeof metadata === 'object' && "getElementsByTagName" in metadata){
            var version = 'http://schemas.microsoft.com/ado/2008/09/edm';
            var item = metadata.getElementsByTagName('Schema');
            if (item)
                item = item[0];
            if (item)
                item = item.attributes;
            if (item)
                item = item.getNamedItem('xmlns');
            if (item)
                version = item.value;

            var versionNum = this._supportedODataVersions[version];
            return {
                ns: version,
                version: versionNum || 'unknown'
            };
        }else if (typeof module !== 'undefined' && typeof require !== 'undefined'){
            var xslt = require('node_xslt');
            var libxml = require('libxmljs');

            var schemaXml = metadata;
            var schemaNamespace = 'http://schemas.microsoft.com/ado/2008/09/edm';

            /*var parserEvents = {
             startElementNS: function() {
             if ('Schema' === arguments[0]){
             schemaNamespace = arguments[3];
             }
             }
             };

             var parser = new libxml.SaxParser(parserEvents);
             parser.parseString(schemaXml);*/

            return {
                ns: schemaNamespace,
                version: 'nodejs'
            }
        }
    },
    _supportedODataVersions: {
        value: {
            "http://schemas.microsoft.com/ado/2006/04/edm": "V1",
            "http://schemas.microsoft.com/ado/2008/09/edm": "V2",
            "http://schemas.microsoft.com/ado/2009/11/edm": "V3",
            "http://schemas.microsoft.com/ado/2007/05/edm": "V11"
        }
    },
    _supportedODataVersionXSLT: {
        value: {
            "V1": 'JayDataContextGen$my.contexterator_OData_V1.xslt',
            "V2": 'JayDataContextGenerator_OData_V2.xslt',
            "V3": 'JayDataContextGenerator_OData_V3.xslt',
            "V11": 'JayDataContextGenerator_OData_V11.xslt'
        }
    },
    getCurrentXSLTVersion: function (versionInfo, metadata, cnf) {
        return this[cnf.mode].replace('@@VERSIONNS@@', versionInfo.ns).replace('@@VERSION@@', versionInfo.version);
    },
    __encodeBase64: function (val) {
        var b64array = "ABCDEFGHIJKLMNOP" +
                           "QRSTUVWXYZabcdef" +
                           "ghijklmnopqrstuv" +
                           "wxyz0123456789+/" +
                           "=";

        var input = val;
        var base64 = "";
        var hex = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            base64 = base64 +
                        b64array.charAt(enc1) +
                        b64array.charAt(enc2) +
                        b64array.charAt(enc3) +
                        b64array.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return base64;
    },
    _metadataTypeScriptConverterXSLT: {
        type: 'string',
        value:
            "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" \r\n" +
            "                xmlns:edm=\"@@VERSIONNS@@\" \r\n" +
            "                xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" \r\n" +
            "                xmlns:annot=\"http://schemas.microsoft.com/ado/2009/02/edm/annotation\" \r\n" +
            "                xmlns:exsl=\"http://exslt.org/common\" \r\n" +
            "                xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\">\r\n" +
            "\r\n" +
            "  <xsl:key name=\"entityType\" match=\"edm:EntityType\" use=\"concat(string(../@Namespace),'.', string(@Name))\"/>\r\n" +
            "  <xsl:key name=\"associations\" match=\"edm:Association\" use=\"concat(string(../@Namespace),'.', string(@Name))\"/>\r\n" +
            "\r\n" +
            "  <xsl:strip-space elements=\"property item unprocessed\"/>\r\n" +
            "  <xsl:output method=\"text\" indent=\"no\"  />\r\n" +
            "  <xsl:param name=\"contextNamespace\" />\r\n" +
            "\r\n" +
            "  <xsl:param name=\"SerivceUri\" />\r\n" +
            "  <xsl:param name=\"EntityBaseClass\"/>\r\n" +
            "  <xsl:param name=\"ContextBaseClass\"/>\r\n" +
            "  <xsl:param name=\"AutoCreateContext\"/>\r\n" +
            "  <xsl:param name=\"ContextInstanceName\"/>\r\n" +
            "  <xsl:param name=\"EntitySetBaseClass\"/>\r\n" +
            "  <xsl:param name=\"CollectionBaseClass\"/>\r\n" +
            "  <xsl:param name=\"DefaultNamespace\"/>\r\n" +
            "\r\n" +
            "  <xsl:variable name=\"EdmJayTypeMapping\">\r\n" +
            "    <map from=\"Edm.Boolean\" to=\"bool\" />\r\n" +
            "    <map from=\"Edm.Binary\" to=\"$data.Blob\" />\r\n" +
            "    <map from=\"Edm.DateTime\" to=\"Date\" />\r\n" +
            "    <map from=\"Edm.DateTimeOffset\" to=\"Date\" />\r\n" +
            "    <map from=\"Edm.Time\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Decimal\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Single\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Double\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Guid\" to=\"$data.Guid\" />\r\n" +
            "    <map from=\"Edm.Int16\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Int32\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Int64\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.Byte\" to=\"number\" />\r\n" +
            "    <map from=\"Edm.String\" to=\"string\" />\r\n" +
            "    <map from=\"Edm.GeographyPoint\" to=\"$data.Geography\" />\r\n" +
            "  </xsl:variable>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"/\">///&lt;reference path=\"./jaydata.d.ts\" /&gt;\r\n" +
            "/*//////////////////////////////////////////////////////////////////////////////////////\r\n" +
            "////// Autogenerated by JaySvcUtil.exe http://JayData.org for more info        /////////\r\n" +
            "//////                      oData @@VERSION@@ TypeScript                                /////////\r\n" +
            "//////////////////////////////////////////////////////////////////////////////////////*/\r\n" +
            "\r\n" +
            "<xsl:for-each select=\"//edm:Schema\"  xml:space=\"default\">\r\n" +
            "module <xsl:value-of select=\"concat($DefaultNamespace,@Namespace)\"/> {\r\n" +
            "<xsl:for-each select=\"edm:EntityType | edm:ComplexType\" xml:space=\"default\">\r\n" +
            "  <xsl:message terminate=\"no\">Info: generating type <xsl:value-of select=\"concat(../@Namespace, '.', @Name)\"/>\r\n" +
            "</xsl:message>\r\n" +
            "    <xsl:variable name=\"ctorprops\">\r\n" +
            "    <xsl:apply-templates select=\"*\">\r\n" +
            "      <xsl:with-param name=\"suffix\" select=\"'?'\" />\r\n" +
            "    </xsl:apply-templates>\r\n" +
            "  </xsl:variable>\r\n" +
            "  <xsl:variable name=\"props\">\r\n" +
            "    <xsl:apply-templates select=\"*\" />\r\n" +
            "  </xsl:variable>\r\n" +
            "  <xsl:variable name=\"keyprops\">\r\n" +
            "    <xsl:apply-templates select=\"*\">\r\n" +
            "      <xsl:with-param name=\"suffix\" select=\"''\" />\r\n" +
            "      <xsl:with-param name=\"keyProperties\" select=\"'true'\" />\r\n" +
            "    </xsl:apply-templates>\r\n" +
            "  </xsl:variable>\r\n" +
            "  <xsl:variable name=\"fullName\">\r\n" +
            "    <xsl:value-of select=\"concat($DefaultNamespace,parent::edm:Schema/@Namespace)\"/>.<xsl:value-of select=\"@Name\"/>\r\n" +
            "  </xsl:variable>\r\n" +
            " \r\n" +
            "  <xsl:text xml:space=\"preserve\">  </xsl:text>class <xsl:value-of select=\"@Name\"/> extends <xsl:value-of select=\"$EntityBaseClass\"  /> {\r\n" +
            "    constructor ();\r\n" +
            "    constructor (initData: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$ctorprops\" /></xsl:call-template>});\r\n" +
            "    <xsl:choose>\r\n" +
            "    <xsl:when test=\"function-available('msxsl:node-set')\">\r\n" +
            "      <xsl:for-each select=\"msxsl:node-set($props)/*\">\r\n" +
            "        <xsl:value-of select=\".\"/>;\r\n" +
            "    </xsl:for-each>\r\n" +
            "    </xsl:when>\r\n" +
            "    <xsl:otherwise>\r\n" +
            "      <xsl:for-each select=\"exsl:node-set($props)/*\">\r\n" +
            "        <xsl:value-of select=\".\"/>;\r\n" +
            "    </xsl:for-each>\r\n" +
            "    </xsl:otherwise>\r\n" +
            "  </xsl:choose>\r\n" +
            "  }\r\n" +
            "\r\n" +
            "  export interface <xsl:value-of select=\"@Name\"/>Queryable extends $data.Queryable {\r\n" +
            "    filter(predicate:(it: <xsl:value-of select=\"$fullName\"/>) => bool): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "    filter(predicate:(it: <xsl:value-of select=\"$fullName\"/>) => bool, thisArg: any): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "\r\n" +
            "    map(projection: (it: <xsl:value-of select=\"$fullName\"/>) => any): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "\r\n" +
            "    length(): $data.IPromise;\r\n" +
            "    length(handler: (result: number) => void): $data.IPromise;\r\n" +
            "    length(handler: { success?: (result: number) => void; error?: (result: any) => void; }): $data.IPromise;\r\n" +
            "\r\n" +
            "    forEach(handler: (it: <xsl:value-of select=\"$fullName\"/>) => void ): $data.IPromise;\r\n" +
            "    \r\n" +
            "    toArray(): $data.IPromise;\r\n" +
            "    toArray(handler: (result: <xsl:value-of select=\"$fullName\"/>[]) => void): $data.IPromise;\r\n" +
            "    toArray(handler: { success?: (result: <xsl:value-of select=\"$fullName\"/>[]) => void; error?: (result: any) => void; }): $data.IPromise;\r\n" +
            "\r\n" +
            "    single(predicate: (it: <xsl:value-of select=\"$fullName\"/>, params?: any) => bool, params?: any, handler?: (result: <xsl:value-of select=\"$fullName\"/>) => void): $data.IPromise;\r\n" +
            "    single(predicate: (it: <xsl:value-of select=\"$fullName\"/>, params?: any) => bool, params?: any, handler?: { success?: (result: <xsl:value-of select=\"$fullName\"/>[]) => void; error?: (result: any) => void; }): $data.IPromise;\r\n" +
            "\r\n" +
            "    take(amout: number): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "    skip(amout: number): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "\r\n" +
            "    order(selector: string): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "    orderBy(predicate: (it: <xsl:value-of select=\"$fullName\"/>) => any): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "    orderByDescending(predicate: (it: <xsl:value-of select=\"$fullName\"/>) => any): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "    \r\n" +
            "    first(predicate: (it: <xsl:value-of select=\"$fullName\"/>, params?: any) => bool, params?: any, handler?: (result: <xsl:value-of select=\"$fullName\"/>) => void): $data.IPromise;\r\n" +
            "    first(predicate: (it: <xsl:value-of select=\"$fullName\"/>, params?: any) => bool, params?: any, handler?: { success?: (result: <xsl:value-of select=\"$fullName\"/>[]) => void; error?: (result: any) => void; }): $data.IPromise;\r\n" +
            "    \r\n" +
            "    include(selector: string): <xsl:value-of select=\"$fullName\"/>Queryable;\r\n" +
            "\r\n" +
            "    removeAll(): $data.IPromise;\r\n" +
            "    removeAll(handler: (count: number) => void): $data.IPromise;\r\n" +
            "    removeAll(handler: { success?: (result: number) => void; error?: (result: any) => void; }): $data.IPromise;\r\n" +
            "  }\r\n" +
            "\r\n" +
            "<xsl:if test=\"local-name() != 'ComplexType'\">\r\n" +
            "  export interface <xsl:value-of select=\"@Name\"/>Set extends <xsl:value-of select=\"@Name\"/>Queryable {\r\n" +
            "    add(initData: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$ctorprops\" /></xsl:call-template>}): <xsl:value-of select=\"$fullName\"/>;\r\n" +
            "    add(item: <xsl:value-of select=\"$fullName\"/>): <xsl:value-of select=\"$fullName\"/>;\r\n" +
            "\r\n" +
            "    attach(item: <xsl:value-of select=\"$fullName\"/>): void;\r\n" +
            "    attach(item: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$keyprops\" /></xsl:call-template>}): void;\r\n" +
            "    attachOrGet(item: <xsl:value-of select=\"$fullName\"/>): <xsl:value-of select=\"$fullName\"/>;\r\n" +
            "    attachOrGet(item: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$keyprops\" /></xsl:call-template>}): <xsl:value-of select=\"$fullName\"/>;\r\n" +
            "\r\n" +
            "    detach(item: <xsl:value-of select=\"$fullName\"/>): void;\r\n" +
            "    detach(item: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$keyprops\" /></xsl:call-template>}): void;\r\n" +
            "\r\n" +
            "    remove(item: <xsl:value-of select=\"$fullName\"/>): void;\r\n" +
            "    remove(item: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$keyprops\" /></xsl:call-template>}): void;\r\n" +
            "    \r\n" +
            "    elementType: new (initData: { <xsl:call-template name=\"generateProperties\"><xsl:with-param name=\"properties\" select=\"$ctorprops\" /></xsl:call-template>}) => <xsl:value-of select=\"$fullName\"/>;\r\n" +
            "  }\r\n" +
            "\r\n" +
            "</xsl:if>\r\n" +
            "</xsl:for-each>\r\n" +
            "\r\n" +
            "<xsl:for-each select=\"edm:EntityContainer\">\r\n" +
            "  <xsl:text xml:space=\"preserve\">  </xsl:text>export class <xsl:value-of select=\"@Name\"/> extends <xsl:value-of select=\"$ContextBaseClass\"  /> {\r\n" +
            "    onReady(handler: (context: <xsl:value-of select=\"@Name\"/>) => void): $data.IPromise;\r\n" +
            "    <xsl:for-each select=\"edm:EntitySet | edm:FunctionImport\">\r\n" +
            "      <xsl:apply-templates select=\".\" />;\r\n" +
            "    </xsl:for-each>\r\n" +
            "  }\r\n" +
            "</xsl:for-each>\r\n" +
            "<xsl:text>}\r\n" +
            "</xsl:text>\r\n" +
            "</xsl:for-each> \r\n" +
            "    \r\n" +
            "</xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template name=\"generateProperties\">\r\n" +
            "    <xsl:param name=\"properties\" />\r\n" +
            "\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"function-available('msxsl:node-set')\">\r\n" +
            "        <xsl:for-each select=\"msxsl:node-set($properties)/*\">\r\n" +
            "          <xsl:value-of select=\".\"/>\r\n" +
            "          <xsl:text>; </xsl:text>\r\n" +
            "        </xsl:for-each>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:for-each select=\"exsl:node-set($properties)/*\">\r\n" +
            "          <xsl:value-of select=\".\"/>\r\n" +
            "          <xsl:text>; </xsl:text>\r\n" +
            "        </xsl:for-each>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:Key\"></xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"edm:FunctionImport\">\r\n" +
            "    <xsl:variable name=\"isCollection\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"starts-with(@ReturnType, 'Collection')\">\r\n" +
            "          <xsl:value-of select=\"'true'\"/>\r\n" +
            "        </xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\"'false'\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:variable>\r\n" +
            "    <xsl:variable name=\"elementType\">\r\n" +
            "      <xsl:if test=\"$isCollection = 'true'\">\r\n" +
            "        <xsl:call-template name=\"GetElementType\">\r\n" +
            "          <xsl:with-param name=\"ReturnType\" select=\"@ReturnType\" />\r\n" +
            "          <xsl:with-param name=\"noResolve\" select=\"'true'\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "      </xsl:if>\r\n" +
            "    </xsl:variable>\r\n" +
            "    <xsl:variable name=\"canFilter\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"$isCollection = 'true' and not(starts-with($elementType, 'Edm'))\">\r\n" +
            "          <xsl:value-of select=\"'true'\"/>\r\n" +
            "        </xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\"'false'\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:variable>\r\n" +
            "\r\n" +
            "    <xsl:value-of select=\"@Name\"/>\r\n" +
            "    <xsl:text>: </xsl:text>\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"$canFilter = 'true'\">\r\n" +
            "        <xsl:text>{ (</xsl:text>\r\n" +
            "        <xsl:for-each select=\"edm:Parameter\">\r\n" +
            "          <xsl:value-of select=\"@Name\"/>: <xsl:apply-templates select=\"@Type\" mode=\"render-functionImport-type\" />\r\n" +
            "          <xsl:if test=\"position() != last()\">\r\n" +
            "            <xsl:text>, </xsl:text>\r\n" +
            "          </xsl:if>\r\n" +
            "        </xsl:for-each>\r\n" +
            "        <xsl:text>): </xsl:text>\r\n" +
            "        <xsl:value-of select=\"$elementType\"/>\r\n" +
            "        <xsl:text>Queryable; </xsl:text>\r\n" +
            "\r\n" +
            "        <xsl:text>(</xsl:text>\r\n" +
            "        <xsl:for-each select=\"edm:Parameter\">\r\n" +
            "          <xsl:value-of select=\"@Name\"/>: <xsl:apply-templates select=\"@Type\" mode=\"render-functionImport-type\" /><xsl:text>, </xsl:text>\r\n" +
            "        </xsl:for-each>\r\n" +
            "        <xsl:text>handler: (</xsl:text>\r\n" +
            "        <xsl:apply-templates select=\".\" mode=\"render-return-config\" />\r\n" +
            "        <xsl:text>) => void): $data.IPromise; </xsl:text>\r\n" +
            "        <xsl:text>}</xsl:text>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:text>(</xsl:text>\r\n" +
            "        <xsl:for-each select=\"edm:Parameter\">\r\n" +
            "          <xsl:value-of select=\"@Name\"/>: <xsl:apply-templates select=\"@Type\" mode=\"render-functionImport-type\" /><xsl:text>, </xsl:text>\r\n" +
            "        </xsl:for-each>\r\n" +
            "        <xsl:text>handler?: (</xsl:text>\r\n" +
            "        <xsl:apply-templates select=\".\" mode=\"render-return-config\" />\r\n" +
            "        <xsl:text>) => void) => $data.IPromise</xsl:text>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "    <!--<xsl:choose>\r\n" +
            "      <xsl:when test=\"$canFilter = 'true'\">\r\n" +
            "        <xsl:text>) => void) => </xsl:text>\r\n" +
            "        <xsl:value-of select=\"$elementType\"/>\r\n" +
            "        <xsl:text>Queryable</xsl:text>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>-->\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Type | @ReturnType\" mode=\"render-functionImport-type\">\r\n" +
            "    <xsl:variable name=\"curr\" select=\".\"/>\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"//edm:Schema[starts-with($curr, @Namespace)]\"> \r\n" +
            "        <xsl:value-of select=\"concat($DefaultNamespace,$curr)\" />\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:call-template name=\"resolveType\">\r\n" +
            "          <xsl:with-param name=\"type\" select=\"$curr\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:FunctionImport\" mode=\"render-return-config\">\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"not(@ReturnType)\"></xsl:when>\r\n" +
            "      <xsl:when test=\"starts-with(@ReturnType, 'Collection')\">\r\n" +
            "        <xsl:text>result: </xsl:text>\r\n" +
            "        <xsl:call-template name=\"GetElementType\">\r\n" +
            "          <xsl:with-param name=\"ReturnType\" select=\"@ReturnType\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "        <xsl:text>[]</xsl:text>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>result: <xsl:apply-templates select=\"@ReturnType\" mode=\"render-functionImport-type\" /></xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template name=\"GetElementType\">\r\n" +
            "    <xsl:param name=\"ReturnType\" />\r\n" +
            "    <xsl:param name=\"noResolve\" />\r\n" +
            "\r\n" +
            "    <xsl:variable name=\"len\" select=\"string-length($ReturnType)-12\"/>\r\n" +
            "    <xsl:variable name=\"curr\" select=\"substring($ReturnType,12,$len)\"/>\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"//edm:Schema[starts-with($curr, @Namespace)]\">\r\n" +
            "        <xsl:value-of select=\"concat($DefaultNamespace,$curr)\" />\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"$noResolve = ''\">\r\n" +
            "            <xsl:call-template name=\"resolveType\">\r\n" +
            "              <xsl:with-param name=\"type\" select=\"$curr\" />\r\n" +
            "            </xsl:call-template>\r\n" +
            "          </xsl:when>\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <xsl:value-of select=\"$curr\"/>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:EntitySet\"><xsl:value-of select=\"@Name\"/>: <xsl:value-of select=\"concat($DefaultNamespace,@EntityType)\"/>Set</xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:Property | edm:NavigationProperty\">\r\n" +
            "    <xsl:param name=\"suffix\" />\r\n" +
            "    <xsl:param name=\"keyProperties\" />\r\n" +
            "    <xsl:if test=\"$keyProperties != 'true' or parent::edm:EntityType/edm:Key/edm:PropertyRef[@Name = current()/@Name]\">\r\n" +
            "      <property>\r\n" +
            "    <xsl:variable name=\"memberDefinition\">\r\n" +
            "      <xsl:if test=\"parent::edm:EntityType/edm:Key/edm:PropertyRef[@Name = current()/@Name]\"><attribute name=\"key\">true</attribute></xsl:if>\r\n" +
            "      <xsl:apply-templates select=\"@*[local-name() != 'Name']\" mode=\"render-field\" />\r\n" +
            "    </xsl:variable>\r\n" +
            "      <xsl:value-of select=\"@Name\"/><xsl:value-of select=\"$suffix\"/>: <xsl:choose>\r\n" +
            "      <xsl:when test=\"function-available('msxsl:node-set')\">\r\n" +
            "        <xsl:call-template name=\"propertyType\">\r\n" +
            "          <xsl:with-param name=\"type\" select=\"msxsl:node-set($memberDefinition)/*[@name = 'type']\" />\r\n" +
            "          <xsl:with-param name=\"elementType\" select=\"msxsl:node-set($memberDefinition)/*[@name = 'elementType']\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:call-template name=\"propertyType\">\r\n" +
            "          <xsl:with-param name=\"type\" select=\"exsl:node-set($memberDefinition)/*[@name = 'type']\" />\r\n" +
            "          <xsl:with-param name=\"elementType\" select=\"exsl:node-set($memberDefinition)/*[@name = 'elementType']\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose></property>\r\n" +
            "    </xsl:if>\r\n" +
            "</xsl:template>\r\n" +
            "  <xsl:template name=\"propertyType\">\r\n" +
            "    <xsl:param name=\"type\" />\r\n" +
            "    <xsl:param name=\"elementType\" />\r\n" +
            "\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"$elementType\">\r\n" +
            "        <xsl:call-template name=\"resolveType\">\r\n" +
            "          <xsl:with-param name=\"type\" select=\"$elementType\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "        <xsl:text>[]</xsl:text>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:call-template name=\"resolveType\">\r\n" +
            "          <xsl:with-param name=\"type\" select=\"$type\" />\r\n" +
            "        </xsl:call-template>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "  <xsl:template name=\"resolveType\">\r\n" +
            "    <xsl:param name=\"type\" />\r\n" +
            "    <xsl:variable name=\"mapped\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"function-available('msxsl:node-set')\">\r\n" +
            "          <xsl:value-of select=\"msxsl:node-set($EdmJayTypeMapping)/*[@from = $type]/@to\"/>\r\n" +
            "        </xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\"exsl:node-set($EdmJayTypeMapping)/*[@from = $type]/@to\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:variable>\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"$mapped != ''\">\r\n" +
            "        <xsl:value-of select=\"$mapped\"/>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <xsl:value-of select=\"$type\"/>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"@Name\" mode=\"render-field\">\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Type\" mode=\"render-field\">\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"starts-with(., 'Collection')\">\r\n" +
            "        <attribute name=\"type\">Array</attribute>\r\n" +
            "        <xsl:variable name=\"len\" select=\"string-length(.)-12\"/>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"starts-with(., ../../../@Namespace)\">\r\n" +
            "            <attribute name=\"elementType\"><xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"substring(.,12,$len)\" /></attribute>\r\n" +
            "          </xsl:when>\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"elementType\"><xsl:value-of select=\"substring(.,12,$len)\" /></attribute>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"starts-with(., ../../../@Namespace)\">\r\n" +
            "        <attribute name=\"type\"><xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\".\"/></attribute>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <attribute name=\"type\"><xsl:value-of select=\".\"/></attribute>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@ConcurrencyMode\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"concurrencyMode\">$data.ConcurrencyMode.<xsl:value-of select=\".\"/></attribute>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Nullable\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"nullable\"><xsl:value-of select=\".\"/></attribute>\r\n" +
            "    \r\n" +
            "    <xsl:if test=\". = 'false'\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"parent::edm:Property/@annot:StoreGeneratedPattern = 'Identity' or parent::edm:Property/@annot:StoreGeneratedPattern = 'Computed'\"></xsl:when>\r\n" +
            "        <xsl:otherwise><attribute name=\"required\">true</attribute></xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:if>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@annot:StoreGeneratedPattern\" mode=\"render-field\">\r\n" +
            "    <xsl:if test=\". != 'None'\"><attribute name=\"computed\">true</attribute></xsl:if>    \r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@MaxLength\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"maxLength\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"string(.) = 'Max'\">Number.POSITIVE_INFINITY</xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\".\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </attribute>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@FixedLength | @Unicode | @Precision | @Scale\" mode=\"render-field\">\r\n" +
            "  </xsl:template>\r\n" +
            "  <xsl:template match=\"@*\" mode=\"render-field\">\r\n" +
            "    <xsl:variable name=\"nameProp\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"substring-after(name(), ':') != ''\">\r\n" +
            "          <xsl:value-of select=\"substring-after(name(), ':')\"/>\r\n" +
            "        </xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\"name()\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:variable>\r\n" +
            "    <xsl:element name=\"attribute\"><xsl:attribute name=\"extended\">true</xsl:attribute><xsl:attribute name=\"name\"><xsl:value-of select=\"$nameProp\"/></xsl:attribute>'<xsl:value-of select=\".\"/>'</xsl:element>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Relationship\" mode=\"render-field\">\r\n" +
            "    <xsl:variable name=\"relationName\" select=\"string(../@ToRole)\"/>\r\n" +
            "    <xsl:variable name=\"relationshipName\" select=\"string(.)\" />\r\n" +
            "    <xsl:variable name=\"relation\" select=\"key('associations',string(.))/edm:End[@Role = $relationName]\" />\r\n" +
            "    <xsl:variable name=\"otherName\" select=\"../@FromRole\" />\r\n" +
            "    <xsl:variable name=\"otherProp\" select=\"//edm:NavigationProperty[@ToRole = $otherName and @Relationship = $relationshipName]\" />\r\n" +
            "    <xsl:variable name=\"m\" select=\"$relation/@Multiplicity\" />\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"$m = '*'\">\r\n" +
            "        <attribute name=\"type\"><xsl:value-of select=\"$CollectionBaseClass\"/></attribute>\r\n" +
            "        <attribute name=\"elementType\"><xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/></attribute>\r\n" +
            "        <xsl:if test=\"not($otherProp/@Name)\">\r\n" +
            "          <attribute name=\"inverseProperty\">'$$unbound'</attribute></xsl:if>\r\n" +
            "        <xsl:if test=\"$otherProp/@Name\">\r\n" +
            "          <attribute name=\"inverseProperty\"><xsl:value-of select=\"$otherProp/@Name\"/></attribute></xsl:if>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"$m = '0..1'\">\r\n" +
            "        <attribute name=\"type\"><xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/></attribute>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"$otherProp\">\r\n" +
            "            <attribute name=\"inverseProperty\"><xsl:value-of select=\"$otherProp/@Name\"/></attribute>\r\n" +
            "          </xsl:when >\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"inverseProperty\">'$$unbound'</attribute>\r\n" +
            "            <xsl:message terminate=\"no\">  Warning: inverseProperty other side missing: <xsl:value-of select=\".\"/>\r\n" +
            "          </xsl:message>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"$m = '1'\">\r\n" +
            "        <attribute name=\"type\"><xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/></attribute>\r\n" +
            "        <attribute name=\"required\">true</attribute>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"$otherProp\">\r\n" +
            "            <attribute name=\"inverseProperty\">'<xsl:value-of select=\"$otherProp/@Name\"/>'</attribute>\r\n" +
            "          </xsl:when >\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"inverseProperty\">'$$unbound'</attribute>\r\n" +
            "            <xsl:message terminate=\"no\">\r\n" +
            "              Warning: inverseProperty other side missing: <xsl:value-of select=\".\"/>\r\n" +
            "            </xsl:message>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@FromRole | @ToRole\" mode=\"render-field\"></xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"*\" mode=\"render-field\">\r\n" +
            "    <!--<unprocessed>!!<xsl:value-of select=\"name()\"/>!!</unprocessed>-->\r\n" +
            "    <xsl:message terminate=\"no\">  Warning: <xsl:value-of select=\"../../@Name\"/>.<xsl:value-of select=\"../@Name\"/>:<xsl:value-of select=\"name()\"/> is an unknown/unprocessed attribued</xsl:message>\r\n" +
            "  </xsl:template>\r\n" +
            "  <!--<xsl:template match=\"*\">\r\n" +
            "    !<xsl:value-of select=\"name()\"/>!\r\n" +
            "  </xsl:template>-->\r\n" +
            "</xsl:stylesheet>\r\n"
    },
    _metadataConverterXSLT: {
        type: 'string',
        value:
            "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" \r\n" +
            "                xmlns:edm=\"@@VERSIONNS@@\" \r\n" +
            "                xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" \r\n" +
            "                xmlns:annot=\"http://schemas.microsoft.com/ado/2009/02/edm/annotation\" \r\n" +
            "                xmlns:exsl=\"http://exslt.org/common\" \r\n" +
            "                xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\">\r\n" +
            "\r\n" +
            "  <xsl:key name=\"entityType\" match=\"edm:EntityType\" use=\"concat(string(../@Namespace),'.', string(@Name))\"/>\r\n" +
            "  <xsl:key name=\"associations\" match=\"edm:Association\" use=\"concat(string(../@Namespace),'.', string(@Name))\"/>\r\n" +
            "\r\n" +
            "  <xsl:strip-space elements=\"property item unprocessed\"/>\r\n" +
            "  <xsl:output method=\"text\" indent=\"no\"  />\r\n" +
            "  <xsl:param name=\"contextNamespace\" />\r\n" +
            "\r\n" +
            "  <xsl:param name=\"SerivceUri\" />\r\n" +
            "  <xsl:param name=\"EntityBaseClass\"/>\r\n" +
            "  <xsl:param name=\"ContextBaseClass\"/>\r\n" +
            "  <xsl:param name=\"AutoCreateContext\"/>\r\n" +
            "  <xsl:param name=\"ContextInstanceName\"/>\r\n" +
            "  <xsl:param name=\"EntitySetBaseClass\"/>\r\n" +
            "  <xsl:param name=\"CollectionBaseClass\"/>\r\n" +
            "  <xsl:param name=\"DefaultNamespace\"/>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"/\">\r\n" +
            "\r\n" +
            "/*//////////////////////////////////////////////////////////////////////////////////////\r\n" +
            "////// Autogenerated by JaySvcUtil.exe http://JayData.org for more info        /////////\r\n" +
            "//////                             oData @@VERSION@@                                    /////////\r\n" +
            "//////////////////////////////////////////////////////////////////////////////////////*/\r\n" +
            "(function(global, $data, undefined) {\r\n" +
            "\r\n" +
            "<xsl:for-each select=\"//edm:EntityType | //edm:ComplexType\" xml:space=\"default\">\r\n" +
            "  <xsl:message terminate=\"no\">Info: generating type <xsl:value-of select=\"concat(../@Namespace, '.', @Name)\"/>\r\n" +
            "</xsl:message>\r\n" +
            "  <xsl:variable name=\"props\">\r\n" +
            "    <xsl:apply-templates select=\"*\" />\r\n" +
            "  </xsl:variable>\r\n" +
            "  <xsl:text xml:space=\"preserve\">  </xsl:text><xsl:value-of select=\"$EntityBaseClass\"  />.extend('<xsl:value-of select=\"concat($DefaultNamespace,../@Namespace)\"/>.<xsl:value-of select=\"@Name\"/>', {\r\n" +
            "    <xsl:choose><xsl:when test=\"function-available('msxsl:node-set')\">\r\n" +
            "    <xsl:for-each select=\"msxsl:node-set($props)/*\">\r\n" +
            "      <xsl:value-of select=\".\"/><xsl:if test=\"position() != last()\">,\r\n" +
            "    </xsl:if></xsl:for-each>\r\n" +
            "  </xsl:when>\r\n" +
            "  <xsl:otherwise>\r\n" +
            "    <xsl:for-each select=\"exsl:node-set($props)/*\">\r\n" +
            "      <xsl:value-of select=\".\"/><xsl:if test=\"position() != last()\">,\r\n" +
            "    </xsl:if></xsl:for-each>\r\n" +
            "    </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  });\r\n" +
            "  \r\n" +
            "</xsl:for-each>\r\n" +
            "\r\n" +
            "<xsl:for-each select=\"//edm:EntityContainer\">\r\n" +
            "  <xsl:text xml:space=\"preserve\">  </xsl:text><xsl:value-of select=\"$ContextBaseClass\"  />.extend('<xsl:value-of select=\"concat(concat($DefaultNamespace,../@Namespace), '.', @Name)\"/>', {\r\n" +
            "    <xsl:for-each select=\"edm:EntitySet | edm:FunctionImport\">\r\n" +
            "      <xsl:apply-templates select=\".\"></xsl:apply-templates><xsl:if test=\"position() != last()\">,\r\n" +
            "    </xsl:if>\r\n" +
            "    </xsl:for-each>\r\n" +
            "  });\r\n" +
            "\r\n" +
            "  $data.generatedContexts = $data.generatedContexts || [];\r\n" +
            "  $data.generatedContexts.push(<xsl:value-of select=\"concat(concat($DefaultNamespace,../@Namespace), '.', @Name)\" />);\r\n" +
            "  <xsl:if test=\"$AutoCreateContext = 'true'\">\r\n" +
            "  /*Context Instance*/\r\n" +
            "  <xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$ContextInstanceName\" /> = new <xsl:value-of select=\"concat(concat($DefaultNamespace,../@Namespace), '.', @Name)\" />( { name:'oData', oDataServiceHost: '<xsl:value-of select=\"$SerivceUri\" />' });\r\n" +
            "</xsl:if>\r\n" +
            "\r\n" +
            "</xsl:for-each>\r\n" +
            "      \r\n" +
            "})(window, $data);\r\n" +
            "      \r\n" +
            "    </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"edm:Key\"></xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"edm:FunctionImport\">'<xsl:value-of select=\"@Name\"/>': $data.EntityContext.generateServiceOperation({ serviceName:'<xsl:value-of select=\"@Name\"/>', returnType: <xsl:apply-templates select=\".\" mode=\"render-return-config\" />, <xsl:apply-templates select=\".\" mode=\"render-elementType-config\" />params: [<xsl:for-each select=\"edm:Parameter\">{ <xsl:value-of select=\"@Name\"/>: '<xsl:apply-templates select=\"@Type\" mode=\"render-functionImport-type\" />' }<xsl:if test=\"position() != last()\">,</xsl:if>\r\n" +
            "    </xsl:for-each>], method: '<xsl:value-of select=\"@m:HttpMethod\"/>' })</xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Type | @ReturnType\" mode=\"render-functionImport-type\">\r\n" +
            "    <xsl:variable name=\"curr\" select=\".\"/>\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"//edm:Schema[starts-with($curr, @Namespace)]\"> \r\n" +
            "        <xsl:value-of select=\"concat($DefaultNamespace,$curr)\" />\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise> \r\n" +
            "        <xsl:value-of select=\"$curr\"/>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:FunctionImport\" mode=\"render-return-config\">\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"not(@ReturnType)\">null</xsl:when>\r\n" +
            "      <xsl:when test=\"starts-with(@ReturnType, 'Collection')\">$data.Queryable</xsl:when>\r\n" +
            "      <xsl:otherwise> '<xsl:apply-templates select=\"@ReturnType\" mode=\"render-functionImport-type\" />' </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:FunctionImport\" mode=\"render-elementType-config\">\r\n" +
            "    <xsl:if test=\"starts-with(@ReturnType, 'Collection')\">\r\n" +
            "      <xsl:variable name=\"len\" select=\"string-length(@ReturnType)-12\"/>\r\n" +
            "      <xsl:variable name=\"curr\" select=\"substring(@ReturnType,12,$len)\"/>\r\n" +
            "      <xsl:variable name=\"ElementType\" >\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"//edm:Schema[starts-with($curr, @Namespace)]\">\r\n" +
            "            <xsl:value-of select=\"concat($DefaultNamespace,$curr)\" />\r\n" +
            "          </xsl:when>\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <xsl:value-of select=\"$curr\" />\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:variable>elementType: '<xsl:value-of select=\"$ElementType\"/>', </xsl:if>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"edm:EntitySet\">'<xsl:value-of select=\"@Name\"/>': { type: <xsl:value-of select=\"$EntitySetBaseClass\"  />, elementType: <xsl:value-of select=\"concat($DefaultNamespace,@EntityType)\"/> }</xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"edm:Property | edm:NavigationProperty\">\r\n" +
            "    <property>\r\n" +
            "    <xsl:variable name=\"memberDefinition\">\r\n" +
            "      <xsl:if test=\"parent::edm:EntityType/edm:Key/edm:PropertyRef[@Name = current()/@Name]\"><attribute name=\"key\">true</attribute></xsl:if>\r\n" +
            "      <xsl:apply-templates select=\"@*[local-name() != 'Name']\" mode=\"render-field\" />\r\n" +
            "    </xsl:variable>'<xsl:value-of select=\"@Name\"/>': { <xsl:choose><xsl:when test=\"function-available('msxsl:node-set')\"><xsl:for-each select=\"msxsl:node-set($memberDefinition)/*\">'<xsl:if test=\"@extended = 'true'\">$</xsl:if><xsl:value-of select=\"@name\"/>':<xsl:value-of select=\".\"/>\r\n" +
            "      <xsl:if test=\"position() != last()\">,<xsl:text> </xsl:text>\r\n" +
            "    </xsl:if> </xsl:for-each></xsl:when>\r\n" +
            "  <xsl:otherwise><xsl:for-each select=\"exsl:node-set($memberDefinition)/*\">'<xsl:if test=\"@extended = 'true'\">$</xsl:if><xsl:value-of select=\"@name\"/>':<xsl:value-of select=\".\"/>\r\n" +
            "      <xsl:if test=\"position() != last()\">,<xsl:text> </xsl:text>\r\n" +
            "    </xsl:if> </xsl:for-each></xsl:otherwise>\r\n" +
            "    </xsl:choose> }</property>\r\n" +
            "</xsl:template>\r\n" +
            "  \r\n" +
            "  <xsl:template match=\"@Name\" mode=\"render-field\">\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Type\" mode=\"render-field\">\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"starts-with(., 'Collection')\">\r\n" +
            "        <attribute name=\"type\">'Array'</attribute>\r\n" +
            "        <xsl:variable name=\"len\" select=\"string-length(.)-12\"/>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"starts-with(., ../../../@Namespace)\">\r\n" +
            "            <attribute name=\"elementType\">'<xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"substring(.,12,$len)\" />'</attribute>\r\n" +
            "          </xsl:when>\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"elementType\">'<xsl:value-of select=\"substring(.,12,$len)\" />'</attribute>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"starts-with(., ../../../@Namespace)\">\r\n" +
            "        <attribute name=\"type\">'<xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\".\"/>'</attribute>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:otherwise>\r\n" +
            "        <attribute name=\"type\">'<xsl:value-of select=\".\"/>'</attribute>\r\n" +
            "      </xsl:otherwise>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@ConcurrencyMode\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"concurrencyMode\">$data.ConcurrencyMode.<xsl:value-of select=\".\"/></attribute>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Nullable\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"nullable\"><xsl:value-of select=\".\"/></attribute>\r\n" +
            "    \r\n" +
            "    <xsl:if test=\". = 'false'\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"parent::edm:Property/@annot:StoreGeneratedPattern = 'Identity' or parent::edm:Property/@annot:StoreGeneratedPattern = 'Computed'\"></xsl:when>\r\n" +
            "        <xsl:otherwise><attribute name=\"required\">true</attribute></xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:if>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@annot:StoreGeneratedPattern\" mode=\"render-field\">\r\n" +
            "    <xsl:if test=\". != 'None'\"><attribute name=\"computed\">true</attribute></xsl:if>    \r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@MaxLength\" mode=\"render-field\">\r\n" +
            "    <attribute name=\"maxLength\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"string(.) = 'Max'\">Number.POSITIVE_INFINITY</xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\".\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </attribute>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@FixedLength | @Unicode | @Precision | @Scale\" mode=\"render-field\">\r\n" +
            "  </xsl:template>\r\n" +
            "  <xsl:template match=\"@*\" mode=\"render-field\">\r\n" +
            "    <xsl:variable name=\"nameProp\">\r\n" +
            "      <xsl:choose>\r\n" +
            "        <xsl:when test=\"substring-after(name(), ':') != ''\">\r\n" +
            "          <xsl:value-of select=\"substring-after(name(), ':')\"/>\r\n" +
            "        </xsl:when>\r\n" +
            "        <xsl:otherwise>\r\n" +
            "          <xsl:value-of select=\"name()\"/>\r\n" +
            "        </xsl:otherwise>\r\n" +
            "      </xsl:choose>\r\n" +
            "    </xsl:variable>\r\n" +
            "    <xsl:element name=\"attribute\"><xsl:attribute name=\"extended\">true</xsl:attribute><xsl:attribute name=\"name\"><xsl:value-of select=\"$nameProp\"/></xsl:attribute>'<xsl:value-of select=\".\"/>'</xsl:element>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@Relationship\" mode=\"render-field\">\r\n" +
            "    <xsl:variable name=\"relationName\" select=\"string(../@ToRole)\"/>\r\n" +
            "    <xsl:variable name=\"relationshipName\" select=\"string(.)\" />\r\n" +
            "    <xsl:variable name=\"relation\" select=\"key('associations',string(.))/edm:End[@Role = $relationName]\" />\r\n" +
            "    <xsl:variable name=\"otherName\" select=\"../@FromRole\" />\r\n" +
            "    <xsl:variable name=\"otherProp\" select=\"//edm:NavigationProperty[@ToRole = $otherName and @Relationship = $relationshipName]\" />\r\n" +
            "    <xsl:variable name=\"m\" select=\"$relation/@Multiplicity\" />\r\n" +
            "    <xsl:choose>\r\n" +
            "      <xsl:when test=\"$m = '*'\">\r\n" +
            "        <attribute name=\"type\">'<xsl:value-of select=\"$CollectionBaseClass\"/>'</attribute>\r\n" +
            "        <attribute name=\"elementType\">'<xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/>'</attribute>\r\n" +
            "        <xsl:if test=\"not($otherProp/@Name)\">\r\n" +
            "          <attribute name=\"inverseProperty\">'$$unbound'</attribute></xsl:if>\r\n" +
            "        <xsl:if test=\"$otherProp/@Name\">\r\n" +
            "          <attribute name=\"inverseProperty\">'<xsl:value-of select=\"$otherProp/@Name\"/>'</attribute></xsl:if>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"$m = '0..1'\">\r\n" +
            "        <attribute name=\"type\">'<xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/>'</attribute>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"$otherProp\">\r\n" +
            "            <attribute name=\"inverseProperty\">'<xsl:value-of select=\"$otherProp/@Name\"/>'</attribute>\r\n" +
            "          </xsl:when >\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"inverseProperty\">'$$unbound'</attribute>\r\n" +
            "            <xsl:message terminate=\"no\">  Warning: inverseProperty other side missing: <xsl:value-of select=\".\"/>\r\n" +
            "          </xsl:message>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "      <xsl:when test=\"$m = '1'\">\r\n" +
            "        <attribute name=\"type\">'<xsl:value-of select=\"$DefaultNamespace\"/><xsl:value-of select=\"$relation/@Type\"/>'</attribute>\r\n" +
            "        <attribute name=\"required\">true</attribute>\r\n" +
            "        <xsl:choose>\r\n" +
            "          <xsl:when test=\"$otherProp\">\r\n" +
            "            <attribute name=\"inverseProperty\">'<xsl:value-of select=\"$otherProp/@Name\"/>'</attribute>\r\n" +
            "          </xsl:when >\r\n" +
            "          <xsl:otherwise>\r\n" +
            "            <attribute name=\"inverseProperty\">'$$unbound'</attribute>\r\n" +
            "            <xsl:message terminate=\"no\">\r\n" +
            "              Warning: inverseProperty other side missing: <xsl:value-of select=\".\"/>\r\n" +
            "            </xsl:message>\r\n" +
            "          </xsl:otherwise>\r\n" +
            "        </xsl:choose>\r\n" +
            "      </xsl:when>\r\n" +
            "    </xsl:choose>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "\r\n" +
            "  <xsl:template match=\"@FromRole | @ToRole\" mode=\"render-field\"></xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"*\" mode=\"render-field\">\r\n" +
            "    <!--<unprocessed>!!<xsl:value-of select=\"name()\"/>!!</unprocessed>-->\r\n" +
            "    <xsl:message terminate=\"no\">  Warning: <xsl:value-of select=\"../../@Name\"/>.<xsl:value-of select=\"../@Name\"/>:<xsl:value-of select=\"name()\"/> is an unknown/unprocessed attribued</xsl:message>\r\n" +
            "  </xsl:template>\r\n" +
            "  <!--<xsl:template match=\"*\">\r\n" +
            "    !<xsl:value-of select=\"name()\"/>!\r\n" +
            "  </xsl:template>-->\r\n" +
            "</xsl:stylesheet>\r\n"
    },
    _metadataPHPConverterXSLT: {
        type: 'string',
        value:
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n" +
            "<xsl:stylesheet version=\"1.0\"\r\n" +
            "    xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"\r\n" +
            "    xmlns:edmx=\"http://schemas.microsoft.com/ado/2007/06/edmx\"\r\n" +
            "    xmlns:d=\"http://schemas.microsoft.com/ado/2007/08/dataservices\"\r\n" +
            "    xmlns:schema_1_0=\"http://schemas.microsoft.com/ado/2006/04/edm\"\r\n" +
            "    xmlns:schema_1_1=\"http://schemas.microsoft.com/ado/2007/05/edm\"\r\n" +
            "    xmlns:schema_1_2=\"http://schemas.microsoft.com/ado/2008/09/edm\"\r\n" +
            "    xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\">\r\n" +
            "\r\n" +
            "  <xsl:output method=\"text\"/>\r\n" +
            "\r\n" +
            "  <!-- Default service URI passed externally -->\r\n" +
            "  <xsl:param name=\"DefaultServiceURI\"/>\r\n" +
            "  <xsl:template match=\"/\">\r\n" +
            "&lt;?php\r\n" +
            "  /*\r\n" +
            "    Copyright 2010 Persistent Systems Limited\r\n" +
            "\r\n" +
            "    Licensed under the Apache License, Version 2.0 (the \"License\");\r\n" +
            "    you may not use this file except in compliance with the License.\r\n" +
            "    You may obtain a copy of the License at\r\n" +
            "\r\n" +
            "    http://www.apache.org/licenses/LICENSE-2.0\r\n" +
            "\r\n" +
            "    Unless required by applicable law or agreed to in writing, software\r\n" +
            "    distributed under the License is distributed on an \"AS IS\" BASIS,\r\n" +
            "    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n" +
            "    See the License for the specific language governing permissions and\r\n" +
            "    limitations under the License.\r\n" +
            "   */\r\n" +
            "\r\n" +
            "    /**\r\n" +
            "    * This code was generated by the tool 'PHPDataSvcUtil.php'.\r\n" +
            "    * Runtime Version:1.0\r\n" +
            "    *\r\n" +
            "    * Changes to this file may cause incorrect behavior and will be lost if\r\n" +
            "    * the code is regenerated.\r\n" +
            "    */\r\n" +
            "\r\n" +
            "    require_once 'Context/ObjectContext.php';\r\n" +
            "    /**\r\n" +
            "    * Defines default OData Service URL for this proxy class\r\n" +
            "    */\r\n" +
            "    define(\"DEFAULT_ODATA_SERVICE_URL\", \"<xsl:value-of select=\"$DefaultServiceURI\"/>\");\r\n" +
            "    <xsl:apply-templates select=\"/edmx:Edmx/edmx:DataServices/schema_1_0:Schema | /edmx:Edmx/edmx:DataServices/schema_1_1:Schema | /edmx:Edmx/edmx:DataServices/schema_1_2:Schema\"/>\r\n" +
            "?&gt;\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"/edmx:Edmx/edmx:DataServices/schema_1_0:Schema | /edmx:Edmx/edmx:DataServices/schema_1_1:Schema | /edmx:Edmx/edmx:DataServices/schema_1_2:Schema\">\r\n" +
            "    <xsl:apply-templates select=\"schema_1_0:EntityContainer | schema_1_1:EntityContainer | schema_1_2:EntityContainer\"/>\r\n" +
            "    <xsl:for-each select=\"schema_1_0:EntityType | schema_1_1:EntityType | schema_1_2:EntityType\">\r\n" +
            "      <xsl:apply-templates select=\".\"/>\r\n" +
            "    </xsl:for-each>\r\n" +
            "    <xsl:for-each select=\"schema_1_0:ComplexType | schema_1_1:ComplexType | schema_1_2:ComplexType\">\r\n" +
            "      <xsl:apply-templates select=\".\"/>\r\n" +
            "    </xsl:for-each>\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <!-- Generate container class -->\r\n" +
            "  <xsl:template match=\"schema_1_0:EntityContainer | schema_1_1:EntityContainer | schema_1_2:EntityContainer\">\r\n" +
            "    <xsl:variable name=\"smallcase\" select=\"'abcdefghijklmnopqrstuvwxyz'\" />\r\n" +
            "    <xsl:variable name=\"uppercase\" select=\"'ABCDEFGHIJKLMNOPQRSTUVWXYZ'\" />\r\n" +
            "    <xsl:variable name=\"service_namespace_1\" select=\"concat(//schema_1_0:EntityType/../@Namespace, //schema_1_1:EntityType/../@Namespace)\" />\r\n" +
            "    <xsl:variable name=\"service_namespace\" select=\"concat($service_namespace_1, //schema_1_2:EntityType/../@Namespace)\" />\r\n" +
            "   /**\r\n" +
            "    * Container class <xsl:value-of select=\"@Name\"/>, Namespace: <xsl:value-of select=\"$service_namespace\"/>\r\n" +
            "    */\r\n" +
            "    class <xsl:value-of select=\"@Name\"/> extends ObjectContext\r\n" +
            "    {\r\n" +
            "    <xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "        protected $_<xsl:value-of select=\"@Name\"/>;</xsl:for-each>\r\n" +
            "        \r\n" +
            "       /**\r\n" +
            "        * The constructor for <xsl:value-of select=\"@Name\"/> accepting service URI\r\n" +
            "        */\r\n" +
            "        public function __construct($uri = \"\")\r\n" +
            "        {\r\n" +
            "            if(strlen($uri) == 0)\r\n" +
            "            {\r\n" +
            "                $uri = DEFAULT_ODATA_SERVICE_URL;\r\n" +
            "            }\r\n" +
            "\r\n" +
            "            if (Utility::reverseFind($uri, '/') != strlen($uri) - 1)\r\n" +
            "            {\r\n" +
            "                $uri = $uri . '/';\r\n" +
            "            }\r\n" +
            "\r\n" +
            "            $this->_baseURI = $uri;\r\n" +
            "            parent::__construct($this->_baseURI);\r\n" +
            "            $this->_entities = array(<xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "                                \"<xsl:value-of select=\"@Name\"/>\"<xsl:if test=\"position() != last()\">,</xsl:if>\r\n" +
            "                     </xsl:for-each>);\r\n" +
            "            $this->_entitySet2Type = array(<xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "                                            \"<xsl:value-of select=\"translate(@Name, $uppercase, $smallcase)\" />\" =&gt; \"<xsl:value-of select=\"substring-after(@EntityType, concat($service_namespace, '.'))\"/>\"<xsl:if test=\"position() != last()\">, </xsl:if>\r\n" +
            "                                            </xsl:for-each>);\r\n" +
            "            $this->_entityType2Set = array(<xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "                                            \"<xsl:value-of select=\"translate(substring-after(@EntityType, concat($service_namespace, '.')), $uppercase, $smallcase)\" />\" =&gt; \"<xsl:value-of select=\"@Name\"/>\"<xsl:if test=\"position() != last()\">, </xsl:if>\r\n" +
            "                                            </xsl:for-each>);\r\n" +
            "\r\n" +
            "            $this->_association = array(<xsl:for-each select=\"/edmx:Edmx/edmx:DataServices/schema_1_0:Schema/schema_1_0:Association | /edmx:Edmx/edmx:DataServices/schema_1_1:Schema/schema_1_1:Association\">\r\n" +
            "                                         \"<xsl:value-of select=\"@Name\"/>\" =&gt; array(<xsl:for-each select=\"schema_1_0:End | schema_1_1:End\">\r\n" +
            "                                                                         \"<xsl:value-of select=\"@Role\"/>\" =&gt; \"<xsl:value-of select=\"@Multiplicity\"/>\" <xsl:if test=\"position() != last()\">,</xsl:if>\r\n" +
            "                                                                      </xsl:for-each>)<xsl:if test=\"position() != last()\">, </xsl:if>\r\n" +
            "                        </xsl:for-each>);\r\n" +
            "\r\n" +
            "    <xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "            $this-&gt;_<xsl:value-of select=\"@Name\"/> = new DataServiceQuery('/'.'<xsl:value-of select=\"@Name\"/>', $this);</xsl:for-each>\r\n" +
            "\r\n" +
            "        }\r\n" +
            "\r\n" +
            "    <xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "        /**\r\n" +
            "         * Function returns DataServiceQuery reference for\r\n" +
            "         * the entityset <xsl:value-of select=\"@Name\"/>\r\n" +
            "         * @return DataServiceQuery\r\n" +
            "         */\r\n" +
            "        public function <xsl:value-of select=\"@Name\"/>()\r\n" +
            "        {\r\n" +
            "            $this->_<xsl:value-of select=\"@Name\"/>->ClearAllOptions();\r\n" +
            "            return $this->_<xsl:value-of select=\"@Name\"/>;\r\n" +
            "        }\r\n" +
            "    </xsl:for-each>\r\n" +
            "       /**\r\n" +
            "        * Functions for adding object to the entityset/collection\r\n" +
            "        */\r\n" +
            "    <xsl:for-each select=\"schema_1_0:EntitySet | schema_1_1:EntitySet | schema_1_2:EntitySet\">\r\n" +
            "       /**\r\n" +
            "        * Add <xsl:value-of select=\"@Name\"/>\r\n" +
            "        * @param <xsl:value-of select=\"@Name\"/> $object\r\n" +
            "        */\r\n" +
            "      public function AddTo<xsl:value-of select=\"@Name\"/>($object)\r\n" +
            "        {\r\n" +
            "            return parent::AddObject('<xsl:value-of select=\"@Name\"/>', $object);\r\n" +
            "        }\r\n" +
            "    </xsl:for-each>\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * This function returns the entities.\r\n" +
            "        */\r\n" +
            "        public function getEntities()\r\n" +
            "        {\r\n" +
            "            return $this->_entities;\r\n" +
            "        }\r\n" +
            "    }\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"schema_1_0:EntityType |schema_1_1:EntityType |schema_1_2:EntityType\">\r\n" +
            "    <xsl:variable name=\"service_namespace_1\" select=\"concat(//schema_1_0:EntityType/../@Namespace, //schema_1_1:EntityType/../@Namespace)\" />\r\n" +
            "    <xsl:variable name=\"service_namespace\" select=\"concat($service_namespace_1, //schema_1_2:EntityType/../@Namespace)\" />\r\n" +
            "   /**\r\n" +
            "    * @class:<xsl:value-of select=\"@Name\"/>\r\n" +
            "    * @type:EntityType<xsl:for-each select=\"schema_1_0:Key | schema_1_1:Key | schema_1_2:Key\">\r\n" +
            "      <xsl:for-each select=\"schema_1_0:PropertyRef | schema_1_1:PropertyRef | schema_1_2:PropertyRef\">\r\n" +
            "    * @key:<xsl:value-of select=\"@Name\"/>\r\n" +
            "      </xsl:for-each>\r\n" +
            "    </xsl:for-each>\r\n" +
            "    <xsl:if test=\"@m:FC_SourcePath\">\r\n" +
            "      * @FC_SourcePath:<xsl:value-of select=\"@m:FC_SourcePath\"/>\r\n" +
            "      * @FC_TargetPath:<xsl:value-of select=\"@m:FC_TargetPath\"/>\r\n" +
            "      * @FC_ContentKind:<xsl:value-of select=\"@m:FC_ContentKind\"/>\r\n" +
            "      * @FC_KeepInContent:<xsl:value-of select=\"@m:FC_KeepInContent\"/>\r\n" +
            "    </xsl:if>\r\n" +
            "    */\r\n" +
            "    class <xsl:value-of select=\"@Name\"/> extends Object\r\n" +
            "    {\r\n" +
            "        protected $_entityMap = array();\r\n" +
            "        protected $_entityKey = array();\r\n" +
            "        protected $_relLinks  = array();\r\n" +
            "        protected $_baseURI;\r\n" +
            "\r\n" +
            "    <xsl:for-each select=\"schema_1_0:Property | schema_1_1:Property | schema_1_2:Property\">\r\n" +
            "       /**\r\n" +
            "        * @Type:EntityProperty<xsl:if test=\"@Nullable = 'false'\">\r\n" +
            "        * NotNullable</xsl:if>\r\n" +
            "        * @EdmType:<xsl:value-of select=\"@Type\"/><xsl:if test=\"@Type = 'Edm.String'\">\r\n" +
            "        * @MaxLength:<xsl:value-of select=\"@MaxLength\"/>\r\n" +
            "        * @FixedLength:<xsl:value-of select=\"@FixedLength\"/>\r\n" +
            "      </xsl:if>\r\n" +
            "      <xsl:if test=\"@m:FC_TargetPath\">\r\n" +
            "        * @FC_TargetPath:<xsl:value-of select=\"@m:FC_TargetPath\"/>\r\n" +
            "        * @FC_ContentKind:<xsl:value-of select=\"@m:FC_ContentKind\"/>\r\n" +
            "        * @FC_NsPrefix:<xsl:value-of select=\"@m:FC_NsPrefix\"/>\r\n" +
            "        * @FC_NsUri:<xsl:value-of select=\"@m:FC_NsUri\"/>\r\n" +
            "        * @FC_KeepInContent:<xsl:value-of select=\"@m:FC_KeepInContent\"/>\r\n" +
            "      </xsl:if>\r\n" +
            "        */\r\n" +
            "        public $<xsl:value-of select=\"@Name\"/>;\r\n" +
            "    </xsl:for-each>\r\n" +
            "    <xsl:for-each select=\"schema_1_0:NavigationProperty | schema_1_1:NavigationProperty | schema_1_2:NavigationProperty\">\r\n" +
            "       /**\r\n" +
            "        * @Type:NavigationProperty\r\n" +
            "        * @Relationship:<xsl:value-of select=\"substring-after(@Relationship, concat($service_namespace, '.'))\"/>\r\n" +
            "        * @FromRole:<xsl:value-of select=\"@FromRole\"/>\r\n" +
            "        * @ToRole:<xsl:value-of select=\"@ToRole\"/>\r\n" +
            "        */\r\n" +
            "        public $<xsl:value-of select=\"@Name\"/>;\r\n" +
            "    </xsl:for-each>\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * Function to create an instance of <xsl:value-of select=\"@Name\"/>\r\n" +
            "    <xsl:for-each select=\"schema_1_0:Property[@Nullable = 'false'] | schema_1_1:Property[@Nullable = 'false'] | schema_1_2:Property[@Nullable = 'false']\">\r\n" +
            "        * @param <xsl:value-of select=\"@Type\"/> $<xsl:value-of select=\"@Name\"/>\r\n" +
            "    </xsl:for-each>\r\n" +
            "        */\r\n" +
            "        public static function Create<xsl:value-of select=\"@Name\"/>(<xsl:for-each select=\"schema_1_0:Property[@Nullable = 'false'] | schema_1_1:Property[@Nullable = 'false'] | schema_1_2:Property[@Nullable = 'false']\">\r\n" +
            "            $<xsl:value-of select=\"@Name\"/><xsl:if test=\"position() != last()\">, </xsl:if>\r\n" +
            "    </xsl:for-each>)\r\n" +
            "        {   <xsl:variable name=\"ClassName\" select=\"@Name\"/>\r\n" +
            "            $<xsl:value-of select=\"@Name\"/> = new <xsl:value-of select=\"@Name\"/>();<xsl:for-each select=\"schema_1_0:Property[@Nullable = 'false'] | schema_1_1:Property[@Nullable = 'false'] | schema_1_2:Property[@Nullable = 'false']\">\r\n" +
            "            $<xsl:value-of select=\"$ClassName\"/>-><xsl:value-of select=\"@Name\"/> = $<xsl:value-of select=\"@Name\"/>;</xsl:for-each>\r\n" +
            "            return $<xsl:value-of select=\"@Name\"/>;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * Constructor for <xsl:value-of select=\"@Name\"/>\r\n" +
            "        */\r\n" +
            "        public function __construct($uri = \"\")\r\n" +
            "        {\r\n" +
            "            $this->_objectID = Guid::NewGuid();\r\n" +
            "            $this->_baseURI = $uri;\r\n" +
            "    <xsl:for-each select=\"schema_1_0:NavigationProperty | schema_1_1:NavigationProperty | schema_1_2:NavigationProperty\">\r\n" +
            "            $this->_entityMap['<xsl:value-of select=\"@Name\"/>'] = '<xsl:value-of select=\"@ToRole\"/>';</xsl:for-each>\r\n" +
            "    <xsl:apply-templates select=\"schema_1_0:Key | schema_1_1:Key\"/>\r\n" +
            "    <xsl:for-each select=\"schema_1_0:NavigationProperty | schema_1_1:NavigationProperty | schema_1_2:NavigationProperty\">\r\n" +
            "            $this-><xsl:value-of select=\"@Name\"/> = array();</xsl:for-each>\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * overring getObjectID() functon of Object class\r\n" +
            "        */\r\n" +
            "        public function getObjectID()\r\n" +
            "        {\r\n" +
            "            return $this->_objectID;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * This function returns the entity keys of this entity.\r\n" +
            "        */\r\n" +
            "        public function getEntityKeys()\r\n" +
            "        {\r\n" +
            "            return $this->_entityKey;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * This function set the entity keys of this entity.\r\n" +
            "        */\r\n" +
            "        public function setEntityKeys($entityKey)\r\n" +
            "        {\r\n" +
            "            $this->_entityKey = $entityKey;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * This function returns the related links of this entity.\r\n" +
            "        */\r\n" +
            "        public function getRelatedLinks()\r\n" +
            "        {\r\n" +
            "            return $this->_relLinks;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * This function set the related links of this entity.\r\n" +
            "        */\r\n" +
            "        public function setRelatedLinks($relLinks)\r\n" +
            "        {\r\n" +
            "            $this->_relLinks = $relLinks;\r\n" +
            "        }\r\n" +
            "\r\n" +
            "       /**\r\n" +
            "        * Function for getting Entity Type Name corrosponding to navigation Name\r\n" +
            "        */\r\n" +
            "        public function getActualEntityTypeName($key)\r\n" +
            "        {\r\n" +
            "            if (array_key_exists($key, $this->_entityMap))\r\n" +
            "            {\r\n" +
            "                return ($this->_entityMap[$key]);\r\n" +
            "            }\r\n" +
            "            return $key;\r\n" +
            "        }\r\n" +
            "    }\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"schema_1_0:ComplexType |schema_1_1:ComplexType |schema_1_2:ComplexType\">\r\n" +
            "    <xsl:variable name=\"service_namespace_1\" select=\"concat(//schema_1_0:ComplexType/../@Namespace, //schema_1_1:ComplexType/../@Namespace)\" />\r\n" +
            "    <xsl:variable name=\"service_namespace\" select=\"concat($service_namespace_1, //schema_1_2:ComplexType/../@Namespace)\" />\r\n" +
            "    /**\r\n" +
            "    * @class:<xsl:value-of select=\"@Name\"/>\r\n" +
            "    * @type:ComplexType\r\n" +
            "    */\r\n" +
            "    class <xsl:value-of select=\"@Name\"/>\r\n" +
            "    {\r\n" +
            "    <xsl:for-each select=\"schema_1_0:Property | schema_1_1:Property | schema_1_2:Property\">\r\n" +
            "       /**\r\n" +
            "        * @Type:EntityProperty<xsl:if test=\"@Nullable = 'false'\">\r\n" +
            "        * NotNullable</xsl:if>\r\n" +
            "        * @EdmType:<xsl:value-of select=\"@Type\"/><xsl:if test=\"@Type = 'Edm.String'\">\r\n" +
            "        * @MaxLength:<xsl:value-of select=\"@MaxLength\"/>\r\n" +
            "        * @FixedLength:<xsl:value-of select=\"@FixedLength\"/>\r\n" +
            "      </xsl:if>\r\n" +
            "        */\r\n" +
            "        public $<xsl:value-of select=\"@Name\"/>;\r\n" +
            "    </xsl:for-each>\r\n" +
            "    }\r\n" +
            "  </xsl:template>\r\n" +
            "\r\n" +
            "  <xsl:template match=\"schema_1_0:Key | schema_1_1:Key | schema_1_2:Key\">\r\n" +
            "    <xsl:for-each select=\"schema_1_0:PropertyRef | schema_1_1:PropertyRef | schema_1_2:PropertyRef\">\r\n" +
            "            $this->_entityKey[] = '<xsl:value-of select=\"@Name\"/>';</xsl:for-each>\r\n" +
            "  </xsl:template>\r\n" +
            "</xsl:stylesheet>\r\n"
    }

});

$data.MetadataLoader = new $data.MetadataLoaderClass();
$data.service = function (serviceUri, cb, config) {
    $data.MetadataLoader.load(serviceUri, cb, config);
};
