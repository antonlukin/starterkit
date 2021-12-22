const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const clean = require('gulp-clean-css');
const order = require("gulp-order");
const pug = require('gulp-pug');
const babel = require('gulp-babel');
const del = require('del');

require('dotenv').config()

const production = ((list) => {
  const args = list.slice(3);

  if (args.length > 0) {
    return args[0] === '--production';
  }

  return false;
})(process.argv);


const paths = {
  dist: './public/',
  src: './src',
};

function cleanDist() {
  return del(paths.dist);
}

function browserSyncInit(done) {
  browserSync.init({
    server: {
      baseDir: paths.dist,
    },
    ui: false,
    host: 'localhost',
    port: 9000
  });
  done();
}

function browserSyncReload(done) {
  browserSync.reload();
  done();
}

function copyImages() {
  return gulp.src(paths.src + '/images/**/*')
    .pipe(gulp.dest(paths.dist + '/images/'));
}

function copyFonts() {
  return gulp.src(paths.src + '/fonts/**/*')
    .pipe(gulp.dest(paths.dist + '/fonts/'));
}

function stylesProcess() {
  return gulp.src(paths.src + '/styles/app.scss')
    .pipe(plumber(function (error) {
      console.error(error.message);
      this.emit('end');
    }))
    .pipe(sass())
    .pipe(clean())
    .pipe(concat('styles.min.css'))
    .pipe(gulp.dest(paths.dist));
}

function scriptsProcess() {
  return gulp.src(paths.src + '/scripts/**/*')
    .pipe(plumber((error) => {
      console.error(error.message);
      this.emit('end');
    }))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(order([
      'scripts/data/*.js',
      'scripts/*.js'
    ], { base: paths.src }))
    .pipe(concat('scripts.min.js'))
    .pipe(gulp.dest(paths.dist));
}

function htmlProcess() {
  const data = {
    baseurl: 'http://localhost:9000/',
    version: '',
  };

  if (production) {
    data.baseurl = process.env.BASEURL || '/';

    // Set random string as version
    data.version = '?v=' + Math.random().toString(16).substring(2, 15);
  }

  return gulp.src(paths.src + '/views/index.pug')
    .pipe(plumber())
    .pipe(pug({
      basedir: __dirname,
      data: data,
    }))
    .pipe(concat('index.html'))
    .pipe(gulp.dest(paths.dist))
}

function watchFiles() {
  gulp.watch(
    paths.src + '/**/*',
    gulp.series(stylesProcess, scriptsProcess, htmlProcess, browserSyncReload)
  );

  gulp.watch(
    paths.src + '/images/**/*',
    gulp.series(copyImages, browserSyncReload)
  );

  gulp.watch(
    paths.src + '/fonts/**/*',
    gulp.series(copyFonts, browserSyncReload)
  );
}

// Build static files and watch changes by default.
const build = gulp.series(
  cleanDist, copyImages, copyFonts, stylesProcess, scriptsProcess, htmlProcess
);

// Wath file changes
const watch = gulp.series(
  build, browserSyncInit, watchFiles
);

exports.build = build;
exports.default = watch;
