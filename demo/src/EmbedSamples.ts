/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />



import embed = tsembed.embed;
import EmbedType = tsembed.EmbedType;
import EmbedUtils = tsembed.EmbedUtils;
import IEmbedDiskFile = tsembed.IEmbedAsset;

class EmbedSamples{
	@embed({src:'./resources/Examples.js', as:EmbedType.script, mime:'text/javascript'})
	static examples:HTMLScriptElement;
}