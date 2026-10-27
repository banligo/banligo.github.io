import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {levels} from '../../assets/seamshift/levels.js';
import {initialState,transition,applyAction,createSession,isLevelComplete,score,disconnected,starActive,shadowDanger,lampProtected} from '../../assets/seamshift/engine.js';
import {neighbor,directions,dualNode,dualGraph,shortestPath,primalGraph,primalOpen,same,tile} from '../../assets/seamshift/graphs.js';
import {freshProgress,recordWin,SAVE_KEY,saveProgress,loadProgress,resetProgress,validSnapshot} from '../../assets/seamshift/progress.js';
import {solve,search} from '../../assets/seamshift/solver.js';
import {renderBoard} from '../../assets/seamshift/board.js';
import {ports} from '../../assets/seamshift/pieces.js';
import {introducedLessons,pendingLessons,referenceLessons,lessonCards} from '../../assets/seamshift/teaching.js';
import {createActionQueue,swipeDirection,cellFromClient} from '../../assets/seamshift/input.js';
const proofs=JSON.parse(readFileSync(new URL('./solutions.json',import.meta.url)));
const move=direction=>({type:'move',direction});
function replay(l,actions,start=initialState(l)) {let s=start;for(const a of actions){let r=transition(s,a,l);assert(r.valid,JSON.stringify(a));s=r.state;assert.notEqual(s.status,'lost');}return s;}
for(const l of levels){
 test(`Level ${l.id}: real normal and star routes win`,()=>{const p=proofs.find(p=>p.id===l.id);assert.equal(replay(l,p.normal).status,'won');const s=replay(l,p.star);assert.equal(s.status,'won');assert(s.starCollected);assert.equal(p.star.length,l.n3Opt);assert.equal(score(s,l),3);});
 test(`Level ${l.id}: exact A* proves N3_opt`,()=>{const s=solve(l,undefined,{requireStar:true,maxDepth:l.n3Opt,maxExpanded:2000000});assert(s);assert.equal(s.actions.length,l.n3Opt);assert.equal(replay(l,s.actions).status,'won');});
 test(`Level ${l.id}: undo and save restore every state`,()=>{const session=createSession(l), snapshots=[session.snapshot()];for(const a of proofs[l.id-1].star){session.act(a);snapshots.push(session.snapshot());assert(validSnapshot(session.snapshot(),l));}for(let i=snapshots.length-2;i>=0;i--){assert(session.undo());assert.deepEqual(session.snapshot(),snapshots[i]);}session.restart();assert.deepEqual(session.state,initialState(l));});
}
test('goal arrival has no extra objective, key, scale or topology predicate (Level 5 regression)',()=>{for(const l of levels){const e=l.map.flatMap((r,y)=>[...r].flatMap((t,x)=>t==='E'?[{x,y}]:[]))[0];const s={...initialState(l),player:e,hasKey:false};assert(isLevelComplete(s,l));assert(!isLevelComplete({...s,status:'lost'},l));const next=applyAction(s,{type:'wait'}, {...l,hunterSpeed:0,shadowSpeed:0});assert.equal(next.status,'won');}});
test('ordinary and star optimum are separate and two-star extra challenges use OR',()=>{const l=levels[0],s={...initialState(l),status:'won',turn:l.threeStarLimit+1};assert.equal(score(s,l),1);assert.equal(score({...s,starCollected:true},l),2);assert.equal(score({...s,turn:l.threeStarLimit},l),2);assert.equal(score({...s,turn:l.threeStarLimit,starCollected:true},l),3);let p=recordWin(freshProgress(),1,1,4);assert.equal(p.results[1].bestThreeStarTurns,null);p=recordWin(p,1,3,10);p=recordWin(p,1,1,3);assert.equal(p.results[1].bestTurns,3);assert.equal(p.results[1].bestThreeStarTurns,10);assert.equal(p.results[1].stars,3);});
test('connection radius uses Euclidean node distances and is a monotone filtration',()=>{for(const l of levels)for(const mode of l.modes){const s={...initialState(l),topology:mode,hasKey:true};s.pieces.forEach((p,i)=>p.slot=l.slots[i]?.id??null);for(const e of l.bridges){const a={x:e.from[0],y:e.from[1]},b={x:e.to[0],y:e.to[1]},d=Math.hypot(e.nodes[0].x-e.nodes[1].x,e.nodes[0].y-e.nodes[1].y);for(const scale of l.scales){const t={...s,scale};if(tile(l,a)!=='J'&&tile(l,b)!=='J')assert.equal(primalOpen(l,t,a,b),d<=l.radii[scale-1]+1e-9);}}let old=new Set();for(const scale of [1,2,3]){const g=primalGraph(l,{...s,scale}),edges=new Set([...g].flatMap(([k,ns])=>ns.map(n=>k+':'+n)));old.forEach(e=>assert(edges.has(e)));old=edges;}}});
test('Level 1 needs two range adjustments and has two distinct bridge thresholds',()=>{const l=levels[0];assert(new Set(l.bridges.map(e=>e.distance)).size>=2);assert(proofs[0].normal.filter(a=>a.type==='scale').length>=2);});
test('Cylinder and Mobius seam are involutions and reverse the correct coordinates',()=>{for(const l of levels)for(let y=0;y<l.height;y++){const p={x:0,y};for(const topology of ['cylinder','mobius']){const q=neighbor(p,directions[3],l,topology);assert.deepEqual(q,{x:l.width-1,y:topology==='mobius'?l.height-1-y:y});assert.deepEqual(neighbor(q,directions[1],l,topology),p);}}assert.deepEqual(dualNode({x:7,y:1},levels[2],'mobius'),{x:0,y:6});});
test('free fragments can use any socket, swap and be retrieved',()=>{const l=levels[2];for(const p of l.pieces)assert.deepEqual(p.allowedSlots,l.slots.map(s=>s.id));let s=replay(l,[{type:'place',pieceId:'reed',slotId:'bend'},{type:'place',pieceId:'bend',slotId:'bridge'},{type:'place',pieceId:'reed',slotId:'bridge'}]);assert.equal(s.pieces[0].slot,'bridge');assert.equal(s.pieces[1].slot,'bend');s=applyAction(s,{type:'remove',pieceId:'reed'},l);assert.equal(s.pieces[0].slot,null);});
test('rotation changes real primal AND dual edges',()=>{const l=levels[2],a=applyAction(initialState(l),{type:'place',pieceId:'reed',slotId:'middle'},l),b=applyAction(a,{type:'rotate',pieceId:'reed'},l);assert.notDeepEqual(primalGraph(l,a),primalGraph(l,b));assert.notDeepEqual(dualGraph(l,a).graph,dualGraph(l,b).graph);for(const shape of ['straight','corner','tee'])for(let r=0;r<4;r++)assert.deepEqual(ports({rotation:r+4},{shape}),ports({rotation:r},{shape}));});
test('every dual edge complements its actual crossing primal edge in all geometries',()=>{for(const l of levels)for(const topology of l.modes)for(const scale of l.scales){const s={...initialState(l),topology,scale};s.pieces.forEach((p,i)=>{p.slot=l.slots[i]?.id;p.rotation=1;});for(const e of dualGraph(l,s).crossings)assert.equal(e.open,!primalOpen(l,s,e.a,e.b));}});
test('Shadow patrol is geometrically local and road rotation changes its real dual route',()=>{
 const l=levels[3],s=initialState(l),placed=applyAction(s,{type:'place',pieceId:'barrier',slotId:'barrier'},l),rotated=applyAction(placed,{type:'rotate',pieceId:'barrier'},l);
 assert.notDeepEqual(dualGraph(l,placed).graph,dualGraph(l,rotated).graph);
 assert(renderBoard(l,s).includes('data-danger='));assert(!renderBoard(l,s).includes('data-next-danger='));
 const n=applyAction(s,{type:'wait'},l);assert.equal(n.turn,1);assert.equal(n.status,'playing');
 for(const p of shadowDanger(s,l))assert(Math.abs(p.x-s.shadows[0].x)<=1&&Math.abs(p.y-s.shadows[0].y)<=1);
});
test('awake hunters act once on every effective turn and follow current graph',()=>{const l=levels[1];let s=initialState(l),moved=0;for(const a of proofs[1].star){const n=applyAction(s,a,l);if(n.hunterAwake){const graph=primalGraph(l,n);s.hunters.forEach((p,i)=>{if(!same(p,n.hunters[i])){assert(graph.get(`${p.x},${p.y}`)?.includes(`${n.hunters[i].x},${n.hunters[i].y}`));moved++;}});}s=n;}assert(moved>=2);const awake={...initialState(l),hunterAwake:true};for(const action of [{type:'wait'},{type:'scale',value:2},{type:'topology',value:'cylinder'},move('left')]){const result=transition(awake,action,l);if(result.valid){assert(result.state.hunterAwake);assert.equal(result.state.turn,1);}}});
test('sleeping and blocked hunter states are visible and prediction is deterministic',()=>{const l=levels[1],s=initialState(l);assert(renderBoard(l,s).includes('>z<'));const awake={...s,hunterAwake:true,topology:'plane',player:{x:6,y:1}};assert(renderBoard(l,awake).includes('受阻'));assert.deepEqual(applyAction(awake,{type:'wait'},l).hunters,awake.hunters);});
test('every star starts with an observable clue and activation is deterministic',()=>{for(const l of levels){const s=initialState(l);assert(renderBoard(l,s).includes('star-shard'));assert.equal(starActive(s,l),starActive(structuredClone(s),l));}});
test('storage roundtrip, reentry, restart and full reset',()=>{const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let p=freshProgress();const s=createSession(levels[0]);s.act(move('right'));p.snapshot=s.snapshot();saveProgress(storage,p);assert.deepEqual(loadProgress(storage,levels).snapshot,p.snapshot);s.restart();assert.equal(s.state.turn,0);values.set('seamshift.adventure.v2','old');values.set('seamshift.progress.v1','old');values.set('unrelated','keep');assert.deepEqual(resetProgress(storage),freshProgress());assert.deepEqual([...values],[['unrelated','keep']]);assert.deepEqual(loadProgress(storage,levels),freshProgress());});
test('corrupt storage never prevents immediate entry',()=>{assert.deepEqual(loadProgress({getItem:()=>'{bad'},levels),freshProgress());assert.deepEqual(loadProgress({getItem:()=>{throw Error();}},levels),freshProgress());});
test('fast input queue remains bounded FIFO and cancellable',()=>{let jobs=[],got=[];const q=createActionQueue(a=>got.push(a.direction),{schedule:f=>jobs.push(f),cancel:()=>jobs=[],limit:3});for(const d of ['left','right','up'])assert(q.push(move(d)));assert(!q.push(move('down')));while(jobs.length)jobs.shift()();assert.deepEqual(got,['left','right','up']);q.push(move('down'));q.clear();assert.equal(q.length,0);assert.equal(swipeDirection({x:0,y:0},{x:50,y:2}),'right');assert.equal(swipeDirection({x:0,y:0},{x:1,y:1}),null);});
test('HTML controls exist, new name, reset confirmation, no start gate',()=>{const html=readFileSync(new URL('../../seamshift/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../../assets/seamshift/app.js',import.meta.url),'utf8');const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of app.matchAll(/\$\('#([\w-]+)'\)/g))assert(ids.includes(m[1]),m[1]);assert(html.includes('<title>SEAMLOOM'));assert(html.includes('id="reset-dialog"'));assert(!html.includes('id="start-button"'));});
test('awake pursuit responds to move, range, topology and wait each turn; rejected inputs do not advance',()=>{const l={...levels[1],scales:[1,2,3]},s={...initialState(l),hunterAwake:true};for(const action of [move('left'),{type:'scale',value:2},{type:'topology',value:'cylinder'},{type:'wait'}]){const r=transition(s,action,l);assert(r.valid);assert.equal(r.state.turn,1);assert.deepEqual(r.state.hunters,[{x:0,y:3}]);}assert.equal(transition(s,move('up'),l).state,s);});
test('key doors are physical graph obstacles and direct collision always loses',()=>{const l=levels[1],s=initialState(l),door={x:0,y:5},goal={x:1,y:5};assert(!primalOpen(l,s,door,goal));assert(primalOpen(l,{...s,hasKey:true},door,goal));const hit={...s,player:{x:0,y:3}};assert.equal(applyAction(hit,move('down'),l).status,'lost');});
test('Shadow reaching a patrol waypoint turns around rather than ending the level',()=>{
 const l={...levels[3],shadowSpeed:3},s={...initialState(l),turn:2,shadows:[{x:1,y:3}]};const n=applyAction(s,{type:'wait'},l);
 assert.deepEqual(n.shadows,[{x:1,y:4}]);assert(n.shadowReturning);assert.equal(n.status,'playing');
});

test('Torus wraps all four primal directions and all dual corner coordinates',()=>{
 const l=levels[3];for(let x=0;x<l.width;x++){assert.deepEqual(neighbor({x,y:0},directions[0],l,'torus'),{x,y:l.height-1});assert.deepEqual(neighbor({x,y:l.height-1},directions[2],l,'torus'),{x,y:0});}
 assert.deepEqual(dualNode({x:l.width,y:l.height},l,'torus'),{x:0,y:0});
 const g=dualGraph(l,{...initialState(l),topology:'torus'});assert.equal(g.graph.size,l.width*l.height);
 assert(g.crossings.some(e=>e.a.y===l.height-1&&e.b.y===0));assert(g.crossings.some(e=>e.a.x===l.width-1&&e.b.x===0));
});
test('a noncontractible primal cycle does not separate the Torus dual graph',()=>{
 const l={...levels[0],width:4,height:4,map:['####','####','P..E','####'],bridges:[],slots:[],pieces:[]},s={...initialState(l),topology:'torus'};
 const g=dualGraph(l,s).graph;for(const id of g.keys())assert(shortestPath(g,'0,0',id));
 const plane=dualGraph(l,{...s,topology:'plane'}).graph;assert.equal(shortestPath(plane,'1,1','1,3'),null);
});
test('unsafe floor at turn end loses, while moving away or Undo restores safety',()=>{
 const l=levels[3],s={...initialState(l),player:{x:4,y:2}};assert(shadowDanger(s,l).some(p=>same(p,s.player)));assert.equal(applyAction(s,{type:'wait'},l).status,'lost');
 const session=createSession(l,{state:s,history:[]});session.act({type:'wait'});assert(session.undo());assert.deepEqual(session.state,s);
 assert.equal(applyAction(s,move('up'),l).status,'playing');
});
test('star activation collects under a stationary player on range changes and reload',()=>{
 const l=levels[2],s={...initialState(l),player:{...l.star}};assert(!starActive(s,l));const n=applyAction(s,{type:'scale',value:2},l);assert(n.starCollected);assert.equal(n.turn,1);
 const raw={...freshProgress(),currentLevel:2,results:{1:{stars:1,bestTurns:12}},snapshot:{state:{...initialState(levels[1]),player:{...levels[1].star}},history:[]}};
 const restored=loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify(raw):null},levels);assert(restored.snapshot.state.starCollected);
});
test('Level 3 genuinely needs puzzle and geometric radius operations',()=>{
 const l=levels[2];assert.equal(l.pieces.length,3);assert.equal(l.slots.length,3);assert.equal(l.hunterSpeed,undefined);assert.equal(l.shadowSpeed,undefined);
 assert.equal(search(l,undefined,{forbid:a=>a.type==='scale',maxDepth:24}).actions,null);
 assert.equal(search(l,undefined,{forbid:a=>a.type==='place',maxDepth:24}).actions,null);
});
test('Level 4 Torus shortcut is used, Level 5 is shorter without any seal predicate',()=>{
 assert(proofs[3].normal.some(a=>a.type==='topology'&&a.value==='torus'));assert(proofs[4].star.length<20);
 for(const l of levels.slice(3)){const s=replay(l,proofs[l.id-1].normal);assert.equal(s.status,'won');assert.equal(tile(l,s.player),'E');}
});
test('renaming migrates previous achievements and compatible attempts without losing old data',()=>{
 const oldState={...initialState(levels[1]),version:3,turn:2};delete oldState.layoutRevision;delete oldState.shadowReturning;
 const old={version:3,currentLevel:2,results:{1:{stars:3,bestTurns:10,bestThreeStarTurns:10}},seenTips:['lesson-1'],snapshot:{state:oldState,history:[]}};
 const values=new Map([['geomaze.adventure.v3',JSON.stringify(old)]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const p=loadProgress(storage,levels);assert.equal(p.results[1].stars,3);assert.equal(p.currentLevel,2);assert.equal(p.snapshot.state.turn,2);assert(validSnapshot(p.snapshot,levels[1]));saveProgress(storage,p);assert(values.has(SAVE_KEY));assert(values.has('geomaze.adventure.v3'));
 old.currentLevel=3;old.results[2]={stars:2,bestTurns:10};old.snapshot.state.levelId=3;values.set('geomaze.adventure.v3',JSON.stringify(old));values.delete(SAVE_KEY);
 const updated=loadProgress(storage,levels);assert.equal(updated.currentLevel,3);assert.equal(updated.snapshot,null);assert(updated.archivedAttempts[3]);assert.equal(updated.results[2].stars,2);
});
test('intro is nonblocking and scores are absent from level entry UI',()=>{
 const html=readFileSync(new URL('../../seamshift/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../../assets/seamshift/app.js',import.meta.url),'utf8');assert(html.includes('intro-rules'));assert(html.includes('等待</span>'));assert(!html.includes('id="par"'));assert(!app.includes('三星最优'));assert(app.includes("includes('first-rules')"));
});
test('predicted Shadow floor matches the actual next wait turn across patrol reversals',()=>{for(const l of levels.slice(3)){let s=initialState(l);for(const a of proofs[l.id-1].star){const predicted=shadowDanger(s,l,true).map(p=>`${p.x},${p.y}`).sort(),wait=applyAction(s,{type:'wait'},l);assert.deepEqual(predicted,shadowDanger(wait,l).map(p=>`${p.x},${p.y}`).sort());s=applyAction(s,a,l);}}});
test('Torus corner danger wraps geometrically and does not invent arbitrary cells',()=>{const l=levels[4],s={...initialState(l),topology:'torus',shadows:[{x:0,y:0}]};const danger=shadowDanger(s,l);assert.deepEqual(danger,[]);const full={...l,map:Array.from({length:8},()=>'.'.repeat(8))};assert.deepEqual(shadowDanger(s,full).map(p=>`${p.x},${p.y}`).sort(),['0,0','0,7','7,0','7,7']);});

test('lamp missions begin unprotected with a physically locked exit',()=>{
 for(const l of levels.filter(l=>l.circuit)){const s=initialState(l);assert(!lampProtected(s,l));assert(!s.lampLit);const goal=l.map.flatMap((r,y)=>[...r].flatMap((t,x)=>t==='E'?[{x,y}]:[]))[0];for(const d of directions){const q=neighbor(goal,d,l,s.topology);if(q)assert(!primalOpen(l,s,q,goal));}assert(renderBoard(l,s).includes('data-lamp-lit="false"'));}
});
test('repairing a real primal barrier charges the lamp, powers the exit and is reversible',()=>{
 const l=levels[5],session=createSession(l);session.act({type:'rotate',pieceId:'shield'});const before=session.snapshot();session.act({type:'place',pieceId:'shield',slotId:'shield'});assert(session.state.lampLit);assert(lampProtected(session.state,l));assert(primalOpen(l,session.state,{x:3,y:5},{x:4,y:5}));assert(renderBoard(l,session.state).includes('data-lamp-lit="true"'));session.undo();assert.deepEqual(session.snapshot(),before);
});
test('on the Torus, the long barrier fails but a contractible ring protects the lamp',()=>{
 const l=levels[6],initial=initialState(l);const long={...initial,pieces:initial.pieces.map(p=>p.id==='shield'?{...p,slot:'shield'}:p)};assert(!lampProtected(long,l));
 const ring={...initial,pieces:initial.pieces.map(p=>p.id==='ring'?{...p,slot:'ring',rotation:1}:p)};assert(lampProtected(ring,l));
});
test('every new level actually powers its lamp along its replayed winning route',()=>{
 for(const l of levels.filter(l=>l.circuit)){const s=replay(l,proofs[l.id-1].star);assert(s.lampLit);assert.equal(s.status,'won');assert(proofs[l.id-1].star.some(a=>a.type==='place'));const p=recordWin(freshProgress(),l.id,3,s.turn);assert.equal(p.results[l.id].stars,3);}
});
test('ten-level progression preserves old five- and eight-level saves',()=>{
 assert.equal(levels.length,10);let p=freshProgress();for(let id=1;id<=5;id++)p=recordWin(p,id,3,12);assert.equal(p.currentLevel,6);
 const old={...p,currentLevel:5,snapshot:null};delete old.campaignLength;
 const loaded=loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify(old):null},levels);assert.equal(loaded.currentLevel,6);assert.equal(loaded.results[5].stars,3);
 for(let id=6;id<=8;id++)p=recordWin(p,id,1,20);assert.equal(p.currentLevel,9);assert.equal(Object.keys(p.results).length,8);
 const eight={...p,campaignLength:8,currentLevel:8,snapshot:null};const migrated=loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify(eight):null},levels);assert.equal(migrated.currentLevel,9);assert.deepEqual(migrated.results,p.results);
 const active=createSession(levels[7]);active.act(move('right'));eight.snapshot=active.snapshot();assert.equal(loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify(eight):null},levels).currentLevel,8);
 for(let id=9;id<=10;id++)p=recordWin(p,id,3,15);assert.equal(p.currentLevel,10);
});

test('Level 4 remains stationary through waits, geometry and its entire legal star route',()=>{
 const l=levels[3];assert.equal(l.shadowSpeed,0);let s=initialState(l);const start=structuredClone(s.shadows);
 for(let i=0;i<8;i++){s=applyAction(s,{type:'wait'},l);assert.deepEqual(s.shadows,start);}
 s=initialState(l);for(const a of proofs[3].star){s=applyAction(s,a,l);assert.deepEqual(s.shadows,start);}assert.equal(s.status,'won');assert(s.starCollected);assert.equal(l.n3Opt,10);
});
test('bridges have physical reaching arms and traps do not use duplicate dashed floor frames',()=>{
 const l=levels[0],a=renderBoard(l,initialState(l)),b=renderBoard(l,{...initialState(l),scale:3});assert(a.includes('bridge-arm'));assert(a.includes('data-bridge-open="false"'));assert(!b.includes('data-bridge-open="false"'));
 const shadow=renderBoard(levels[3],initialState(levels[3]));assert(!shadow.includes('shadow-hatch'));assert(!shadow.includes('data-next-danger='));assert(!shadow.includes('stroke-dasharray="3 5" class="shadow-trail"'));
});
test('new mechanism notices occur only once, without level-by-level introductions',()=>{
 const p=freshProgress();assert.deepEqual(introducedLessons(levels[0]).map(l=>l.id),['bridge']);
 for(const id of [7,8,9,10])assert.equal(pendingLessons(levels[id-1],p).length,0);
 const fresh=pendingLessons(levels[3],p);assert(fresh.some(l=>l.id==='shadow'));assert(fresh.some(l=>l.id==='view'));
 for(const l of fresh)p.seenTips.push(`mechanism:${l.id}`);assert.equal(pendingLessons(levels[3],p).length,0);
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};saveProgress(storage,p);assert.equal(pendingLessons(levels[3],loadProgress(storage,levels)).length,0);
 p.results[1]={stars:1,bestTurns:8};assert.equal(pendingLessons(levels[0],p).length,0);
 const cards=lessonCards(referenceLessons(levels[5]));assert(cards.includes('<svg'));assert(cards.includes('眼睛'));assert(!cards.includes('1. '));
 const app=readFileSync(new URL('../../assets/seamshift/app.js',import.meta.url),'utf8');assert(!app.includes('toast(level.lesson)'));assert(!app.includes('level.topTip'));
});

test('new fold level needs real bridge length, free puzzle and topology operations',()=>{
 const l=levels[8];for(const type of ['scale','place','topology'])assert.equal(search(l,undefined,{forbid:a=>a.type===type,maxDepth:24}).actions,null);
 assert(proofs[8].star.some(a=>a.type==='topology'&&a.value==='mobius'));assert(proofs[8].star.some(a=>a.type==='move'&&a.direction==='up'));
});
test('late levels have longer strategic routes and actually face awakened hunters',()=>{
 for(const l of levels.slice(8)){assert(proofs[l.id-1].normal.length>proofs[7].normal.length);assert(l.n3Opt>levels[7].n3Opt);let s=initialState(l),steps=0;for(const a of proofs[l.id-1].star){const n=applyAction(s,a,l);if(n.hunterAwake&&!same(s.hunters[0],n.hunters[0]))steps++;s=n;}assert(steps>=3);assert(s.hasKey);assert.equal(s.status,'won');}
 const l=levels[9],s=replay(l,proofs[9].star);assert(s.lampLit);assert.equal(l.pieces.length,2);assert(proofs[9].star.some(a=>a.type==='rotate'&&a.pieceId==='bend'));assert(proofs[9].star.some(a=>a.type==='scale'&&a.value===3));assert.equal(l.shadowSpeed,3);
});
test('clean bridge rendering omits range circles and water background; indicators have legends',()=>{
 const svg=renderBoard(levels[0],initialState(levels[0]));assert(!svg.includes('#709b98'));assert(!svg.includes('#78928c'));assert(svg.includes('bridge-arm'));assert(svg.includes('traveler-hat'));assert(svg.includes('traveler-face'));
 const shadow=renderBoard(levels[5],initialState(levels[5]));assert(shadow.includes('dual-channel'));assert(shadow.includes('data-shadow-next'));assert(shadow.includes('箭头：影子下次移动'));
 const html=readFileSync(new URL('../../seamshift/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../../assets/seamshift/app.js',import.meta.url),'utf8');
 assert(html.includes('id="level-info"'));assert(!html.includes('id="shadow-info"'));assert(!html.includes('id="shadow-dialog"'));assert(html.includes('>桥长</span>'));assert(!app.includes('combined'));assert(app.includes('lessonCards('));assert(app.includes('renderLevelInfo()'));
});

test('two view modes change network emphasis without changing the Shadow route or arrows',()=>{
 const l=levels[5],s=initialState(l),road=renderBoard(l,s,{view:'primal'}),dual=renderBoard(l,s,{view:'dual'});
 assert(road.includes('opacity=".25" class="dual-channel"'));assert(dual.includes('opacity=".9" class="dual-channel"'));
 assert.deepEqual(road.match(/<path[^>]*class="shadow-trail"[^>]*>/g),dual.match(/<path[^>]*class="shadow-trail"[^>]*>/g));
 assert(road.includes('class="shadow-next-arrow"'));assert(!road.includes('<circle data-shadow-next'));assert.deepEqual(road.match(/<g data-shadow-next[^]*?<\/g>/g),dual.match(/<g data-shadow-next[^]*?<\/g>/g));
});
test('solver feedback optimization preserves every rule and state field except explanatory events',()=>{
 for(const l of levels){let a=initialState(l),b=initialState(l);for(const action of proofs[l.id-1].star){a=applyAction(a,action,l);b=applyAction(b,action,l,{feedback:false});assert.deepEqual({...a,events:[]},{...b,events:[]});}}
});
test('redesigned late attempts are archived while achievements remain',()=>{
 const l=levels[8],old={...freshProgress(),currentLevel:9};for(let id=1;id<=9;id++)old.results[id]={stars:3,bestTurns:15,bestThreeStarTurns:15};old.snapshot={state:{...initialState(l),layoutRevision:2},history:[]};
 const loaded=loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify(old):null},levels);assert.equal(loaded.currentLevel,9);assert.equal(loaded.snapshot,null);assert(loaded.archivedAttempts[9]);assert.equal(loaded.results[9].stars,3);
});

test('redesigned layouts retain old achievements without reporting impossible old best times',()=>{
 const p={...freshProgress(),results:{9:{stars:3,bestTurns:15,bestThreeStarTurns:15}}};const updated=recordWin(p,9,3,21);assert.equal(updated.results[9].stars,3);assert.equal(updated.results[9].bestTurns,21);assert.equal(updated.results[9].bestThreeStarTurns,21);assert.equal(updated.results[9].priorBest.bestTurns,15);
 const loaded=loadProgress({getItem:k=>k===SAVE_KEY?JSON.stringify({...updated,currentLevel:1}):null},levels);assert.equal(loaded.results[9].priorBest.bestTurns,15);
});
