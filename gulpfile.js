const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge-stream');
var del = require('del');

const tsProject = ts.createProject('tsconfig.json');

const dirs = {
  dist: ['dist']
};

const movePackage = () => {
  return gulp.src('package.json')
    .pipe(gulp.dest(dirs.dist));
};

const moveReadme = () => {
  return gulp.src('readme.md')
    .pipe(gulp.dest(dirs.dist));
};

const moveLocals = () => {
  return gulp.src('i18n/**/*.json')
    .pipe(gulp.dest(dirs.dist + '/i18n'))
}

const compileProd = () => {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest(dirs.dist));
};

const compileTest = () => {
  const tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  return merge(tsResult, tsResult.js)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dirs.dist));
};

const delDist = () => {
  return del(['dist/**/*']);
}

const build = gulp.series(delDist, compileProd, moveLocals);
const buildMeta = gulp.parallel(movePackage, moveReadme);

module.exports = {
  build,
  buildMeta,
  default: build
};

gulp.task('watch', gulp.series(function() {
  gulp.watch(['src/*.ts', 'cli.ts'], gulp.series(compileTest, moveLocals));
}));
