var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
var debug = require('gulp-debug');
var sourcemaps = require('gulp-sourcemaps');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var eslint = require('gulp-eslint');

gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**/*', '!dist/**/*'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

var bundler = function (watching) {
  var opts = {
    entries: ['./src/js/app.js'],
    debug: true
  };
  var b = (watching) ? watchify(browserify(Object.assign(watchify.args, opts))) : browserify(opts);
  var rebundle = function () {
    return b.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/js/'));
  };
  if (watching) {
    b.on('update', rebundle);
  }
  b.on('log', gutil.log);
  rebundle();
};

gulp.task('js', bundler.bind(null, false));

gulp.task('index', function () {
  return gulp
    .src('./src/index.html')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('css', function () {
  return gulp
    .src('./src/css/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(debug({ title: 'sass' }))
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.', {
      includeContent: false,
      sourceRoot: '/css'
    }))
    .pipe(gulp.dest('./dist/css/'));
});

gulp.task('build', ['css', 'js', 'index']);

gulp.task('node', function () {
  return nodemon({
    script: 'server.js',
    ignore: [
      'gulpfile.js',
      'bundler.js',
      'package.json',
      'src/*/**',
      'dist/*/**',
      'node_modules/*/**'
    ]
  });
});

gulp.task('serve', ['node', 'build'], function () {
  gulp.watch('./src/css/**/*.scss', ['css']);
  bundler(true);
  gulp.watch('./src/index.html', ['index']);
});

gulp.task('default', ['serve']);
