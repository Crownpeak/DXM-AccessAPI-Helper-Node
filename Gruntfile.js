/*
 * CrownpeakGruntUpload
 * y
 *
 * Copyright (c) 2019 y
 * Licensed under the y license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    crownpeakgruntupload: {
      default_options: {
        options:grunt.file.readJSON("D:\\Documents\\GitHub\\CP\\loginInfo.json")
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['tests/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "tests" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then tests the result.
  grunt.registerTask('test', ['clean', 'crownpeakgruntupload', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};