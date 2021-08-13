const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const insert = require('gulp-insert');
const path = require('path');

const srcFiles = [
  './src/js/base.js',
  './src/js/utils/utils.js',
  './src/js/utils/EventEmitter.js',
  './src/js/utils/DragListener.js',
  './src/js/**',
];

const outputFile = 'goldenlayout.js';
const outputMinFile = 'goldenlayout.min.js';
const outputFolder = './dist';

function combine() {
  return (
    gulp
      // Source files loaded in order
      .src(srcFiles)
      // Concatenate to goldenLayout.js
      .pipe(concat(outputFile))
      // These are a prefix and suffix added to the concatenated file
      .pipe(insert.wrap('(function($){', '})(window.$);'))
      .pipe(gulp.dest(outputFolder))
  );
}

function watch() {
  return gulp.watch(srcFiles, combine);
}

function minify() {
  return gulp
    .src(path.join(outputFolder, outputFile))
    .pipe(uglify())
    .pipe(concat(outputMinFile))
    .pipe(gulp.dest(outputFolder));
}

exports.build = gulp.series(combine, minify);
exports.dev = gulp.series(combine, watch);
exports.default = exports.build;
