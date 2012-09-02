(function ($data) {

    function voidTrace() {
    };

    function debugTraceConsole() {
        console.dir.apply(console, arguments);
    }

    $data.trace = debugTraceConsole;

})(window["$data"] || (window["$data"] = {}));