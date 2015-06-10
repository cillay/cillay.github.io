"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AsyncWorker = (function () {
    function AsyncWorker(asyncFunction, imports) {
        _classCallCheck(this, AsyncWorker);

        if (asyncFunction instanceof Function) {
            var getFunctionBody = function getFunctionBody(fn) {
                return fn.toString().substring(fn.toString().indexOf("{") + 1, fn.toString().lastIndexOf("}"));
            },
                getFunctionArgs = function getFunctionArgs(fn) {
                return fn.toString().substring(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")"));
            },
                $$syncFunctionBody = getFunctionBody(asyncFunction),
                $$syncFunctionArgs = getFunctionArgs(asyncFunction).replace(/\s/g, "");

            if ($$syncFunctionArgs.length) {
                $$syncFunctionArgs = $$syncFunctionArgs.replace(/(\w+)/g, "\"$1\"");
                $$syncFunctionArgs += ", ";
            }

            var workerFunction = function workerFunction() {
                var syncFunction = new Function($$syncFunctionArgs, $$syncFunctionBody);

                self.onmessage = function (event) {
                    var uid = event.data[0],
                        args = event.data[1],
                        result = syncFunction.apply(syncFunction, args);
                    self.postMessage([uid, result]);
                };
            };

            var onWorkerMessage = function onWorkerMessage(event) {
                var uid = event.data[0],
                    result = event.data[1],
                    handler = this.handlers[uid];
                if (handler) {
                    handler(result);
                    delete this.handlers[uid];
                }
            };

            var strSyncFunction = "\"" + $$syncFunctionBody.replace(/"/g, "\\\"").replace(/[\r\n]/g, "; ") + "\"";
            var strWorkerFunction = getFunctionBody(workerFunction).replace("$$syncFunctionBody", strSyncFunction).replace("$$syncFunctionArgs,", $$syncFunctionArgs);

            if (imports && imports instanceof Array && imports.length) {
                strWorkerFunction = "importScripts(\"" + imports.join("\", \"") + "\");\n" + strWorkerFunction;
            }
            strWorkerFunction = "var window = self;\nwindow.document=new Object();\n" + strWorkerFunction;

            var blob = new Blob([strWorkerFunction], { type: "text/javascript" });
            this.worker = new Worker(window.URL.createObjectURL(blob));
            this.worker.onmessage = onWorkerMessage.bind(this.worker);
            this.worker.handlers = {};
        } else {
            throw new Error("Argument must be a function");
        }
    }

    _createClass(AsyncWorker, [{
        key: "_generateUniqueId",
        value: function _generateUniqueId() {
            var d = Date.now();
            var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == "x" ? r : r & 3 | 8).toString(16);
            });
            return uuid;
        }
    }, {
        key: "invoke",
        value: function invoke() {
            var _this = this,
                _arguments = arguments;

            var uid = this._generateUniqueId();
            var promise = new Promise(function (resolve, reject) {
                _this.worker.handlers[uid] = function (result) {
                    resolve(result);
                };
                var args = Array.prototype.slice.call(_arguments);
                _this.worker.postMessage([uid, args]);
            });
            return promise;
        }
    }]);

    return AsyncWorker;
})();

//# sourceMappingURL=async-worker.js.map