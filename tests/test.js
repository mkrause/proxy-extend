
import chai, { assert, expect } from 'chai';

import ProxyWrapper, { proxyKey } from '../src/index.js';


const getEnumerableKeys = obj => {
    // `for ... in` will do a lookup for `ownKeys`, but also check each one if it is `enumerable`
    let keys = [];
    for (let key in obj) { keys.push(key); }
    return keys;
};

describe('ProxyWrapper', () => {
    it('should return a proxy', () => {
        const proxy = ProxyWrapper(null, { ext: 42 });
        
        expect(proxy).to.have.property(proxyKey);
    });
    
    it('should not allow undefined', () => {
        expect(() => { ProxyWrapper(undefined, { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should simulate null as empty object', () => {
        const proxy = ProxyWrapper(null, { ext: 42 });
        
        expect(typeof proxy).to.equal('object');
        
        try {
            expect(Object.getPrototypeOf(proxy)).to.equal(null);
        } catch (e) {
            // This is a known bug in V8 v7.7 (the version shipping in Node v12 up to at least v12.12):
            // https://bugs.chromium.org/p/v8/issues/detail?id=9781
            // Returning `null` from the `getPrototypeOf` trap triggers an exception even though it shouldn't.
            if (/trap returned neither object nor null/.test(e.message)) {
                // ignore
            } else {
                throw e;
            }
        }
        
        expect(proxy).to.not.equal(null); // Cannot trap equality
        expect(Reflect.ownKeys(proxy)).to.deep.equal([]); // Should be empty
        expect(Object.keys(proxy)).to.deep.equal([]); // Should be empty
    });
    
    it('should simulate string as boxed String', () => {
        const proxy = ProxyWrapper('foo', { ext: 42 });
        
        expect(typeof proxy).to.equal('object'); // Cannot trap `typeof`, must be object
        expect(proxy).to.be.an.instanceOf(String);
        
        expect(String(proxy)).to.equal('foo');
        expect(proxy.valueOf()).to.equal('foo');
        
        expect(proxy.toJSON()).to.equal('foo'); // Should also support `toJSON` (to make `JSON.stringify` work)
        expect(JSON.stringify(proxy)).to.equal(`"foo"`);
        
        expect(proxy.substring(0, 2)).to.equal('fo');
        
        // Note: in JS, a boxed string is treated as an array when iterated over.
        // - `Reflect.ownKeys(new String('foo'))` equals `['0', '1', '2', 'length']` (i.e. array-like)
        // - All of these properties are non-configurable.
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['0', '1', '2', 'length']);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal(['0', '1', '2']);
        
        // We need these own properties to be reported as configurable
        expect(Reflect.getOwnPropertyDescriptor(proxy, '0')).to.have.property('configurable', true);
        expect(Reflect.getOwnPropertyDescriptor(proxy, 'length')).to.have.property('configurable', true);
        
        // Iteration (will result in a lookup for `Symbol.iterator`)
        expect([...proxy]).to.deep.equal(['f', 'o', 'o']);
    });
    
    it('should simulate number as boxed Number', () => {
        const proxy = ProxyWrapper(42, { ext: 42 });
        
        expect(typeof proxy).to.equal('object'); // Cannot trap `typeof`, must be object
        expect(proxy).to.be.an.instanceOf(Number);
        
        expect(Number(proxy)).to.equal(42);
        expect(proxy.valueOf()).to.equal(42);
        expect(+proxy).to.equal(42);
        
        expect(proxy.toJSON()).to.equal(42); // Should also support `toJSON` (to make `JSON.stringify` work)
        expect(JSON.stringify(proxy)).to.equal(`42`);
        
        // `Reflect.ownKeys(new Number(42))` equals `[]`
        expect(Reflect.ownKeys(proxy)).to.deep.equal([]);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal([]);
        
        expect(proxy + 1).to.equal(43);
    });
    
    // XXX disable bigint test for now, because we cannot reliably run this test on Node v8.x. We can transpile
    // with `plugin-syntax-bigint`, but we would need a transform to actually simulate bigint.
    // it('should not allow bigint', () => {
    //     expect(() => { ProxyWrapper(10n, { ext: 42 }) }).to.throw(TypeError);
    //     expect(() => { ProxyWrapper(10n, { ext: 42 }) }).to.throw(TypeError);
    // });
    
    it('should not allow boolean', () => {
        expect(() => { ProxyWrapper(true, { ext: 42 }) }).to.throw(TypeError);
        expect(() => { ProxyWrapper(false, { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should not allow symbol', () => {
        expect(() => { ProxyWrapper(Symbol('symbol'), { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should support proxying arrays', () => {
        const proxy = ProxyWrapper(['a', 'b', 'c'], { ext: 42 });
        
        expect(typeof proxy).to.equal('object');
        expect(proxy).to.be.an.instanceOf(Array);
        
        expect(JSON.stringify(proxy)).to.equal(`["a","b","c"]`);
        
        expect(proxy.slice(0, 2)).to.deep.equal(['a', 'b']);
        
        // An array has as its own properties its numeric indices, and the `length`. Of these, `length`
        // is non-configurable, as well as non-enumerable.
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['0', '1', '2', 'length']);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal(['0', '1', '2']);
        
        // We need `length` to be reported as configurable
        expect(Reflect.getOwnPropertyDescriptor(proxy, 'length')).to.have.property('configurable', true);
        
        // Iteration (will result in a lookup for `Symbol.iterator`)
        expect([...proxy]).to.deep.equal(['a', 'b', 'c']);
    });
    
    it('should support proxying arrow functions', () => {
        const proxy = ProxyWrapper((a, b) => a + b, { ext: 42 });
        
        expect(typeof proxy).to.equal('function'); // Proxied functions get the proper `typeof`
        expect(proxy).to.be.an.instanceOf(Function);
        
        // Should be callable
        expect(proxy(42, 1)).to.equal(43);
        
        const fixArrowFunctionKeys = keys => {
            // If transpiled, arrow functions will get converted to regular functions (with a `prototype` key)
            return keys.filter(key => key !== 'prototype');
        };
        
        // An arrow function has as its own properties `length` and `name`. Both are configurable, both are
        // non-enumerable.
        expect(fixArrowFunctionKeys(Reflect.ownKeys(proxy))).to.deep.equal(['length', 'name']);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal([]);
    });
    
    it('should support proxying regular functions', () => {
        const proxy = ProxyWrapper(function myFunc(a, b) { return a + b; }, { ext: 42 });
        
        expect(typeof proxy).to.equal('function'); // Proxied functions get the proper `typeof`
        expect(proxy).to.be.an.instanceOf(Function);
        
        // Should be callable
        expect(proxy(42, 1)).to.equal(43);
        
        // A function has as its own properties `length`, `name`, and `prototype`. Of these, `prototype` is
        // non-configurable.
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['length', 'name', 'prototype']);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal([]);
        
        // `prototype` should be reported as non-configurable
        expect(Reflect.getOwnPropertyDescriptor(proxy, 'prototype')).to.have.property('configurable', false);
    });
    
    it('should allow accessing extension properties', () => {
        const proxy = ProxyWrapper(null, { ext: 42 });
        
        expect(proxy).to.have.property('ext', 42);
        expect(proxy.ext).to.equal(42);
    });
    
    it('should allow symbols as extension keys', () => {
        const sym = Symbol('sym');
        
        const proxy = ProxyWrapper(null, { [sym]: 'internal' });
        
        expect(proxy).to.have.property(sym, 'internal');
        expect(proxy[sym]).to.equal('internal');
    });
    
    it('should allow getting property descriptors', () => {
        const body = { name: 'John' };
        const proxy = ProxyWrapper(body, { ext: 42 });
        
        expect(Object.getOwnPropertyDescriptor(proxy, 'name')).to.deep.equal(
            Object.getOwnPropertyDescriptor(body, 'name')
        );
        expect(Object.getOwnPropertyDescriptor(proxy, 'ext')).to.deep.equal({
            value: 42,
            enumerable: false,
            configurable: true,
            writable: false,
        });
    });
    
    it('should allow spreading to get only the body properties', () => {
        const proxy = ProxyWrapper({ name: 'John', score: 10 }, { ext: 42 });
        
        expect({ ...proxy }).to.deep.equal({ name: 'John', score: 10 });
    });
    
    it('should work with classes', () => {
        class User {
            constructor(name) {
                this.name = name;
            }
        }
        
        const proxy = ProxyWrapper(new User('John'), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(User);
    });
    
    it('should work with class constructors', () => {
        class User {
            constructor(name) {
                this.name = name;
            }
        }
        
        const proxy = ProxyWrapper(User, { ext: 42 });
        
        expect(typeof proxy).to.equal('function');
        
        const instance = new proxy('John');
        expect(instance).to.be.an.instanceOf(User);
    });
    
    it('should support built-in Date', () => {
        const proxy = ProxyWrapper(new Date(977711040000), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(Date);
        expect(+proxy).to.equal(977711040000);
        expect(proxy.valueOf()).to.equal(977711040000);
    });
        
    it('should support built-in RegExp', () => {
        const proxy = ProxyWrapper(/foo/, { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(RegExp);
        expect(proxy.lastIndex).to.equal(0);
    });
    
    it('should support non-extensible objects', () => {
        const nonextensible = Object.preventExtensions({ x: 42 });
        
        const proxy = ProxyWrapper(nonextensible, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
    });
    
    it('should support frozen objects', () => {
        const frozen = Object.freeze({ x: 42 });
        
        const proxy = ProxyWrapper(frozen, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
    });
    
    it('should support sealed objects', () => {
        const sealed = Object.seal({ x: 42 });
        
        const proxy = ProxyWrapper(sealed, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
    });
});
