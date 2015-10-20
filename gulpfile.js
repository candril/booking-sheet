'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var template = require('gulp-template');
var templateCache = require('gulp-templateCache');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var inlinesource = require('gulp-inline-source');
var browserSync = require('browser-sync').create();

gulp.task('build-templates', function () {

  var options = {
    output: 'templates.js',
    moduleName: 'booking',
    strip: 'templates/'

  };

  gulp.src('client/templates/**/*.html')
    .pipe(templateCache(options))
    .pipe(gulp.dest('.temp'))
});

gulp.task('copy', function () {
  return gulp.src('client/**', {base: 'client'})
    .pipe(gulp.dest('.temp'));
});

gulp.task('compile-scripts', ['build-templates', 'copy'], function () {
  return gulp.src(['.temp/js/app.js', '.temp/js/**/*.js', '.temp/templates.js'], { base: '.temp'})
    .pipe(babel())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('.temp'));
});

gulp.task('compile-css', ['copy'], function () {
  return gulp.src('.temp/css/**/*.css', { base: '.temp'})
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('.temp'));
});

gulp.task('copy-html', ['copy'], function () {
  return gulp.src('.temp/index.html')
    .pipe(template({ scripts: 'app.min.js', styles: 'styles.css'}))
    .pipe(gulp.dest('.temp'));
});

gulp.task('inline-scripts', ['compile-scripts', 'compile-css', 'copy-html'], function () {
  return gulp.src('.temp/index.html')
    .pipe(inlinesource())
    .pipe(gulp.dest('dist'))
});

gulp.task('build', ['inline-scripts']);


gulp.task('watch', ['serve'], function() {
  gulp.watch('client/*', ['build']);
});

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    }
  });

  gulp.watch("client/**", ['build']);
  gulp.watch("dist/index.html").on('change', browserSync.reload);

});
