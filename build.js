// @Maxylan
//
import * as esbuild from 'esbuild'

await esbuild.build({
    globalName: 'Savie',
    platform: 'browser',
    format: 'iife', // "Immideatly Invoked Function Expression"
    packages: 'external',
    target: [
        'es2020',
        'chrome58',
        'edge16',
        'firefox57',
        'node12',
        'safari11'
    ],
    sourcemap: 'both', // Change for prod.
    minify: false, // Change for prod.
    bundle: true,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/savie.js'
})
