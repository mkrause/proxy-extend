
# proxy-extend

[![npm](https://img.shields.io/npm/v/proxy-extend.svg?style=flat-square)](https://www.npmjs.com/package/proxy-extend)
[![Travis](https://img.shields.io/travis/mkrause/proxy-extend.svg?style=flat-square)](https://travis-ci.org/mkrause/proxy-extend)
![MIT](https://img.shields.io/npm/l/proxy-extend?style=flat-square)
![TypeScript](https://img.shields.io/badge/-TypeScript-blue.svg?style=flat-square)


Transparently extend any JS object, using ES6 Proxy.


## Motivation

Given some existing JS value, you may want to "annotate" it with some additional information (e.g. for bookkeeping purposes), without actually modifying the original. The simplest way to do so is to create a *wrapper* around the value:

```js
const someValue = getValue();

const someValueAnnotated = {
    value: someValue,
    status: 'ready',
};
```

One drawback of using a wrapper object, is that the newly annotated value now has a different interface from the original. That means that any consuming code will need to know about the wrapper and "unwrap" it to do anything with it.

Another possibility is to create a copy of the value, and set the new property on that (e.g. `{ ...someValue, status: 'ready' }`), but this has its own issues once you need to extend something more complex than a plain object (prototypes are not preserved, need to take care to preserve non-enumerable properties, doesn't work with functions or primitives, etc.)

Using [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), we can make the wrapper have the same interface as the original value, allowing us to pass the wrapped value to any consuming code without the consumer needing to know whether it has been proxied or not.


## Usage

To import the library:

```js
import extend from 'proxy-extend';
````

Basic usage:

```js
const user = { name: 'John' }; // Some value to be extended

const userExtended = extend(user, { status: 'ready' });

// The extended value has the same interface as the original
userExtended.name; // 'John'
({ ...userExtended }); // { name: 'John' }

// But we can also access our annotation, if we know the key
userExtended.status; // 'ready'
```

To make sure that we do not conflict with any existing properties on the original value, it is useful to use a [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) as the key of the annotation:

```js
const user = { name: 'John' };

const meta = Symbol('meta'); // Private symbol

const userExtended = extend(user, { [meta]: 'some metadata' });
userExtended.name; // 'John'
userExtended[meta]; // 'some metadata'
```

Prototypes are preserved:

```js
class User {
    constructor(name) {
        this.name = name;
    }
}

const meta = Symbol('meta'); // Private symbol

const userExtended = extend(new User('John'), { [meta]: 'some metadata' });
userExtended instanceof User; // true
userExtended[meta]; // 'some metadata'
```

Can also proxy functions and constructors:

```js
const fn = (a, b) => a + b;
extend(fn)(2, 3) === 5; // Works

class MyClass {}
new extend(MyClass); // Works
```


## API

```js
import extend, { proxyKey } from 'proxy-extend';
```

* ```js
  extend(value, extension = {})
  ```
  Returns a proxy representing the given `value`, extended with the properties of the `extension`. If `value` is already a proxy (created using `extend`), it will flatten the result to prevent nested proxies.
  
* ```js
  proxyKey
  ```
  A unique symbol that can be used to retrieve the original value and extension:
  
  ```js
  proxy[proxyKey].value; // The original value
  proxy[proxyKey].extension; // The extension object
  ```


## Limitations

**Primitives**

Due to the nature of `Proxy`, we can only use an object as target value. This library supports any JS object, including plain objects, arrays, functions, and class constructors. We also support a few kinds of primitives by emulating them using objects:

* `null` (using an empty object, with `null` prototype)
* Strings (using boxed `String`)
* Numbers (using boxed `Number`)

**Reference equality**

You cannot use `==` to check equality, the proxy is a different reference:

```js
const value = { x: 42 };
const proxy = extend(value);

value !== proxy; // Reference equality does not hold
```

Instead, you can use `proxyKey` to access the original value:

```js
import extend, { proxyKey } from 'proxy-extend';

proxy[proxyKey].value === value;

// Or, you may want to add a convenience method:
const value = { x: 42 };
const proxy = extend(value, {
    is(other) { return this[proxyKey].value === other; },
});
proxy.is(value) === true;
```

For primitives, you can use `.valueOf()`, or cast using a constructor:

```js
const proxyString = extend('foo');
proxyString !== 'foo'; // Won't work

proxyString.valueOf() === 'foo'; // Get primitive value
String(proxyString) === 'foo'; // Or, cast to string using `String` constructor
```


## Similar libraries

- [proxy-merge](https://www.npmjs.com/package/proxy-merge)
- [proxy-link](https://www.npmjs.com/package/proxy-link)
