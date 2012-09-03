﻿$data.Class.define('$data.JayService.OData.BatchProcessor', null, null, {
    constructor: function (context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.Q = require('q');
        this.queryHelper = require('qs');
    },
    process: function (request, response) {
        //processRequest
        var self = this;
        var reqWrapper = {
            body: request.body,
            headers: request.headers
        }
        OData.batchServerHandler.read(reqWrapper, {});
        var idx = -1;
        var pHandler = new $data.PromiseHandler();
        var cbWrapper = pHandler.createCallback();

        if (reqWrapper.data) {
            var batchRequests = reqWrapper.data.__batchRequests;
            var batchResult = [];

            var saveSuccess = function () {

                idx++;
                if (idx < batchRequests.length) {
                    if (batchRequests[idx].__changeRequests) {

                        self._processBatch(batchRequests[idx].__changeRequests, request, {
                            success: function (result) {
                                if (result) batchResult.push({ __changeRequests: result });
                                saveSuccess();
                            },
                            error: function () { cbWrapper.error(batchResult) }
                        });

                    } else {
                        self._processBatchRead(batchRequests[idx], request, response, {
                            success: function (result) {
                                if (result) batchResult.push(result);
                                saveSuccess();
                            },
                            error: function () { cbWrapper.error(batchResult) }
                        });

                    }
                } else {
                    cbWrapper.success(batchResult);
                }
            }
            saveSuccess();

        } else {
            cbWrapper.error();
        }

        //processResponse
        return function () {
            var async = this;
            var responseData = {
                headers: {
                    'Content-Type': $data.JayService.OData.Defaults.multipartContentType
                },
                data: {
                    __batchRequests: []
                }
            };

            self.Q.when(pHandler.getPromise()).then(function (batchRes) {
                //buildResponse
                for (var i = 0; i < batchRes.length; i++) {
                    var refData = batchRes[i];

                    if (refData.__changeRequests) {
                        responseData.data.__batchRequests.push({ __changeRequests: self._prepareBatch(refData.__changeRequests, request) });
                    } else {
                        responseData.data.__batchRequests.push(self._prepareBatchRead(refData, request));
                    }
                }

                OData.batchServerHandler.write(responseData, {});

                //writeheaders
                for (var name in responseData.headers) {
                    if (name.toLowerCase() !== 'content-type') {
                        response.setHeader(name, responseData.headers[name]);
                    }
                }
                response.statusCode = 202;
                var res = new $data.MultiPartMixedResult(responseData.body, responseData.batchBoundary);
                async.success(res);
            });
        }
    },

    _processBatch: function (changeRequests, request, callback) {
        var referenceData = {};

        for (var j = 0, l2 = changeRequests.length; j < l2; j++) {
            var changeRequest = changeRequests[j];

            //Refactor
            var setInfo = $data.JayService.OData.Utils.parseUrlPart(changeRequest.urlPart.replace(request.fullRoute, ''), this.context);
            var itemType = setInfo.set.elementType;

            var refId = changeRequest.headers['Content-Id'] || changeRequest.headers['content-id'] || changeRequest.headers['Content-ID'] || $data.JayService.OData.Utils.getRandom(itemType.name);
            referenceData[refId] = { requestObject: changeRequest };

            switch (changeRequest.method) {
                case 'POST':
                    var entity = new itemType(changeRequest.data);
                    referenceData[refId].resultObject = entity;
                    //discover navigations (__metadata.uri: "$n")
                    setInfo.set.add(entity);
                    break;
                case 'MERGE':
                    var entity = new itemType(changeRequest.data);
                    referenceData[refId].resultObject = entity;

                    //discover navigations (__metadata.uri: "$n")
                    setInfo.set.attach(entity);
                    entity.entityState = $data.EntityState.Modified;
                    break;
                case 'DELETE':
                    var entity = new itemType(setInfo.idObj);
                    referenceData[refId].resultObject = entity;
                    setInfo.set.remove(entity);
                    break;
                default:
                    break;
            }
        }

        return this.context.saveChanges({
            success: function () {
                callback.success(referenceData);
            },
            error: function () { callback.error(); }
        });
    },
    _processBatchRead: function (getBatchrequest, req, res, callback) {
        var getProcessor = new $data.JayService.OData.EntitySetProcessor('', this.context, { top: this.context.storageProvider.providerConfiguration.responseLimit || $data.JayService.OData.Defaults.defaultResponseLimit });

        var batchUrl = getBatchrequest.urlPart.replace(req.fullRoute, '');
        var subReq = {
            url: batchUrl,
            method: 'GET',
            query: this._getQueryObject(batchUrl),
            headers: getBatchrequest.headers
        };

        var config = {
            version: 'V2',
            baseUrl: req.fullRoute,
            request: subReq,
            response: res,
            context: this.context.getType(),
            simpleResult: batchUrl.toLowerCase().indexOf('/$count') > 0
        };

        if (getProcessor.isSupported(subReq)) {

            getProcessor.ReadFromEntitySet(subReq, config, {
                success: function (result) {
                    callback.success({
                        requestObject: getBatchrequest,
                        resultObject: result,
                        elementType: getProcessor.entitySet.elementType
                    });
                },
                error: callback.error
            });

        } else {
            callback.error();
        }
    },
    _getQueryObject: function (url) {
        var paramIdx;
        if ((paramIdx = url.indexOf('?')) >= 0) {
            return this.queryHelper.parse(url.slice(paramIdx + 1));
        } else {
            return {};
        }
    },

    _prepareBatch: function (changedElements, request) {
        var responseData = [];
        var entityTransformer = new $data.oDataServer.EntityTransform(this.context.getType(), this.baseUrl);
        var entityXmlTransformer = new $data.oDataServer.EntityXmlTransform(this.context.getType(), this.baseUrl, { headers: request.headers });

        for (var contentId in changedElements) {
            var resItem = changedElements[contentId];

            var response = {
                headers: {
                    'Content-Id': contentId,
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-cache'
                }
            };

            switch (resItem.requestObject.method) {
                case "POST":
                    response.statusName = 'Created';
                    response.statusCode = 201;
                    var requestContentType = $data.JayService.OData.Utils.getHeaderValue(resItem.requestObject.headers, 'Accept') || $data.JayService.OData.Utils.getHeaderValue(resItem.requestObject.headers, 'Content-Type');
                    if (requestContentType.indexOf($data.JayService.OData.Defaults.xmlContentType) >= 0) {
                        this._transformItem(entityXmlTransformer, response, resItem, resItem.resultObject.getType());
                    } else {
                        this._transformItem(entityTransformer, response, resItem, resItem.resultObject.getType());
                    }
                    break;
                case "MERGE":
                case "DELETE":
                    response.statusName = 'No Content';
                    response.statusCode = 204;
                    break;
                default:
                    continue;
            }

            responseData.push(response);
        }
        return responseData;
    },
    _prepareBatchRead: function (data, request) {
        var entityTransformer = new $data.oDataServer.EntityTransform(this.context.getType(), this.baseUrl);
        var entityXmlTransformer = new $data.oDataServer.EntityXmlTransform(this.context.getType(), this.baseUrl, { headers: request.headers });

        var response = {
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-cache'
            },
            statusName: 'Ok',
            statusCode: 200
        }

        if (data.resultObject instanceof $data.ServiceResult) {
            response.headers['Content-Type'] = data.resultObject.contentType;
            response.data = data.resultObject.getData();
        } else {
            var requestContentType = $data.JayService.OData.Utils.getHeaderValue(data.requestObject.headers, 'Accept') || $data.JayService.OData.Utils.getHeaderValue(data.requestObject.headers, 'Content-Type');
            if (requestContentType.indexOf($data.JayService.OData.Defaults.jsonContentType) >= 0) {
                this._transformItem(entityTransformer, response, data, data.elementType);
            } else {
                this._transformItem(entityXmlTransformer, response, data, data.elementType);
            }
        }

        return response;
    },

    _transformItem: function (entityTransformer, responseObj, resItem, elementType) {
        var isSingle = !Array.isArray(resItem.resultObject);

        if (entityTransformer instanceof $data.oDataServer.EntityXmlTransform) {
            responseObj.data = entityTransformer.convertToResponse(resItem.resultObject, elementType);
            responseObj.headers['Content-Type'] = $data.JayService.OData.Defaults.xmlContentType;
            if (isSingle)
                responseObj.headers['Location'] = entityTransformer.generateUri(resItem.resultObject, entityTransformer._getEntitySetDefByType(elementType));
        } else {
            if (isSingle) {
                responseObj.data = { d: entityTransformer.convertToResponse([resItem.resultObject], elementType)[0] };
                responseObj.headers['Location'] = responseObj.data.d.__metadata.url;
            } else {
                responseObj.data = { d: entityTransformer.convertToResponse(resItem.resultObject, elementType) };
            }
            responseObj.headers['Content-Type'] = $data.JayService.OData.Defaults.jsonReturnContentType;
        }
    }
}, {
    connectBodyReader: function (req, res, next) {
        console.log("OBSOLATE: do not use '$data.JayService.OData.BatchProcessor.connectBodyReader' as connect middleware\r\nUse: '$data.JayService.OData.Utils.simpleBodyReader()'");
        $data.JayService.OData.Utils.simpleBodyReader()(req, res, next);
    }
});
