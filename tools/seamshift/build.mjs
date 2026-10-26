import { cp, mkdir, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assets = resolve(root, 'assets/seamshift');
for (const name of await readdir(assets)) if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', resolve(assets, name)]);
const html = await readFile(resolve(root, 'seamshift/index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\.\/[^"#]+)"/g)) await readFile(resolve(root, 'seamshift', match[1]));
await mkdir(resolve(root, 'dist/assets'), { recursive: true });
await cp(resolve(root, 'seamshift'), resolve(root, 'dist/seamshift'), { recursive: true });
await cp(assets, resolve(root, 'dist/assets/seamshift'), { recursive: true });
await cp(resolve(root, 'favicon.ico'), resolve(root, 'dist/favicon.ico'));
console.log('Built standalone game: dist/seamshift/index.html (also copied by Jekyll unchanged).');
