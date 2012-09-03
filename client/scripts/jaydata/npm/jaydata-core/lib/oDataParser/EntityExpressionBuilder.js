﻿$data.Class.define('$data.oDataParser.EntityExpressionBuilder', null, null, {
    constructor: function (scopeContext, entitySetName) {
        Guard.requireValue("scopeContext", scopeContext);
        this.scopeContext = scopeContext;
        this.entitySetName = entitySetName;
        this.lambdaTypes = [];

    },
    supportedParameters: {
        value: [
            { name: 'expand', expType: $data.Expressions.IncludeExpression },
            { name: 'filter', expType: $data.Expressions.FilterExpression },
            { name: 'orderby', expType: $data.Expressions.OrderExpression },
            { name: 'select', expType: $data.Expressions.ProjectionExpression },
            { name: 'skip', expType: $data.Expressions.PagingExpression },
            { name: 'top', expType: $data.Expressions.PagingExpression }
        ]
    },
    parse: function (queryParams) {
        ///<param name="queryParams" type="Object">{ filter: expression, orderby: [{}] }</param>

        var req = new $data.oDataParser.QueryRequest();
        req = $data.typeSystem.extend(req, queryParams);
        var parser = new $data.oDataParser.RequestParser();
        parser.parse(req);

        return { expression: this.buildExpression(req) };
    },
    buildExpression: function (req) {

        var expression = this.createRootExpression(this.entitySetName);
        this.lambdaTypes.push(expression);

        for (var i = 0; i < this.supportedParameters.length; i++) {
            var paramName = this.supportedParameters[i].name;
            var funcName = paramName + 'Converter';
            if (typeof this[funcName] === 'function' && req[paramName]) {
                expression = this[funcName].call(this, req[paramName], expression);
            }
        }


        if (req.frame) {
            expression = Container['create' + req.frame + 'Expression'](expression);
        } else {
            expression = Container.createToArrayExpression(expression);
        }

        return expression;
    },
    createRootExpression: function (setName) {
        var ec = Container.createEntityContextExpression(this.scopeContext);
        var memberdef = this.scopeContext.getType().getMemberDefinition(setName);
        var es = Container.createEntitySetExpression(ec,
            Container.createMemberInfoExpression(memberdef), null,
            this.scopeContext[setName]);

        return es;
    },
    filterConverter: function (expr, rootExpr) {
        var pqExp = this._buildParametricQueryExpression(expr, $data.Expressions.FilterExpression);
        var expression = new $data.Expressions.FilterExpression(rootExpr, pqExp);
        return expression;
    },
    orderbyConverter: function (exprObjArray, rootExpr) {
        for (var i = 0; i < exprObjArray.length; i++) {
            var expConf = exprObjArray[i];

            var pqExp = this._buildParametricQueryExpression(expConf.expression, $data.Expressions.OrderExpression);
            rootExpr = new $data.Expressions.OrderExpression(rootExpr, pqExp, $data.Expressions.ExpressionType[expConf.nodeType]);
        }
        return rootExpr;
    },
    selectConverter: function (exprObjArray, rootExpr) {
        var objectFields = [];
        for (var i = 0; i < exprObjArray.length; i++) {
            var expr = exprObjArray[i];
            var ofExpr = new $data.Expressions.ObjectFieldExpression(this.findMemberPathBaseName(expr), expr);
            objectFields.push(ofExpr);
        }

        var objectLiteralExpr = new $data.Expressions.ObjectLiteralExpression(objectFields);

        var pqExp = this._buildParametricQueryExpression(objectLiteralExpr, $data.Expressions.ProjectionExpression);
        var expression = new $data.Expressions.ProjectionExpression(rootExpr, pqExp);
        return expression;
    },
    findMemberPathBaseName: function (expr) {
        if (expr.expression instanceof $data.Expressions.PropertyExpression)
            return this.findMemberPathBaseName(expr.expression);
        else
            return expr.member.value;
    },
    skipConverter: function (expr, rootExpr) {
        var expression = new $data.Expressions.PagingExpression(rootExpr, expr, $data.Expressions.ExpressionType.Skip);
        return expression;
    },
    topConverter: function (expr, rootExpr) {
        var expression = new $data.Expressions.PagingExpression(rootExpr, expr, $data.Expressions.ExpressionType.Take);
        return expression;
    },
    expandConverter: function (exprObjArray, rootExpr) {
        if (exprObjArray.length > 0) {
            for (var i = 0; i < exprObjArray.length; i++) {
                rootExpr = new $data.Expressions.IncludeExpression(rootExpr, new $data.Expressions.ConstantExpression(this._getMemberPath(exprObjArray[i]), 'string'));
            }
        }
        return rootExpr;
    },
    _getMemberPath: function (expr) {
        if (expr.expression instanceof $data.Expressions.PropertyExpression)
            return this._getMemberPath(expr.expression) + '.' + expr.member.value;
        else
            return expr.member.value;
    },
    _buildParametricQueryExpression: function (expression, frameType) {

        var constantResolver = Container.createConstantValueResolver(undefined, window);
        var parameterProcessor = Container.createParameterResolverVisitor();

        var exp = parameterProcessor.Visit(expression, constantResolver);

        var converter = Container.createCodeToEntityConverter(this.scopeContext);

        var entityExpressionTree = converter.Visit(exp, { queryParameters: undefined, lambdaParameters: this.lambdaTypes, frameType: frameType });

        return Container.createParametricQueryExpression(entityExpressionTree, converter.parameters);

    }
});