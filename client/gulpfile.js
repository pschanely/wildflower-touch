var gulp = require('gulp');
var print = require('gulp-print');
var inlinesource = require('gulp-inline-source');
var browserify = require('gulp-browserify');

function buildto(dir, isweb) {
    var html;
    if (isweb) {
	html = gulp.src('./src/*.html');
        html = html.pipe(inlinesource({compress:true}));
    } else {
	html = gulp.src(['./src/*.html', './src/*.css']);
    }
    html.pipe(gulp.dest(dir));
    
    gulp.src('node_modules/dialog-polyfill/dialog-polyfill.js').pipe(gulp.dest(dir))
    gulp.src('node_modules/dialog-polyfill/dialog-polyfill.css').pipe(gulp.dest(dir))
    
    gulp.src('./src/main.js')
        .pipe(browserify({
          insertGlobals : true,
          debug : !gulp.env.production
        }))
        .pipe(gulp.dest(dir));

    gulp.src('./src/img/*')
        .pipe(gulp.dest(dir + '/img'));

}

gulp.task('default', function() {
    buildto('./dist', true);
});

gulp.task('app', function() {
    buildto('../mobile/www', false);
});

gulp.task('watch', function() {
    gulp.watch('./src/*.css', ['default','app']);
    gulp.watch('./src/*.js', ['default','app']);
    gulp.watch('./src/*.html', ['default','app']);
    gulp.watch('./src/img/*', ['default','app']);
});
