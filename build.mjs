// @Maxylan
//
import * as esbuild from 'esbuild'

await esbuild.build({
    globalName: 'Savie',
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    format: 'iife', // "Immideatly Invoked Function Expression"
    target: [
        'esnext',
	    'firefox121',
	    'chrome121'
    ],
    sourcemap: 'both', // Change for prod.
    minify: true, // Change for prod.
    bundle: true,
    entryPoints: [
        'src/manifest.json',
        'src/index.ts',
        'src/popups',
        'src/icons',
    ],
    assetNames: '[name]',
    loader: {
        '.json': 'copy',
        '.html': 'copy',
        '.png': 'file',
        '.ico': 'file',
    },
    outbase: 'src',
    outdir: 'ext/bundle'
})
