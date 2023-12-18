import { build } from 'esbuild';
import { copyFile } from 'node:fs';

build({
    entryPoints: ['src/index.js'],
    outdir: 'public',
    bundle: true,
    minify: true,
    sourcemap: 'linked',
});

copyFile('src/index.html', 'public/index.html', (err) => {
    if (err) throw err;
    console.log('コピー完了: src/index.html to public/index.html');
});