
// Require events
const Events  = require('events');
const toRegex = require('path-to-regexp');

// Cache polyfil to support cacheAPI in all browsers
require('./cache-polyfill');

/**
 * Build edenWorker eden
 *
 * @extends events
 */
class EdenOffline extends Events {
  /**
   * Construct eden
   */
  constructor(parent, ...args) {
    // Run super
    super(parent, ...args);

    // set parent
    this.eden = parent;

    // Bind methods
    this.build = this.build.bind(this);

    // Build this
    this.building = this.build();
  }

  /**
   * Builds eden worker
   */
  build() {
    // install offline cache
    this.eden.log('info', 'enabling offline');

    // build routes
    this._routes = [];

    // loop routes
    for (const route of self.config.routes) {
      // test route
      route.test = toRegex(route.route);

      // push route
      this._routes.push(route);
    }

    // Adding `install` event listener
    self.addEventListener('install', (event) => {
      // await install
      event.waitUntil(this.install(event));
    });

    // Adding `activate` event listener
    self.addEventListener('activate', (event) => {
      // await install
      event.waitUntil(this.activate(event));
    });

    // Adding `fetch` event listener
    self.addEventListener('fetch', (event) => {
      // await install
      event.respondWith(this.fetch(event));
    });

    // install offline cache
    this.eden.log('info', 'enabled offline');
  }

  /**
   * hook fetch stuff
   *
   * @param  {Event}  event
   *
   * @return {Promise}
   */
  async fetch(event) {
    // get request
    const { request } = event;
    const path = request.url.includes(self.config.domain) ? request.url.split(self.config.domain).pop() : null;

    // match cache
    let response = await caches.match(request);

    // return cached response
    if (response && request.headers.get('Accept') !== 'application/json' && path.includes('.')) return response;

    // check response
    if (!response && path) {
      // find offline route
      const offline = this._routes.find((route) => {
        // test route
        return route.test.test(path);
      });

      // create offline response
      response = request.headers.get('Accept') === 'application/json' ? new Response(JSON.stringify({
        mount : {
          url    : path,
          page   : offline ? offline.view : 'offline-page',
          path   : offline ? offline.path : path,
          layout : `${(offline || {}).layout || 'main'}-layout`,
        },
        page : {
          title : offline ? offline.title : 'Offline',
        },
        state : {
          offline : true,
        },
      }), {
        headers : {
          'Content-Type' : 'application/json',
        },
      }) : caches.match('/offline');
    }

    // try/catch around fetch
    try {
      // fetch request
      response = await fetch(request);
    } catch (e) {}

    // return response
    return response;
  }

  /**
   * install offline cache
   *
   * @param  {Event} event
   */
  async install(event) {
    // install offline cache
    this.eden.log('info', 'installing offline cache');

    // open cache
    const cache = await caches.open(self.config.version);
    const files = self.config.offline.files || [];

    // unshift files
    files.unshift('/');
    files.unshift('/offline');
    files.unshift(`/public/js/app.min.js?v=${self.config.version}`);
    files.unshift(`/public/css/app.min.css?v=${self.config.version}`);

    // add all
    await cache.addAll(files);

    // skip waiting
    self.skipWaiting();

    // install offline cache
    this.eden.log('info', 'installed offline cache');
  }

  /**
   * on activate event
   *
   * @param  {Event}  event
   *
   * @return {Promise}
   */
  async activate(event) {
    // install offline cache
    this.eden.log('info', 'removing depricated offline cache');

    // get cache keys
    const keys = await caches.keys();

    // loop keys
    for (const key of keys) {
      // delete cache
      if (key !== self.config.version) await caches.delete(key);
    }

    // install offline cache
    this.eden.log('info', 'removed depricated offline cache');

    // claim clients
    self.clients.claim();
  }
}

/**
 * Create edenWorker
 *
 * @type {edenWorker}
 */
module.exports = EdenOffline;
