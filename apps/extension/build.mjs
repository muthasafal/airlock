// Bundles the extension into dist/ (load it unpacked from chrome://extensions).
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('static', 'dist', { recursive: true });

const common = { bundle: true, minify: true, sourcemap: false, target: 'chrome138', logLevel: 'info' };
await build({ ...common, entryPoints: ['src/background.ts'], outfile: 'dist/background.js', format: 'esm' });
await build({ ...common, entryPoints: ['src/content.ts'], outfile: 'dist/content.js', format: 'iife' });
await build({ ...common, entryPoints: ['src/popup.ts'], outfile: 'dist/popup.js', format: 'esm' });
await build({ ...common, entryPoints: ['src/sidepanel.ts'], outfile: 'dist/sidepanel.js', format: 'esm' });
