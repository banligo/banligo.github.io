import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';

test('root homepage is a real HTTP 404 while the game and its assets remain available',async()=>{
  const child=spawn(process.execPath,[new URL('./dev-server.mjs',import.meta.url).pathname],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  try {
    const url=await new Promise((resolve,reject)=>{
      let output='';const timer=setTimeout(()=>reject(Error('Preview did not start')),5000);
      child.once('error',error=>{clearTimeout(timer);reject(error);});
      child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
      child.once('exit',code=>{clearTimeout(timer);reject(Error(`Preview exited: ${code}`));});
    });
    for(const path of ['/','/index.html']){const r=await fetch(url+path,{redirect:'manual'});assert.equal(r.status,404);assert((await r.text()).includes('<h1>404</h1>'));assert.equal(r.headers.get('location'),null);}
    const game=await fetch(url+'/seamshift/');assert.equal(game.status,200);assert((await game.text()).includes('<title>SEAMLOOM'));
    const asset=await fetch(url+'/assets/seamshift/app.js');assert.equal(asset.status,200);assert(asset.headers.get('content-type').includes('javascript'));
    assert.equal((await fetch(url+'/_config.yml')).status,404);
    const config=readFileSync(new URL('../../_config.yml',import.meta.url),'utf8');assert(config.includes('  - /index.html'));assert(!config.includes('  - /seamshift/'));
  } finally {const exited=once(child,'exit');child.kill();await exited;}
});
