// Verify that each finale strategy really uses the mechanisms in its map.
import {readFileSync,writeFileSync} from 'node:fs';
import {levels} from '../../assets/seamshift/levels.js';
import {initialState,transition} from '../../assets/seamshift/engine.js';
const file=new URL('./solutions.json',import.meta.url),proofs=JSON.parse(readFileSync(file));
function outcome(level,route){let state=initialState(level);for(const a of route){const r=transition(state,a,level);if(!r.valid)return 'invalid';state=r.state;if(state.status==='lost')return 'lost';}return state.status;}
for(const l of levels.filter(l=>l.id>=14)){
 const p=proofs.find(p=>p.id===l.id);
 if(outcome(l,p.star)!=='won')throw Error('Finale route failed '+l.id);
 const cases={
  noIgnition:{...l,controls:l.controls.filter(c=>c.kind!=='ignite')},
  noBridge:{...l,controls:l.controls.filter(c=>c.kind!=='bridge')},
  noRoomRotation:{...l,controls:l.controls.filter(c=>c.kind!=='room')},
  noKey:{...l,map:l.map.map(r=>r.replace('K','.'))},
 };
 const results=Object.fromEntries(Object.entries(cases).map(([name,copy])=>[name,outcome(copy,p.star)]));
 results.noRift=outcome(l,p.star.filter(a=>a.type!=='shift'));
 results.noTopology=outcome(l,p.star.filter(a=>a.type!=='topology'));
 if(Object.values(results).includes('won'))throw Error('Unused finale mechanism '+l.id+': '+JSON.stringify(results));
 p.mechanismChecks={routeCounterfactuals:results,scope:'Removing a mechanism breaks this verified strategy; this is not a proof that every alternative is impossible.'};
 console.log(l.id,JSON.stringify(results));
}
writeFileSync(file,JSON.stringify(proofs,null,2)+'\n');
