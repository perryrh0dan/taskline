var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');

const paths = {
  readme: ['readme.md'],
  package: ['package.json'],
  packagelock: ['package-lock.json'],
  dist: ['dist']
};

gulp.task('copy-readme', function() {
  return gulp.src(paths.readme)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('copy-package', function() {
  return gulp.src(paths.package)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('copy-package-lock', function() {
  return gulp.src(paths.packagelock)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile', function() {
  return tsProject.src()
      .pipe(tsProject())
      .js.pipe(gulp.dest(paths.dist));
});

gulp.task('default', gulp.series(gulp.parallel('compile', 'copy-readme', 'copy-package', 'copy-package-lock')));
