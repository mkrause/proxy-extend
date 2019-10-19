
# proxy-extend

[![npm](https://img.shields.io/npm/v/proxy-extend.svg)](https://www.npmjs.com/package/proxy-extend)
[![Travis](https://img.shields.io/travis/mkrause/proxy-extend.svg)](https://travis-ci.org/mkrause/proxy-extend)

Transparently extend any JS object, using ES6 Proxy.


## Usage

```js
import ProxyWrapper from 'proxy-extend';

const meta = Symbol('meta');

const user = { name: 'John' };

const userWithMeta = ProxyWrapper(user, { [meta]: 'some metadata' });
console.log(userWithMeta.name); // 'John'
console.log(userWithMeta[meta]); // 'some metadata'
````
