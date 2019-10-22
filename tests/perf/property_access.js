
const b = require('benny');
const extend = require('../..').default;


b.suite(
    'Property access',
    
    b.add('Without proxy', () => {
        const obj = { x: Math.random() };
        
        return () => {
            obj.x;
        };
    }),
    
    b.add('With bare Proxy', () => {
        const obj = new Proxy({ x: Math.random() }, {});
        
        return () => {
            obj.x;
        };
    }),
    
    b.add('With proxy-extend', () => {
        const obj = extend({ x: Math.random() });
        
        return () => {
            obj.x;
        };
    }),
    
    b.cycle(),
    b.complete(),
);
