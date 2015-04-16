/**
 * ts-embed.ts
 * Created by xperiments on 30/03/15.
 */
///<reference path="reference.ts"/>
var xp;
(function (xp) {
    (function (EmbedType) {
        EmbedType[EmbedType["binary"] = 0] = "binary";
        EmbedType[EmbedType["utf8"] = 1] = "utf8";
    })(xp.EmbedType || (xp.EmbedType = {}));
    var EmbedType = xp.EmbedType;
    function embed(embedParams) {
        return function (proto, propertyName) {
            EmbedCore.addPendingAsignment(embedParams, proto, propertyName);
        };
    }
    xp.embed = embed;
    var EmbedLoader = (function () {
        function EmbedLoader() {
        }
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
        EmbedLoader.prototype.loadFromArrayBuffer = function (buffer) {
            var _this = this;
            return this._promise || (this._promise = new Promise(function (resolve, reject) {
                var result = EmbedCore.processFile(buffer);
                _this._embedDiskMap = result.map;
                resolve(result.embedMap);
            }));
        };
        EmbedLoader.prototype._loaded = function () {
            if (this._xhr.status == 200) {
                var result = EmbedCore.processFile(this._xhr.response);
                this._embedDiskMap = result.map;
                this._resolve(result.embedMap);
            }
            else {
                this._reject(this._xhr.statusText);
            }
        };
        return EmbedLoader;
    })();
    xp.EmbedLoader = EmbedLoader;
    var EmbedType;
    (function (EmbedType) {
        function image(file) {
            var img = dce('img');
            img.src = EmbedCore.createObjectURL(file);
            return img;
        }
        EmbedType.image = image;
        function script(file) {
            var script = dce('script');
            var onload = function () { script.removeEventListener('load', onload); EmbedCore.processPendingAssignments(); };
            script.addEventListener('load', onload, false);
            script.src = EmbedCore.createObjectURL(file);
            return script;
        }
        EmbedType.script = script;
        function style(file) {
            var style = dce('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(file.content));
            return style;
        }
        EmbedType.style = style;
        function source(file) {
            var source = dce("source");
            source.type = file.mime;
            source.src = EmbedCore.createObjectURL(file);
            return source;
        }
        EmbedType.source = source;
        function objectURL(file) {
            return EmbedCore.createObjectURL(file);
        }
        EmbedType.objectURL = objectURL;
    })(EmbedType = xp.EmbedType || (xp.EmbedType = {}));
    var EmbedUtils = (function () {
        function EmbedUtils() {
        }
        EmbedUtils.injectScript = function (element) {
            return new Promise(function (resolve, reject) {
                element.addEventListener('load', function onload() { element.removeEventListener('load', onload); resolve(element); }, false);
                element.addEventListener('error', function onerror() { element.removeEventListener('error', onerror); reject(element); }, false);
                document.head.appendChild(element);
                return element;
            });
        };
        EmbedUtils.imageFromDataURL = function (dataURL, revoke) {
            if (revoke === void 0) { revoke = false; }
            var img = dce('img');
            img.onload = function () {
            };
            img.src = dataURL;
            return img;
        };
        EmbedUtils.getSymbol = function (symbol) {
            return EmbedCore.MAP[Object.keys(EmbedCore.MAP).filter(function (key) {
                return EmbedCore.MAP[key].symbol == symbol;
            })[0]] || null;
        };
        EmbedUtils.getSymbolAs = function (symbol, as) {
            return as(EmbedUtils.getSymbol(symbol));
        };
        EmbedUtils.getFile = function (src) {
            return EmbedCore.MAP[EmbedCore.PJWHash(src)];
        };
        return EmbedUtils;
    })();
    xp.EmbedUtils = EmbedUtils;
    var EmbedCore = (function () {
        function EmbedCore() {
        }
        EmbedCore.revokeURL = function (target) {
            if (target.src && target.src.indexOf('blob:') == 0) {
                target.onload = function () {
                    EmbedCore.URL.revokeObjectURL(target.src);
                };
            }
            return target;
        };
        EmbedCore.createObjectURL = function (file) {
            return EmbedCore.URL.createObjectURL(EmbedCore.getBlobContent(file));
        };
        EmbedCore.getBlobContent = function (file) {
            var blobContent = file.content;
            var blobResult;
            var BB = "BlobBuilder";
            try {
                blobResult = new Blob([typeof blobContent === "string" ? blobContent : blobContent.buffer], { type: file.mime });
                return blobResult;
            }
            catch (e) {
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
                    blobResult = new Blob([typeof blobContent === "string" ? blobContent : blobContent.buffer], { type: file.mime });
                    return blobResult;
                }
            }
            return null;
        };
        EmbedCore.addPendingAsignment = function (embedParams, proto, propertyName) {
            EmbedCore.pendingAssignments.push({
                params: embedParams,
                proto: proto,
                propertyName: propertyName,
                done: false
            });
        };
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
        EmbedCore.processPendingAssignments = function () {
            EmbedCore.pendingAssignments.filter(function (decParam) {
                return decParam.done == false;
            }).forEach(function (decParam) {
                decParam.done = true;
                var file = EmbedUtils.getFile(decParam.params.src);
                decParam.proto[decParam.propertyName] = decParam.params.as ?
                    EmbedCore.revokeURL(decParam.params.as(file)) : file.content;
            });
        };
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
                        out += String.fromCharCode(c);
                        break;
                    case 12:
                    case 13:
                        char2 = array[i++];
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                        break;
                    case 14:
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
        EmbedCore.readBinary = function (data, file) {
            file.content = EmbedCore.extractBuffer(data, file.start, file.length);
        };
        EmbedCore.readUTF8 = function (data, file) {
            file.content = EmbedCore.UTF8ArrayToString(EmbedCore.extractBuffer(data, file.start, file.length));
        };
        EmbedCore.extractBuffer = function (src, offset, length) {
            var dstU8 = new Uint8Array(length);
            var srcU8 = new Uint8Array(src, offset, length);
            dstU8.set(srcU8);
            return dstU8;
        };
        EmbedCore.unpack = function (data, file) {
            EmbedCore.decompressFormat[file.format](data, file);
        };
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
            decompressFormat[EmbedType.utf8] = EmbedCore.readUTF8;
            decompressFormat[EmbedType.binary] = EmbedCore.readBinary;
            return decompressFormat;
        })();
        EmbedCore.pendingAssignments = [];
        EmbedCore.URL = window['URL'] || window['webkitURL'];
        return EmbedCore;
    })();
    function dce(tagName) {
        return document.createElement(tagName);
    }
})(xp || (xp = {}));
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="ts-embed.ts" /> 
//# sourceMappingURL=ts-embed.js.map