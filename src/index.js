
import $msg from 'message-tag';


// Version of `hasOwnProperty` that doesn't conflict
const hasOwnProperty = (obj, propKey) => Object.prototype.hasOwnProperty.call(obj, propKey);

// Cache some values
const nullObject = Object.create(null);
const TypedArray = Object.getPrototypeOf(Int8Array);
const nodeInspectCustom = Symbol.for('nodejs.util.inspect.custom');


export const proxyKey = Symbol('proxy-wrapper.proxy');

export const extend = (_value, _extension = nullObject) => {
    let value = _value;
    let extension = _extension;
    
    // Check if the given value is already a proxy with extension. If so, flatten.
    if (typeof value === 'object' && value !== null && proxyKey in value) {
        const unproxied = value[proxyKey];
        value = unproxied.value;
        extension = { ...unproxied.extension, ...extension };
    }
    
    let isString = false;
    let isNumber = false;
    
    // Handle primitive values. Because a Proxy always behaves as an object, we cannot really transparently
    // "simulate" a primitive. However, we use sensible equivalents where possible.
    const valueType = typeof value;
    let target = value;
    if (valueType === 'undefined') {
        throw new TypeError($msg`Cannot construct proxy, given \`undefined\``);
    } else if (value === null) {
        target = nullObject;
    } else if (valueType === 'string') {
        target = new String(value);
        isString = true;
    } else if (valueType === 'number') {
        target = new Number(value);
        isNumber = true;
    } else if (valueType === 'bigint') {
        throw new TypeError($msg`Cannot construct proxy from bigint, given ${value}`);
    } else if (valueType === 'boolean') {
        // Note: we could use a boxed `Boolean`, but it would not be very useful because there's not much you can
        // do with it. Boxed booleans (including `new Boolean(false)`) are treated as truthy in logic operations.
        throw new TypeError($msg`Cannot construct proxy from boolean, given ${value}`);
    } else if (valueType === 'symbol') {
        throw new TypeError($msg`Cannot construct proxy from symbol, given ${value}`);
    } else if (valueType !== 'object' && valueType !== 'function') {
        // Note: this shouldn't happen, unless there's a new type of primitive added to JS
        throw new TypeError($msg`Cannot construct proxy, given value of unknown type ${valueType}`);
    }
    
    // Some methods of built-in types cannot be proxied, i.e. they need to bound directly to the
    // target. Because they explicitly check the type of `this` (e.g. `Date`), or because they need
    // to access an internal slot of the target (e.g. `String.toString`).
    // https://stackoverflow.com/questions/36394479/proxies-on-regexps-and-boxed-primitives
    // https://stackoverflow.com/questions/47874488/proxy-on-a-date-object
    // https://stackoverflow.com/questions/43927933/why-is-set-incompatible-with-proxy
    const usesInternalSlots =
        target instanceof String
        || target instanceof Number
        || target instanceof Boolean
        || target instanceof Date
        || target instanceof RegExp
        || target instanceof Map
        || target instanceof WeakMap
        || target instanceof Set
        || target instanceof WeakSet
        || target instanceof ArrayBuffer
        || target instanceof TypedArray;
    
    
    const handler = {
        has(target, propKey) {
            if (hasOwnProperty(extension, propKey)) {
                // Note: use `hasOwnProperty` for the extension, rather than `in`, because we do not want to
                // consider properties in the prototype chain as being part of the extension.
                return true;
            }
            
            // Implement `toJSON` for boxed primitives (otherwise `JSON.stringify` will not work properly).
            if (propKey === 'toJSON' && (isString || isNumber)) { return true; }
            
            if (propKey === nodeInspectCustom) { return true; }
            if (propKey === proxyKey) { return true; }
            
            return Reflect.has(target, propKey);
        },
        
        get(target, propKey, receiver) {
            // Backdoor to get the original value, and the extension.
            // Note: use `value` here, not `target` (target is just an internal representation).
            if (propKey === proxyKey) { return { value, extension }; }
            
            let targetProp = undefined;
            if (hasOwnProperty(extension, propKey)) {
                targetProp = extension[propKey];
            } else if (propKey in target) {
                targetProp = target[propKey];
                
                // Note: any getter properties will receive the `target`, rather than the proxy as their `this`
                // value. Thus, getters will not have access to the extension. If you really need this behavior,
                // you can use the following. But it's not recommended, due to the impact on performance.
                /*
                if (hasOwnProperty(target, propKey)) {
                    const descriptor = Object.getOwnPropertyDescriptor(target, propKey);
                    if (typeof descriptor.get === 'function') {
                        targetProp = descriptor.get.call(receiver);
                    }
                }
                */
            } else {
                // Fallback: property is not present in either the target or extension
                
                // Implement `toJSON` for boxed primitives (otherwise `JSON.stringify` will not work properly).
                if (propKey === 'toJSON') {
                    if (isString) {
                        targetProp = target.toString.bind(target);
                    } else if (isNumber) {
                        targetProp = target.valueOf.bind(target);
                    }
                }
                
                if (propKey === nodeInspectCustom) { targetProp = () => target; }
            }
            
            if (typeof targetProp === 'function') {
                if (usesInternalSlots) {
                    // Have `this` bound to the original target
                    return targetProp.bind(target);
                } else {
                    // Unbound (i.e. `this` can be bound to anything, usually will be the proxy object)
                    return targetProp;
                }
            } else {
                return targetProp;
            }
        },
    };
    
    return new Proxy(target, handler);
};

export const isProxy = value => {
    if (typeof value !== 'object' || value === null || !(proxyKey in value)) {
        return false;
    } else {
        return true;
    }
};

export const unwrapProxy = proxy => {
    if (!isProxy(proxy)) {
        throw new TypeError($msg`Cannot unwrap input, expected a proxy, received: ${proxy}`);
    }
    
    return proxy[proxyKey];
};

// Add some properties to `extend` as shorthand
extend.is = isProxy;
extend.unwrap = unwrapProxy;

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
        if (!Array.isArray(window.devtoolsFormatters)) {
            window.devtoolsFormatters = [];
        }
        
        window.devtoolsFormatters.push({
            header(value) {
                if (typeof value !== 'object' || value === null || !(proxyKey in value)) {
                    return null;
                }
                
                return ['object', { object: value[proxyKey].value }];
            },
        });
    }
};


export default extend;
