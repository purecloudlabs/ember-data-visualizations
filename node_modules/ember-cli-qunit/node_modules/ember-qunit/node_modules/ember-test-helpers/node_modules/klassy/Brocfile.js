var concat     = require('broccoli-concat');
var pickFiles  = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');
var compileES6 = require('broccoli-es6-concatenator');

// --- Compile ES6 modules ---

var loader = pickFiles('bower_components', {
  srcDir: 'loader',
  files: ['loader.js'],
  destDir: '/'
});

var lib = pickFiles('lib', {
  srcDir: '/',
  files: ['**/*.js'],
  destDir: '/'
});

var tests = pickFiles('tests', {
  srcDir: '/',
  files: ['*.js'],
  destDir: '/tests'
});

var main = mergeTrees([loader, lib, tests]);
main = compileES6(main, {
  loaderFile: '/loader.js',
  inputFiles: ['**/*.js'],
  ignoredModules: ['ember'],
  outputFile: '/assets/klassy-tests.amd.js'
});

// --- Select and concat vendor / support files ---

var qunit = pickFiles('bower_components', {
  srcDir: '/qunit/qunit',
  files: ['qunit.js', 'qunit.css'],
  destDir: '/assets'
});

var testIndex = pickFiles('tests', {
  srcDir: '/',
  files: ['index.html'],
  destDir: '/tests'
});

var testSupport = concat('bower_components', {
  inputFiles: ['ember-cli-test-loader/test-loader.js'],
  outputFile: '/assets/test-support.js'
});

module.exports = mergeTrees([main, testIndex, qunit, testSupport]);

