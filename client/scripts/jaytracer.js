(function ($data) {

    function voidTrace() {
    };

    function debugTraceConsole() {
        //console.log.apply(console, arguments);
    }

    $data.trace = debugTraceConsole;

})(window["$data"] || (window["$data"] = {}));