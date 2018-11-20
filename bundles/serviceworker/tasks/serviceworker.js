
// Require dependencies
const gulp       = require('gulp');
const glob       = require('glob-all');
const buffer     = require('vinyl-buffer');
const source     = require('vinyl-source-stream');
const uglify     = require('gulp-uglify-es').default;
const babelify   = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');

/**
 * Build serviceworker task class
 *
 * @task serviceworker
 */
class ServiceworkerTask {
  /**
   * Construct serviceworker task class
   *
   * @param {edenGulp} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param {Array} files
   *
   * @return {Promise}
   */
  run(files) {
    // Create javascript array
    const entries = glob.sync(files);

    // Browserfiy javascript
    return browserify({
      entries,
      paths   : [
        global.appRoot,
        `${global.appRoot}/bundles`,
        `${global.edenRoot}/node_modules`,
      ],
    })
      .transform(babelify)
      .bundle()
      .pipe(source('sw.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps : true,
      }))
      .pipe(uglify({
        compress : true,
      }))
      .pipe(sourcemaps.write(`${global.appRoot}/data/www`))
      .pipe(gulp.dest(`${global.appRoot}/data/www`));
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch() {
    // Return files
    return [
      'public/js/serviceworker.js',
    ];
  }
}

/**
 * Export serviceworker task
 *
 * @type {ServiceworkerTask}
 */
module.exports = ServiceworkerTask;
