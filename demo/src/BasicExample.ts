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

class BasicExample{

	// html file
	@embed({src:'./resources/html5template.html'})
		html5template:string;


	 //png file as HTMLImageElement
	@embed({src:'./resources/pngImage.png', as:EmbedType.objectURL })
	 pngImage:string;

	// png file as HTMLImageElement
	@embed({src:'./resources/bootstrap.min.css' })
		bootstrap:string;


	constructor() {

		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
		document.body.appendChild(EmbedUtils.imageFromObjectURL(this.pngImage));
	}

}
