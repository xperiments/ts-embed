/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
///<reference path="reference.ts"/>
import embed = xp.embed;
import Embed = xp.Embed;
import EmbedUtils = xp.EmbedUtils;
import IEmbedDiskFile = xp.IEmbedFile;

type PrimitiveArray = Array<string|number|boolean>;
class BasicExample{

	// html file
	@embed({src:'./resources/html5template.html'})
		html5template:string;


	// png file as HTMLImageElement
	@embed({src:'./resources/pngImage.png', as:Embed.dataURL })
	 pngImage:string;



	constructor() {

		document.body.appendChild(EmbedUtils.imageFromDataURL(this.pngImage));
	}

}
