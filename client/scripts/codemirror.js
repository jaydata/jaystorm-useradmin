$data.Base.extend('$data.JayStormUI.CodeMirror', {
    constructor: function(el, value){
        setTimeout(function(){
            if (!value()) value('function(items){\n  // code here...\n}');
            var editor = CodeMirror(document.getElementById(el), {
                value: value(),
                mode: 'javascript',
                lineNumbers: true,
                //theme: "ambiance",
                extraKeys: {
                    'Ctrl-Space': 'autocomplete',
                    "F11": function(cm) {
                        setFullScreen(cm, !isFullScreen(cm));
                    },
                    "Esc": function(cm) {
                        if (isFullScreen(cm)) setFullScreen(cm, false);
                    }
                },
                onChange: function(editor){
                    console.log(editor.getValue());
                    value(editor.getValue());
                },
                onCursorActivity: function() {
                    editor.setLineClass(hlLine, null, null);
                    hlLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
                    editor.matchHighlight("CodeMirror-matchhighlight");
                }
            });
            var hlLine = editor.setLineClass(0, "activeline");
        }, 1);
    }
});

$data.Base.extend('$data.JayStormUI.CodeHighlight', {
    constructor: function(el, value){
        setTimeout(function(){
            if (!value()) value('function(items){\n  // code here...\n}');
            CodeMirror.runMode(value(), 'text/javascript', document.getElementById(el));
        }, 1);
    }
})
