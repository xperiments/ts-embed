/// <reference path="../src/typings/es6-promise/es6-promise.d.ts" />
declare module xp {
    enum EmbedType {
        binary = 0,
        utf8 = 1,
    }
    interface IEmbedFile {
        format: EmbedType;
        mime: string;
        start: number;
        length: number;
        content?: string | Uint8Array;
        symbol?: string;
    }
    interface EmbedDisk {
        [key: string]: IEmbedFile;
    }
    interface IEmbedMeta {
        src: string;
        format?: xp.EmbedType;
        as?: IEmbedExtractor;
        symbol?: string;
        mime?: string;
        path?: string;
    }
    interface IEmbedExtractor {
        (file: IEmbedFile): any;
    }
    interface IEmbedDecorator {
        params: IEmbedMeta;
        proto: any;
        propertyName: string;
        done?: boolean;
    }
    interface IPendingDOMInjection {
        target: HTMLElement;
        source: HTMLElement;
    }
    function embed(embedParams: xp.IEmbedMeta): PropertyDecorator;
    class EmbedLoader {
        url: string;
        private _xhr;
        private _resolve;
        private _reject;
        private _promise;
        private _embedDiskMap;
        load(url: string): Promise<EmbedDisk>;
        loadFromArrayBuffer(buffer: ArrayBuffer): Promise<EmbedDisk>;
        private _loaded();
        removeEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
        addEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
        dispatchEvent(evt: Event): boolean;
    }
    module Embed {
        function image(file: IEmbedFile): HTMLImageElement;
        function dataURL(file: IEmbedFile): string;
        function script(file: IEmbedFile): HTMLScriptElement;
        function style(file: IEmbedFile): HTMLStyleElement;
        function source(file: IEmbedFile): HTMLSourceElement;
    }
    class EmbedUtils {
        static injectScript(element: HTMLScriptElement): Promise<HTMLScriptElement>;
        static imageFromDataURL(dataURL: string, revoke?: boolean): HTMLImageElement;
        static revokeURL(target: any): any;
        static getURLFrom(file: IEmbedFile): string;
        static getBlob(file: IEmbedFile): Blob;
        static getFile(src: string): IEmbedFile;
        static getSymbol(symbol: string): IEmbedFile;
        static getSymbolAs(symbol: string, as: IEmbedExtractor): any;
        static addPendingAsignment(embedParams: IEmbedMeta, proto: any, propertyName: string): void;
        static processFile(data: ArrayBuffer): {
            embedMap: EmbedDisk;
            map: EmbedDisk;
        };
        static processPendingAssignments(): void;
        static UTF8ArrayToString(array: Uint8Array): string;
        private static uint6ToB64(nUint6);
        static Uint8ArrayToBase64(aBytes: Uint8Array): string;
        protected static MAP: EmbedDisk;
        protected static decompressFormat: any;
        protected static pendingAssignments: IEmbedDecorator[];
        protected static readBinary(data: ArrayBuffer, file: IEmbedFile): void;
        protected static readUTF8(data: ArrayBuffer, file: IEmbedFile): void;
        protected static extractBuffer(src: ArrayBuffer, offset: any, length: any): Uint8Array;
        protected static unpack(data: ArrayBuffer, file: IEmbedFile): void;
        protected static PJWHash(str: string): number;
    }
}
