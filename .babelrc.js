
const target = process.env.BABEL_ENV || 'esm';

module.exports = {
    presets: [
        ['@babel/env', {
            targets: {
                browsers: [
                    'node 8.9', // Support Node v8.9 LTS (Carbon)
                    '>0.1%',
                    'not dead',
                    'not OperaMini all',
                    'not IE < 11',
                    'last 2 Edge versions',
                ],
            },
            
            // Do not include polyfills automatically. Leave it up to the consumer to include the right polyfills
            // for their required environment.
            useBuiltIns: false,
            
            // Whether to transpile modules
            modules: target === 'cjs' ? 'commonjs' : false,
        }],
    ],
    plugins: [
    ],
};
