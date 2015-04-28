/**
 * CustomExtractorExample
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />
/// <reference path="typings/webaudioapi/waa.d.ts" />


class CustomExtractorExample{

	/**
	 *
	 * @param file
	 * @returns {AudioBufferSourceNode}
	 */
	static  extractAudio( file:IEmbedDiskFile ):AudioBufferSourceNode{

		var buffer = (<Uint8Array>file.content).buffer;
		var context = new AudioContext();
		var audioSource = context.createBufferSource();
		context.decodeAudioData( buffer, function( res ) {

			audioSource.buffer = res;
			audioSource.connect( context.destination );

		});
		return audioSource;
	}

	// https://wolf4life.bandcamp.com/track/ludum-dare-2014-vgm-track

	@embed({src:'./resources/ludum-dare-2014-vgm-track.mp3', as:CustomExtractorExample.extractAudio})
	static gameMusic:AudioBufferSourceNode;

	constructor() {

		// start playing the AudioBufferSourceNode
		CustomExtractorExample.gameMusic.start(0);

	}

}
