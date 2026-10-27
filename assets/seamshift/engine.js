import {at,buildable,bridgeIsOpen,equal,roomAt,territoryAt} from './world.js';
import { active, directions, dualGraph, dualNode, key, neighbor, primalGraph, primalOpen, remapDual, same, shortestPath, tile } from './graphs.js';
export function positions(level, symbol) {
  return level.map.flatMap((row, y) => [...row].flatMap((t, x) => t === symbol ? [{ x, y }] : []));
}
export function initialState(level) {
  const state={ version: 6, world:'primal', anchor:positions(level,'P')[0], bridgeStates:Object.fromEntries(level.bridges.map(b=>[b.id,!!b.initialOpen])), triggered:[], rooms:Object.fromEntries((level.rooms??[]).map(r=>[r.id,r.rotation??0])), lampStarted:!!level.circuit?.initialStarted, lampCharge:0, energy:0, lampStatus:level.circuit?'ready':'unpowered', layoutRevision:level.revision, levelId: level.id, player: positions(level, 'P')[0], hunters: positions(level, 'M'),
    shadows: level.shadow ? [{ x: level.shadow[0], y: level.shadow[1] }] : [],
    pieces: level.pieces.map(p => ({ id: p.id, rotation: p.rotation, slot: null })),
    scale: level.initialScale, topology: level.initialTopology, hasKey: false, starCollected: false,
    hunterStates:positions(level,'M').map(()=>level.hunterInitial??'sleeping'),hunterWakeReasons:positions(level,'M').map(()=>level.hunterInitial?'guard':null),lampLit: false, shadowReturning: false, hunterAwake: false, turn: 0, status: 'playing', events: [] };
  state.hunterAwake=state.hunterStates.some(mode=>mode!=='sleeping');
  if(level.circuit){const powered=!level.circuit.source||!!shortestPath(primalGraph(level,state),level.circuit.source,level.circuit.receiver);state.lampStatus=!lampProtected(state,level)?'shorted':!powered?'unpowered':'ready';}
  return state;
}
export const beaconPosition = (state, level) => { const target=state.shadowReturning ? level.shadow : level.beacon; return target ? remapDual({x:target[0],y:target[1]},level,state.topology) : null; };
const pathCache = new WeakMap();
export function shadowPaths(state, level) {
  if (!state.shadows.length) return [];
  const { graph } = dualGraph(level, state);
  if(!pathCache.has(graph)) pathCache.set(graph,new Map()); const cache=pathCache.get(graph);
  return state.shadows.map(p => { const id=`${p.x},${p.y}:${!!state.shadowReturning}`; if(!cache.has(id)) cache.set(id,shortestPath(graph,p,beaconPosition(state,level))); return cache.get(id); });
}
export const disconnected = (state, level) => !!state.shadows.length && shadowPaths(state, level).every(p => !p);
export function lampProtected(state,level) {
  if(!level.circuit)return false;
  if(!state.shadows.length)return true;
  const target=remapDual({x:level.circuit.lamp[0],y:level.circuit.lamp[1]},level,state.topology),{graph}=dualGraph(level,state);
  return state.shadows.every(p=>!shortestPath(graph,p,target));
}
export function lampSupply(state,level){
  if(!level.circuit)return {started:false,powered:false,shorted:false,path:null,maxCharge:2};
  const c=level.circuit,path=c.source?shortestPath(primalGraph(level,state),c.source,c.receiver):null;
  return {started:state.lampStarted,powered:!c.source||!!path,shorted:!lampProtected(state,level),path,maxCharge:c.maxCharge??2};
}
export function updateLamp(state,level,events=[]) {
  if(!level.circuit)return;
  const {started,powered,shorted,maxCharge}=lampSupply(state,level),old=state.lampStatus;
  if(shorted){state.lampStatus='shorted';state.lampCharge=0;}
  else if(!powered)state.lampStatus='unpowered';
  else if(!started)state.lampStatus='ready';
  else {state.lampCharge=Math.min(maxCharge,state.lampCharge+1);state.lampStatus=state.lampCharge===maxCharge?'lit':'charging';}
  state.lampLit=state.lampStatus==='lit';state.energy=state.lampCharge;
  if(old!==state.lampStatus)events.push(({shorted:'紫线短路：灯熄灭，电量归零。',unpowered:'供能道路断开，停止充电。',ready:'供能已连接，发电机 OFF；踩火纹地板启动。',charging:`有效回合充电一格：${state.lampCharge}/${maxCharge}。`,lit:`电量 ${state.lampCharge}/${maxCharge}，灯光照亮灰灯印地板。`})[state.lampStatus]);
}
export function darkDanger(state,level){return state.lampLit?[]:[...positions(level,'N'),...(level.circuit?.darkCells??[])];}
export const isLevelComplete = (state, level) => state.status !== 'lost' && state.world!=='dual' && tile(level, state.player) === 'E';
export function score(state, level) {
  if (state.status !== 'won') return 0;
  const within = state.turn <= level.threeStarLimit;
  return 1 + Number(within || state.starCollected) + Number(within && state.starCollected);
}
export const starActive = (state, level) => !level.starScale || state.scale >= level.starScale;
export function shadowDanger(state,level,predict=false) {
  const moving=predict && (state.turn+1)%level.shadowSpeed===0;
  const shadows=moving ? state.shadows.map((p,i)=>shadowPaths(state,level)[i]?.[1]??p) : state.shadows;
  const cells=new Map();
  for(const p of shadows) for(const dx of [-1,0]) for(const dy of [-1,0]) {
    let x=p.x+dx,y=p.y+dy;
    if(state.topology !== 'plane' && (x<0 || x>=level.width)) {x=(x+level.width)%level.width;if(state.topology==='mobius')y=level.height-1-y;}
    if(state.topology==='torus') y=(y+level.height)%level.height;
    const q={x,y}; if(x>=0&&x<level.width&&y>=0&&y<level.height&&active(level,q,state.scale,state)) cells.set(`${x},${y}`,q);
  }
  return [...cells.values()];
}
export function dangerCells(state,level){
  const cells=new Map();
  for(const [kind,positions]of [['dark',darkDanger(state,level)],['shadow',shadowDanger(state,level)]])for(const p of positions){const id=key(p),old=cells.get(id);cells.set(id,{...p,kind,kinds:old?[...old.kinds,kind]:[kind]});}
  return [...cells.values()];
}
export const hunterMode=(state,index)=>state.hunterStates?.[index]??(state.hunterAwake?'chasing':'sleeping');
export function hunterAlertCells(state,level,index){
  const graph=primalGraph(level,state),start=state.hunters[index];if(!start||!graph.has(key(start)))return [];
  const queue=[{...start,distance:0}],seen=new Set([key(start)]),radius=level.alertRadius??2;
  for(let i=0;i<queue.length;i++){const p=queue[i];if(p.distance>=radius)continue;for(const id of graph.get(key(p))??[])if(!seen.has(id)){seen.add(id);const [x,y]=id.split(',').map(Number);queue.push({x,y,distance:p.distance+1});}}
  return queue;
}
export function riftAccess(state,level){
  const rift=level.rifts.find(r=>same(state.player,state.world==='dual'?r.dual:r.primal));
  if(!rift)return {available:false,message:'只有站在双色裂隙上才能切换世界。'};
  if(state.world==='dual'){
    if(!active(level,rift.primal,state.scale,state)||state.hunters.some(p=>same(p,rift.primal))||dangerCells(state,level).some(p=>same(p,rift.primal)))return {available:false,message:'另一侧出口被占据或有危险，先等待或改变道路。'};
  }else if(!dualGraph(level,state).graph.has(key(rift.dual))||state.shadows.some(p=>same(p,rift.dual)))return {available:false,message:'裂隙另一端无效或被影子占据。'};
  return {available:true,rift,message:state.world==='dual'?'返回道路世界':'进入紫色裂隙'};
}
export function collectStar(state,level,events=[]) {
  if(state.world!=='dual' && !state.starCollected && same(state.player,level.star) && starActive(state,level)) {state.starCollected=true;events.push('捡到一片星光。');}
}
export const rejected = (state, message) => ({ state, valid: false, message });
const copyState = state => ({...state,pieces:state.pieces.map(p=>({...p})),hunters:[...state.hunters],shadows:[...state.shadows],bridgeStates:{...state.bridgeStates},triggered:[...state.triggered],rooms:{...state.rooms},hunterStates:[...state.hunterStates],hunterWakeReasons:[...state.hunterWakeReasons],events:[]});
function geometryChange(state, action, level) {
  const next = copyState(state);
  if(action.type==='topology') {
    if (!level.modes.includes(action.value) || state.topology === action.value) return rejected(state, '这条边界还不能改变。');
    if(state.world==='dual'&&!dualNode(state.player,level,action.value))return rejected(state,'先回到普通世界，再切开这条边界。');
    next.topology = action.value; next.shadows = next.shadows.map(p => remapDual(p, level, action.value));
  } else if (['rotate', 'place', 'remove'].includes(action.type)) {
    const piece = next.pieces.find(p => p.id === action.pieceId), definition = level.pieces.find(p => p.id === action.pieceId);
    if (!piece || !definition) return rejected(state, '先选一块碎片。');
    const occupied=slot=>slot&&[...(state.world==='primal'?[state.player]:[]),...state.hunters].some(p=>same(p,level.slots.find(s=>s.id===slot)));
    if(occupied(piece.slot))return rejected(state,'上面还有角色。');
    if (action.type === 'rotate') piece.rotation = (piece.rotation + 1) % 4;
    else {
      if (action.type === 'remove') {
        if (!piece.slot) return rejected(state, '碎片已在背包里。');
        piece.slot = null;
      } else {
        const slot = level.slots.find(s => s.id === action.slotId);
        if (!slot || !buildable(level,slot)) return rejected(state, '这里不能建路。请选择普通空白地面。');
        if(occupied(slot.id))return rejected(state,'上面还有角色。');
        if(piece.slot===slot.id)return rejected(state,'碎片已经在这里。');
        const other = next.pieces.find(p => p.id !== piece.id && p.slot === slot.id);
        if (other) other.slot = piece.slot;
        piece.slot = slot.id;
      }
    }
  } else return rejected(state, '无法预览这个操作。');
  return { state: next, valid: true };
}
export function preview(state, action, level) {
  const result = geometryChange(state, action, level); return result.valid ? result.state : null;
}
export function triggerFloor(state,level,p,events=[]) {
  for(const control of level.controls??[]) {
    if(!same(p,control)||control.once&&state.triggered.includes(control.id))continue;
    if(control.kind==='bridge') {
      const bridge=level.bridges.find(b=>b.id===control.bridge),open=bridgeIsOpen(state,bridge),desired=control.value??!open;
      if(!desired&&[state.player,...state.hunters].some(q=>bridge.cells.some(c=>same(q,at(c))))){events.push('桥上还有角色，机关没有断桥。');continue;}
      state.bridgeStates[bridge.id]=desired;events.push(desired?'同纹机关接通了桥。':'同纹机关切断了桥，小兽也无法通过。');
    } else if(control.kind==='ignite') {state.lampStarted=true;events.push('火纹地板启动发电机：OFF → ON。');}
    else if(control.kind==='room') {
      const region=territoryAt(level,p),room=level.rooms.find(r=>r.id===control.room&&r.territory===region);
      if(!room){events.push('控制点不属于这间房的领地。');continue;}
      if([...(state.world==='primal'?[state.player]:[]),...state.hunters].some(q=>q.x>=room.x&&q.x<room.x+room.size&&q.y>=room.y&&q.y<room.y+room.size)){events.push('房间里还有角色，暂时不能旋转。');continue;}
      state.rooms[room.id]=((state.rooms[room.id]??0)+(control.direction??1)+4)%4;events.push('同色房间转了九十度，出口重新对齐。');
    }
    if(!state.triggered.includes(control.id))state.triggered.push(control.id);
  }
}
export function predictTurn(state,level,action={type:'wait'}) {
  const result=transition(state,action,level,{feedback:false});
  return {valid:result.valid,hunters:result.state.hunters,shadows:result.state.shadows,danger:dangerCells(result.state,level),hunterStates:result.state.hunterStates,state:result.state};
}
export function transition(state, action, level, { feedback = true } = {}) {
  if (state.status !== 'playing') return rejected(state, '可撤销一步，或重来。');
  let next; const events = [];
  if(action.type==='shift') {
    const access=riftAccess(state,level);if(!access.available)return rejected(state,access.message);
    const {rift}=access;next=copyState(state);
    if(state.world==='dual'){next.world='primal';next.player={...rift.primal};next.anchor={...rift.primal};}
    else{next.world='dual';next.player={...rift.dual};next.anchor={...state.player};}
    events.push(next.world==='dual'?'进入裂隙，沿紫线移动。':'回到道路世界。');
  } else if (action.type === 'move') {
    const dir=directions.find(d=>d.name===action.direction);let target;
    if(state.world==='dual') {
      if(dir){let p={x:state.player.x+dir.x,y:state.player.y+dir.y};if(p.x<0&&state.topology!=='plane'){p.x+=level.width;if(state.topology==='mobius')p.y=level.height-p.y;}target=dualNode(p,level,state.topology);}
      if(!target||!dualGraph(level,state).graph.get(key(state.player))?.includes(key(target)))return rejected(state,'这条紫色裂隙被道路挡住了。');
    } else {
      target=dir&&neighbor(state.player,dir,level,state.topology);
      if(!target||!primalOpen(level,state,state.player,target))return rejected(state,tile(level,target??state.player)==='D'?'那扇门需要钥匙。':'路还没接上。试试机关、拼图或另一种空间。');
    }
    if(state.world!=='dual'&&state.hunters.some(p=>same(p,target)))return rejected(state,'小兽占着这块地板，不能从它身上穿过。');
    next=copyState(state);next.player=target;
    if(state.world!=='dual') {
      next.anchor=target;
      if(tile(level,target)==='K'&&!state.hasKey){next.hasKey=true;events.push('钥匙找到了，锁住的门打开。');}
      triggerFloor(next,level,target,events);
    }
  } else if (action.type === 'wait') next = copyState(state);
  else {
    const result = geometryChange(state, action, level); if (!result.valid) return result;
    next = result.state;
    events.push(({ rotate: '道路转了一个方向。', place: '碎片落位。两端要对上才能走。', remove: '碎片收回了。', topology: '世界的边缘改变了。' })[action.type]);
  }
  if(feedback && state.shadows.length && ['place','rotate','remove','topology','move'].includes(action.type)) {
    const old=dualGraph(level,state).crossings,changed=dualGraph(level,next).crossings;
    if(changed.some(e=>!e.open&&old.some(o=>o.open&&same(o.a,e.a)&&same(o.b,e.b))))events.push('你的路接通了，交叉的紫色裂隙被挡住了。');
  }

  next.turn++;
  if(feedback && state.shadows.length && disconnected(state, level) !== disconnected(next, level)) events.push(disconnected(next, level) ? '通向巡逻目标的紫线被截断了。' : '影子又找到巡逻路线了。');
  const hunterGraph=next.hunters.length?primalGraph(level,next):null,target=next.world==='dual'?next.anchor:next.player;
  next.hunters=next.hunters.map((p,i)=>{
    const mode=hunterMode(state,i),path=shortestPath(hunterGraph,p,target);
    if(mode==='sleeping'){
      const inRange=next.world!=='dual'&&path&&path.length-1<=(level.alertRadius??2);
      const keyNoise=!state.hasKey&&next.hasKey&&level.keyNoise;
      const noisePath=keyNoise?shortestPath(hunterGraph,p,positions(level,'K')[0]):null;
      const heard=noisePath&&noisePath.length-1<=level.keyNoise.radius;
      if(inRange||heard){next.hunterStates[i]='alert';next.hunterWakeReasons[i]=heard?'keyNoise':'range';events.push(heard?'带铃钥匙发出声音：小兽警觉了，本回合不移动。':'进入警戒道路范围：小兽警觉了，本回合不移动。');}
      return p;
    }
    next.hunterStates[i]='chasing';const destination=path?.[1]??p;
    if(next.world!=='dual'&&same(destination,next.player))next.status='lost';
    return destination;
  });
  next.hunterAwake=next.hunterStates.some(mode=>mode!=='sleeping');
  if (level.shadowSpeed && next.turn % level.shadowSpeed === 0) {
    const paths = shadowPaths(next, level); next.shadows = next.shadows.map((p, i) => paths[i]?.[1] ?? p);
  }
  if(next.shadows.some(p=>same(p,beaconPosition(next,level)))) next.shadowReturning=!next.shadowReturning;
  updateLamp(next,level,events);
  if(next.world==='dual'?next.shadows.some(p=>same(p,next.player)):dangerCells(next,level).some(p=>same(p,next.player))){
    next.status='lost';events.push(next.world==='dual'?'影子与你在同一角点相遇了。':dangerCells(next,level).find(p=>same(p,next.player)).kind==='dark'?'灰灯印地板还没照亮，先给灯充电。':'紫色裂痕有危险；看下一回合的菱形预告，再绕行。');
  }
  if(next.status !== 'lost') collectStar(next,level,events);
  if (next.status === 'lost') events.push('没关系，撤销一步就好。');
  else if (isLevelComplete(next, level)) { next.status = 'won'; events.push('找到路了。'); }

  if(next.status==='playing' && !state.lampLit && next.lampLit) events.push('灯光照亮了黑暗地板。');
  next.events = events;
  return { state: next, valid: true, message: events.at(-1) || '' };
}
export const applyAction = (state, action, level, options) => transition(state, action, level, options).state;
export function createSession(level, snapshot = null) {
  let state = snapshot?.state ? structuredClone(snapshot.state) : initialState(level);
  const history = snapshot?.history ? structuredClone(snapshot.history) : [];
  return { get state() { return state; }, get undoCount() { return history.length; },
    snapshot: ({ clone = true } = {}) => clone ? { state: structuredClone(state), history: structuredClone(history) } : { state, history },
    act(action) { const result = transition(state, action, level); if (result.valid) { history.push(state); state = result.state; } return result; },
    undo() { if (!history.length) return false; state = history.pop(); return true; },
    restart() { state = initialState(level); history.length = 0; } };
}
