///<reference path="typings/es6-promise/es6-promise.d.ts"/>

module tsembed {

	/**
	 * Types of internal data storage formats
	 */
	export enum EmbedFormat
	{
		binary,
		utf8
	}


	/**
	 * Representation of file descriptor
	 */
	export interface IEmbedAsset {
		format:EmbedFormat;
		mime:string;
		start:number;
		length:number;
		content?:string | Uint8Array;
		symbol?:string;
	}

	/**
	 * The EmbedDisk interface contains a ( key,value ) pair of IEmbedFiles representing the available file assets.
	 * IEmbedFiles are indexed by the PJWHash of the IEmbedAsset original source path.
	 *
	 */
	export interface EmbedDisk {
		[key:string]:IEmbedAsset;
	}


	/**
	 * The avaliable options provided to the @embed decorator
	 */
	export interface IEmbedOptions {
		src:string;
		format?:EmbedFormat;
		as?:IEmbedExtractor;
		symbol?:string;
		mime?:string;
		path?:string; /*node only*/
	}

	/**
	 * A method that gets the internal data representation from a file
	 */
	export interface IEmbedExtractor {
		( file:IEmbedAsset ):any;
	}

	/**
	 * Represents a Pending Assignment
	 * Pending Assignments will be processed every time a new EmbedLibrary is loaded
	 * or after any script injection that may contain new Pending Assignments
	 */
	export interface IEmbedPendingAssignment {
		params:IEmbedOptions;
		proto:any;
		propertyName:string;
		done?:boolean;
	}


	/**
	 * The @embed decorator gets the specified source asset file from an ts-embed library and assigns it to the decorated property.
	 * @param embedParams
	 * @returns {function(any, string): void}
	 */
	export function embed( embedParams:tsembed.IEmbedOptions ):PropertyDecorator {
		return ( proto:any, propertyName:string ) => {
			EmbedCore.addPendingAsignment(embedParams, proto, propertyName);
		}
	}


	/**
	 * The EmbedLoader lets us load an ts-embed library
	 */
	export class EmbedLoader {

		public url:string;
		private _xhr:XMLHttpRequest;
		private _resolve:any;
		private _reject:any;
		private _promise:Promise<EmbedDisk>;
		private _embedDiskMap:EmbedDisk;

		/**
		 * Loads an ts-embed library from the provided url
		 * Returns a Promise that resolves to an EmbedDisk
		 * @param url
		 * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
		 */
		public load( url:string ):Promise<EmbedDisk> {

			return this._promise || ( this._promise = new Promise(( resolve, reject )=> {
					this._resolve = resolve;
					this._reject = reject;
					this.url = url;
					var req = this._xhr = new XMLHttpRequest();
					var onload = ()=> {
						req.removeEventListener('load', onload, false);
						this._loaded();
					};
					req.open('GET', url);
					req.responseType = 'arraybuffer';
					req.addEventListener('load', onload, false);
					req.send();
				}) );

		}

		/**
		 * Loads an ts-embed library from the provided ArrayBuffer
		 * Returns a Promise that resolves to an EmbedDisk
		 * @param buffer
		 * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
		 */
		public loadFromArrayBuffer( buffer:ArrayBuffer ):Promise<EmbedDisk> {
			return this._promise || ( this._promise = new Promise(( resolve, reject )=> {
					var result = EmbedCore.processFile(buffer);
					this._embedDiskMap = result.map;
					resolve(result.embedMap);
				}) );
		}

		/**
		 * @private
		 */
		private _loaded():void {
			if (this._xhr.status == 200) {
				var result:{ embedMap:EmbedDisk; map:EmbedDisk } = EmbedCore.processFile(this._xhr.response);
				this._embedDiskMap = result.map;
				this._resolve(result.embedMap);

			}
			else {
				this._reject(this._xhr.statusText);
			}
			//this._xhr = null;
		}

	}


	/**
	 * The EmbedType module contains basic IEmbedExtractor functions used in the @embed decorator
	 */
	export module EmbedType {

		/**
		 * Returns an HTMLImageElement from the specified file
		 * @param file
		 * @returns {HTMLImageElement}
		 */
		export function image( file:IEmbedAsset ):HTMLImageElement {

			var img = dce<HTMLImageElement>('img');
			img.src = EmbedCore.createObjectURL(file);
			return img;
		}

		/**
		 * Returns an HTMLScriptElement from the specified file
		 * Scripts that contains @embed decorators must be injected with the EmbedCore.injectScript method
		 * @param file
		 * @returns {HTMLScriptElement}
		 */
		export function script( file:IEmbedAsset ):HTMLScriptElement {

			var script = dce<HTMLScriptElement>('script');
			var onload = ()=> {
				script.removeEventListener('load', onload);
				EmbedCore.processPendingAssignments();
			}
			script.addEventListener('load', onload, false);

			script.src = EmbedCore.createObjectURL(file);
			return script;
		}

		/**
		 * Returns an HTMLStyleElement from the specified file
		 * @param file
		 * @returns {HTMLStyleElement}
		 */
		export function style( file:IEmbedAsset ):HTMLStyleElement {

			var style = dce<HTMLStyleElement>('style');
			style.type = 'text/css';
			style.appendChild(document.createTextNode(<string>file.content));
			return style;
		}

		/**
		 * Returns an HTMLSourceElement from the specified file
		 * @param file
		 * @returns {HTMLSourceElement}
		 */
		export function source( file:IEmbedAsset ):HTMLSourceElement {

			var source = dce<HTMLSourceElement>("source");
			source.type = file.mime;
			source.src = EmbedCore.createObjectURL(file);
			return source;
		}

		/**
		 * Returns an URL.createObjectURL from the specified file
		 * @param file
		 * @returns {string}
		 */
		export function objectURL( file:IEmbedAsset ):string {
			return EmbedCore.createObjectURL(file);
		}
	}

	export class EmbedUtils {

		/**
		 * Injects the specified HTMLScriptElement into
		 * @param element
		 * @returns {Promise<T>|Promise}
		 */
		public static injectScript( element:HTMLScriptElement ):Promise<HTMLScriptElement> {
			return new Promise(( resolve, reject )=> {

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
			})
		}

		/**
		 * Creates a new image from the provided objectURL
		 * @param dataURL dddd
		 * @param revoke
		 * @returns {*}
		 */
		public static imageFromObjectURL( objectURL:string ):HTMLImageElement {
			var img = dce<HTMLImageElement>('img');
			img.onload = ()=> {
				EmbedCore.revokeObjectURL(objectURL);
			}
			img.src = objectURL;
			return img;
		}

		/**
		 * Gets the IEmbedAsset for the provided symbol
		 * @param src
		 * @returns {IEmbedDiskFile}
		 */
		public static getSymbol( symbol:string ):IEmbedAsset {
			return EmbedCore.MAP[Object.keys(EmbedCore.MAP).filter(( key:any )=> {
					return EmbedCore.MAP[key].symbol == symbol;
				})[0]] || null;
		}

		/**
		 * Gets the symbol param from the lib and returns it extracted with the as IEmbedExtractor param
		 * @param symbol
		 * @param as
		 * @returns {any}
		 */
		public static getSymbolAs( symbol:string, as:IEmbedExtractor ):any {
			return as(EmbedUtils.getSymbol(symbol));
		}

		/**
		 * Gets the IEmbedAsset for the provided asset src file
		 * @param src
		 * @returns {IEmbedDiskFile}
		 */
		public static getAsset( src:string ):IEmbedAsset {
			return EmbedCore.MAP[EmbedCore.PJWHash(src)]
		}
	}

	/**
	 * Internal utility classes
	 */
	class EmbedCore {
		/**
		 * Revokes if possible the provided blob object url and returns it
		 * @param target
		 */
		public static revokeObjectURL( target:string ):void {
			if (target.indexOf('blob:') == 0) {
				EmbedCore.URL.revokeObjectURL(target);
			}

		}

		/**
		 * Revokes if possible the provided blob target source and returns it
		 * @param target
		 */
		public static revokeURL( target:any ):any {
			if (target.src && target.src.indexOf('blob:') == 0) {
				target.onload = ()=> {
					EmbedCore.URL.revokeObjectURL(target.src);
				}
			}
			return target;
		}

		/**
		 * Generates a valid image/script src dataURL | Blob source
		 * @param file
		 * @returns {string}
		 */
		public static createObjectURL( file:IEmbedAsset ):string {

			if (EmbedCore.URL) {
				return EmbedCore.URL.createObjectURL(EmbedCore.getBlobContent(file))
			}
			else {
				return EmbedCore.getBase64Memoized(file);
			}
		}

		public static getBase64( file:IEmbedAsset ):string {
			var b64:string = typeof file.content === "string" ? window.btoa(<string>file.content) : base64EncArr(<Uint8Array>file.content);
			return `data:${file.mime};base64,${b64}`;
		}

		public static getBase64Memoized = memoize<string>(EmbedCore.getBase64);

		/**
		 * Gets a blob for the provided EmbedType File
		 * @param file
		 * @returns {any}
		 */
		public static getBlobContent( file:IEmbedAsset ):Blob {
			var blobContent:any = file.content;
			var blobResult:any;
			var BB = "BlobBuilder";
			try {

				blobResult = new Blob(
					[typeof blobContent === "string" ? blobContent : <Uint8Array>blobContent.buffer],
					{type: file.mime});
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
					bb.append(typeof blobContent === "string" ? [blobContent] : <Uint8Array>blobContent.buffer);
					blobResult = bb.getBlob(file.mime);
					return blobResult
				}
				else if (e.name == "InvalidStateError") {
					// InvalidStateError FF13 WinXP
					blobResult = new Blob(
						[typeof blobContent === "string" ? blobContent : <Uint8Array>blobContent.buffer],
						{type: file.mime}
					);
					return blobResult
				}
			}
			return null;
		}

		/**
		 * Used internally by the @embed decorator
		 * Stores pending dynamic/static properties initialization
		 * @param embedParams
		 * @param proto
		 * @param propertyName
		 */
		public static addPendingAsignment( embedParams:IEmbedOptions, proto:any, propertyName:string ) {
			EmbedCore.pendingAssignments.push({
				params: embedParams,
				proto: proto,
				propertyName: propertyName,
				done: false
			});
		}

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
		public static processFile( data:ArrayBuffer ):{ embedMap:EmbedDisk; map:EmbedDisk } {

			// read head size getUint32
			var u8 = new Uint8Array(data);
			var b0 = u8[0], b1 = u8[1], b2 = u8[2], b3 = u8[3];
			var diskMapSize = (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;

			var diskMapBytes = this.extractBuffer(data, 4, diskMapSize);
			var jsonMapObject = EmbedCore.UTF8ArrayToString(diskMapBytes);
			var diskMapObject:EmbedDisk = JSON.parse(jsonMapObject);
			var originalDiskMapObject:EmbedDisk = JSON.parse(jsonMapObject);
			var files = Object.keys(diskMapObject);
			files.forEach(( key )=> {
				diskMapObject[key].start += (diskMapSize + 4);
				EmbedCore.unpack(data, diskMapObject[key]);
				EmbedCore.MAP[key] = diskMapObject[key];
			});

			EmbedCore.processPendingAssignments();
			return {
				embedMap: diskMapObject,
				map: originalDiskMapObject
			};
		}

		/**
		 * Processes all pending assignments,getting its value from the file contents or from the "IEmbedMeta.as" provided parameter .
		 */
		static processPendingAssignments() {

			EmbedCore.pendingAssignments.filter(( decParam:IEmbedPendingAssignment )=> {
				return decParam.done == false;
			}).forEach(( decParam:IEmbedPendingAssignment )=> {
				decParam.done = true;
				var file:IEmbedAsset = EmbedUtils.getAsset(decParam.params.src);
				decParam.proto[decParam.propertyName] = decParam.params.as ?
					EmbedCore.revokeURL(decParam.params.as(file)) : file.content;
			});
		}

		/* Conversion utils */

		/**
		 * UTF8ArrayToString
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

		public static MAP:EmbedDisk = {};
		public static decompressFormat:any = (()=> {
			var decompressFormat = {};
			decompressFormat[EmbedFormat.utf8] = EmbedCore.readUTF8;
			decompressFormat[EmbedFormat.binary] = EmbedCore.readBinary;
			return decompressFormat;
		})();
		public static pendingAssignments:IEmbedPendingAssignment[] = [];

		/**
		 * reads an embed file as a Uint8Array
		 * @param data
		 * @param file
		 */
		public static readBinary( data:ArrayBuffer, file:IEmbedAsset ):void {
			file.content = EmbedCore.extractBuffer(data, file.start, file.length);
		}

		/**
		 * reads an embed file as a UTF8
		 * @param data
		 * @param file
		 */
		public static readUTF8( data:ArrayBuffer, file:IEmbedAsset ):void {
			file.content = EmbedCore.UTF8ArrayToString(EmbedCore.extractBuffer(data, file.start, file.length));

		}

		/**
		 * Extracts a Uint8Array buffer from ArrayBuffer
		 * @param src
		 * @param offset
		 * @param length
		 * @returns {Uint8Array}
		 */
		public static extractBuffer( src:ArrayBuffer, offset, length ):Uint8Array {
			return new Uint8Array(src.slice(offset, length + offset));
		}

		/**
		 * Unpacks the file from the ArrayBuffer
		 * @param key
		 * @param data
		 * @param diskMapObject
		 */
		public static unpack( data:ArrayBuffer, file:IEmbedAsset ) {
			EmbedCore.decompressFormat[file.format](data, file);
		}

		/**
		 * simple hash algorithm
		 * @param str
		 * @returns {number}
		 * @constructor
		 */
		public static PJWHash( str:string ):number {
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

		public static  URL:any = window['URL'] || window['webkitURL'] || null;
	}


	function dce<T>( tagName:string ):T {
		return <T><any>document.createElement(tagName);
	}


	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
	 * @param nUint6
	 * @returns {number}
	 */
	function uint6ToB64( nUint6:number ):number {

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
	function base64EncArr( aBytes:Uint8Array ):string {

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
	function memoize<T>( fn ) {
		return function ( ...args ):T {
			var /*args = Array.prototype.slice.call(arguments),*/
				hash = "",
				i = args.length;
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
}





