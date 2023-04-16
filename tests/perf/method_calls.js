
import b from 'benny';
import extend from '../../src/proxyExtend.js';


b.suite(
    'Method calls',
    
    b.add('Without proxy', () => {
        const value = new String('foo');
        
        return () => {
            value.toString();
        };
    }),
    
    b.add('With bare Proxy', () => {
        const str = 'foo';
        const value = new Proxy(new String(str), {});
        
        return () => {
            // Need to explicitly `call` to set the right `this` value
            value.toString.call(str);
        };
    }),
    
    b.add('With proxy-extend', () => {
        const value = extend('foo');
        
        return () => {
            // Will create a new bound function on every invocation
            value.toString();
        };
    }),
    
    b.cycle(),
    b.complete(),
);
