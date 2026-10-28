// Plan between design checkpoints with real transitions, then replay the whole journey.
// These are verified solutions, not a claim of globally optimal play.
import {readFileSync,writeFileSync} from 'node:fs';
import {levels} from '../../assets/seamshift/levels.js';
import {initialState,transition} from '../../assets/seamshift/engine.js';
import {stateHash} from '../../assets/seamshift/solver.js';
const output=new URL('./solutions.json',import.meta.url),proofs=JSON.parse(readFileSync(output));
for(const l of levels.filter(l=>l.id>=14)) {
 const plans=[];
 for(const variant of ['normal','star',...(l.id===15?['twist']:[])]) {
  const requireStar=variant!=='normal';
  let state=initialState(l),route=[];
  function act(action) {
   const r=transition(state,action,l);
   if(!r.valid||r.state.status==='lost')throw Error(JSON.stringify({action,player:state.player,turn:state.turn,reason:r.message}));
   state=r.state;route.push(action);
  }
  function reach(x,y,world=state.world) {
   const queue=[{state,path:[]}],seen=new Set([stateHash(state,l)]);
   const actions=['up','right','down','left'].map(direction=>({type:'move',direction}));
   actions.push({type:'wait'});
   if(world!==state.world)actions.push({type:'shift'});
   for(let i=0;i<queue.length&&i<30000;i++) {
    const {state:current,path}=queue[i];
    if(current.player.x===x&&current.player.y===y&&current.world===world){for(const a of path)act(a);return;}
    if(path.length>=40||current.status!=='playing')continue;
    for(const action of actions) {
     const result=transition(current,action,l,{feedback:false});
     if(!result.valid||result.state.status==='lost')continue;
     const hash=stateHash(result.state,l);if(seen.has(hash))continue;
     seen.add(hash);queue.push({state:result.state,path:[...path,action]});
    }
   }
   throw Error(`Unreachable checkpoint ${l.id}: ${x},${y} ${world}`);
  }
  const place=(pieceId,slotId)=>act({type:'place',pieceId,slotId});
  const shift=()=>act({type:'shift'});
  if(l.id===14) {
   place('reed','5,6');place('bend','7,6');
   reach(2,2);reach(6,1);reach(6,2);shift();
   reach(3,4,'primal');reach(4,4);reach(0,4);reach(3,4);shift();
   reach(6,5,'primal');reach(6,6);
   if(requireStar){reach(0,6);reach(6,6);}
   act({type:'topology',value:'torus'});reach(7,7);
  } else {
   place('reed','4,7');place('fork','6,7');
   reach(1,3);reach(6,1);reach(6,2);shift();
   reach(5,5,'primal');reach(5,4);reach(8,4);reach(5,5);shift();
   if(variant==='twist'){reach(6,2,'primal');reach(0,2);act({type:'topology',value:'mobius'});}
   reach(7,7,'primal');reach(5,7);
   if(requireStar){reach(1,7);reach(5,7);}
   act({type:'topology',value:'torus'});reach(6,8);
  }
  if(state.status!=='won'||requireStar&&!state.starCollected)throw Error('Incomplete finale route '+l.id);
  plans.push(route);console.log(l.id,variant,route.length,'real turns replayed');
 }
 const index=proofs.findIndex(p=>p.id===l.id);
 proofs[index]={id:l.id,revision:l.revision,title:l.title,normal:plans[0],star:plans[1],...(plans[2]?{alternateStar:{label:'扭转边界绕行',actions:plans[2]}}:{}),n3Opt:null,threeStarLimit:plans[1].length+4,knownLimitations:['Checkpoint routes are verified using the real engine; global optimum not proved.']};
}
writeFileSync(output,JSON.stringify(proofs,null,2)+'\n');
writeFileSync(new URL('../../assets/seamshift/verified.js',import.meta.url),'// Generated verification metadata; null means optimum has not been proved.\nexport const verified = '+JSON.stringify(proofs.map(p=>({id:p.id,revision:p.revision,n3Opt:p.n3Opt,threeStarLimit:p.threeStarLimit})))+';\n');
writeFileSync(new URL('../../assets/seamshift/walkthroughs.js',import.meta.url),'// Verified finale routes used for hints on matching states.\nexport const walkthroughs = '+JSON.stringify(proofs.filter(p=>p.id>=14).map(p=>({id:p.id,revision:p.revision,actions:p.star})))+';\n');
