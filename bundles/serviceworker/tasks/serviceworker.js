
// Require dependencies
const config         = require('config');
const gulp           = require('gulp');
const glob           = require('@edenjs/glob');
const babel          = require('@babel/core');
const vinylBuffer    = require('vinyl-buffer');
const vinylSource    = require('vinyl-source-stream');
const gulpTerser     = require('gulp-terser');
const babelify       = require('babelify');
const watchify       = require('watchify');
const gulpSourcemaps = require('gulp-sourcemaps');
const browserify     = require('browserify');
const babelPresetEnv = require('@babel/preset-env');

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
    this._b = null;

    // Bind methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  async _browserify(files) {
    if (this._b !== null) {
      return this._b;
    }

    // Browserify javascript
    let b = browserify({
      paths         : global.importLocations,
      entries       : await glob(files),
      debug         : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      commondir     : false,
      insertGlobals : true,
      cache         : {},
      packageCache  : {},
    });

    b = b.transform(babelify, {
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      presets    : [
        babel.createConfigItem([babelPresetEnv, {
          useBuiltIns : 'usage',
          targets     : {
            browsers : config.get('browserlist'),
          },
        }]),
      ],
    });

    b.plugin(watchify, {
      poll        : false,
      ignoreWatch : ['*'],
    });

    this._b = b;

    return b;
  }

  /**
   * Run assets task
   *
   * @param {Array} files
   *
   * @return {Promise}
   */
  async run(files) {
    const b = await this._browserify(files);

    // Create job from browserify
    let job = b
      .bundle()
      .pipe(vinylSource('sw.js')) // Convert to gulp stream
      .pipe(vinylBuffer()); // Needed for terser, sourcemaps

    // Init gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init({ loadMaps : true }));
    }

    // Only minify in live
    if (config.get('environment') === 'live') {
      // Pipe uglify
      job = job.pipe(gulpTerser({
        ie8    : false,
        mangle : true,
        output : {
          comments : false,
        },
        compress : true,
      }));
    }

    // Write gulpSourcemaps
    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    // Pipe job
    job = job.pipe(gulp.dest(`${global.appRoot}/data/www`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
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
