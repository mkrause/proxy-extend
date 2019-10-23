
import chai, { assert, expect } from 'chai';

import extend, { proxyKey } from '../../src/index.js';


const getEnumerableKeys = obj => {
    // `for ... in` will do a lookup for `ownKeys`, but also check each one if it is `enumerable`
    let keys = [];
    for (let key in obj) { keys.push(key); }
    return keys;
};

describe('extend', () => {
    it('should return a proxy', () => {
        const proxy = extend(null, { ext: 42 });
        
        expect(proxy).to.have.property(proxyKey);
        expect(proxy[proxyKey]).to.deep.equal({ value: null, extension: { ext: 42 } });
    });
    
    it('should not allow undefined', () => {
        expect(() => { extend(undefined, { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should simulate null as empty object', () => {
        const proxy = extend(null, { ext: 42 });
        
        expect(typeof proxy).to.equal('object');
        
        expect(Object.getPrototypeOf(proxy)).to.equal(null);
        
        expect(proxy).to.not.equal(null); // Cannot trap equality
        expect(Reflect.ownKeys(proxy)).to.deep.equal([]); // Should be empty
        expect(Object.keys(proxy)).to.deep.equal([]); // Should be empty
    });
    
    it('should simulate string as boxed String', () => {
        const proxy = extend('foo', { ext: 42 });
        
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
        
        // Should be reported as non-configurable
        expect(Reflect.getOwnPropertyDescriptor(proxy, '0')).to.have.property('configurable', false);
        expect(Reflect.getOwnPropertyDescriptor(proxy, 'length')).to.have.property('configurable', false);
        
        // Iteration (will result in a lookup for `Symbol.iterator`)
        expect([...proxy]).to.deep.equal(['f', 'o', 'o']);
    });
    
    it('should simulate number as boxed Number', () => {
        const proxy = extend(42, { ext: 42 });
        
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
    //     expect(() => { extend(10n, { ext: 42 }) }).to.throw(TypeError);
    //     expect(() => { extend(10n, { ext: 42 }) }).to.throw(TypeError);
    // });
    
    it('should not allow boolean', () => {
        expect(() => { extend(true, { ext: 42 }) }).to.throw(TypeError);
        expect(() => { extend(false, { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should not allow symbol', () => {
        expect(() => { extend(Symbol('symbol'), { ext: 42 }) }).to.throw(TypeError);
    });
    
    it('should support proxying arrays', () => {
        const proxy = extend(['a', 'b', 'c'], { ext: 42 });
        
        expect(typeof proxy).to.equal('object');
        expect(proxy).to.be.an.instanceOf(Array);
        
        expect(JSON.stringify(proxy)).to.equal(`["a","b","c"]`);
        
        expect(proxy.slice(0, 2)).to.deep.equal(['a', 'b']);
        
        // An array has as its own properties its numeric indices, and the `length`. Of these, `length`
        // is non-configurable, as well as non-enumerable.
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['0', '1', '2', 'length']);
        const enumerableKeys = getEnumerableKeys(proxy);
        expect(enumerableKeys).to.deep.equal(['0', '1', '2']);
        
        // Should be reported as non-configurable
        expect(Reflect.getOwnPropertyDescriptor(proxy, 'length')).to.have.property('configurable', false);
        
        // Iteration (will result in a lookup for `Symbol.iterator`)
        expect([...proxy]).to.deep.equal(['a', 'b', 'c']);
    });
    
    it('should support proxying arrow functions', () => {
        const proxy = extend((a, b) => a + b, { ext: 42 });
        
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
        const proxy = extend(function myFunc(a, b) { return a + b; }, { ext: 42 });
        
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
        const proxy = extend(null, { ext: 42 });
        
        expect(proxy).to.have.property('ext', 42);
    });
    
    it('should override the existing property in case of name clash', () => {
        const proxy = extend({ x: 42 }, { x: 43 });
        
        expect(proxy).to.have.property('x', 43);
    });
    
    it('should allow symbols as extension keys', () => {
        const sym = Symbol('sym');
        
        const proxy = extend(null, { [sym]: 'internal' });
        
        expect(proxy).to.have.property(sym, 'internal');
        expect(proxy[sym]).to.equal('internal');
    });
    
    it('should flatten nested proxies', () => {
        const subproxy = extend({ name: 'John' }, { ext1: 1, ext2: 2 });
        const proxy = extend(subproxy, { ext2: 'override' });
        
        expect(proxy).to.have.property('name', 'John');
        expect(proxy).to.deep.equal({ name: 'John' });
        expect(proxy).to.have.property('ext1', 1);
        expect(proxy).to.have.property('ext2', 'override');
        expect(proxy[proxyKey]).to.deep.equal({
            value: { name: 'John' },
            extension: { ext1: 1, ext2: 'override' },
        });
    });
    
    it('should allow checking reference equality through `proxyKey`', () => {
        const subject = { name: 'John' };
        const proxy = extend(subject, {
            ext: 42,
            is(other) { return this[proxyKey].value === other; },
        });
        
        expect(proxy).to.not.equal(subject);
        expect(proxy.is(subject)).to.be.true;
    });
    
    
    it('should allow getting property descriptors', () => {
        const value = { name: 'John' };
        const proxy = extend(value, { ext: 42 });
        
        expect(Object.getOwnPropertyDescriptor(proxy, 'name')).to.deep.equal(
            Object.getOwnPropertyDescriptor(value, 'name')
        );
        
        // Extension properties are not own properties, so should not have an own property descriptor
        expect(Object.getOwnPropertyDescriptor(proxy, 'ext')).to.equal(undefined);
    });
    
    it('should work with getter properties', () => {
        const value = {
            firstName: 'John',
            lastName: 'Doe',
            get name() { return `${this.firstName} ${this.lastName}`; },
            get nameWithExt() { return `${this.name} [ext=${this.ext}]`; },
        };
        const proxy = extend(value, { ext: 42 });
        
        expect(proxy.name).to.equal('John Doe');
        
        // Getters will receive the orginal value as their `this` value. We can fix this (see the source),
        // but doing so has a costly impact on performance, so we do not support it at the moment.
        expect(proxy.nameWithExt).to.equal('John Doe [ext=undefined]');
    });
    
    it('should work with setter properties', () => {
        const value = {
            firstName: 'John',
            lastName: 'Doe',
            set name(name) {
                const nameParts = name.split(' ');
                this.firstName = nameParts[0];
                this.lastName = nameParts[1];
            },
            set nameWithExt(name) {
                const nameParts = name.split(' ');
                this.firstName = nameParts[0];
                this.lastName = nameParts[1] + ` [ext=${this.ext}]`;
            },
        };
        const proxy = extend(value, { ext: 42 });
        
        proxy.name = 'Jane Smith';
        expect(proxy.firstName).to.equal('Jane');
        expect(proxy.lastName).to.equal('Smith');
        
        // Setters *do* get access to the extension
        proxy.nameWithExt = 'Jane Smith';
        expect(proxy.lastName).to.equal('Smith [ext=42]');
    });
    
    it('should allow spreading to get only the value properties', () => {
        const proxy = extend({ name: 'John', score: 10 }, { ext: 42 });
        
        expect({ ...proxy }).to.deep.equal({ name: 'John', score: 10 });
    });
    
    it('should support non-extensible objects', () => {
        const nonextensible = Object.preventExtensions({ x: 42 });
        
        const proxy = extend(nonextensible, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
        
        expect(Object.isExtensible(proxy)).to.be.false;
        
        // Attempt to extend
        expect(() => { proxy.foo = true; }).to.throw(TypeError, /object is not extensible/i);
        
        // Attempt to configure
        Object.defineProperty(proxy, 'x', { value: 42, configurable: true });
        expect(Object.getOwnPropertyDescriptor(proxy, 'x')).to.have.property('configurable', true); // Should work
        
        // Attempt to write
        proxy.x = 43;
        expect(proxy).to.have.property('x', 43); // Should work
    });
    
    it('should support sealed objects', () => {
        const sealed = Object.seal({ x: 42 });
        
        const proxy = extend(sealed, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
        
        expect(Object.isExtensible(proxy)).to.be.false;
        expect(Object.isSealed(proxy)).to.be.true;
        
        // Attempt to extend
        expect(() => { proxy.foo = true; }).to.throw(TypeError, /object is not extensible/i);
        
        // Attempt to configure
        expect(() => { Object.defineProperty(proxy, 'x', { value: 42, configurable: true }); })
            .to.throw(TypeError, /cannot redefine/i);
        
        // Attempt to write
        proxy.x = 43;
        expect(proxy).to.have.property('x', 43); // Should work
    });
    
    it('should support frozen objects', () => {
        const frozen = Object.freeze({ x: 42 });
        
        const proxy = extend(frozen, { ext: 42 });
        
        expect(Reflect.ownKeys(proxy)).to.deep.equal(['x']);
        
        expect(Object.isExtensible(proxy)).to.be.false;
        expect(Object.isFrozen(proxy)).to.be.true;
        
        // Attempt to extend
        expect(() => { proxy.foo = true; }).to.throw(TypeError, /object is not extensible/i);
        
        // Attempt to configure
        expect(() => { Object.defineProperty(proxy, 'x', { value: 42, configurable: true }); })
            .to.throw(TypeError, /cannot redefine/i);
        
        // Attempt to write
        expect(() => { proxy.x = 43; }).to.throw(TypeError, /read only/i);
    });
    
    it('should work with classes', () => {
        class User {
            constructor(name) {
                this.name = name;
            }
        }
        
        const proxy = extend(new User('John'), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(User);
    });
    
    it('should work with class constructors', () => {
        class User {
            constructor(name) {
                this.name = name;
            }
        }
        
        const proxy = extend(User, { ext: 42 });
        
        expect(typeof proxy).to.equal('function');
        
        const instance = new proxy('John');
        expect(instance).to.be.an.instanceOf(User);
    });
    
    it('should support built-in Error', () => {
        const proxy = extend(new Error('some error'), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(Error);
        expect(proxy.message).to.equal('some error');
    });
    
    it('should support built-in Date', () => {
        const proxy = extend(new Date(977711040000), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(Date);
        expect(+proxy).to.equal(977711040000);
        expect(proxy.valueOf()).to.equal(977711040000);
    });
    
    it('should support built-in RegExp', () => {
        const proxy = extend(/foo/, { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(RegExp);
        expect(proxy.lastIndex).to.equal(0);
    });
    
    it('should support built-in Map', () => {
        const proxy = extend(new Map([['x', 42], ['y', 10]]), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(Map);
        expect(proxy.get('x')).to.equal(42);
    });
    
    it('should support built-in Set', () => {
        const proxy = extend(new Set([1, 2, 3]), { ext: 42 });
        
        expect(proxy).to.be.an.instanceOf(Set);
        expect(proxy.has(2)).to.equal(true);
    });
});
