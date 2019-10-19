
# proxy-extend

[![npm](https://img.shields.io/npm/v/proxy-extend.svg)](https://www.npmjs.com/package/proxy-extend)
[![Travis](https://img.shields.io/travis/mkrause/proxy-extend.svg)](https://travis-ci.org/mkrause/proxy-extend)

Transparently extend any JS object, using ES6 Proxy.


## Motivation

Given some existing JS value, you may want to add some information to this value without actually modifying the original. The simplest way to do so is to create a *wrapper* around the value:

```js
const someValue = getValue();

const someValueAnnotated = {
    value: someValue,
    status: 'ready',
};
```

One drawback of using a wrapper object, is that the newly annotated value now has a different interface from the original. That means that any consuming code will need to know about the wrapper and "unwrap" it do anything with it.

Using [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), we can make the wrapper have the same interface as the original value, allowing us to pass the wrapped value to any consuming code without the consumer needing to know whether it has been proxied or not.


## Usage

```js
import ProxyExtend from 'proxy-extend';

const user = { name: 'John' }; // Some value to be extended

const userExtended = ProxyExtend(user, { status: 'ready' });

// The extended value has the same interface as the original
userExtended.name; // 'John'
({ ...userExtended }); // { name: 'John' }

// But we can also access our annotation, if we know the name of the key
console.log(userExtended.status); // { status: 'ready' }
````

To make sure that we do not conflict with any existing properties on the original value, it is useful to use a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) as the key of the annotation:

```js
import ProxyExtend from 'proxy-extend';

const user = { name: 'John' };

const meta = Symbol('meta'); // Private symbol

const userExtended = ProxyExtend(user, { [meta]: 'some metadata' });
userExtended.name; // 'John'
userExtended[meta]; // 'some metadata'
````


## Limitations

Due to the nature of `Proxy`, we can only use an object as target value. This library supports any JS object, including plain objects, arrays, functions, and class constructors. We also support a few kinds of primitives by emulating them using objects:

* `null` (using an empty object)
* Strings (using boxed `String`)
* Numbers (using boxed `Number`)
