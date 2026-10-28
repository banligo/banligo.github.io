import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {assetVersion} from './version-assets.mjs';
for(const mode of ['fresh','resumed','blocked-storage'])test(`real page entry works with ${mode} progress and accepts movement`,()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./boot-harness.mjs',import.meta.url)),mode],{encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stdout+result.stderr);assert(result.stdout.includes('entrance, movement and retry passed'));
});
test('HTML, module imports and workers belong to the same content-versioned release',()=>{
 const version=assetVersion(),directory=new URL('../../assets/seamshift/',import.meta.url),html=readFileSync(new URL('../../seamshift/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/(?:src|href)="\.\.\/assets\/seamshift\/[^"?]+(?:\?v=([a-f0-9]{12}))?"/g))assert.equal(match[1],version);
 for(const name of readdirSync(directory).filter(name=>name.endsWith('.js'))){const source=readFileSync(new URL(name,directory),'utf8');for(const match of source.matchAll(/['"]\.\/[^'"?]+\.js(?:\?v=([a-f0-9]{12}))?['"]/g))assert.equal(match[1],version,`${name}: ${match[0]}`);}
 assert(html.includes('boot.js?v='+version));
});
