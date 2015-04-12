# ts-embed

## why ts-embed? ##
**ts-embed** is a set of code & tools to create compacted assets libraries (audio, video, text). It takes some inspiration from the as3 flex [Embed(source="file.png")] syntax.

The advantage of embedding assets is that are included in a single **.tse** file, and can be accessed faster than it the application has to load one to one every asset.

## Basic Syntax ##
~~~typescript 
class SomeClass {
	
	@embed({src:'./resources/helloWorld.txt'});
	someProperty:string;

}
~~~

## Embed parameters ##

The following table describes the parameters that are available for any type of embedded asset.


param  | required | description
----------| ---- | -------------
**src**	| true | Specifies the path of the asset to embed with a path relative to the file containing the @embed statement.
**as**		| false | Specifies the [Extractor](#extractor) function to use to recreate the property. 
**mime**	| false | Specifies the mime type of the asset. [Supported MIME types](#supported-MIME-types)
**symbol**| false | A unique identifier name used to retrieve an embed asset at runtime.
## Basic Usage ##

Embed an asset in your code:

~~~typescript 
class EmbedTest {
	
	@embed({src:'./resources/helloWorld.txt'});
	helloWorldProperty:string;

}
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




## Extractor ##
~~~typescript 
class EmbedTest {
	
	@embed({ src:'./resources/logo.png', as:Embed.HTMLImageElement });
	logoImage:HTMLImageElement;

}
~~~

## Retrieve an embed asset at Runtime ##
~~~typescript 
class EmbedTest {
	
	@embed({ src:'./resources/logo.png', symbol:'mySymbolName' });
	logoImage:HTMLImageElement;

}
~~~

## Custom Extractors ##
~~~typescript 
class EmbedTest {
	
	@embed({ src:'./resources/logo.png', as:Embed.HTMLImageElement });
	logoImage:HTMLImageElement;

}
~~~
## Supported MIME types ##

You can optionally specify a MIME type for the imported asset by using the mimeType parameter. If you do not specify a mimeType parameter, ts-embed makes a best guess about the type of the imported file based on the file extension. If you do specify it, the mimeType parameter overrides the default guess of the asset type.

Currentlly supported MIME types:

* audio/L24
* audio/mp4
* audio/mpeg
* audio/ogg
* audio/opus
* audio/vorbis
* audio/vnd.wave
* audio/webm
* image/gif
* image/jpeg
* image/pjpeg
* image/png
* image/bmp
* image/svg+xml
* image/tiff
* text/css
* text/csv
* text/html
* text/javascript
* text/plain
* text/rtf
* text/vcard
* text/xml
* video/avi
* video/mpeg
* video/mp4
* video/ogg
* video/quicktime
* video/webm
* application/typescript
* application/ecmascript
* application/json
* application/javascript
* application/octet-stream
* application/pdf
* application/xml
* application/zip
* application/gzip
