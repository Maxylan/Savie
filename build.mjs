// @Maxylan
//
import * as esbuild from 'esbuild'

await esbuild.build({
    globalName: 'Savie',
    platform: 'browser',
    format: 'iife', // "Immideatly Invoked Function Expression"
    target: [
        'es2020',
    ],
    sourcemap: 'both', // Change for prod.
    minify: false, // Change for prod.
    bundle: true,
    entryPoints: [
        'src/index.ts', 
        'src/manifest.json', 
        'src/popup/controller.ts',
        'src/popup/savie.html',
        'src/popup/savie.css'
    ],
    assetNames: '[name]',
    loader: {
        '.json': 'copy',
        '.html': 'copy',
        '.png': 'file',
        '.jpg': 'file',
        '.ico': 'file',
        '.svg': 'file'
    },
    outbase: 'src',
    // outfile: 'dist/savie.js'
    outdir: 'dist'
})
