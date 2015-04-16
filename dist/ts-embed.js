///<reference path="reference.ts"/>
var tsembed;
(function (tsembed) {
    /**
     * Types of internal data storage formats
     */
    (function (EmbedFormat) {
        EmbedFormat[EmbedFormat["binary"] = 0] = "binary";
        EmbedFormat[EmbedFormat["utf8"] = 1] = "utf8";
    })(tsembed.EmbedFormat || (tsembed.EmbedFormat = {}));
    var EmbedFormat = tsembed.EmbedFormat;
    /**
     * The @embed decorator gets the specified source asset file from an ts-embed library and assigns it to the decorated property.
     * @param embedParams
     * @returns {function(any, string): void}
     */
    function embed(embedParams) {
        return function (proto, propertyName) {
            EmbedCore.addPendingAsignment(embedParams, proto, propertyName);
        };
    }
    tsembed.embed = embed;
    /**
     * The EmbedLoader lets us load an ts-embed library
     */
    var EmbedLoader = (function () {
        function EmbedLoader() {
        }
        /**
         * Loads an ts-embed library from the provided url
         * Returns a Promise that resolves to an EmbedDisk
         * @param url
         * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
         */
        EmbedLoader.prototype.load = function (url) {
            var _this = this;
            return this._promise || (this._promise = new Promise(function (resolve, reject) {
                _this._resolve = resolve;
                _this._reject = reject;
                _this.url = url;
                var req = _this._xhr = new XMLHttpRequest();
                var onload = function () {
                    req.removeEventListener('load', onload, false);
                    _this._loaded();
                };
                req.open('GET', url);
                req.responseType = 'arraybuffer';
                req.addEventListener('load', onload, false);
                req.send();
            }));
        };
        /**
         * Loads an ts-embed library from the provided ArrayBuffer
         * Returns a Promise that resolves to an EmbedDisk
         * @param buffer
         * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
         */
        EmbedLoader.prototype.loadFromArrayBuffer = function (buffer) {
            var _this = this;
            return this._promise || (this._promise = new Promise(function (resolve, reject) {
                var result = EmbedCore.processFile(buffer);
                _this._embedDiskMap = result.map;
                resolve(result.embedMap);
            }));
        };
        /**
         * @private
         */
        EmbedLoader.prototype._loaded = function () {
            if (this._xhr.status == 200) {
                var result = EmbedCore.processFile(this._xhr.response);
                this._embedDiskMap = result.map;
                this._resolve(result.embedMap);
            }
            else {
                this._reject(this._xhr.statusText);
            }
            //this._xhr = null;
        };
        return EmbedLoader;
    })();
    tsembed.EmbedLoader = EmbedLoader;
    /**
     * The EmbedType module contains basic IEmbedExtractor functions used in the @embed decorator
     */
    var EmbedType;
    (function (EmbedType) {
        /**
         * Returns an HTMLImageElement from the specified file
         * @param file
         * @returns {HTMLImageElement}
         */
        function image(file) {
            var img = dce('img');
            img.src = EmbedCore.createObjectURL(file);
            return img;
        }
        EmbedType.image = image;
        /**
         * Returns an HTMLScriptElement from the specified file
         * Scripts that contains @embed decorators must be injected with the EmbedCore.injectScript method
         * @param file
         * @returns {HTMLScriptElement}
         */
        function script(file) {
            var script = dce('script');
            var onload = function () { script.removeEventListener('load', onload); EmbedCore.processPendingAssignments(); };
            script.addEventListener('load', onload, false);
            script.src = EmbedCore.createObjectURL(file);
            return script;
        }
        EmbedType.script = script;
        /**
         * Returns an HTMLStyleElement from the specified file
         * @param file
         * @returns {HTMLStyleElement}
         */
        function style(file) {
            var style = dce('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(file.content));
            return style;
        }
        EmbedType.style = style;
        /**
         * Returns an HTMLSourceElement from the specified file
         * @param file
         * @returns {HTMLSourceElement}
         */
        function source(file) {
            var source = dce("source");
            source.type = file.mime;
            source.src = EmbedCore.createObjectURL(file);
            return source;
        }
        EmbedType.source = source;
        /**
         * Returns an URL.createObjectURL from the specified file
         * @param file
         * @returns {string}
         */
        function objectURL(file) {
            return EmbedCore.createObjectURL(file);
        }
        EmbedType.objectURL = objectURL;
    })(EmbedType = tsembed.EmbedType || (tsembed.EmbedType = {}));
    var EmbedUtils = (function () {
        function EmbedUtils() {
        }
        /**
         * Injects the specified HTMLScriptElement into
         * @param element
         * @returns {Promise<T>|Promise}
         */
        EmbedUtils.injectScript = function (element) {
            return new Promise(function (resolve, reject) {
                element.addEventListener('load', function onload() { element.removeEventListener('load', onload); resolve(element); }, false);
                element.addEventListener('error', function onerror() { element.removeEventListener('error', onerror); reject(element); }, false);
                document.head.appendChild(element);
                return element;
            });
        };
        /**
         * Creates a new image from the provided objectURL
         * @param dataURL dddd
         * @param revoke
         * @returns {*}
         */
        EmbedUtils.imageFromObjectURL = function (objectURL) {
            var img = dce('img');
            img.onload = function () {
                EmbedCore.URL.revokeObjectURL(objectURL);
            };
            img.src = objectURL;
            return img;
        };
        /**
         * Gets the IEmbedAsset for the provided symbol
         * @param src
         * @returns {IEmbedDiskFile}
         */
        EmbedUtils.getSymbol = function (symbol) {
            return EmbedCore.MAP[Object.keys(EmbedCore.MAP).filter(function (key) {
                return EmbedCore.MAP[key].symbol == symbol;
            })[0]] || null;
        };
        /**
         * Gets the symbol param from the lib and returns it extracted with the as IEmbedExtractor param
         * @param symbol
         * @param as
         * @returns {any}
         */
        EmbedUtils.getSymbolAs = function (symbol, as) {
            return as(EmbedUtils.getSymbol(symbol));
        };
        /**
         * Gets the IEmbedAsset for the provided asset src file
         * @param src
         * @returns {IEmbedDiskFile}
         */
        EmbedUtils.getAsset = function (src) {
            return EmbedCore.MAP[EmbedCore.PJWHash(src)];
        };
        return EmbedUtils;
    })();
    tsembed.EmbedUtils = EmbedUtils;
    /**
     * Internal utility classes
     */
    var EmbedCore = (function () {
        function EmbedCore() {
        }
        /**
         * Revokes if possible the provided blob target source and returns it
         * @param target
         */
        EmbedCore.revokeURL = function (target) {
            if (target.src && target.src.indexOf('blob:') == 0) {
                target.onload = function () {
                    EmbedCore.URL.revokeObjectURL(target.src);
                };
            }
            return target;
        };
        /**
         * Generates a valid image/script src dataURL | Blob source
         * @param file
         * @returns {string}
         */
        EmbedCore.createObjectURL = function (file) {
            return EmbedCore.URL.createObjectURL(EmbedCore.getBlobContent(file));
        };
        /**
         * Gets a blob for the provided EmbedType File
         * @param file
         * @returns {any}
         */
        EmbedCore.getBlobContent = function (file) {
            var blobContent = file.content;
            var blobResult;
            var BB = "BlobBuilder";
            try {
                blobResult = new Blob([typeof blobContent === "string" ? blobContent : blobContent.buffer], { type: file.mime });
                return blobResult;
            }
            catch (e) {
                // TypeError old chrome and FF
                window[BB] = window[BB]
                    || window['WebKit' + BB]
                    || window['Moz' + BB]
                    || window['MS' + BB];
                if (e.name == 'TypeError' && window[BB]) {
                    var bb = new window[BB]();
                    bb.append([typeof blobContent === "string" ? blobContent : blobContent.buffer]);
                    blobResult = bb.getBlob(file.mime);
                    return blobResult;
                }
                else if (e.name == "InvalidStateError") {
                    // InvalidStateError FF13 WinXP
                    blobResult = new Blob([typeof blobContent === "string" ? blobContent : blobContent.buffer], { type: file.mime });
                    return blobResult;
                }
            }
            return null;
        };
        /**
         * Used internally by the @embed decorator
         * Stores pending dynamic/static properties initialization
         * @param embedParams
         * @param proto
         * @param propertyName
         */
        EmbedCore.addPendingAsignment = function (embedParams, proto, propertyName) {
            EmbedCore.pendingAssignments.push({
                params: embedParams,
                proto: proto,
                propertyName: propertyName,
                done: false
            });
        };
        /**
         * Processes an ArrayBuffer loaded via xhr
         * >Reads the header
         * >Reads the json EmbedDisk object
         * >Generates corresponding static MAP data
         * >Processes pending assignments requests
         * >Injects pending Scripts to the dom
         * >Processes pending assignments requests that may have been generated by the loaded code )
         *
         * @param data ArrayBuffer representing the tse loaded file
         * @returns {EmbedDisk}
         */
        EmbedCore.processFile = function (data) {
            var view = new DataView(data);
            var diskMapSize = view.getUint32(0);
            var diskMapBytes = this.extractBuffer(data, 4, diskMapSize);
            var jsonMapObject = EmbedCore.UTF8ArrayToString(diskMapBytes);
            var diskMapObject = JSON.parse(jsonMapObject);
            var originalDiskMapObject = JSON.parse(jsonMapObject);
            var files = Object.keys(diskMapObject);
            files.forEach(function (key) {
                diskMapObject[key].start += (diskMapSize + 4);
                EmbedCore.unpack(data, diskMapObject[key]);
                EmbedCore.MAP[key] = diskMapObject[key];
            });
            EmbedCore.processPendingAssignments();
            return {
                embedMap: diskMapObject,
                map: originalDiskMapObject
            };
        };
        /**
         * Processes all pending assignments,getting its value from the file contents or from the "IEmbedMeta.as" provided parameter .
         */
        EmbedCore.processPendingAssignments = function () {
            EmbedCore.pendingAssignments.filter(function (decParam) {
                return decParam.done == false;
            }).forEach(function (decParam) {
                decParam.done = true;
                var file = EmbedUtils.getAsset(decParam.params.src);
                decParam.proto[decParam.propertyName] = decParam.params.as ?
                    EmbedCore.revokeURL(decParam.params.as(file)) : file.content;
            });
        };
        /* Conversion utils */
        /**
         * UTF8ArrayToString
         * @param array
         * @returns {string}
         * @constructor
         */
        EmbedCore.UTF8ArrayToString = function (array) {
            var out, i, len, c;
            var char2, char3;
            out = "";
            len = array.length;
            i = 0;
            while (i < len) {
                c = array[i++];
                switch (c >> 4) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        // 0xxxxxxx
                        out += String.fromCharCode(c);
                        break;
                    case 12:
                    case 13:
                        // 110x xxxx   10xx xxxx
                        char2 = array[i++];
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                        break;
                    case 14:
                        // 1110 xxxx  10xx xxxx  10xx xxxx
                        char2 = array[i++];
                        char3 = array[i++];
                        out += String.fromCharCode(((c & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
                        break;
                }
            }
            return out;
        };
        /**
         * reads an embed file as a Uint8Array
         * @param data
         * @param file
         */
        EmbedCore.readBinary = function (data, file) {
            file.content = EmbedCore.extractBuffer(data, file.start, file.length);
        };
        /**
         * reads an embed file as a UTF8
         * @param data
         * @param file
         */
        EmbedCore.readUTF8 = function (data, file) {
            file.content = EmbedCore.UTF8ArrayToString(EmbedCore.extractBuffer(data, file.start, file.length));
        };
        /**
         * Extracts a Uint8Array buffer from ArrayBuffer
         * @param src
         * @param offset
         * @param length
         * @returns {Uint8Array}
         */
        EmbedCore.extractBuffer = function (src, offset, length) {
            var dstU8 = new Uint8Array(length);
            var srcU8 = new Uint8Array(src, offset, length);
            dstU8.set(srcU8);
            return dstU8;
        };
        /**
         * Unpacks the file from the ArrayBuffer
         * @param key
         * @param data
         * @param diskMapObject
         */
        EmbedCore.unpack = function (data, file) {
            EmbedCore.decompressFormat[file.format](data, file);
        };
        /**
         * simple hash algorithm
         * @param str
         * @returns {number}
         * @constructor
         */
        EmbedCore.PJWHash = function (str) {
            var BitsInUnsignedInt = 4 * 8;
            var ThreeQuarters = (BitsInUnsignedInt * 3) / 4;
            var OneEighth = BitsInUnsignedInt / 8;
            var HighBits = (0xFFFFFFFF) << (BitsInUnsignedInt - OneEighth);
            var hash = 0;
            var test = 0;
            for (var i = 0; i < str.length; i++) {
                hash = (hash << OneEighth) + str.charCodeAt(i);
                if ((test = hash & HighBits) != 0) {
                    hash = ((hash ^ (test >> ThreeQuarters)) & (~HighBits));
                }
            }
            return hash;
        };
        EmbedCore.MAP = {};
        EmbedCore.decompressFormat = (function () {
            var decompressFormat = {};
            decompressFormat[EmbedFormat.utf8] = EmbedCore.readUTF8;
            decompressFormat[EmbedFormat.binary] = EmbedCore.readBinary;
            return decompressFormat;
        })();
        EmbedCore.pendingAssignments = [];
        EmbedCore.URL = window['URL'] || window['webkitURL'];
        return EmbedCore;
    })();
    function dce(tagName) {
        return document.createElement(tagName);
    }
})(tsembed || (tsembed = {}));
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
//grunt-start
//grunt-end
/// <reference path="ts-embed.ts" /> 
//# sourceMappingURL=ts-embed.js.map