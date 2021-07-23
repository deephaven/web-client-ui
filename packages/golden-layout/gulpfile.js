// Deprecated but left here for now; use the gulp tasks in the Gruntfile.
var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var insert = require("gulp-insert");
var path = require("path");

const srcFiles = [
  "./build/ns.js",
  "./src/js/utils/utils.js",
  "./src/js/utils/EventEmitter.js",
  "./src/js/utils/DragListener.js",
  "./src/js/**",
];

const outputFile = "goldenlayout.js";
const outputMinFile = "goldenlayout.min.js";
const outputFolder = "./dist";

function watch() {
  return gulp.watch(srcFiles, combine);
}

function combine() {
  return (
    gulp
      // Source files loaded in order
      .src(srcFiles)
      // Concatenate to goldenLayout.js
      .pipe(concat(outputFile))
      // These are a prefix and suffix added to the concatenated file
      .pipe(insert.wrap("(function($){", "})(window.$);"))
      .pipe(gulp.dest(outputFolder))
  );
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
