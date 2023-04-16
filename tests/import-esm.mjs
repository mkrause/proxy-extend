
/*
Test the public interface of this package, simulating an ESM consumer.

Note: this is intended to run in Node.js directly without transpiling, so only use features of Node that are supported
by all supported Node.js versions.
*/


import assert from 'node:assert';

import extend, { proxyKey, isProxyable, isProxy, unwrapProxy, registerProxyFormatter } from 'proxy-extend';


// Test: importing an ESM package from an ESM context
assert(typeof proxyKey === 'symbol');
assert(typeof isProxyable === 'function');
assert(typeof isProxy === 'function');
assert(typeof unwrapProxy === 'function');
assert(typeof registerProxyFormatter === 'function');
assert(typeof extend === 'function');


// Note: importing a CJS package from an ESM context is not possible
//require('proxy-extend');
