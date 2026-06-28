// Node.js shim to load the browser-IIFE modules for smoke tests.
// Uses vm to run each script in a shared context where ANEF is a true global
// (matching browser behavior where `window.ANEF = ...` makes `ANEF` accessible bare).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {
  window: null,  // bound below to ctx itself
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Map: Map,
  Set: Set,
  Promise: Promise,
  Error: Error,
  RegExp: RegExp,
  URLSearchParams: URLSearchParams,
  isNaN: isNaN,
  parseInt: parseInt,
  parseFloat: parseFloat,
  location: { protocol: 'file:', hostname: 'localhost', search: '', pathname: '' },
  document: {
    addEventListener: function() {},
    documentElement: { lang: 'fr', dir: 'ltr', setAttribute: function() {}, getAttribute: function() {} }
  },
  localStorage: { getItem: function() { return null; }, setItem: function() {} },
  navigator: { language: 'fr-FR', userLanguage: 'fr-FR' },
  addEventListener: function() {},
  removeEventListener: function() {},
  fetch: function() { return Promise.reject(new Error('fetch not available')); }
};
ctx.window = ctx;
vm.createContext(ctx);

function load(rel) {
  var p = path.join(__dirname, rel);
  var code = fs.readFileSync(p, 'utf8');
  vm.runInContext(code, ctx, { filename: p });
}

// Order matters: utils → constants → stats-math → data
load('shared/utils.js');
load('shared/constants.js');
load('shared/stats-math.js');
load('shared/data.js');

module.exports = ctx.ANEF;
