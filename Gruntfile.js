/**
 * Created by xperiments on 01/04/15.
 */
module.exports = function (grunt) {


    grunt.initConfig(
        {
            ts: {
                build: {
                    src: ["./src/**/*.ts"],
                    reference: "./src/reference.ts",  // If specified, generate this file that you can use for your reference management
                    out: './dist/ts-embed.js',
                    options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
                        target: 'es5',                 // 'es3' (default) | 'es5'
                        module: 'commonjs',            // 'amd' (default) | 'commonjs'
                        sourceMap: true,               // true (default) | false
                        declaration: true,            // true | false (default)
                        removeComments: false,           // true (default) | false
                        fast: "never",
                        compiler:'./node_modules/typescript/bin/tsc'
                    }

                },
                demo:{
                    src: ["./demo/src/**/EmbedSamples.ts"],
                    //reference: "./demo/src/reference.ts",  // If specified, generate this file that you can use for your reference management
                    out: './demo/src/EmbedSamples.js',
                    options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
                        target: 'es5',                 // 'es3' (default) | 'es5'
                        module: 'commonjs',            // 'amd' (default) | 'commonjs'
                        sourceMap: true,               // true (default) | false
                        declaration: false,            // true | false (default)
                        removeComments: true,           // true (default) | false
                        fast: "never",
                        compiler:'./node_modules/typescript/bin/tsc'
                    }
                },
                basicExample:{
                    src: ["./demo/src/**/BasicExample.ts"],
                    //reference: "./demo/src/reference.ts",  // If specified, generate this file that you can use for your reference management
                    out: './demo/src/BasicExample.js',
                    options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
                        target: 'es5',                 // 'es3' (default) | 'es5'
                        module: 'commonjs',            // 'amd' (default) | 'commonjs'
                        sourceMap: true,               // true (default) | false
                        declaration: false,            // true | false (default)
                        removeComments: true,           // true (default) | false
                        fast: "never",
                        compiler:'./node_modules/typescript/bin/tsc'
                    }
                }
            },
            typedoc: {
                release: {
                    options: {
                        module: 'commonjs',
                        target: 'es5',
                        out: './docs',
                        name: 'ts-embed API docs',
                        mode:'file',
                        theme:'minimal'
                    },
                    src: ['tmp/**/*.ts','!tmp/reference.ts']
                }
            },
            watch: {
                ts: {
                    files: ['./src/**/*.ts'],
                    tasks: ['ts:build']
                }
            },
            uglify: {
                js: {
                    files: {
                        './dist/ts-embed.min.js': ['./dist/ts-embed.js'],
                        './demo/js/ts-embed.min.js':['./dist/ts-embed.js']
                    }
                }
            },
            embed: {
                demo: {
                    src: ['./demo/**/*.ts'],
                    out:'./demo/bin/embedOutput.tse'
                }
            },
            copy:{
                definitions:{
                    files:[
                        {expand: true, cwd:'dist', src: ['ts-embed.d.ts'], dest: 'demo/src/typings/ts-embed'}

                    ]
                },
                doc:{
                    files:[
                        {expand: true, cwd:'src', src: ['**/*'], dest: 'tmp'}

                    ]
                }
            },

            // replace es6-promise.d.ts path inside ts-embed.d.ts for the demo
            replace: {
                definitions: {
                    src: ['demo/src/typings/ts-embed/ts-embed.d.ts'],
                    dest: 'demo/src/typings/ts-embed/ts-embed.d.ts',
                    replacements: [{
                        from: '../src/typings/es6-promise/es6-promise.d.ts',
                        to: '../es6-promise/es6-promise.d.ts'
                    }]
                },
                doc:{
                    src: ['tmp/ts-embed.ts'],
                    dest: 'tmp/ts-embed.ts',
                    replacements: [
                        {
                            from: 'PropertyDecorator',
                            to: 'any'
                        },
                        {
                            from: 'path="reference.ts"',
                            to: 'path="typings/es6-promise/es6-promise.d.ts"'
                        }
                    ]
                }
            },
            clean:{
                doc: ["tmp"]
            },
            "browser-badge":{
                readme: {
                    src:'./README.md',
                    dest:'./README.md',
                    browsers:{
                        "explorer" : { "8.0" : false, "9.0" : true },
                        "firefox" : { "13.0" : true, "34.0" : true, "35.0" : true, "36.0" : true, "37.0" : true},
                        "chrome" : { "20.0" : true, "39.0" : true, "40.0" : true, "41.0" : true, "42.0" : true},
                        "safari" : { "6":true,"6.1":true, "7":true,"7.1":true, "8":true },
                        "opera" : { "11.6" : true, "12.0" : true, "21.10" : true, "12.12" : true, "12.14" : true, "12.15" : true },
                        "iphone": { "6.0" : true,"7.0" : true,"8.0" : true },
                        "android": { "4.0" : true,"4.1" : true,"4.2" : true,"4.3" : true,"4.4" : true,"5.0" : true,"5.1" : true },
                        "android chrome": { "42" : true }
                    },
                    icons:[
                        'ie',
                        'firefox',
                        'chrome',
                        'safari',
                        'opera',
                        'ios',
                        'android',
                        'android chrome'
                    ]
                }
            }
        });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browser-mdbagde');

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-ts-embed');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-typedoc');

    grunt.registerTask("default", ["ts:build","watch"]);
    grunt.registerTask("doc", ["ts:build","copy:doc","replace:doc","typedoc:release","clean:doc"]);
    grunt.registerTask("demo", ["copy:definitions","replace:definitions","ts:demo","ts:basicExample","embed:demo"]);
    grunt.registerTask("compile", ["ts:build","uglify:js"]);
    grunt.registerTask("build", ["compile","demo","doc"]);

}