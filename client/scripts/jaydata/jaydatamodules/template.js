
(function ($data) {
    var toTemplate = function (templateId, targetId, callback) {
        ///<summary></summary>
        ///<param name="templateId" type="string"/>
        ///<param name="targetId" type="string"/>
        ///<param name="callback" type="function"/>

        //Adat tulajdons�g jel�l�se. Ak�r ugy is mint tmpl-ben: prefix: '\\${', postfix: '}'
        var prefix = '\\${', postfix = '}';
        return this.toArray(function (data) {
            var template = document.getElementById(templateId);
            var target = document.getElementById(targetId);
            if (!template || !target)
                return;

            target.innerHTML = "";
            var regex = new RegExp(prefix + "(.*?)" + postfix, "g");
            var myArray = template.innerHTML.match(regex);
            for (var i = 0; i < data.length; i++) {
                var currTemp = template.innerHTML;
                for (var j = 0; j < myArray.length; j++) {
                    var prop = myArray[j].substring(prefix.replace("\\", "").length, myArray[j].length - postfix.replace("\\", "").length);
                    var root = data[i];
                    var parts = prop.split('.');
                    for (var k = 0; k < parts.length; k++) {
                        if (root)
                            root = root[parts[k]];
                    }
                    currTemp = currTemp.replace(myArray[j], root);
                }
                target.innerHTML += currTemp;
            }

            if (typeof callback == "function")
                callback(data);
        });
    };
    var tojQueryTemplate = function (templateName, targetSelector, options, callback) {
        ///<summary></summary>
        ///<param name="templateName" type="string"/>
        ///<param name="targetSelector" type="string"/>
        ///<param name="callback" type="function"/>
        return this.toArray(function (data) {
            if ($ && $.tmpl) {
				var templateSource = $(templateName);
				if (templateSource.length)
					templateSource.tmpl(data, options).appendTo($(targetSelector));
				else
					$.tmpl(templateName, data, options).appendTo($(targetSelector));
            }
            if (typeof callback == "function")
                callback(data);
        });
    };

    $data.Queryable.prototype.toTemplate = $data.Queryable.prototype.toTemplate || toTemplate;
    $data.EntitySet.prototype.toTemplate = $data.EntitySet.prototype.toTemplate || toTemplate;

    if (typeof $ != 'undefined' && typeof $.tmpl != 'undefined') {
        $data.Queryable.prototype.tojQueryTemplate = $data.Queryable.prototype.tojQueryTemplate || tojQueryTemplate;
        $data.EntitySet.prototype.tojQueryTemplate = $data.EntitySet.prototype.tojQueryTemplate || tojQueryTemplate;
    } else { 
        $data.Queryable.prototype.tojQueryTemplate = 
        $data.EntitySet.prototype.tojQueryTemplate = function() {
            Guard.raise(new Exception('jQuery and jQuery tmpl plugin is required', 'Not Found!'));
        };
    }

})($data);