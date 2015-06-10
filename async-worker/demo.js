(function () {
    "use strict";

    var howMany = 10000;

    var useAsync = true,
        useArrays = false;

    var pathToSjcl = "http://cdnjs.cloudflare.com/ajax/libs/sjcl/1.0.0/sjcl.min.js";

    var crypto = {
        encrypt: function (text) {
            var secretKey = "iGDoA4MXU0msiUAG8v3TBeqX4vqraWDJ3iuzjGOSdy67glDPUHalhZ2TyuSrIirS5OUZdWCEP4L5bf6a0zQH90DBKSMx6GdiN8tqEofxghXDo0887r8OderML9QAYjXr";
            return sjcl.encrypt(secretKey, text);
        },
        decrypt: function (cipher) {
            var secretKey = "iGDoA4MXU0msiUAG8v3TBeqX4vqraWDJ3iuzjGOSdy67glDPUHalhZ2TyuSrIirS5OUZdWCEP4L5bf6a0zQH90DBKSMx6GdiN8tqEofxghXDo0887r8OderML9QAYjXr";
            return sjcl.decrypt(secretKey, cipher);
        }
    };

    var encryptAsync = new AsyncWorker(crypto.encrypt, [pathToSjcl]);
    var decryptAsync = new AsyncWorker(crypto.decrypt, [pathToSjcl]);

    var getSentences = function (howMany, wordsPerSentence) {
        return Array.apply(0, new Array(howMany)).map(function () {
            return chance.sentence({words: wordsPerSentence});
        });
    };

    var sentences;
    var operations = {
        generateData: function () {
            if (useAsync) {
                return new AsyncWorker(getSentences, ["http://cdnjs.cloudflare.com/ajax/libs/chance/0.5.6/chance.js"])
                    .invoke(howMany, 100)
                    .then(function (result) {
                        sentences = result;
                    });
            }
            else {
                return new Promise(function (resolve, reject) {
                    sentences = getSentences(howMany, 100);
                    resolve(sentences);
                });
            }
        },
        encryptData: function () {
            return doWork();
        }
    };

    //var encryptArray = Array.apply(0, new Array(10)).map(function () {
    //    return new AsyncWorker(crypto.encrypt, [pathToSjcl]);
    //});

    //var decryptArray = Array.apply(0, new Array(10)).map(function () {
    //    return new AsyncWorker(crypto.decrypt, [pathToSjcl]);
    //});

    function doWork() {
        var itemCount = sentences.length;
        console.log("Starting...");
 
        var resultsArray = [];

        return new Promise(function (resolve, reject) {
            // Asynchronous
            if (useAsync) {
                (function () {
                    var t0 = performance.now();
                    sentences.forEach(function (sentence, index) {
                        encryptAsync.invoke(sentence).then(function (cipher) {
                            decryptAsync.invoke(cipher).then(function (text) {
                                resultsArray.push(text);
                                if (resultsArray.length === itemCount) {
                                    var t1 = performance.now();
                                    console.log("Done!")
                                    console.log("encrypt/decrypt async took " + (t1 - t0) + " milliseconds.");
                                    resolve(resultsArray);
                                }
                            });
                        });
                    });
                })();
            }
            else {
                // Synchronous
                (function () {
                    var t0 = performance.now();
                    sentences.forEach(function (sentence, index) {
                        var cipher = crypto.encrypt(sentence);
                        var text = crypto.decrypt(cipher);
                        resultsArray.push(text);
                        if (resultsArray.length === itemCount) {
                            var t1 = performance.now();
                            console.log("Done!")
                            console.log("encrypt/decrypt sync took " + (t1 - t0) + " milliseconds.");
                            resolve(resultsArray);
                        }
                    });
                })();
            }
        });
    }

    // Wire up events
    document.addEventListener("DOMContentLoaded", function () {
        var allButtons = document.getElementsByTagName("button");
        [].forEach.call(allButtons, function (element) {
            element.addEventListener("click", function (e) {
                var button = e.target,
                    method = button.name,
                    panel = button.parentElement;
                useAsync = panel.id.toLowerCase().indexOf("async") !== -1;

                // Disable all the buttons
                [].forEach.call(allButtons, function (element) {
                    element.disabled = true;
                });

                panel.getElementsByClassName("animation")[0].style.visibility = "visible";

                var outputElement = [].filter.call(panel.getElementsByTagName("p"), function (p) {
                    (method === "generateData") && (p.innerText = "");
                    return p.getAttribute("data-for") === method;
                })[0];
                var doneMessage, doneFunction;
                var countAsText = howMany.toLocaleString();
                if (method === "generateData") {
                    outputElement.innerText = "Generating " + countAsText + " sentences";
                    doneMessage = countAsText + " sentences generated";
                    doneFunction = function () {
                        button.disabled = true;
                        button.nextElementSibling.disabled = false;
                    };
                }
                else if (method === "encryptData") {
                    outputElement.innerText = "Encrypting " + countAsText + " sentences";
                    doneMessage = countAsText + " sentences encrypted";
                    doneFunction = function () {
                        button.disabled = true;
                        [].forEach.call(document.querySelectorAll(".panel button:first-of-type"), function (element) {
                            element.disabled = false;
                        });
                    };
                }

                // Start on a delay to allow for animation to begin
                window.setTimeout(function () {
                    var t0 = performance.now();
                    operations[method]().then(function () {
                        var t1 = performance.now();
                        outputElement.innerText = doneMessage + " in " + ((t1 - t0) / 1000).toFixed(3) + " seconds";
                        if (doneFunction instanceof Function) {
                            doneFunction();
                        }
                    });
                }, 200);
            });
        });
    });
})();