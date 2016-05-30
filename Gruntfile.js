

module.exports = function(grunt) {

    grunt.initConfig({
        less: {
            dev: {
                options: {
                    paths: ["."]
                },
                files: {
                    "style.css": "less/style.less",
                },
            }
        },
        watch: {
            less: {
                files: "less/**.less",
                tasks: ['less'],
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('gen', ['less']);
    grunt.registerTask('watcher', ['gen', 'watch']);

    grunt.registerTask('default', ['gen']);

};
