(function ($data) {

    function voidTrace() {
    };

    function debugTraceConsole() {
        console.dir(arguments);
    }

    $data.trace = debugTraceConsole;

})(window["$data"] || (window["$data"] = {}));