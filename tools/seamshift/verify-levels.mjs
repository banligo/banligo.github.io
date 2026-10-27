import {levels} from '../../assets/seamshift/levels.js';
import {search} from '../../assets/seamshift/solver.js';
import {initialState,transition,score} from '../../assets/seamshift/engine.js';
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
const target=process.argv[2]?Number(process.argv[2]):null;
const output=new URL('./solutions.json',import.meta.url);
let proofs=target&&existsSync(output)?JSON.parse(readFileSync(output)):[];
for(const l of levels.filter(l=>!target||l.id===target)){
 const p={id:l.id,revision:l.revision,title:l.title,normal:null,star:null,n3Opt:null,knownLimitations:[]};
 for(const requireStar of [false,true]){
  const t=Date.now(),r=search(l,undefined,{requireStar,maxDepth:80,maxExpanded:Number(process.env.MAX_EXPANDED??300000),weight:Number(process.env.WEIGHT??1)});
  console.log(l.id,requireStar?'star':'normal',r.actions?.length??'NOT FOUND',r.expanded,Date.now()-t+'ms',r.exhausted);
  if(!r.actions){p.knownLimitations.push(`Search budget reached (${r.expanded}); no verified ${requireStar?'star':'normal'} route.`);continue;}
  let state=initialState(l);for(const action of r.actions){const n=transition(state,action,l);if(!n.valid)throw Error(`Invalid replay ${l.id}: ${n.message}`);state=n.state;}
  if(state.status!=='won'||requireStar&&!state.starCollected)throw Error('Replay failed');
  p[requireStar?'star':'normal']=r.actions;
  if(requireStar){p.n3Opt=Number(process.env.WEIGHT??1)===1?r.actions.length:null;p.threeStarLimit=r.actions.length+Math.max(2,Math.floor(l.id/4));p.starExpanded=r.expanded;}
 }
 proofs=proofs.filter(p=>p.id!==l.id);proofs.push(p);proofs.sort((a,b)=>a.id-b.id);writeFileSync(output,JSON.stringify(proofs,null,2)+'\n');
}
