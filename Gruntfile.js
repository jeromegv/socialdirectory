module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jadeUsemin: {
        scripts: {
            options: {
                tasks: {
                    js: ['concat', 'uglify','filerev'],
                    css: ['concat', 'cssmin','filerev']
                },
               
                targetPrefix:'./public/',
                dirTasks: ['filerev'],
                prefix:'./public'
            },
            files: [{
                dest: './views/websiteViews/shared/layoutGrunted.jade',
                src: './views/websiteViews/shared/layout.jade'
            }]
        }
    },
    copy: {
      main: {
      files: [
        {
          cwd: 'public/fonts/',
          src: '**',
          dest: 'public/dist/css',
          filter: 'isFile',
          expand: true
        },
        {
          cwd: 'public/components/jquery-ui/themes/smoothness/',
          src: 'images/**',
          dest: 'public/dist/css',
          expand: true
        },
        {
          cwd: 'public/components/slick.js/slick/',
          src: 'fonts/**',
          dest: 'public/dist/css',
          expand: true
        },
        {
          cwd: 'public/components/slick.js/slick/',
          src: 'ajax-loader.gif',
          dest: 'public/dist/css',
          expand: true
        },
        {
          cwd: 'public/components/font-awesome/fonts/',
          src: '**',
          dest: 'public/dist/fonts',
          expand: true
        }
      ]
    }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-jade-usemin');
  grunt.registerTask('default', ['jadeUsemin','copy']);
};