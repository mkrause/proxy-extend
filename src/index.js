
import $msg from 'message-tag';


/*
Similar:
  - https://www.npmjs.com/package/proxy-helpers
*/

/*
Transparently wraps any value, with the exception of:

  - Equality will not work: `ProxyExtend(42) !== 42`.
  - `typeof` will return `object` for strings/numbers (these are "boxed"): `typeof ProxyExtend(42) -== 'object'`.
    (`instanceof` on the other hand will work fine.)
*/

// Version of `hasOwnProperty` that doesn't conflict with an own property
const hasOwnProperty = (obj, propKey) => Object.prototype.hasOwnProperty.call(obj, propKey);

const nodeInspectCustom = Symbol.for('nodejs.util.inspect.custom');


export const proxyKey = Symbol('proxy-wrapper.proxy');

const isObjectLike = value => (typeof value === 'object' && value !== null) || typeof value === 'function';

const handlerMethods = {
    getPrototypeOf({ body, extension }) {
        if (isObjectLike(body)) {
            return Object.getPrototypeOf(body);
        } else {
            return null;
        }
    },
    
    ownKeys({ body, extension }) {
        // Note: `ownKeys` should include non-enumerable keys. Should also include symbol keys.
        
        // Boxed primitives should not expose any own keys
        // if (body instanceof String || body instanceof Number) { return []; }
        
        const bodyKeys = isObjectLike(body) ? Reflect.ownKeys(body) : [];
        
        return bodyKeys;
    },
    
    has({ body, extension }, propKey) {
        if (hasOwnProperty(extension, propKey)) {
            // Note: use `hasOwnProperty` for the extension, rather than `in`, because we do not want to consider
            // properties in the prototype chain as being part of the extension.
            return true;
        }
        
        if (isObjectLike(body) && propKey in body) {
            return true;
        }
        
        // Implement `toJSON` for boxed primitives (otherwise `JSON.stringify` will not work properly).
        if (propKey === 'toJSON') {
            if (body instanceof String || body instanceof Number || Array.isArray(body)) {
                return true;
            }
        }
        
        if (propKey === nodeInspectCustom) { return true; }
        
        if (propKey === proxyKey) { return true; }
        
        return false;
    },
    
    get({ body, extension }, propKey, receiver) {
        let targetProp = undefined;
        if (hasOwnProperty(extension, propKey)) {
            targetProp = extension[propKey];
        } else if (isObjectLike(body) && propKey in body) {
            targetProp = body[propKey];
        } else {
            // Fallback: property is not present in either the body or extension
            
            // Implement `toJSON` for boxed primitives (otherwise `JSON.stringify` will not work properly).
            if (propKey === 'toJSON') {
                if (body instanceof String) {
                    targetProp = body.toString.bind(body);
                } else if (body instanceof Number) {
                    targetProp = body.valueOf.bind(body);
                } else if (Array.isArray(body)) {
                    targetProp = () => body;
                }
            }
            
            if (propKey === nodeInspectCustom) { return () => body; }
            
            if (propKey === proxyKey) {
                return { body, extension };
            }
        }
        
        if (typeof targetProp === 'function') {
            // Some methods of built-in types cannot be proxied, i.e. they need to bound directly to the
            // target. Because they explicitly check the type of `this` (e.g. `Date`), or because they need
            // to access an internal slot of the target (e.g. `String.toString`).
            // https://stackoverflow.com/questions/36394479
            // https://stackoverflow.com/questions/47874488/proxy-on-a-date-object
            const cannotProxy =
                body instanceof String
                || body instanceof Number
                || body instanceof Date
                || body instanceof RegExp;
            
            if (cannotProxy) {
                // Have `this` bound to the original target
                return targetProp.bind(body);
            } else {
                // Unbound (i.e. `this` will be bound to the proxy object, or possibly some other receiver)
                return targetProp;
            }
        } else {
            return targetProp;
        }
    },
    
    getOwnPropertyDescriptor({ body, extension }, propKey) {
        if (hasOwnProperty(extension, propKey)) {
            return {
                value: extension[propKey],
                
                // Make the extension prop non-enumerable, so it does not get copied (e.g. on `{ ...obj }` spread)
                enumerable: false,
                
                // *Must* be configurable (enforced by Proxy), see:
                // https://stackoverflow.com/questions/40921884
                configurable: true,
            };
        } else {
            if (isObjectLike(body)) {
                const descriptor = Object.getOwnPropertyDescriptor(body, propKey);
                
                // Invariant: if we report any property as being non-configurable, then that property must also exist
                // as such on the target. Since our target does not have non-configurable properties, we *must* make
                // sure to report all such properties as configurable (either that or report as non-existent).
                if (!descriptor.configurable) {
                    if (typeof body === 'function' && propKey === 'prototype') {
                        // This is fine, because we use a function for the target anyway
                        return descriptor;
                    }
                    
                    return { ...descriptor, configurable: true };
                } else {
                    return descriptor;
                }
            } else {
                return undefined;
            }
        }
    },
    
    isExtensible() {
        // Invariant: this trap must return the same as `Object.isExtensible(target)`, otherwise a `TypeError` will
        // be thrown (enforced by the engine).
        // Because we use a plain object for the target (which is always extensible), we *must* return `true`.
        
        return true;
    },
    preventExtensions() {
        // Invariant: can only return `true` if the `isExtensible` proxy trap returns `false`.
        
        return false;
    },
    
    setPrototypeOf() { return false; },
    set() { throw new TypeError('Unsupported operation: cannot modify property'); },
    defineProperty() { throw new TypeError('Unsupported operation: cannot define property'); },
    deleteProperty() { throw new TypeError('Unsupported operation: cannot delete property'); },
};

export const ProxyExtend = (value, extension = {}) => {
    let body = value;
    
    // Handle primitive values. Because a Proxy always behaves as an object, we cannot really transparently
    // "simulate" a primitive. However, we use sensible equivalents where possible.
    if (body === undefined) {
        throw new TypeError($msg`Cannot construct proxy, given \`undefined\``);
    } else if (body === null) {
        body = null;
    } else if (typeof value === 'string') {
        body = new String(value);
    } else if (typeof value === 'number') {
        body = new Number(value);
    } else if (typeof value === 'bigint') {
        throw new TypeError($msg`Cannot construct proxy from bigint, given ${value}`);
    } else if (typeof value === 'boolean') {
        // Note: we could use a boxed `Boolean`, but it would not be very useful because there's not much you can
        // do with it. For example, `!new Boolean(false)` is `false`, not `true`.
        throw new TypeError($msg`Cannot construct proxy from boolean, given ${value}`);
    } else if (typeof value === 'symbol') {
        throw new TypeError($msg`Cannot construct proxy from symbol, given ${value}`);
    } else if (typeof value !== 'object' && typeof value !== 'function') {
        // Note: this shouldn't happen, unless there's a new type of primitive added to JS
        throw new TypeError($msg`Cannot construct proxy, given value of unknown type: ${value}`);
    }
    
    // Note: for `Proxy`, the following rule holds:
    // Any non-configurable property of the actual target must occur in the list of properties returned by `ownKeys`.
    // Thus, we want to prevent non-configurable properties existing on our target. That means that the target
    // cannot (for example) be an array, because then we would be required to implement properties like `length`.
    // https://stackoverflow.com/questions/39811021/typeerror-ownkeys-on-proxy-trap
    let target = { body, extension };
    
    // If the body is a function, we need the target to be a function as well, in order to allow the proxy
    // to be callable.
    if (typeof body === 'function') {
        target = function(...args) { return Function.prototype.apply.call(body, this, args); };
        Object.assign(target, body);
        Object.assign(target, { body, extension });
    }
    
    return new Proxy(target, handlerMethods);
};


// Make formatting of proxies a little nicer
export const registerProxyFormatter = () => {
    if (typeof require === 'function') {
        const util = require('util');
        
        if (util.inspect && util.inspect.replDefaults) {
            util.inspect.replDefaults.showProxy = false;
        }
    }
    
    // https://stackoverflow.com/questions/55733647/chrome-devtools-formatter-for-javascript-proxy
    if (typeof window === 'object') {
        const formatter = {
            header(value) {
                if (typeof value !== 'object' || value === null || !(proxyKey in value)) {
                    return null;
                }
                
                return ['object', { object: value[proxyKey].body }];
            },
        };
        
        if (!Array.isArray(window.devtoolsFormatters)) {
            window.devtoolsFormatters = [];
        }
        
        window.devtoolsFormatters.push(formatter);
    }
};


export default ProxyExtend;
