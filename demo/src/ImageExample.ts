/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />

class ImageExample{

	// use image for static appened images
	@embed({src:'./resources/panda.png', as:EmbedType.image })
	static elephant:HTMLImageElement;

	// use objectURL for multiple appened images
	@embed({src:'./resources/elephant.png', as:EmbedType.objectURL })
	elephant:string;

	// use objectURL for multiple appened images
	@embed({src:'./resources/parrot.svg', as:EmbedType.image })
	static parrotSVG:HTMLImageElement;


	constructor() {

		// single image instances can be appened
		// actually second append will fail
		document.body.appendChild(ImageExample.elephant);
		document.body.appendChild(ImageExample.elephant);

		document.body.appendChild(ImageExample.parrotSVG);

		// multiple instances of elephant can be appened
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.elephant));
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.elephant));
	}

}
