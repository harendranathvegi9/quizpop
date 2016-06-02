var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var debug = require('gulp-debug');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function () {
  return gulp
    .src('./src/sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(debug({title: 'sass'}))
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.', {
        includeContent: false,
        sourceRoot: '/sass'
    }))
    .pipe(gulp.dest('./src/css/'))
    .pipe(browserSync.stream());
});

gulp.task('node', function(cb){
  var started = false;
  nodemon({
    script: 'server.js',
    ignore: [
      'gulpfile.js',
      'package.json',
      'src/*/**'
    ]
  }).once('start', cb);
});

gulp.task('serve', ['node', 'sass'], function() {
  gulp.watch('./src/sass/*.scss', ['sass']);
  browserSync({
    proxy: 'localhost:3333',
    logPrefix: 'quizpop',
    notify: false,
    open: false
  });
  gulp.watch([
    './src/**/*',
    '!./src/css/**/*',
    '!./src/sass/**/*',
    '!./src/service-worker.js',
    '!./gulpfile.js'
  ], browserSync.reload);
});

gulp.task('default', ['serve']);
