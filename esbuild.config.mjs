import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs';

mkdir('public', (err) => {
    if (err) throw err;
    console.log('ディレクトリ作成完了: ./public')
});

build({
    entryPoints: ['src/index.js','src/chat.js'],
    outdir: 'public',
    bundle: true,
    minify: true,
    sourcemap: 'linked',
});

copyFile('src/index.html', 'public/index.html', (err) => {
    if (err) throw err;
    console.log('コピー完了: src/index.html to public/index.html');
});

copyFile('src/chat.html', 'public/chat.html', (err) => {
    if (err) throw err;
    console.log('コピー完了: src/chat.html to public/chat.html');
});

copyFile('src/chat.css', 'public/chat.css', (err) => {
    if (err) throw err;
    console.log('コピー完了: src/chat.css to public/chat.css');
});