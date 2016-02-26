var gulp = require('gulp');
var watch = require('gulp-watch');
var file = require('gulp-file');
var merge = require('merge-stream');
var inject = require('gulp-inject-string');

var rename = require("gulp-rename");

var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var inline = require('gulp-inline');
var uncss = require('gulp-uncss');
var autoprefixer = require('gulp-autoprefixer');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var spritesmith = require('gulp.spritesmith');

var browserSync = require('browser-sync').create();


/*
 *	Set src and public folder
 */

var projectDir = 'project/public';
var srcDir = 'project/src';


gulp.task('server', function() {

    browserSync.init({
        server: projectDir
    });  
});


/*
 *
 *	Generate header_min.css in public folder
 *
 */

gulp.task('header_styles', function() {
	gulp.src(srcDir + '/sass/header.scss')		
    .pipe(sass({includePaths: require('node-bourbon').includePaths}).on('error', sass.logError))
    .pipe(minifyCss({keepSpecialComments : 0}))
		.pipe(rename({suffix: '_min'}))
		.pipe(autoprefixer({
			browsers: ['last 15 versions'],
			cascade: false
		}))
	    .pipe(gulp.dest(projectDir + '/css'));
});


/*
 *
 *	Generate main_min.css in public folder
 *
 */

gulp.task('main_styles', function() {
	gulp.src(srcDir + '/sass/main.scss')
	    .pipe(sass({includePaths: require('node-bourbon').includePaths}).on('error', sass.logError))
	    .pipe(minifyCss({keepSpecialComments : 0}))
	    .pipe(rename({suffix: '_min'}))
	    .pipe(autoprefixer({
			browsers: ['last 15 versions'],
			cascade: false
		})) 	
	    .pipe(gulp.dest(projectDir + '/css'))
	    .pipe(browserSync.stream());	    
});


/*
 *
 *	Enable uncss bootstrap.min.css
 *  Enable after release
 *
 *	gulp bootstrap_uncss_on
 *
 */

gulp.task('bootstrap_uncss_on', function(){
	gulp.src(projectDir + '/libs/style/bootstrap.min.css')
		.pipe(uncss({html: [srcDir + '/*.html']}))
		.pipe(minifyCss({keepSpecialComments : 0}))
		.pipe(gulp.dest(projectDir + '/css'));
    
});


/*
 *
 *	Disable uncss bootstrap.min.css
 *
 *	gulp bootstrap_uncss_off
 *
 */

gulp.task('bootstrap_uncss_off', function(){
	gulp.src(projectDir + '/libs/style/bootstrap.min.css')
		.pipe(minifyCss({keepSpecialComments : 0}))
		.pipe(gulp.dest(projectDir + '/css'));
    
});


/*
 *
 *	Generate html files in public folder
 *
 */

gulp.task('html', function() {
	gulp.src(srcDir + '/*.html')
		.pipe(inline({
			disabledTypes: ['svg', 'img', 'js'],
		}))
		.pipe(gulp.dest(projectDir))
		.pipe(browserSync.stream());
});


/*
 *
 *	Skan projectDir/libs/js folder and generate libs.js file
 *
 */

gulp.task('lib_js', function(){	
	watch(projectDir + '/libs/js/**/*.js',function(){
		file('libs.js', '').pipe(gulp.dest(projectDir + '/js/'));

		gulp.src(projectDir + '/libs/js/*')		
			.pipe(concat('libs.js', {newLine: '\r\n\r\n \r\n \r\n'}))		
			.pipe(gulp.dest(projectDir + '/js/'));
	});
});


/*
 *
 *	Generate js files in public folder
 *
 */

gulp.task('js', function(){
	gulp.src(srcDir + '/js/script.js')
		.pipe(uglify())
		.pipe(gulp.dest(projectDir + '/js'));
});


/*
 *
 *	Generate optimize img in public folder
 *
 *	gulp images
 *
 */

gulp.task('images', function() {
	gulp.src(srcDir + '/img/**/*')
		.pipe(imagemin({
            progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],      
        }))  
		.pipe(gulp.dest(projectDir + '/img'))
});


/*
 *
 *	Generate sprite in img folder
 *
 *	gulp sprite
 *
 */

gulp.task('sprite', function (){

	var spriteData = gulp.src(srcDir + '/sprite/*.*').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: '_sprite.scss',
		imgPath: '../img/sprite.png',
	}));


	var imgStream = spriteData.img		
		.pipe(gulp.dest(projectDir + '/img/'));

	var cssStream = spriteData.css
        .pipe(gulp.dest(srcDir + '/sass/_inc/'));

    return merge(imgStream, cssStream);
});

gulp.task('watch', function() {

	//regenerate header_min.css and main_min.css after change sass file in _inc folder
	gulp.watch(srcDir + '/sass/_inc/*.scss', ['header_styles', 'main_styles']);	
	
	//	regenerate header_min.css and main_min.css after change
	gulp.watch(srcDir + '/sass/main.scss', ['main_styles']);
	gulp.watch(srcDir + '/sass/header.scss', ['header_styles']);
	
	//	regenerate main_min.css after change _media.scss
	gulp.watch(srcDir + '/sass/_media.scss', ['main_styles']);

	//regenerate html file after change header_min.css
	gulp.watch(projectDir + '/css/header_min.css', ['html']);
	
	//regenerate html file after change bootstrap.min.css
	gulp.watch(projectDir + '/css/bootstrap.min.css', ['html']);

	//	generate js file after change
	gulp.watch(srcDir + '/js/*.js', ['js']).on('change', browserSync.reload);

	//	generate html file after change	
	gulp.watch(srcDir + '/*.html', ['html']);

});

gulp.task('default', ['watch', 'server', 'lib_js']);
