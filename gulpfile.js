/**
 * Command list
 *  clean                       - cleans out server/public
 *  watch-scss                  - watches changes in client scss
 *  compile-scss                - compiles client scss into css
 *  minify-scss                 - compile the scss and minify the css
 *  watch-img                   - watches for changes in the game/assets/img directory
 *  compile-img                 - for now, it moves the images over to server/public/img
 *  minify-img                  - minify the images and move them
 *  watch-html                  - watches for changes in the client html
 *  compile-html                - for now, it moves the html file to server/public/html
 *  minify-html                 - minify the html and move it
 *  watch-client-ts             - watches for changes in the client typescript
 *  compile-client-ts           - compiles the client typescript and bundles it
 *  minify-client-ts            - compiles and minifies the typescript
 *  move-client-js-libraries    - moves the client javascript libraries to server/public/javascripts/libraries
 *  watch-sockets-ts            - watches for changes in the socket server typescript
 *  compile-sockets-ts          - compiles the server typescript
 *  nodemon                     - automatically restart the server on changes
 *  lintjs                      - javascript linter
 *  lintts                      - typescript linter
 *  compile-client              - compiles client ts, html, scss, images
 *  watch-client                - compiles and watches for changes and runs the server
 *  minify-client               - minifies client code
 *  compile-sockets             - compiles the socket server
 *  watch-sockets               - watch for changes and run the socket server
 */

var gulp = require('gulp');
var util = require('gulp-util');
var fs = require('fs-extra');
var Q = require('q');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watch = require('gulp-watch');

var rimraf = require('rimraf');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var minifyImg = require('gulp-imagemin');
var htmlmin = require('gulp-htmlmin');
var watchify = require('watchify');
var browserify = require('browserify');
var ts = require('gulp-typescript');
var tsify = require('tsify');
var babel = require('gulp-babel');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var tslint = require('gulp-tslint');
var nodemon = require('gulp-nodemon');
var runSequence = require('run-sequence');

var config = {
  client: {
    scss: {
      src: './client/scss/*.scss',
      out: './server/public/stylesheets',
    },
    html: {
      src: './client/html/index.html',
      out: './server/public/html'
    },
    ts: {
      src: './client/js/main.ts',
      out: './server/public/javascripts'
    }
  },

  game: {
    img: {
      src: './game/assets/img/**/*',
      out: './server/public/img'
    }
  },

  sockets: {
    ts: {
      src: './sockets/src/**/*',
      out: './sockets/build'
    },
    startPath: './sockets/build/sc/server'
  }

};

// clear out the public files on the server
gulp.task('clean', function() {
  var deferred = Q.defer();
  rimraf('./server/public/**/*', function(e) {
    if (e) util.log(util.colors.red(e.toString()));
    deferred.resolve();
  });
  return deferred.promise;
});

// compile scss into css
gulp.task('watch-scss', function() {
  return watch(config.client.scss.src, function() {
      return gulp.start('compile-scss');
  });
});

gulp.task('compile-scss', function() {
  var deferred = Q.defer();
  gulp.src(config.client.scss.src)
    .pipe(sass())
    .pipe(gulp.dest(config.client.scss.out))
    .on('end', function() {
      deferred.resolve();
    });
  return deferred.promise;
});

gulp.task('minify-scss', function() {
  var deferred = Q.defer();
  gulp.src(config.client.scss.src)
    .pipe(sass())
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest(config.client.scss.out))
    .on('end', function() {
      deferred.resolve();
    });
  return deferred.promise;
});

// move game images into the server
gulp.task('watch-img', function() {
  return watch(config.game.img.src, function() {
    return gulp.start('compile-img');
  });
});

gulp.task('compile-img', function() {
  var deferred = Q.defer();
  gulp.src(config.game.img.src)
    .pipe(gulp.dest(config.game.img.out))
    .on('end', function() {
      deferred.resolve();
    });
  return deferred.promise;
});

gulp.task('minify-img', function() {
  var deferred = Q.defer();
  gulp.src(config.game.img.src)
    .pipe(minifyImg())
    .pipe(gulp.dest(config.game.img.out))
    .on('end', function() {
      deferred.resolve();
    });
  return deferred.promise;
});

// move html files over to the server
gulp.task('watch-html', function() {
  return watch(config.client.html.src, function() {
    return gulp.start('compile-html');
  });
});

gulp.task('compile-html', function() {
  // make sure the html folder exists
  var dir = config.client.html.out;
  var deferred = Q.defer();
  fs.ensureDir(dir, function(e) {
    if (e) util.log(util.colors.red(e.toString()));
    gulp.src(config.client.html.src)
      .pipe(gulp.dest(config.client.html.out))
      .on('end', function() {
        deferred.resolve();
      });
  });
  return deferred.promise;
});

gulp.task('minify-html', function() {
  // make sure the html folder exists
  var dir = config.client.html.out;
  var deferred = Q.defer();
  fs.ensureDir(dir, function(e) {
    if (e) util.log(util.colors.red(e.toString()));
    gulp.src(config.client.html.src)
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest(config.client.html.out))
      .on('end', function() {
        deferred.resolve();
      });
  });
  return deferred.promise;
});

// compile typescript
gulp.task('watch-client-ts', function() {
  var task = ['watch-client-ts'];
  var count = 0;
  var cyan = util.colors.cyan;
  var magenta = util.colors.magenta;

  var bundle = function(bundler) {
    util.log(cyan(task), 'Starting bundling', magenta('#' + count));
    var startTime = new Date().getTime();

    return bundler
      .bundle()
      .on('error', function(e) {
        util.log(util.colors.red(e.toString()));
        this.emit('end');
      })
      .pipe(source('app.js'))
      .pipe(gulp.dest(config.client.ts.out))
      .on('end', function() {
        var time = new Date().getTime() - startTime;
        util.log(cyan(task), 'Finished bundling', magenta('#' + count++), 'after', magenta(time + 'ms'));
      });
  };

  var bundler = browserify(config.client.ts.src, {
    cache: {},
    packageCache: {},
    sourceMap: false
  })
  .plugin(watchify)
  .plugin(tsify)
  .transform(babelify.configure({
    compact: false,
    presets: ['es2015']
  }));

  bundler.on('update', function() {
    bundle(bundler);
  });

  return bundle(bundler);
});

gulp.task('compile-client-ts', function() {
  return browserify(config.client.ts.src, {
    cache: {},
    packageCache: {},
    sourceMap: false
  })
  .plugin(tsify)
  .transform(babelify.configure({
    compact: false,
    presets: ['es2015']
  }))
  .bundle()
  .pipe(source('app.js'))
  .pipe(gulp.dest(config.client.ts.out));
});

gulp.task('minify-client-ts', function() {
  return browserify(config.client.ts.src, {
    cache: {},
    packageCache: {},
    sourceMap: false
  })
  .plugin(tsify)
  .transform(babelify.configure({
    compact: false,
    presets: ['es2015']
  }))
  .bundle()
  .pipe(source('app.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest(config.client.ts.out));
});

gulp.task('move-client-js-libraries', function() {
  var dir = config.client.ts.out + '/libraries';
  var deferred = Q.defer();
  fs.ensureDir(dir, function(e) {
    if (e) util.log(util.colors.red(e.toString()));
    gulp.src([
      './client/js/libraries/*.js'
    ])
    .pipe(gulp.dest(dir))
    .on('end', function() {
      deferred.resolve();
    });
  });
return deferred.promise;
});


gulp.task('watch-sockets-ts', function() {
  return watch(config.sockets.ts.src, function() {
      return gulp.start('compile-sockets-ts');
  });
});

gulp.task('compile-sockets-ts', function() {
  var tsProject = ts.createProject('tsconfig.json');

  return gulp.src([config.sockets.ts.src])
    .pipe(tsProject())
    .pipe(babel({
      compact: false,
      presets: ['es2015']
    }))
    .pipe(gulp.dest(config.sockets.ts.out));
});

gulp.task('run-sockets', function() {
  require(config.sockets.startPath);
});

gulp.task('nodemon', function() {
  nodemon({
    srcipt: 'server/bin/www',
    tasks: [],
    ext: 'html js ts scss',
    env: { NODE_ENV: 'development' },
    ignore: [
      'server/public/**',
      'node_modules',
      'client/**'
    ]
  });
});

// javascript linter
gulp.task('lintjs', function() {
  return gulp.src([
    '*.js',
    '!./client/js/libraries/**/*.js',
    './client/js/**/*.js',
    './game/server/**/*.js',
    '!./server/public/javascripts/**/*.js',
    './server/**/*.js'
  ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// typescript linter
gulp.task('lintts', function() {
  return gulp.src([
    './client/js/**/*.ts'
  ])
    .pipe(tslint({
        formatter: 'verbose'
    }))
    .pipe(tslint.report({
      emitError: false,
      summarizeFailureOutput: true,
    }));
});

gulp.task('lint', function() {
  return runSequence(['lintjs', 'lintts']);
});

gulp.task('compile-client', function() {
  return runSequence('clean', ['compile-scss', 'compile-img', 'compile-html', 'compile-client-ts', 'move-client-js-libraries']);
});

gulp.task('watch-client', function() {
  return runSequence('clean', 'compile-client', ['watch-scss', 'watch-img', 'watch-html', 'watch-client-ts', 'nodemon']);
});

gulp.task('minify-client', function() {
  return runSequence('clean', ['minify-html', 'minify-img', 'minify-scss', 'minify-client-ts', 'move-client-js-libraries']);
});

gulp.task('compile-sockets', function() {
  return runSequence(['compile-sockets-ts']);
});

gulp.task('watch-sockets', function() {
  return runSequence('compile-sockets', 'run-sockets', ['watch-sockets-ts']);
})

gulp.task('default', function() {
  gulp.start('watch-client');
});
