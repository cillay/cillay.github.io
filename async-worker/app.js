(function () {
    "use strict";

    var hello = function (name) {
        return "Hello " + (name || "world") + "!";
    };

    var helloAsync = new AsyncWorker(hello);

    helloAsync.invoke("Ian").then(function (result) {
        console.log(result);
    });
})();