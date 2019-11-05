const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge-stream');

const tsProject = ts.createProject('tsconfig.json');

const dirs = {
  packagelock: ['package-lock.json'],
  dist: ['dist']
};

const buildPackage = () => {
  return gulp.src('package.json')
    .pipe(gulp.dest(dirs.dist));
};

const buildReadme = () => {
  return gulp.src('readme.md')
    .pipe(gulp.dest(dirs.dist));
};

const compileTest = () => {
  const tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  return merge(tsResult, tsResult.js)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dirs.dist));
};

const compileProd = () => {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest(dirs.dist));
};

const build = gulp.series(compileProd);
const buildMeta = gulp.parallel(buildPackage, buildReadme);

module.exports = {
  build,
  buildMeta,
  default: build
};

gulp.task('watch', gulp.series(function() {
  gulp.watch(['src/*.ts', 'cli.ts'], gulp.series(compileTest));
}));
