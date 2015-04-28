/**
 * SymbolExample
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />

class SymbolExample{

	// use image for static appened images
	@embed({src:'./resources/arc2.png', symbol:'lib.CharacterSet'})
	static plattformMap:HTMLImageElement;



	constructor() {

		// multiple instances of plattformMap symbol can be appened
		document.body.appendChild(EmbedUtils.getSymbolAs('lib.CharacterSet',EmbedType.image));
		document.body.appendChild(EmbedUtils.getSymbolAs('lib.CharacterSet',EmbedType.image));

	}

}
