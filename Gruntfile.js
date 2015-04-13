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
                        sourceMap: false,               // true (default) | false
                        declaration: true,            // true | false (default)
                        removeComments: true,           // true (default) | false
                        fast: "never",
                        compiler:'./node_modules/typescript/bin/tsc'
                    }

                },
                demo:{
                    src: ["./demo/src/**/*.ts"],
                    reference: "./demo/src/reference.ts",  // If specified, generate this file that you can use for your reference management
                    out: './demo/src/EmbedSampleClass.js',
                    options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
                        target: 'es5',                 // 'es3' (default) | 'es5'
                        module: 'commonjs',            // 'amd' (default) | 'commonjs'
                        sourceMap: false,               // true (default) | false
                        declaration: false,            // true | false (default)
                        removeComments: true,           // true (default) | false
                        fast: "never",
                        compiler:'./node_modules/typescript/bin/tsc'
                    }
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
                release:{
                    files:[
                        {expand: true, cwd:'dist', src: ['ts-embed.d.ts'], dest: 'demo/src/'}

                    ]
                }
            },
            uncss: {
                dist: {
                    options: {
                        ignore: ['.as-sortable-item-handle svg']
                    },
                    files: {
                        'demo/css/tidy.css': ['demo/editor.html']
                    }
                }
            }
        });
    grunt.loadNpmTasks('grunt-uncss');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ts-embed');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask("default", ["ts:build","watch"]);
    grunt.registerTask("demo", ["ts:demo","embed:demo"]);
    grunt.registerTask("release", ["ts:build","uglify:js","copy:release","demo"]);
}