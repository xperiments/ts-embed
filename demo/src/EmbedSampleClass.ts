/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
///<reference path="reference.ts"/>
interface Window{
	AudioContext:any;
}

function CustomAudio( file:IEmbedDiskFile ):any{

	var buffer = (<Uint8Array>file.content).buffer;
	var context = new window.AudioContext();
	var audioSource = context.createBufferSource();
	context.decodeAudioData( buffer, function( res ) {

		audioSource.buffer = res;
		audioSource.connect( context.destination );

	});
	return audioSource;
}

import embed = xp.embed;
import Embed = xp.Embed;
import EmbedUtils = xp.EmbedUtils;
import IEmbedDiskFile = xp.IEmbedFile;






class EmbedSampleClass{

	@embed({src:"../resources/pngFormat.png"})
	pngFormat:HTMLImageElement;

	@embed({src:"../js/app.js", as:Embed.HTMLScriptElement, symbol:"myScript"})
		script:HTMLScriptElement;

	@embed({src:"../resources/gifFormat.gif", as:Embed.HTMLImageElement})
	gifFormat:HTMLImageElement;


	@embed({src:"../resources/flags/Afghanistan.png", as:Embed.HTMLImageElement })
	afghanistan:HTMLImageElement;

	@embed({src:"../resources/flags/African Union.png", as:Embed.HTMLImageElement })
	african_union:HTMLImageElement;

	@embed({src:"../resources/flags/Albania.png", as:Embed.HTMLImageElement })
	albania:HTMLImageElement;

	@embed({src:"../resources/flags/Algeria.png", as:Embed.HTMLImageElement })
	algeria:HTMLImageElement;

	@embed({src:"../resources/flags/American Samoa.png", as:Embed.HTMLImageElement })
		american_samoa:HTMLImageElement;

	@embed({src:"../resources/flags/Andorra.png", as:Embed.HTMLImageElement })
		andorra:HTMLImageElement;

	@embed({src:"../resources/flags/Angola.png", as:Embed.HTMLImageElement })
		angola:HTMLImageElement;

	@embed({src:"../resources/flags/Anguilla.png", as:Embed.HTMLImageElement })
		anguilla:HTMLImageElement;

	@embed({src:"../resources/flags/Antarctica.png", as:Embed.HTMLImageElement })
		antarctica:HTMLImageElement;



	@embed({src:"../resources/flags/Arab League.png", as:Embed.HTMLImageElement })
		arab_league:HTMLImageElement;

	@embed({src:"../resources/flags/Argentina.png", as:Embed.HTMLImageElement })
		argentina:HTMLImageElement;

	@embed({src:"../resources/flags/Armenia.png", as:Embed.HTMLImageElement })
		armenia:HTMLImageElement;

	@embed({src:"../resources/flags/Aruba.png", as:Embed.HTMLImageElement })
		aruba:HTMLImageElement;

	@embed({src:"../resources/flags/ASEAN.png", as:Embed.HTMLImageElement })
		asean:HTMLImageElement;

	@embed({src:"../resources/flags/Australia.png", as:Embed.HTMLImageElement })
		australia:HTMLImageElement;

	@embed({src:"../resources/flags/Austria.png", as:Embed.HTMLImageElement })
		austria:HTMLImageElement;

	@embed({src:"../resources/flags/Azerbaijan.png", as:Embed.HTMLImageElement })
		azerbaijan:HTMLImageElement;

	@embed({src:"../resources/flags/Bahamas.png", as:Embed.HTMLImageElement })
		bahamas:HTMLImageElement;

	@embed({src:"../resources/flags/Bahrain.png", as:Embed.HTMLImageElement })
		bahrain:HTMLImageElement;

	@embed({src:"../resources/flags/Bangladesh.png", as:Embed.HTMLImageElement })
		bangladesh:HTMLImageElement;

	@embed({src:"../resources/flags/Barbados.png", as:Embed.HTMLImageElement })
		barbados:HTMLImageElement;

	@embed({src:"../resources/flags/Belarus.png", as:Embed.HTMLImageElement })
		belarus:HTMLImageElement;

	@embed({src:"../resources/flags/Belgium.png", as:Embed.HTMLImageElement })
		belgium:HTMLImageElement;

	@embed({src:"../resources/flags/Belize.png", as:Embed.HTMLImageElement })
		belize:HTMLImageElement;

	@embed({src:"../resources/flags/Benin.png", as:Embed.HTMLImageElement })
		benin:HTMLImageElement;

	@embed({src:"../resources/flags/Bermuda.png", as:Embed.HTMLImageElement })
		bermuda:HTMLImageElement;

	@embed({src:"../resources/flags/Bhutan.png", as:Embed.HTMLImageElement })
		bhutan:HTMLImageElement;

	@embed({src:"../resources/flags/Bolivia.png", as:Embed.HTMLImageElement })
		bolivia:HTMLImageElement;



	@embed({src:"../resources/flags/Botswana.png", as:Embed.HTMLImageElement })
		botswana:HTMLImageElement;

	@embed({src:"../resources/flags/Brazil.png", as:Embed.HTMLImageElement })
		brazil:HTMLImageElement;

	@embed({src:"../resources/flags/Brunei.png", as:Embed.HTMLImageElement })
		brunei:HTMLImageElement;

	@embed({src:"../resources/flags/Bulgaria.png", as:Embed.HTMLImageElement })
		bulgaria:HTMLImageElement;

	@embed({src:"../resources/flags/Burkina Faso.png", as:Embed.HTMLImageElement })
		burkina_faso:HTMLImageElement;

	@embed({src:"../resources/flags/Burundi.png", as:Embed.HTMLImageElement })
		burundi:HTMLImageElement;
	constructor(){
		Object.keys(this.constructor.prototype).forEach((item:any)=>{
			if( this[item] instanceof HTMLImageElement ){
				document.body.appendChild( this[item] );
			}
		})
		//document.body.appendChild( this.pngFormat );
		//document.body.appendChild( this.gifFormat );
		//var audio = document.createElement('audio');
		//audio.appendChild(this.mp3Format)
		//audio.play();

		//this.mp3Format.start(0);



	}

}