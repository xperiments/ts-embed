/**
 * ts-embed.ts
 * Created by xperiments on 30/03/15.
 */
///<reference path="./typings/es6-promise/es6-promise.d.ts"/>

module ts {


	export interface EmbedDiskMap { [key:string]:EmbedDiskFile }
	export interface EmbedDiskFile {
		format:string;
		mime:string;
		start:number;
		length:number;
		content:string | Uint8Array;
	}

	export enum EmbedDecompressor
	{
		binary,
		utf8,
		ascii
	}


	export class EmbedLoader {

		@embed({src:'pepe'})
		private url:string;
		private _xhr:XMLHttpRequest;
		private _loadBind:any = this._onLoad.bind(this);
		private _resolve:any;
		private _reject:any;
		private _promise:Promise<EmbedDiskMap>;

		/**
		 *
		 * @param url
		 * @returns {Promise<EmbedDiskMap>|Promise<T>|Promise}
		 */
		public load(url:string):Promise<EmbedDiskMap> {
			
			return this._promise || ( this._promise = new Promise((resolve, reject)=> {
				this._resolve = resolve;
				this._reject = reject;
				this.url = url;
				var req = this._xhr = new XMLHttpRequest();
				req.responseType = 'arraybuffer';
				req.addEventListener('load', this._loadBind);
				req.open('GET', url);
				req.send();
			}) );

		}

		private _onLoad():void {
			if (this._xhr.status == 200) {
				this._resolve(EmbedUtils.processFile(this._xhr.response));
			}
			else {
				this._reject(this._xhr.statusText);
			}
		}
	}
	
	export class Embed {

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		public static HTMLImageElement(params:IEmbedParams):any {

			var img = document.createElement('img');
			img.src = Embed.getDataURL(EmbedUtils.getFile(params.src));
			return img;
		}

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		public static HTMLScriptElement(params:IEmbedParams):any {

			var script = document.createElement('script');
			script.src = Embed.getDataURL(EmbedUtils.getFile(params.src));
			return script;
		}

		/**
		 *
		 * @param params
		 * @returns {*}
		 * @constructor
		 */
		public static HTMLStyleElement(params:IEmbedParams):any {

			var s = document.createElement('style');
			s.type = 'text/css';
			s.appendChild(document.createTextNode(<string>EmbedUtils.getFile(params.src).content));
			return s;
		}

		/**
		 *
		 * @param file
		 * @returns {string}
		 */
		private static getDataURL(file:EmbedDiskFile):string {
			return "data:" + file.mime + ";base64," + ( typeof file.content === "string" ? window.btoa(<string>file.content) : EmbedUtils.Uint8ArrayToBase64(<Uint8Array>file.content) );
		}
	}
	
	export class EmbedUtils {


		/**
		 *
		 * @param src
		 * @returns {EmbedDiskFile}
		 */
		public static getFile(src:string):EmbedDiskFile {
			return EmbedUtils.MAP[EmbedUtils.PJWHash(src)]
		}

		/**
		 *
		 * @param embedParams
		 * @param proto
		 * @param propertyName
		 */
		public static assign(embedParams:IEmbedParams, proto:any, propertyName:string) {
			EmbedUtils.assingProperties.push({
				params: embedParams,
				proto: proto,
				propertyName: propertyName,
				processed: false
			});
		}

		/**
		 *
		 * @param data
		 * @returns {EmbedDiskMap}
		 */
		public static processFile(data:ArrayBuffer):EmbedDiskMap {

			var view = new DataView(data);
			var diskMapSize = view.getUint32(0);
			var diskMapBytes = this.extractBuffer(data, 4, diskMapSize);
			var diskMapObject:EmbedDiskMap = JSON.parse(EmbedUtils.UTF8ArrayToString(diskMapBytes));
			var files = Object.keys(diskMapObject);
			files.forEach((key)=> {
				diskMapObject[key].start += (diskMapSize + 4);
			});
			files.forEach((key)=> {
				EmbedUtils.unpack(key, data, diskMapObject);
			});

			for (var file in diskMapObject) {
				EmbedUtils.MAP[file] = diskMapObject[file];
			}

			EmbedUtils.assingProperties.forEach((decParam:IEmbedDecoratorParams)=> {
				if (!decParam.processed) {
					decParam.proto[decParam.propertyName] = decParam.params.as ?
						decParam.params.as(decParam.params) :
						decParam.proto[decParam.propertyName] = EmbedUtils.MAP[EmbedUtils.PJWHash(decParam.params.src)].content;
					decParam.processed = true;
				}
			});
			return diskMapObject;
		}

		/* Conversion utils */

		/**
		 *
		 * @param array
		 * @returns {string}
		 * @constructor
		 */
		public static UTF8ArrayToString(array:Uint8Array):string {
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

		/**
		 *
		 * @param aBytes
		 * @returns {string}
		 * @constructor
		 */
		public static Uint8ArrayToBase64(aBytes:Uint8Array):string {
			return window.btoa(String.fromCharCode.apply(null, aBytes))
		}


		protected static MAP:EmbedDiskMap = {};
		protected static decompressFormat:any = (()=> {
			var decompressFormat = {};
			decompressFormat[EmbedDecompressor.ascii] = EmbedUtils.readAscii;
			decompressFormat[EmbedDecompressor.utf8] = EmbedUtils.readUTF8;
			decompressFormat[EmbedDecompressor.binary] = EmbedUtils.readBinary;
			;
			return decompressFormat;
		})();
		protected static assingProperties:IEmbedDecoratorParams[] = [];

		/**
		 *
		 * @param data
		 * @param file
		 */
		protected static readAscii(data:ArrayBuffer, file:EmbedDiskFile):void {
		}

		/**
		 *
		 * @param data
		 * @param file
		 */
		protected static readBinary(data:ArrayBuffer, file:EmbedDiskFile):void {
			file.content = EmbedUtils.extractBuffer(data, file.start, file.length);
		}

		/**
		 *
		 * @param data
		 * @param file
		 */
		protected static readUTF8(data:ArrayBuffer, file:EmbedDiskFile):void {
			file.content = EmbedUtils.UTF8ArrayToString(EmbedUtils.extractBuffer(data, file.start, file.length));
		}

		/**
		 *
		 * @param src
		 * @param offset
		 * @param length
		 * @returns {Uint8Array}
		 */
		protected static extractBuffer(src:ArrayBuffer, offset, length):Uint8Array {
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
		protected static unpack(key:string, data:ArrayBuffer, diskMapObject:EmbedDiskMap) {
			var file = diskMapObject[key];
			EmbedUtils.decompressFormat[file.format](data, diskMapObject[key]);
		}


		/* method 4 hash source file */
		/**
		 *
		 * @param str
		 * @returns {number}
		 * @constructor
		 */
		protected static PJWHash(str:string):number {
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


}

interface IEmbedDecompressor { (params:IEmbedParams):any; }
interface IEmbedParams { src:string; as?:IEmbedDecompressor; }
interface IEmbedDecoratorParams {
	params:IEmbedParams;
	proto:any;
	propertyName:string;
	processed:boolean;
}

/**
 *
 * @param embedParams
 * @returns {function(any, string): undefined}
 */
function embed(embedParams:IEmbedParams):PropertyDecorator {
	return function (proto:any, propertyName:string) {
		ts.EmbedUtils.assign(embedParams, proto, propertyName);
	}
}





