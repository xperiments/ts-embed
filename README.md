# ts-embed
**ts-embed** is a set of Typescript code & tools to create compacted assets libraries (audio, video, text). It takes some inspiration from the as3 flex [Embed(source="file.png")] syntax.

The advantage of embedding assets is that are included in a single **.tse** file, and can be accessed faster than it the application has to load one to one every asset.

## Table of contents ##

* [install](#install)
* [usage](#usage)
* [loading](#loading)
* [grunt-ts-embed task](#grunt-ts-embed)


## Install ##

### Bower ###
	bower install ts-embed
    
Or add it to your bower.json dependencies.

### html ###
~~~html 
<script src="ts-embed.min.js" type="text/javascript"></script>
~~~     


## Usage ##

To embed assets into our classes, annotate the target properties with the @embed decorator syntax.
~~~typescript 
class EmbedTestClass {

	//helloWorld.txt contents is "HELLO WORLD"
    
	@embed({src:'./resources/helloWorld.txt'});
	helloWorldContents:string;

}
~~~
### Process ###
Process your source files with the [grunt-ts-embed task](#grunt-ts-embed).

### Loading ###
[Load](#loading) the library and consume it.


## Embed parameters ##

The following table describes the parameters that are available for the embed decorator.


param  | required | description
----------| ---- | -------------
**src**	| true | Specifies the path of the asset to embed with a path relative to the file containing the @embed statement.
**as**		| false | Specifies the [Extractor](#extractor) function to use to recreate the property. 
**symbol**| false | A unique identifier name used to retrieve an embed asset at runtime.
**mime**	| false | Specifies the mime type of the asset. [Supported MIME types](#supported-MIME-types)


### @embed({src}) ###
Specifies the path of the asset to embed with a path relative to the file containing the @embed statement.

### @embed({as}) ###

By default embed assets gets extracted to its basic representation ( string | Uint8Array ).

Specifying the **as** parameter let us provide a function (IEmbedExtractor) that will transform this data before it is assigned to the property.

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

### @embed({as:custom}) ##

We can also provide custom **as** functions that implements the IEmbedExtractor interface.

Imagine we need a custom Extractor to get an AudioSource from a loaded mp3 file.

~~~typescript 

// our custom extractor function
function CustomAudioSource( file:IEmbedDiskFile ):AudioBufferSourceNode {

	var buffer = (<Uint8Array>file.content).buffer;
	var context = new window.AudioContext();
	var audioSource = context.createBufferSource();
	context.decodeAudioData( buffer, (res)=>{

		audioSource.buffer = res;
		audioSource.connect( context.destination );

	});
    
    // this is the value actually assigned to the property
	return audioSource;
}

class EmbedSoundClass {

	@embed({src:'./resources/mp3File.mp3', as:CustomAudioSource});
	mp3AudioSource:AudioBufferSourceNode;
    constructor(){
    	// play the mp3 file
    	this.mp3AudioSource.start(0);
    }
}
~~~

### @embed({symbol}) ###

The symbol parameter lets us specify a unique asset name to be able to access it at runtime.
~~~typescript 
class EmbedTest {
	
	@embed({ src:'./resources/logo.png', symbol:'logo' });
	logoImage:HTMLImageElement;

}
~~~
Latter in out code we can access it with the method:

	EmbedUtils.getSymbolAs( symbol:string, as:IEmbedExtractor ):IEmbedFile

~~~typescript 
var logoImage = EmbedUtils.getSymbolAs('logo', Embed.HTMLImageElement);
~~~


### @embed({mime}) ###

You can optionally specify a MIME type for the imported asset by using the mimeType parameter. If you do not specify a mimeType parameter, ts-embed makes a best guess about the type of the imported file based on the file extension. If you do specify it, the mimeType parameter overrides the default guess of the asset type.

Currently supported MIME types:

app|audio|image|text|video
---|---|---|---|---
application/typescript		|audio/L24		|image/gif		|text/css			|video/avi
application/ecmascript		|audio/mp4		|image/jpeg		|text/csv			|video/mpeg
application/json			|audio/mpeg		|image/pjpeg	|text/html			|video/mp4
application/javascript		|audio/ogg		|image/png		|text/javascript	|video/ogg
application/octet-stream	|audio/opus		|image/bmp		|text/plain			|video/quicktime
application/pdf				|audio/vorbis	|image/svg+xml	|text/rtf			|video/webm
application/xml				|audio/vnd.wave	|image/tiff		|text/vcard			|
application/zip				|audio/webm		|				|text/xml			|
application/gzip			|				|				|					|



## Loading ##

Loading a library is as simple as creating a new instance of the EmbedLoader class and calling the load method with the source file path.

The load method returns a promise which resolves to a EmbedDisk.

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
		var embedTest = new EmbedTestClass();
		
		// this logs the contents loaded from the helloWorld.txt file
		console.log( embedTest.helloWorldContents );
		
	});
</script>
~~~

## grunt-ts-embed ##

The [grunt-ts-embed](https://github.com/xperiments/grunt-ts-embed) task will find all assets in our code and generate the corresponding library that we consume with the loader.

A simple configuration example that will find all **@embed** declarations inside the **/src** folder and generate the **embedOutput.tse** inside the out folder.

~~~javascript
grunt.initConfig(
    {
        embed: {
            tests: {
                src: ['./src/**/*.ts'],
                out:'./bin/embedOutput.tse'
            }
        }
    }    
);
grunt.loadNpmTasks('grunt-ts-embed');
~~~
