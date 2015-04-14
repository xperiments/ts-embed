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
            xp.EmbedUtils.process(embedParams, proto, propertyName);
        };
    }
    xp.embed = embed;
    var EmbedLoader = (function () {
        function EmbedLoader() {
            this._xhr = new XMLHttpRequest();
        }
        EmbedLoader.prototype.load = function (url) {
            var _this = this;
            return this._promise || (this._promise = new Promise(function (resolve, reject) {
                _this._resolve = resolve;
                _this._reject = reject;
                _this.url = url;
                var req = _this._xhr;
                var loadBind = function () {
                    req.removeEventListener('load', loadBind, false);
                    req.removeEventListener('progress', loadBind, false);
                    _this._loaded();
                };
                req.responseType = 'arraybuffer';
                req.addEventListener('load', loadBind, false);
                req.open('GET', url);
                req.send();
            }));
        };
        EmbedLoader.prototype.loadFromArrayBuffer = function (buffer) {
            var _this = this;
            return this._promise || (this._promise = new Promise(function (resolve, reject) {
                var result = EmbedUtils.processFile(buffer);
                _this._embedDiskMap = result.map;
                resolve(result.embedMap);
            }));
        };
        EmbedLoader.prototype._loaded = function () {
            if (this._xhr.status == 200) {
                var result = EmbedUtils.processFile(this._xhr.response);
                this._embedDiskMap = result.map;
                this._resolve(result.embedMap);
            }
            else {
                this._reject(this._xhr.statusText);
            }
        };
        EmbedLoader.prototype.removeEventListener = function (type, listener, useCapture) {
            this._xhr.removeEventListener(type, listener, useCapture);
        };
        EmbedLoader.prototype.addEventListener = function (type, listener, useCapture) {
            this._xhr.addEventListener(type, listener, useCapture);
        };
        EmbedLoader.prototype.dispatchEvent = function (evt) {
            return this._xhr.dispatchEvent(evt);
        };
        return EmbedLoader;
    })();
    xp.EmbedLoader = EmbedLoader;
    var Embed;
    (function (Embed) {
        function image(file) {
            var img = document.createElement('img');
            img.src = EmbedUtils.getURLFrom(file);
            return img;
        }
        Embed.image = image;
        function script(file) {
            var script = document.createElement('script');
            script.src = EmbedUtils.getURLFrom(file);
            return script;
        }
        Embed.script = script;
        function $script(file) {
            console.log('aaaa', file);
            var script = Embed.script(file);
            document.body.appendChild(script);
            return script;
        }
        Embed.$script = $script;
        function style(file) {
            var s = document.createElement('style');
            s.type = 'text/css';
            s.appendChild(document.createTextNode(file.content));
            return s;
        }
        Embed.style = style;
        function source(file) {
            var source = document.createElement("source");
            source.type = file.mime;
            source.src = EmbedUtils.getURLFrom(file);
            return source;
        }
        Embed.source = source;
    })(Embed = xp.Embed || (xp.Embed = {}));
    var EmbedUtils = (function () {
        function EmbedUtils() {
        }
        EmbedUtils.revokeURL = function (target) {
            if (target.src && target.src.indexOf('blob:') > -1) {
                target.onload = function () {
                    URL.revokeObjectURL(target.src);
                };
            }
            return target;
        };
        EmbedUtils.getURLFrom = function (file) {
            if (supportsBlob) {
                return URL.createObjectURL(EmbedUtils.getBlob(file));
            }
            return "data:" + file.mime + ";base64," + (typeof file.content === "string" ? window.btoa(file.content) : EmbedUtils.Uint8ArrayToBase64(file.content));
        };
        EmbedUtils.getBlob = function (file) {
            var blobContent = file.content;
            var blobResult;
            var BBN = "BlobBuilder";
            console.log(file.mime, typeof blobContent);
            try {
                blobResult = new Blob([
                    typeof blobContent === "string" ? blobContent : [blobContent.buffer]
                ]);
                return blobResult;
            }
            catch (e) {
                window[BBN] = window[BBN]
                    || window['WebKit' + BBN]
                    || window['Moz' + BBN]
                    || window['MS' + BBN];
                if (e.name == 'TypeError' && window[BBN]) {
                    var bb = new window[BBN]();
                    bb.append(blobContent instanceof String ? blobContent : [blobContent.buffer]);
                    blobResult = bb.getBlob(file.mime);
                    return blobResult;
                }
                else if (e.name == "InvalidStateError") {
                    blobResult = new Blob(blobContent instanceof String ? blobContent : [blobContent.buffer], { type: file.mime });
                    return blobResult;
                }
            }
            return null;
        };
        EmbedUtils.getFile = function (src) {
            return EmbedUtils.MAP[EmbedUtils.PJWHash(src)];
        };
        EmbedUtils.getSymbol = function (symbol) {
            return EmbedUtils.MAP[Object.keys(EmbedUtils.MAP).filter(function (key) {
                return EmbedUtils.MAP[key].symbol == symbol;
            })[0]] || null;
        };
        EmbedUtils.getSymbolAs = function (symbol, as) {
            return as(EmbedUtils.getSymbol(symbol));
        };
        EmbedUtils.process = function (embedParams, proto, propertyName) {
            EmbedUtils.assingProperties.push({
                params: embedParams,
                proto: proto,
                propertyName: propertyName,
                done: false
            });
        };
        EmbedUtils.processFile = function (data) {
            var view = new DataView(data);
            var diskMapSize = view.getUint32(0);
            var diskMapBytes = this.extractBuffer(data, 4, diskMapSize);
            var jsonMapObject = EmbedUtils.UTF8ArrayToString(diskMapBytes);
            var diskMapObject = JSON.parse(jsonMapObject);
            var originalDiskMapObject = JSON.parse(jsonMapObject);
            var files = Object.keys(diskMapObject);
            files.forEach(function (key) {
                diskMapObject[key].start += (diskMapSize + 4);
                EmbedUtils.unpack(key, data, diskMapObject);
                EmbedUtils.MAP[key] = diskMapObject[key];
            });
            EmbedUtils.assingProperties.filter(function (decParam) {
                return decParam.done == false;
            }).forEach(function (decParam) {
                var file = EmbedUtils.getFile(decParam.params.src);
                console.log(decParam.params.src);
                decParam.proto[decParam.propertyName] = decParam.params.as ?
                    EmbedUtils.revokeURL(decParam.params.as(file)) : file.content;
                decParam.done = true;
            });
            return {
                embedMap: diskMapObject,
                map: originalDiskMapObject
            };
        };
        EmbedUtils.UTF8ArrayToString = function (array) {
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
        EmbedUtils.uint6ToB64 = function (nUint6) {
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
        };
        EmbedUtils.Uint8ArrayToBase64 = function (aBytes) {
            var sB64Enc = "";
            for (var nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
                nMod3 = nIdx % 3;
                nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
                if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                    sB64Enc += String.fromCharCode(EmbedUtils.uint6ToB64(nUint24 >>> 18 & 63), EmbedUtils.uint6ToB64(nUint24 >>> 12 & 63), EmbedUtils.uint6ToB64(nUint24 >>> 6 & 63), EmbedUtils.uint6ToB64(nUint24 & 63));
                    nUint24 = 0;
                }
            }
            return sB64Enc.replace(/A(?=A$|$)/g, "=");
        };
        EmbedUtils.readBinary = function (data, file) {
            file.content = EmbedUtils.extractBuffer(data, file.start, file.length);
        };
        EmbedUtils.readUTF8 = function (data, file) {
            file.content = EmbedUtils.UTF8ArrayToString(EmbedUtils.extractBuffer(data, file.start, file.length));
        };
        EmbedUtils.extractBuffer = function (src, offset, length) {
            var dstU8 = new Uint8Array(length);
            var srcU8 = new Uint8Array(src, offset, length);
            dstU8.set(srcU8);
            return dstU8;
        };
        EmbedUtils.unpack = function (key, data, diskMapObject) {
            EmbedUtils.decompressFormat[diskMapObject[key].format](data, diskMapObject[key]);
        };
        EmbedUtils.PJWHash = function (str) {
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
        EmbedUtils.MAP = {};
        EmbedUtils.decompressFormat = (function () {
            var decompressFormat = {};
            decompressFormat[EmbedType.utf8] = EmbedUtils.readUTF8;
            decompressFormat[EmbedType.binary] = EmbedUtils.readBinary;
            return decompressFormat;
        })();
        EmbedUtils.assingProperties = [];
        return EmbedUtils;
    })();
    xp.EmbedUtils = EmbedUtils;
    var supportsBlob = ("URL" in window || "webkitURL" in window) && ("Blob" in window || "BlobBuilder" in window || "WebKitBlobBuilder" in window || "MozBlobBuilder" in window);
    var URL = window['URL'] || window['webkitURL'];
})(xp || (xp = {}));
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="ts-embed.ts" /> 
