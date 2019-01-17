
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

// Globally require babel plugins (i wish eslint would thank me too)
const babelPresets = {
  presetEnv : require('@babel/preset-env'), // eslint-disable-line global-require
};

const babelPlugins = {
  pollyfill        : require('@babel/polyfill'), // eslint-disable-line global-require
  transformClasses : require('@babel/plugin-transform-classes'), // eslint-disable-line global-require
  transformAsync   : require('@babel/plugin-transform-async-to-generator'), // eslint-disable-line global-require
  transformRuntime : require('@babel/plugin-transform-runtime'), // eslint-disable-line global-require
};

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

    // Create javascript array
    const entries = await glob(files);

    // Browserify javascript
    let b = browserify({
      entries,
      paths   : [
        global.appRoot,
        `${global.appRoot}/bundles`,
        `${global.edenRoot}/node_modules`,
      ],
      commondir     : false,
    });

    b = b.transform(babelify, {
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
      presets    : [
        babel.createConfigItem([babelPresets.presetEnv, {
          useBuiltIns : 'entry',
          targets     : {
            chrome         : '71',
            edge           : '18',
            firefox        : '64',
            safari         : '12',
            opera          : '57',
            ios            : '12.1',
            chromeandroid  : '70',
            firefoxandroid : '63',
            samsung        : '7.2',
            ucandroid      : '11.8',
          },
        }]),
      ],
      plugins : [
        babel.createConfigItem(babelPlugins.pollyfill),
        babel.createConfigItem(babelPlugins.transformClasses),
        babel.createConfigItem(babelPlugins.transformAsync),
        babel.createConfigItem([babelPlugins.transformRuntime, {
          helpers      : false,
          regenerators : true,
        }]),
      ],
    });

    b = watchify(b);

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
