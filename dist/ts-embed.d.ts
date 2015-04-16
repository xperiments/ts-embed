/// <reference path="../src/typings/es6-promise/es6-promise.d.ts" />
declare module tsembed {
    /**
     * Types of internal data storage formats
     */
    enum EmbedType {
        binary = 0,
        utf8 = 1,
    }
    /**
     * Representation of file descriptor
     */
    interface IEmbedAsset {
        format: EmbedType;
        mime: string;
        start: number;
        length: number;
        content?: string | Uint8Array;
        symbol?: string;
    }
    /**
     * The EmbedDisk interface contains a ( key,value ) pair of IEmbedFiles representing the available file assets.
     * IEmbedFiles are indexed by the PJWHash of the IEmbedAsset original source path.
     *
     */
    interface EmbedDisk {
        [key: string]: IEmbedAsset;
    }
    /**
     * The avaliable options provided to the @embed decorator
     */
    interface IEmbedOptions {
        src: string;
        format?: tsembed.EmbedType;
        as?: IEmbedExtractor;
        symbol?: string;
        mime?: string;
        path?: string;
    }
    /**
     * A method that gets the internal data representation from a file
     */
    interface IEmbedExtractor {
        (file: IEmbedAsset): any;
    }
    /**
     * Represents a Pending Assignment
     * Pending Assignments will be processed every time a new EmbedLibrary is loaded
     * or after any script injection that may contain new Pending Assignments
     */
    interface IEmbedPendingAssignment {
        params: IEmbedOptions;
        proto: any;
        propertyName: string;
        done?: boolean;
    }
    /**
     * The @embed decorator gets the specified source asset file from an ts-embed library and assigns it to the decorated property.
     * @param embedParams
     * @returns {function(any, string): void}
     */
    function embed(embedParams: tsembed.IEmbedOptions): PropertyDecorator;
    /**
     * The EmbedLoader lets us load an ts-embed library
     */
    class EmbedLoader {
        url: string;
        private _xhr;
        private _resolve;
        private _reject;
        private _promise;
        private _embedDiskMap;
        /**
         * Loads an ts-embed library from the provided url
         * Returns a Promise that resolves to an EmbedDisk
         * @param url
         * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
         */
        load(url: string): Promise<EmbedDisk>;
        /**
         * Loads an ts-embed library from the provided ArrayBuffer
         * Returns a Promise that resolves to an EmbedDisk
         * @param buffer
         * @returns {Promise<EmbedDisk>|Promise<T>|Promise}
         */
        loadFromArrayBuffer(buffer: ArrayBuffer): Promise<EmbedDisk>;
        /**
         * @private
         */
        private _loaded();
    }
    /**
     * The EmbedType module contains basic IEmbedExtractor functions used in the @embed decorator
     */
    module EmbedType {
        /**
         * Returns an HTMLImageElement from the specified file
         * @param file
         * @returns {HTMLImageElement}
         */
        function image(file: IEmbedAsset): HTMLImageElement;
        /**
         * Returns an HTMLScriptElement from the specified file
         * Scripts that contains @embed decorators must be injected with the EmbedCore.injectScript method
         * @param file
         * @returns {HTMLScriptElement}
         */
        function script(file: IEmbedAsset): HTMLScriptElement;
        /**
         * Returns an HTMLStyleElement from the specified file
         * @param file
         * @returns {HTMLStyleElement}
         */
        function style(file: IEmbedAsset): HTMLStyleElement;
        /**
         * Returns an HTMLSourceElement from the specified file
         * @param file
         * @returns {HTMLSourceElement}
         */
        function source(file: IEmbedAsset): HTMLSourceElement;
        /**
         * Returns an URL.createObjectURL from the specified file
         * @param file
         * @returns {string}
         */
        function objectURL(file: IEmbedAsset): string;
    }
    class EmbedUtils {
        /**
         * Injects the specified HTMLScriptElement into
         * @param element
         * @returns {Promise<T>|Promise}
         */
        static injectScript(element: HTMLScriptElement): Promise<HTMLScriptElement>;
        /**
         * Creates a new image from the provided objectURL
         * @param dataURL dddd
         * @param revoke
         * @returns {*}
         */
        static imageFromObjectURL(objectURL: string): HTMLImageElement;
        /**
         * Gets the IEmbedAsset for the provided symbol
         * @param src
         * @returns {IEmbedDiskFile}
         */
        static getSymbol(symbol: string): IEmbedAsset;
        /**
         * Gets the symbol param from the lib and returns it extracted with the as IEmbedExtractor param
         * @param symbol
         * @param as
         * @returns {any}
         */
        static getSymbolAs(symbol: string, as: IEmbedExtractor): any;
        /**
         * Gets the IEmbedAsset for the provided asset src file
         * @param src
         * @returns {IEmbedDiskFile}
         */
        static getAsset(src: string): IEmbedAsset;
    }
}
