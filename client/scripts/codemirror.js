function getCompletions(token, context) {
  var found = [], start = token.string;
  function maybeAdd(str) {
    if (str.indexOf(start) == 0) found.push(str);
  }
  function gatherCompletions(obj) {
    if (typeof obj == "string") forEach(stringProps, maybeAdd);
    else if (obj instanceof Array) forEach(arrayProps, maybeAdd);
    else if (obj instanceof Function) forEach(funcProps, maybeAdd);
    for (var name in obj) maybeAdd(name);
  }

  if (context) {
    // If this is a property, see if it belongs to some object we can
    // find in the current environment.
    var obj = context.pop(), base;
    if (obj.className == "js-variable")
      base = window[obj.string];
    else if (obj.className == "js-string")
      base = "";
    else if (obj.className == "js-atom")
      base = 1;
    while (base != null && context.length)
      base = base[context.pop().string];
    if (base != null) gatherCompletions(base);
  }
  else {
    // If not, just look in the window object and any local scope
    // (reading into JS mode internals to get at the local variables)
    for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
    gatherCompletions(window);
    forEach(keywords, maybeAdd);
  }
  return found;
}

CodeMirror.commands.autocomplete = function(cm) {
    CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
}

function isFullScreen(cm) {
  return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
}
function winHeight() {
  return window.innerHeight || (document.documentElement || document.body).clientHeight;
}
function setFullScreen(cm, full) {
  var wrap = cm.getWrapperElement(), scroll = cm.getScrollerElement();
  if (full) {
    wrap.className += " CodeMirror-fullscreen";
    scroll.style.height = winHeight() + "px";
    document.documentElement.style.overflow = "hidden";
  } else {
    wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
    scroll.style.height = "";
    document.documentElement.style.overflow = "";
  }
  cm.refresh();
}
CodeMirror.connect(window, "resize", function() {
  var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
  if (!showing) return;
  showing.CodeMirror.getScrollerElement().style.height = winHeight() + "px";
});

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
