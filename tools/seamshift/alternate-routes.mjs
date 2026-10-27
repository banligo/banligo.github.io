// Alternative strategies and counterfactuals are separate from published scoring.
import {readFileSync,writeFileSync} from 'node:fs';
import {levels} from '../../assets/seamshift/levels.js';
import {initialState,transition} from '../../assets/seamshift/engine.js';
import {search} from '../../assets/seamshift/solver.js';
const file=new URL('./solutions.json',import.meta.url),proofs=JSON.parse(readFileSync(file));
function replay(l,actions,{allowLoss=false}={}){let state=initialState(l);for(const a of actions){const r=transition(state,a,l);if(!r.valid)throw Error(`Invalid strategy ${l.id}: ${r.message}`);state=r.state;if(state.status==='lost'){if(allowLoss)return state;throw Error('Strategy lost');}}if(!allowLoss&&state.status!=='won')throw Error('Strategy did not win');return state;}
proofs[13].normalPlans=[];
for(const [label,type]of [['周期边界绕行','shift'],['平面双界绕行','topology']]){const r=search(levels[13],undefined,{forbid:a=>a.type===type,maxExpanded:100000,maxDepth:40});if(!r.actions)throw Error('Missing alternate Level 14 route');replay(levels[13],r.actions);proofs[13].normalPlans.push({label,actions:r.actions});}
const l=levels[14];proofs[14].normalPlans=[];
for(const [mode,label]of [['mobius','翻转边缘与拼图改道'],['torus','断桥后从上下边缘绕行']]){
 const prefix=mode==='torus'?[{type:'move',direction:'down'},{type:'move',direction:'up'}]:[];let start=initialState(l);for(const a of prefix){const r=transition(start,a,l);if(!r.valid||r.state.status!=='playing')throw Error('Invalid bridge prefix');start=r.state;}
 const r=search(l,start,{forbid:a=>a.type==='topology'&&a.value!==mode,maxExpanded:200000,maxDepth:35});if(!r.actions)throw Error('No strategy '+mode);const actions=[...prefix,...r.actions];replay(l,actions);proofs[14].normalPlans.push({label,actions});console.log('Level 15',mode,actions.length);
}
const fixed=search(l,undefined,{forbid:a=>a.type==='topology',maxDepth:40,maxExpanded:200000});if(fixed.actions||!fixed.exhausted)throw Error('Plane-only separation not proved');
const harmless={...l,shadow:undefined,beacon:undefined,shadowSpeed:0};
const removed=search(harmless,undefined,{maxDepth:30,maxExpanded:200000});if(!removed.actions)throw Error('Counterfactual route missing');replay(harmless,removed.actions);
const actual=search(l,undefined,{maxDepth:30,maxExpanded:200000});if(!actual.actions)throw Error('Actual route missing');
const tried=replay(l,removed.actions,{allowLoss:true});if(actual.actions.length<=removed.actions.length&&tried.status==='won')throw Error('Shadow does not affect the chosen shortest strategy');
proofs[14].mechanismChecks={withoutTopology:{actions:null,exhausted:fixed.exhausted,certificate:fixed.reason},withShadow:{normalTurns:actual.actions.length},withoutShadow:{normalTurns:removed.actions.length,actions:removed.actions,statusWhenReplayedWithShadow:tried.status},scope:'Shadow is removed only in this counterfactual test, never in campaign play.'};
console.log('Level 15: actual',actual.actions.length,'no Shadow',removed.actions.length,'unadapted replay',tried.status,'fixed topology',fixed.exhausted?'proved unreachable':'unproved');
writeFileSync(file,JSON.stringify(proofs,null,2)+'\n');
