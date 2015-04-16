/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
///<reference path="reference.ts"/>
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


import embed = xp.embed;
import EmbedType = xp.EmbedType;
import EmbedUtils = xp.EmbedUtils;
import IEmbedDiskFile = xp.IEmbedFile;

class EmbedSamples{
	@embed({src:'./BasicExample.js', as:EmbedType.script, mime:'text/javascript'})
	static BasicExample:HTMLScriptElement;
}