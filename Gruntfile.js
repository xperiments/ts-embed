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
                    reference: "./demo/src/reference.ts",  // If specified, generate this file that you can use for your reference management
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
                    reference: "./demo/src/reference.ts",  // If specified, generate this file that you can use for your reference management
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
                        mode:'file'
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
                    src: ['demo/src/typings/ts-embed/ts-embed.d.ts'],             // source files array (supports minimatch)
                    dest: 'demo/src/typings/ts-embed/ts-embed.d.ts',             // destination directory or file
                    replacements: [{
                        from: '../src/typings/es6-promise/es6-promise.d.ts',                   // string replacement
                        to: '../es6-promise/es6-promise.d.ts'
                    }]
                },
                doc:{
                    src: ['tmp/ts-embed.ts'],             // source files array (supports minimatch)
                    dest: 'tmp/ts-embed.ts',             // destination directory or file
                    replacements: [
                        {
                            from: 'PropertyDecorator',                   // string replacement
                            to: 'any'
                        },
                        {
                            from: 'path="reference.ts"',                   // string replacement
                            to: 'path="typings/es6-promise/es6-promise.d.ts"'
                        }
                    ]
                }
            },
            clean:{
                doc: ["tmp"]
            }
        });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-ts-embed');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-typedoc');

    grunt.registerTask("default", ["ts:build","watch"]);
    grunt.registerTask("demo", ["copy:definitions","replace:definitions","ts:demo","ts:basicExample","embed:demo"]);
    grunt.registerTask("compile", ["ts:build","uglify:js"]);
    grunt.registerTask("release", ["compile","demo"]);
    grunt.registerTask("doc", ["ts:build","copy:doc","replace:doc","typedoc:release","clean:doc"]);
}