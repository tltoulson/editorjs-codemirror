import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
    {
        input: './src/index.js',
        output: {
            file: './dist/index.mjs',
            format: 'es',
            name: 'CodeMirrorTool'
        },
        plugins: [nodeResolve()]
    },
    {
        input: './src/index.js',
        output: {
            file: './dist/index.js',
            format: 'umd',
            name: 'CodeMirrorTool'
        },
        plugins: [nodeResolve()]
    },
]