'use strict';

module.exports = function(grunt) {
  // Unified Watch Object
  var watchFiles = {
    serverViews: ['views/**/*.*'],
    serverJS: ['Gruntfile.js', 'app.js', 'config/*.js','controllers/*.js','libs/*.js','models/*.js'],
    clientJS: ['public/js/*.js'],
    clientCSS: ['public/css/*.css'],
    mochaTests: ['test/*.js']
  };

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
    },
    jshint: {
      all: {
        src: watchFiles.clientJS.concat(watchFiles.serverJS),
        options: {
          jshintrc: true
        }
      }
    },csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        src: watchFiles.clientCSS
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-jade-usemin');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  // Default task(s).
  grunt.registerTask('default', ['jadeUsemin','copy']);
  // Lint task(s).
  grunt.registerTask('lint', ['jshint','csslint']);
  grunt.registerTask('build', ['jadeUsemin','copy']);
};