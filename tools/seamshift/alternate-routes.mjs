// Additional strategies are replayed by the real engine; they are not optimum claims.
import {readFileSync,writeFileSync} from 'node:fs';
import {levels} from '../../assets/seamshift/levels.js';
import {initialState,transition} from '../../assets/seamshift/engine.js';
import {search,stateHash} from '../../assets/seamshift/solver.js';
import {directions,same} from '../../assets/seamshift/graphs.js';
const file=new URL('./solutions.json',import.meta.url),proofs=JSON.parse(readFileSync(file));
function replay(l,actions){let state=initialState(l);for(const a of actions){const r=transition(state,a,l);if(!r.valid||r.state.status==='lost')throw Error(`Invalid strategy ${l.id} ${state.turn}: ${r.message}`);state=r.state;}if(state.status!=='won')throw Error('Strategy did not win');return state;}
const l14=levels[13];proofs[13].normalPlans=[];
for(const [label,type]of [['周期边界绕行','shift'],['平面双界绕行','topology']]){const r=search(l14,undefined,{forbid:a=>a.type===type,maxExpanded:100000,maxDepth:40});if(!r.actions)throw Error('Missing alternate Level 14 route');replay(l14,r.actions);proofs[13].normalPlans.push({label,actions:r.actions});console.log(14,label,r.actions.length);}
const l=levels[14],move=direction=>({type:'move',direction});
const direct=search(l,undefined,{forbid:a=>a.type==='topology',maxExpanded:100000,maxDepth:35});if(!direct.actions)throw Error('No plane strategy');replay(l,direct.actions);
const prefix=[{type:'topology',value:'torus'},move('right'),move('right'),move('right'),move('right'),move('down'),{type:'shift'}];
let start=initialState(l);for(const a of prefix){const r=transition(start,a,l);if(!r.valid||r.state.status==='lost')throw Error('Invalid prefix');start=r.state;}
const queue=[{state:start,parent:null,action:null,wrapped:false}],seen=new Set([stateHash(start,l)+':false']);let exit;
for(let i=0;i<queue.length&&i<50000;i++){
 const node=queue[i];if(node.wrapped&&same(node.state.player,l.rifts[1].dual)){const r=transition(node.state,{type:'shift'},l);if(r.valid&&r.state.status==='playing'){exit={state:r.state,parent:node,action:{type:'shift'},wrapped:true};break;}}
 for(const action of [...directions.map(d=>move(d.name)),{type:'wait'}]){const r=transition(node.state,action,l);if(!r.valid||r.state.status==='lost')continue;const wrapped=node.wrapped||Math.abs(r.state.player.x-node.state.player.x)>1||Math.abs(r.state.player.y-node.state.player.y)>1,k=stateHash(r.state,l)+':'+wrapped;if(seen.has(k))continue;seen.add(k);queue.push({state:r.state,parent:node,action,wrapped});}
}
if(!exit)throw Error('No safe periodic dual detour');const detour=[];for(let n=exit;n.parent;n=n.parent)detour.push(n.action);detour.reverse();
const suffix=search(l,exit.state,{maxExpanded:150000,maxDepth:40});if(!suffix.actions)throw Error('Periodic strategy has no exit');
const periodic=[...prefix,...detour,...suffix.actions];replay(l,periodic);
proofs[14].normalPlans=[{label:'平面裂隙与旋转房间',actions:direct.actions},{label:'环面对偶周期绕行',actions:periodic}];
console.log(15,'plane',direct.actions.length,'periodic',periodic.length,'dual BFS states',queue.length);
writeFileSync(file,JSON.stringify(proofs,null,2)+'\n');
