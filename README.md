# EdenJS - Serviceworker
[![TravisCI](https://travis-ci.com/eden-js/serviceworker.svg?branch=master)](https://travis-ci.com/eden-js/serviceworker)
[![Issues](https://img.shields.io/github/issues/eden-js/serviceworker.svg)](https://github.com/eden-js/serviceworker/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/eden-js/serviceworker)
[![Awesome](https://img.shields.io/badge/awesome-true-green.svg)](https://github.com/eden-js/serviceworker)
[![Discord](https://img.shields.io/discord/583845970433933312.svg)](https://discord.gg/5u3f3up)

Serviceworker base logic component for [EdenJS](https://github.com/edenjs-cli)

`@edenjs/serviceworker` automatically adds serviceworker logic to an edenjs install

## Setup

### Install

```
npm i --save @edenjs/serviceworker
```

### Configure

```js
config.serviceworker = {
  config : { // this config field is passed to the compiled serviceworker
    offline : { // disable by passing false or null
      files : ['/some/file.png', '/some/otherfile.png', 'https://some.external/file.png'],
    },
  },
};
```

If offline is on, the entire application can be used offline. To setup routes for offline simply specify `@offline` as part of their config:

```js
/**
 * Index action
 *
 * @param    {Request}  req
 * @param    {Response} res
 *
 * @view     offline
 * @route    {get} /
 * @layout   main
 * @offline
 */
async indexAction(req, res) {
  // render offline page
  res.render();
}
```

As we cannot run a function in the backend when the service has no internet, all other features need to be specified in the config rather than the action function.
For example, the following will not function in offline mode; while the above will.

```js
/**
 * Index action
 *
 * @param    {Request}  req
 * @param    {Response} res
 *
 * @route    {get} /
 * @offline
 */
async indexAction(req, res) {
  // render offline page
  res.render('offline', {
    layout : 'main',
  });
}
```

### Compilation

Any file you include in the following path will be compiled into the serviceworker:

```js
'public/js/serviceworker.js'
'public/js/serviceworker/**/*'
```

### Messaging

Serviceworker messaging is automated between an installed serviceworker and a global eden object.

#### Example

In the serviceworker

```js
// set port
const port = null; // can be a sepcific port

// send message to frontend
self.eden.send(port, 'to.send', 'a', 'b');

// receive a request for data from the frontend
self.eden.endpoint('check.something', async (a, b) => {
  // return b
  return b;
});

// receive an event from the frontend
self.eden.on('check.event', async (a, b) => {
  // got event from frontend
  console.log(a, b);
});
```

In the frontend

```js
// call a serviceworker endpoint
const result = await window.eden.serviceworker.call('check.something', 'a', 'b'); // returns 'b'

// receive a request for data from the frontend
window.eden.serviceworker.send('check.event', 'a', 'b');

// receive an event from the frontend
window.eden.serviceworker.on('to.send', async (a, b) => {
  // got event from serviceworker
  console.log(a, b);
});
```