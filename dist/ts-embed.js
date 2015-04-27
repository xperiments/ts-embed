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
            var onload = function () {
                script.removeEventListener('load', onload);
                EmbedCore.processPendingAssignments();
            };
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
                element.addEventListener('load', function onload() {
                    element.removeEventListener('load', onload);
                    resolve(element);
                }, false);
                element.addEventListener('error', function onerror() {
                    element.removeEventListener('error', onerror);
                    reject(element);
                }, false);
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
                EmbedCore.revokeObjectURL(objectURL);
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
         * Revokes if possible the provided blob object url and returns it
         * @param target
         */
        EmbedCore.revokeObjectURL = function (target) {
            if (target.indexOf('blob:') == 0) {
                EmbedCore.URL.revokeObjectURL(target);
            }
        };
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
            if (EmbedCore.URL) {
                return EmbedCore.URL.createObjectURL(EmbedCore.getBlobContent(file));
            }
            else {
                return EmbedCore.getBase64Memoized(file);
            }
        };
        EmbedCore.getBase64 = function (file) {
            var b64 = typeof file.content === "string" ? window.btoa(file.content) : base64EncArr(file.content);
            return "data:" + file.mime + ";base64," + b64;
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
                    bb.append(typeof blobContent === "string" ? [blobContent] : blobContent.buffer);
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
            // read head size getUint32
            var u8 = new Uint8Array(data);
            var b0 = u8[0], b1 = u8[1], b2 = u8[2], b3 = u8[3];
            var diskMapSize = (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
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
            return new Uint8Array(src.slice(offset, length + offset));
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
        EmbedCore.getBase64Memoized = memoize(EmbedCore.getBase64);
        EmbedCore.MAP = {};
        EmbedCore.decompressFormat = (function () {
            var decompressFormat = {};
            decompressFormat[EmbedFormat.utf8] = EmbedCore.readUTF8;
            decompressFormat[EmbedFormat.binary] = EmbedCore.readBinary;
            return decompressFormat;
        })();
        EmbedCore.pendingAssignments = [];
        EmbedCore.URL = window['URL'] || window['webkitURL'] || null;
        return EmbedCore;
    })();
    function dce(tagName) {
        return document.createElement(tagName);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
     * @param nUint6
     * @returns {number}
     */
    function uint6ToB64(nUint6) {
        return nUint6 < 26 ?
            nUint6 + 65
            : nUint6 < 52 ?
                nUint6 + 71
                : nUint6 < 62 ?
                    nUint6 - 4
                    : nUint6 === 62 ?
                        43
                        : nUint6 === 63 ?
                            47
                            :
                                65;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
     * @param aBytes
     * @returns {string}
     */
    function base64EncArr(aBytes) {
        var nMod3 = 2, sB64Enc = "";
        for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            //if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }
        return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
    }
    /*
     * memoize.js
     * by @philogb and @addyosmani
     * with further optimizations by @mathias
     * and @DmitryBaranovsk
     * perf tests: http://bit.ly/q3zpG3
     * Released under an MIT license.
     * http://addyosmani.com/blog/faster-javascript-memoization/
     */
    function memoize(fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var hash = "", i = args.length;
            var currentArg = null;
            while (i--) {
                currentArg = args[i];
                hash += (currentArg === Object(currentArg)) ?
                    JSON.stringify(currentArg) : currentArg;
                fn.memoize || (fn.memoize = {});
            }
            return (hash in fn.memoize) ? fn.memoize[hash] :
                fn.memoize[hash] = fn.apply(this, args);
        };
    }
})(tsembed || (tsembed = {}));
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
//grunt-start
//grunt-end
/// <reference path="ts-embed.ts" /> 
//# sourceMappingURL=ts-embed.js.map