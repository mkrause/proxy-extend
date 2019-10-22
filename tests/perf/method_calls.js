
const b = require('benny');
const extend = require('../..').default;


b.suite(
    'Method calls',
    
    b.add('Without proxy', () => {
        const value = new String('foo');
        
        return () => {
            value.toString();
        };
    }),
    
    b.add('With proxy-extend', () => {
        const value = extend('foo');
        
        return () => {
            value.toString();
        };
    }),
    
    b.cycle(),
    b.complete(),
);
