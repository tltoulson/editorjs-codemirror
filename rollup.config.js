import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
    {
        input: './src/index.js',
        output: {
            file: './dist/bundle.js',
            format: 'es',
            name: 'CodeMirrorTool'
        },
        plugins: [nodeResolve()]
    },
    {
        input: './src/index.js',
        output: {
            file: './example/bundle.js',
            format: 'umd',
            name: 'CodeMirrorTool'
        },
        plugins: [nodeResolve()]
    },
]