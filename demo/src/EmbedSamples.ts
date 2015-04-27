/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />
//interface Window{
//	AudioContext:any;
//}
//
//function CustomAudio( file:IEmbedDiskFile ):any{
//
//	var buffer = (<Uint8Array>file.content).buffer;
//	var context = new window.AudioContext();
//	var audioSource = context.createBufferSource();
//	context.decodeAudioData( buffer, function( res ) {
//
//		audioSource.buffer = res;
//		audioSource.connect( context.destination );
//
//	});
//	return audioSource;
//}


import embed = tsembed.embed;
import EmbedType = tsembed.EmbedType;
import EmbedUtils = tsembed.EmbedUtils;
import IEmbedDiskFile = tsembed.IEmbedAsset;

class EmbedSamples{
	@embed({src:'./BasicExample.js', as:EmbedType.script, mime:'text/javascript'})
	static BasicExample:HTMLScriptElement;
}