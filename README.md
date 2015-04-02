#ts-embed

A Typescript Decorator that embeds files (string/binary) and injects the resulting value into the prototype.propertyName using the @embed decorator.

It consumes files packed with the [grunt-ts-embed](https://github.com/xperiments/grunt-ts-embed) task.

The @embed decorator works together with a EmbedLoader Class that loads and converts our files to multiple readable formats.
