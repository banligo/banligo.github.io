// A DOM integration fixture: load the shipped HTML and execute its real entry module.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {levels} from '../../assets/seamshift/levels.js';
import {createSession} from '../../assets/seamshift/engine.js';
import {freshProgress,recordWin,SAVE_KEY} from '../../assets/seamshift/progress.js';
const mode=process.argv[2]??'fresh',htmlURL=new URL('../../seamshift/index.html',import.meta.url);
const html=readFileSync(htmlURL,'utf8'),{document,window}=parseHTML(html),frames=[],values=new Map();
if(mode==='resumed') {
 let progress=freshProgress();for(const id of [1,2])progress=recordWin(progress,id,1,20);
 const session=createSession(levels[2]);session.act({type:'move',direction:'left'});
 progress.currentLevel=3;progress.snapshot=session.snapshot();values.set(SAVE_KEY,JSON.stringify(progress));
}
const storage={getItem(name){if(mode==='blocked-storage')throw Error('Storage unavailable');return values.get(name)??null;},setItem(name,value){if(mode==='blocked-storage')throw Error('Storage unavailable');values.set(name,value);},removeItem(name){values.delete(name);}};
Object.assign(globalThis,{document,window,localStorage:storage,matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:callback=>{frames.push(callback);return frames.length;},cancelAnimationFrame(){}});
Object.assign(window,{innerWidth:390,innerHeight:844,matchMedia:globalThis.matchMedia,requestAnimationFrame:globalThis.requestAnimationFrame});
const src=html.match(/<script type="module" src="([^"]+)"/)[1];
const entry=await import(new URL(src,htmlURL));
const button=document.querySelector('#enter-game'),game=document.querySelector('#game'),cover=document.querySelector('#start-screen');
assert(game.hidden);assert(!cover.hidden);
button.click();
for(let i=0;i<500&&!cover.hidden;i++) {
 if(!document.querySelector('#entry-status').hidden)throw Error(document.querySelector('#entry-status').textContent);
 await new Promise(resolve=>setTimeout(resolve,10));
}
assert(cover.hidden,'The cover must disappear after clicking Enter');assert(!game.hidden);assert.equal(game.inert,false);
assert.equal(document.querySelector('#chapter-number').textContent,mode==='resumed'?'03 / 15':'01 / 15');
const event=new window.Event('keydown',{bubbles:true,cancelable:true});event.key=mode==='resumed'?'ArrowUp':'ArrowRight';
document.querySelector('#board').dispatchEvent(event);while(frames.length)frames.shift()();
assert.equal(document.querySelector('#moves').textContent,mode==='resumed'?'2 步':'1 步','The entered game must accept movement');
// A failed module load is visible and the same entry can be retried successfully.
const failed=parseHTML(html).document;let attempts=0;
entry.installEntrance(failed,async()=>{if(++attempts===1)throw Error('Simulated network interruption');return {enterGame(){failed.querySelector('#game').hidden=false;failed.querySelector('#start-screen').hidden=true;}};});
const errorLog=console.error;console.error=()=>{};
failed.querySelector('#enter-game').click();await new Promise(resolve=>setTimeout(resolve,0));
console.error=errorLog;
assert(!failed.querySelector('#entry-status').hidden);assert(!failed.querySelector('#enter-game').disabled);assert(failed.querySelector('#game').hidden);
failed.querySelector('#enter-game').click();await new Promise(resolve=>setTimeout(resolve,0));
assert(failed.querySelector('#start-screen').hidden);assert(!failed.querySelector('#game').hidden);
console.log(mode+': entrance, movement and retry passed');
