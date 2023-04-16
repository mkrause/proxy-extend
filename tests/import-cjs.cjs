
/*
Test the public interface of this package, simulating a CommonJS consumer.

Note: this is intended to run in Node.js directly without transpiling, so only use features of Node that are supported
by all supported Node.js versions.
*/

const assert = require('node:assert');

// Test: importing a CJS package from a CJS context
const extend = require('proxy-extend');
assert(typeof extend.proxyKey === 'symbol');
assert(typeof extend.extend === 'function');
assert(typeof extend.isProxyable === 'function');
assert(typeof extend.isProxy === 'function');
assert(typeof extend.unwrapProxy === 'function');
assert(typeof extend.registerProxyFormatter === 'function');
assert(typeof extend.default === 'function');


// Test: importing an ESM package from a CJS context
import('proxy-extend')
  .then((extend) => {
    assert(typeof extend.proxyKey === 'symbol');
    assert(typeof extend.extend === 'function');
    assert(typeof extend.isProxyable === 'function');
    assert(typeof extend.isProxy === 'function');
    assert(typeof extend.unwrapProxy === 'function');
    assert(typeof extend.registerProxyFormatter === 'function');
    assert(typeof extend.default === 'function');
  });
