/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
///<reference path="reference.ts"/>

class BasicExample{

	// html file
	@embed({src:'./resources/html5template.html'})
		html5template:string;


	// png file as HTMLImageElement
	@embed({src:'./resources/pngImage.png', as:EmbedType.objectURL })
	 pngImage:string;



	constructor() {

		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
	}

}
