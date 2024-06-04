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
    minify: true, // `true` for prod.
    bundle: true,
    entryPoints: [
        'src/index.ts',
        'src/index.css',
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
});

await esbuild.build({
    globalName: 'SaviePopup',
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    format: 'iife', // "Immideatly Invoked Function Expression"
    target: [
        'esnext',
	    'firefox121',
	    'chrome121'
    ],
    sourcemap: 'both', // Change for prod.
    minify: true, // `true` for prod.
    bundle: true,
    entryPoints: [
        'src/popup/controller.ts',
        'src/popup/savie.html',
    ],
    assetNames: '[name]',
    loader: {
        '.json': 'copy',
        '.html': 'copy',
        '.png': 'file',
        '.ico': 'file',
    },
    outbase: 'src',
    outdir: 'ext/bundle/popup'
})
