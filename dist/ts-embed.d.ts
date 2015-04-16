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
    interface IEmbedOptions {
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
    interface IEmbedPendingAssignment {
        params: IEmbedOptions;
        proto: any;
        propertyName: string;
        done?: boolean;
    }
    function embed(embedParams: xp.IEmbedOptions): PropertyDecorator;
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
    }
    module EmbedType {
        function image(file: IEmbedFile): HTMLImageElement;
        function script(file: IEmbedFile): HTMLScriptElement;
        function style(file: IEmbedFile): HTMLStyleElement;
        function source(file: IEmbedFile): HTMLSourceElement;
        function objectURL(file: IEmbedFile): string;
    }
    class EmbedUtils {
        static injectScript(element: HTMLScriptElement): Promise<HTMLScriptElement>;
        static imageFromDataURL(dataURL: string, revoke?: boolean): HTMLImageElement;
        static getSymbol(symbol: string): IEmbedFile;
        static getSymbolAs(symbol: string, as: IEmbedExtractor): any;
        static getFile(src: string): IEmbedFile;
    }
}
