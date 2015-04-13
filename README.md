# ts-embed

## why ts-embed? ##
**ts-embed** is a set of code & tools to create compacted assets libraries (audio, video, text). It takes some inspiration from the as3 flex [Embed(source="file.png")] syntax.

The advantage of embedding assets is that are included in a single **.tse** file, and can be accessed faster than it the application has to load one to one every asset.

## Basic usage ##

To embed assets into our classes, annotate the target properties with the @embed decorator syntax.
~~~typescript 
class EmbedTestClass {

	//helloWorld.txt contents is "HELLO WORLD"
    
	@embed({src:'./resources/helloWorld.txt'});
	helloWorldContents:string;

}
~~~

This will assign the contents of the included asset into the class property prototype.
~~~typescript 
var embedTest = new EmbedTestClass();
console.log(embedTest.helloWorldContents ); // prints "HELLO WORLD";
console.log(EmbedTestClass.prototype.helloWorldContents ); // prints "HELLO WORLD";

~~~

## Embed parameters ##

The following table describes the parameters that are available for the embed decorator.


param  | required | description
----------| ---- | -------------
**src**	| true | Specifies the path of the asset to embed with a path relative to the file containing the @embed statement.
**as**		| false | Specifies the [Extractor](#extractor) function to use to recreate the property. 
**symbol**| false | A unique identifier name used to retrieve an embed asset at runtime.
**mime**	| false | Specifies the mime type of the asset. [Supported MIME types](#supported-MIME-types)


## @embed({src}) ##
Specifies the path of the asset to embed with a path relative to the file containing the @embed statement.

## @embed({as}) ##

By default embed assets gets extracted to its basic representation ( string | Uint8Array ).

Specifying the **as** parameter let us provide a function that will transform this data before it is asigned to the property.

The embed library itself contains this extractors you can use:

* Embed.**HTMLImageElement**
* Embed.**HTMLScriptElement**
* Embed.**HTMLStyleElement**
* Embed.**HTMLSourceElement**



~~~typescript 
class EmbedTestClass {

	@embed({src:'./resources/image.png'});
	uint8Image:Uint8Array;
    
	@embed({src:'./resources/image.png', as:Embed.HTMLImageElement});
	image:HTMLImageElement;
}
~~~

~~~typescript 
var embedTest = new EmbedTestClass();
console.log( typeof embedTest.uint8Image ); // prints "Uint8Array";
console.log( typeof embedTest.image ); // prints "HTMLImageElement";

~~~

Compile and run the grunt-ts-embed task to generate the **.tse** file.

~~~javascript
grunt.initConfig(
    {
        embed: {
            tests: {
                src: ['./**/*.ts'],
                out:'./bin/embedOutput.tse'
            }
        }
    }    
);
grunt.loadNpmTasks('grunt-ts-embed');
~~~
Load the library with the loader:

~~~javascript
<!-- include the Embed & @embed Directive -->
<script src="ts-embed.min.js"></script>

<!-- include the dummy EmbedTest Class -->
<script src="EmbedTest.js"></script>

<script>
	// create a new loader
	var loader = new xp.EmbedLoader();

	// the load method of the library returns a ES6 promise...
	loader.load('bin/embedOutput.tse').then(function(embedDisk){

		// create a new instance of our dummy EmbedTest class
		var embedTest = new EmbedTest();
		
		// this logs the contents loaded from the helloWorld.txt file
		console.log( embedTest.helloWorldProperty );
		
	});
</script>
~~~

## @embed({symbol}) ##
~~~typescript 
class EmbedTest {
	
	@embed({ src:'./resources/logo.png', symbol:'mySymbolName' });
	logoImage:HTMLImageElement;

}
~~~


## @embed({mime}) ##

You can optionally specify a MIME type for the imported asset by using the mimeType parameter. If you do not specify a mimeType parameter, ts-embed makes a best guess about the type of the imported file based on the file extension. If you do specify it, the mimeType parameter overrides the default guess of the asset type.

Currentlly supported MIME types:

app|audio|image|text|video
-|-|-|-|-
application/typescript		|audio/L24		|image/gif		|text/css			|video/avi
application/ecmascript		|audio/mp4		|image/jpeg		|text/csv			|video/mpeg
application/json			|audio/mpeg		|image/pjpeg	|text/html			|video/mp4
application/javascript		|audio/ogg		|image/png		|text/javascript	|video/ogg
application/octet-stream	|audio/opus		|image/bmp		|text/plain			|video/quicktime
application/pdf				|audio/vorbis	|image/svg+xml	|text/rtf			|video/webm
application/xml				|audio/vnd.wave	|image/tiff		|text/vcard			|
application/zip				|audio/webm		|				|text/xml			|
application/gzip			|				|				|					|
