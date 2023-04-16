
const target = process.env.BABEL_ENV || 'esm';

module.exports = {
    targets: {
        browsers: [
            'defaults',
            'node 14.15', // Support Node v14.15 (Fermium) LTS or higher
        ],
    },
    presets: [
        ['@babel/env', {
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
