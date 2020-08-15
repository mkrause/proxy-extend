
const target = process.env.BABEL_ENV || 'esm';

module.exports = {
    presets: [
        ['@babel/env', {
            targets: {
                browsers: [
                    'node 10.13', // Support Node v10.13 LTS (Dubnium) or higher
                    'last 2 Chrome versions',
                    'last 2 Firefox versions',
                    'last 2 Safari versions',
                    'last 2 Edge versions',
                    '>0.1%',
                    'not dead',
                    'not OperaMini all',
                    'not IE < 11',
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
