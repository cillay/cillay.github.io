class AsyncWorker {
    constructor(asyncFunction, imports) {
        if (asyncFunction instanceof Function) {
            var getFunctionBody = (fn) => fn.toString().substring(fn.toString().indexOf("{") + 1, fn.toString().lastIndexOf("}")),
                getFunctionArgs = (fn) => fn.toString().substring(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")")),
                $$syncFunctionBody = getFunctionBody(asyncFunction),
                $$syncFunctionArgs = getFunctionArgs(asyncFunction).replace(/\s/g, "");

            if ($$syncFunctionArgs.length) {
                $$syncFunctionArgs = $$syncFunctionArgs.replace(/(\w+)/g, '"$1"');
                $$syncFunctionArgs += ", ";
            }

            var workerFunction = () => {
                var syncFunction = new Function($$syncFunctionArgs, $$syncFunctionBody);

                self.onmessage = function (event) {
                    var uid = event.data[0],
                        args = event.data[1],
                        result = syncFunction.apply(syncFunction, args);
                    self.postMessage([uid, result]);
                }
            };

            var onWorkerMessage = function (event) {
                var uid = event.data[0],
                    result = event.data[1],
                    handler = this.handlers[uid];
                if (handler) {
                    handler(result);
                    delete (this.handlers[uid]);
                }
            };

            var strSyncFunction = '"' + $$syncFunctionBody.replace(/"/g, '\\"').replace(/[\r\n]/g, '; ') + '"';
            var strWorkerFunction = getFunctionBody(workerFunction)
                .replace("$$syncFunctionBody", strSyncFunction)
                .replace("$$syncFunctionArgs,", $$syncFunctionArgs);

            if (imports && imports instanceof Array && imports.length) {
            	strWorkerFunction = 'importScripts("' + imports.join('", "') +'");\n' + strWorkerFunction;
            }
            strWorkerFunction = 'var window = self;\nwindow.document=new Object();\n' + strWorkerFunction;

            var blob = new Blob([ strWorkerFunction ], { type: "text/javascript" });
            this.worker = new Worker(window.URL.createObjectURL(blob));
            this.worker.onmessage = onWorkerMessage.bind(this.worker);
            this.worker.handlers = {};
        }
        else {
            throw new Error("Argument must be a function");
        }
    }

    _generateUniqueId() {
        var d = Date.now();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    invoke() {
        var uid = this._generateUniqueId();
        var promise = new Promise((resolve, reject) => {
            this.worker.handlers[uid] = function (result) {
                resolve(result);
            };
            var args = Array.prototype.slice.call(arguments);
            this.worker.postMessage([uid, args]);
        });
        return promise;
    }
}