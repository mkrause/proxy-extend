
const target = process.env.BABEL_ENV || 'esm';

module.exports = {
    targets: {
        browsers: [
            'defaults',
            'not IE 11',
            'node 12.13', // Support Node v12.13 LTS (Erbium) or higher
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
