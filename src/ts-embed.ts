/**
 * ts-embed.ts
 * Created by xperiments on 30/03/15.
 */
///<reference path="reference.ts"/>

module xp {

	/**
	 * Types of internal data storage formats
	 */
	export enum EmbedType
	{
		binary,
		utf8
	}


	/**
	 * Internal storage representation of a file
	 */
	export interface IEmbedFile {
		format:EmbedType;
		mime:string;
		start:number;
		length:number;
		content?:string | Uint8Array;
		symbol?:string;
	}

	export interface EmbedDisk {
		[key:string]:IEmbedFile;
	}


	export interface IEmbedMeta {
		src:string;
		format?:xp.EmbedType;
		as?:IEmbedExtractor;
		symbol?:string;
		path?:string; /*node only*/
	}

	/**
	 * A method that gets the internal data representation from a file
	 */
	export interface IEmbedExtractor {
		( file:IEmbedFile ):any;
	}
	export interface IEmbedDecorator {
		params:IEmbedMeta;
		proto:any;
		propertyName:string;
		done?:boolean;
	}

	export class EmbedLoader {

		public url:string;
		private _xhr:XMLHttpRequest = new XMLHttpRequest();
		private _resolve:any;
		private _reject:any;
		private _promise:Promise<EmbedDisk>;
		private _embedDiskMap:EmbedDisk;

		/**
		 *
		 * @param url
		 * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
		 */
		public load( url:string ):Promise<EmbedDisk> {

			return this._promise || ( this._promise = new Promise(( resolve, reject )=> {
					this._resolve = resolve;
					this._reject = reject;
					this.url = url;
					var req = this._xhr;
					var loadBind = ()=> {
						req.removeEventListener('load', loadBind, false);
						req.removeEventListener('progress', loadBind, false);
						this._loaded();
					};
					req.responseType = 'arraybuffer';
					req.addEventListener('load', loadBind, false);
					req.open('GET', url);
					req.send();
				}) );

		}

		public loadFromArrayBuffer( buffer:ArrayBuffer ):Promise<EmbedDisk> {
			return this._promise || ( this._promise = new Promise(( resolve, reject )=> {
					var result = EmbedUtils.processFile(buffer);
					this._embedDiskMap = result.map;
					resolve(result.embedMap);
				}) );
		}

		private _loaded():void {
			if (this._xhr.status == 200) {
				var result:{ embedMap:EmbedDisk; map:EmbedDisk } = EmbedUtils.processFile(this._xhr.response);
				this._embedDiskMap = result.map;
				this._resolve(result.embedMap);
			}
			else {
				this._reject(this._xhr.statusText);
			}
		}

		public removeEventListener( type:string, listener:EventListener, useCapture?:boolean ):void {
			this._xhr.removeEventListener(type, listener, useCapture);
		}

		public addEventListener( type:string, listener:EventListener, useCapture?:boolean ):void {
			this._xhr.addEventListener(type, listener, useCapture);
		}

		public dispatchEvent( evt:Event ):boolean {
			return this._xhr.dispatchEvent(evt);
		}
	}

	export module Embed {

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		export function HTMLImageElement( file:IEmbedFile ):HTMLImageElement {

			var img = document.createElement('img');
			img.src = EmbedUtils.getURLFrom(file);
			return img;
		}

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		export function HTMLScriptElement( file:IEmbedFile ):HTMLScriptElement {

			var script = document.createElement('script');
			script.src = EmbedUtils.getURLFrom(file);
			return script;
		}

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		export function HTMLStyleElement( file:IEmbedFile ):HTMLStyleElement {

			var s = document.createElement('style');
			s.type = 'text/css';
			s.appendChild(document.createTextNode(<string>file.content));
			return s;
		}


		/**
		 *
		 * @param params
		 * @returns {HTMLSourceElement}
		 * @constructor
		 */
		export function HTMLSourceElement( file:IEmbedFile ):HTMLSourceElement {

			var source = <HTMLSourceElement>document.createElement("source");
			source.type = file.mime;
			source.src = EmbedUtils.getURLFrom(file);
			return source;
		}


	}

	export class EmbedUtils {
		/**
		 *
		 * @param target
		 */
		public static revokeURL( target:any ):any {
			if (target.src && target.src.indexOf('blob:') > -1) {
				target.onload = ()=> {
					URL.revokeObjectURL(target.src);
				}
			}
			return target;
		}

		/**
		 *
		 * @param file
		 * @returns {string}
		 */
		public static getURLFrom( file:IEmbedFile ):string {
			if (supportsBlob) {
				return URL.createObjectURL(EmbedUtils.getBlob(file));
			}
			return "data:" + file.mime + ";base64," + ( typeof file.content === "string" ? window.btoa(<string>file.content) : EmbedUtils.Uint8ArrayToBase64(<Uint8Array>file.content) );
		}


		/**
		 *
		 * @param file
		 * @returns {any}
		 */
		public static getBlob( file:IEmbedFile ):Blob {
			var blobContent:any = file.content;
			var blobResult:any;
			var BBN = "BlobBuilder";
			try {
				blobResult = new Blob(
					blobContent instanceof String ? blobContent : [<Uint8Array>blobContent.buffer],
					{type: file.mime}
				);
				return blobResult;
			}
			catch (e) {
				// TypeError old chrome and FF
				window[BBN] = window[BBN]
				|| window['WebKit' + BBN]
				|| window['Moz' + BBN]
				|| window['MS' + BBN];
				if (e.name == 'TypeError' && window[BBN]) {
					var bb = new window[BBN]();
					bb.append(blobContent instanceof String ? blobContent : [blobContent.buffer]);
					blobResult = bb.getBlob(file.mime);
					return blobResult
				}
				else if (e.name == "InvalidStateError") {
					// InvalidStateError FF13 WinXP
					blobResult = new Blob(blobContent instanceof String ? blobContent : [blobContent.buffer], {type: file.mime});
					return blobResult
				}

			}
			return null;
		}

		/**
		 *
		 * @param src
		 * @returns {IEmbedDiskFile}
		 */
		public static getFile( src:string ):IEmbedFile {
			return EmbedUtils.MAP[EmbedUtils.PJWHash(src)]
		}

		/**
		 *
		 * @param src
		 * @returns {IEmbedDiskFile}
		 */
		public static getSymbol( symbol:string ):IEmbedFile {
			return EmbedUtils.MAP[Object.keys(EmbedUtils.MAP).filter(( key:any )=> {
					return EmbedUtils.MAP[key].symbol == symbol;
				})[0]] || null;
		}

		/**
		 *
		 * @param src
		 * @returns {IEmbedDiskFile}
		 */
		public static getSymbolAs( symbol:string, as:IEmbedExtractor ) {
			return as( EmbedUtils.getSymbol( symbol ) );
		}
		/**
		 *
		 * @param embedParams
		 * @param proto
		 * @param propertyName
		 */

		public static process( embedParams:IEmbedMeta, proto:any, propertyName:string ) {
			EmbedUtils.assingProperties.push({
				params: embedParams,
				proto: proto,
				propertyName: propertyName,
				done: false
			});
		}

		/**
		 *
		 * @param data
		 * @returns {EmbedDisk}
		 */

		public static processFile( data:ArrayBuffer ):{ embedMap:EmbedDisk; map:EmbedDisk } {

			var view = new DataView(data);
			var diskMapSize = view.getUint32(0);
			var diskMapBytes = this.extractBuffer(data, 4, diskMapSize);
			var jsonMapObject = EmbedUtils.UTF8ArrayToString(diskMapBytes);
			var diskMapObject:EmbedDisk = JSON.parse(jsonMapObject);
			var originalDiskMapObject:EmbedDisk = JSON.parse(jsonMapObject);
			var files = Object.keys(diskMapObject);
			files.forEach(( key )=> {
				diskMapObject[key].start += (diskMapSize + 4);
				EmbedUtils.unpack(key, data, diskMapObject);
				EmbedUtils.MAP[key] = diskMapObject[key];
			});

			EmbedUtils.assingProperties.filter(( decParam:IEmbedDecorator )=> {
				return decParam.done == false;
			}).forEach(( decParam:IEmbedDecorator )=> {
				var file:IEmbedFile = EmbedUtils.getFile(decParam.params.src);
				decParam.proto[decParam.propertyName] = decParam.params.as ?
					EmbedUtils.revokeURL(decParam.params.as(file)) : file.content;
				decParam.done = true;

			});
			return {
				embedMap: diskMapObject,
				map: originalDiskMapObject
			};
		}

		/* Conversion utils */

		/**
		 *
		 * @param array
		 * @returns {string}
		 * @constructor
		 */
		public static UTF8ArrayToString( array:Uint8Array ):string {
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
		}

		/* UInt8Array to base64 */


		/* Base64 string to array encoding */
		private static uint6ToB64( nUint6:number ):number {

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
		 * UInt8Array to base64
		 * @param aBytes
		 * @returns {string}
		 * @constructor
		 */
		public static Uint8ArrayToBase64( aBytes:Uint8Array ):string {

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

		}

		protected static MAP:EmbedDisk = {};
		protected static decompressFormat:any = (()=> {
			var decompressFormat = {};
			decompressFormat[EmbedType.utf8] = EmbedUtils.readUTF8;
			decompressFormat[EmbedType.binary] = EmbedUtils.readBinary;
			return decompressFormat;
		})();
		protected static assingProperties:IEmbedDecorator[] = [];

		/**
		 *
		 * @param data
		 * @param file
		 */
		protected static readBinary( data:ArrayBuffer, file:IEmbedFile ):void {
			file.content = EmbedUtils.extractBuffer(data, file.start, file.length);
		}

		/**
		 *
		 * @param data
		 * @param file
		 */
		protected static readUTF8( data:ArrayBuffer, file:IEmbedFile ):void {
			file.content = EmbedUtils.UTF8ArrayToString(EmbedUtils.extractBuffer(data, file.start, file.length));
		}

		/**
		 *
		 * @param src
		 * @param offset
		 * @param length
		 * @returns {Uint8Array}
		 */
		protected static extractBuffer( src:ArrayBuffer, offset, length ):Uint8Array {
			var dstU8 = new Uint8Array(length);
			var srcU8 = new Uint8Array(src, offset, length);
			dstU8.set(srcU8);
			return dstU8;

		}

		/**
		 *
		 * @param key
		 * @param data
		 * @param diskMapObject
		 */
		protected static unpack( key:string, data:ArrayBuffer, diskMapObject:EmbedDisk ) {
			EmbedUtils.decompressFormat[diskMapObject[key].format](data, diskMapObject[key]);
		}


		/* method 4 hash source file */
		/**
		 *
		 * @param str
		 * @returns {number}
		 * @constructor
		 */

		protected static PJWHash( str:string ):number {
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
		}

	}

	/**
	 *
	 * @param embedParams
	 * @returns {function(any, string): void}
	 */

	export function embed( embedParams:xp.IEmbedMeta ):PropertyDecorator {
		return function ( proto:any, propertyName:string ):void {
			xp.EmbedUtils.process(embedParams, proto, propertyName);
		}
	}

	/* INTERNAL */
	var supportsBlob:boolean = ("URL" in window || "webkitURL" in window) && ( "Blob" in window || "BlobBuilder" in window || "WebKitBlobBuilder" in window || "MozBlobBuilder" in window);
	var URL:any = window['URL'] || window['webkitURL'];
}





