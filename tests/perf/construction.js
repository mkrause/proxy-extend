
const b = require('benny');
const extend = require('../..').default;


b.suite(
    'Construction',
    
    b.add('Without proxy', () => {
        ({ x: Math.random() });
    }),
    
    b.add('With bare Proxy', () => {
        new Proxy({ x: Math.random() }, {});
    }),
    
    b.add('With proxy-extend', () => {
        extend({ x: Math.random() });
    }),
    
    b.cycle(),
    b.complete(),
);
