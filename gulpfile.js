const gulp = require('gulp');
const del = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const strip = require('gulp-strip-comments');
const header = require('gulp-header');
const fs = require('fs');

var src = ['src/*.js', 'src/super-particle.js', 'src/super-particles.js'];
var dist = "dist/"
var headerFile = 'src/header.txt';


gulp.task('clean', function (cb) {
    return del(dist, cb);
})

gulp.task('compileJs', function () {
    return gulp.src(src)
        .pipe(strip({
            ignore: /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g,  //jsDoc ingnore
            trim: true
        }))
        .pipe(concat('super-particles.js'))
        .pipe(header(fs.readFileSync(headerFile)))
        .pipe(gulp.dest(dist));
});



gulp.task('compileMinJs', function () {
    return gulp.src(src, { sourcemaps: true })
        .pipe(uglify())
        .pipe(concat('super-particles.min.js'))
        .pipe(header(fs.readFileSync(headerFile)))
        .pipe(gulp.dest(dist, { sourcemaps: '.' }));
});

gulp.task('watch', function () {
    gulp.watch('src/*', gulp.series(['clean', gulp.parallel(['compileJs', 'compileMinJs'])]));
});
gulp.task('deafult', gulp.series(['clean', gulp.parallel(['compileJs', 'compileMinJs', 'watch'])]));

//exports.js = js;
//exports.minJs = minJs;
//exports.default = parallel(js, minJs);
