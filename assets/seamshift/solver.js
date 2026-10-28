import { applyAction, disconnected, initialState, positions } from './engine.js?v=06fbbcc5c4e0';
import { directions, key, neighbor, same, shortestPath, tile, dualGraph, dualNode } from './graphs.js?v=06fbbcc5c4e0';
import { pieceSignature, ports } from './pieces.js?v=06fbbcc5c4e0';
const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const period = level => ((level.hunterSpeed || 1) * (level.shadowSpeed || 1)) / gcd(level.hunterSpeed || 1, level.shadowSpeed || 1);
export function stateHash(state,level) {
 const pieces=state.pieces.map(p=>{const d=level.pieces.find(d=>d.id===p.id);return `${d.shape}:${p.slot??'-'}:${p.rotation%(d.shape==='straight'?2:d.shape==='cross'?1:4)}`;}).sort().join(';');
 return [key(state.player),state.world,key(state.anchor),state.hunters.map(key).join(';'),state.shadows.map(key).join(';'),pieces,+state.hasKey,+state.starCollected,state.scale,state.topology,state.turn%period(level),state.hunterStates.join(','),+state.shadowReturning,+state.lampLit,+state.lampStarted,state.lampCharge,state.energy,JSON.stringify(state.bridgeStates),JSON.stringify(state.rooms),state.triggered.filter(id=>level.controls.find(c=>c.id===id)?.once).join(',')].join('|');
}
export function actionsFor(level) {
  return [...directions.map(d => ({ type: 'move', direction: d.name })),
    ...level.modes.map(value => ({ type: 'topology', value })),
    ...level.pieces.flatMap(p => [{ type: 'rotate', pieceId: p.id }, { type: 'remove', pieceId: p.id }, ...p.allowedSlots.map(slotId => ({ type: 'place', pieceId: p.id, slotId }))]),
    ...(level.rifts.length?[{type:'shift'}]:[]),{ type: 'wait' }];
}
class Heap {
  data = [];
  push(node) {
    const a = this.data; a.push(node); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].priority <= node.priority) break; a[i] = a[p]; i = p; }
    a[i] = node;
  }
  pop() {
    const a = this.data, first = a[0], last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) { let c = i * 2 + 1; if (c + 1 < a.length && a[c + 1].priority < a[c].priority) c++; if (last.priority <= a[c].priority) break; a[i] = a[c]; i = c; }
      a[i] = last;
    }
    return first;
  }
}

function makeHeuristic(level,requireStar,modes=level.modes) {
 const union=new Map(),cache=new Map(),pkey=p=>'p:'+key(p),dkey=p=>'d:'+key(p);
 const add=(a,b)=>{if(!union.has(a))union.set(a,new Set());union.get(a).add(b);};
 for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
  const p={x,y};if(tile(level,p)!=='#')for(const mode of modes)for(const d of directions){const q=neighbor(p,d,level,mode);if(q&&tile(level,q)!=='#')add(pkey(p),pkey(q));}
  if(level.rifts.length)for(const mode of modes)if(dualNode(p,level,mode))for(const d of directions){let q={x:x+d.x,y:y+d.y};if(q.x<0&&mode!=='plane'){q.x+=level.width;if(mode==='mobius')q.y=level.height-q.y;}q=dualNode(q,level,mode);if(q)add(dkey(p),dkey(q));}
 }
 for(const r of level.rifts){add(pkey(r.primal),dkey(r.dual));add(dkey(r.dual),pkey(r.primal));}
 const distance=(a,b)=>{const id=a+':'+b;if(!cache.has(id)){const queue=[[a,0]],seen=new Set([a]);let found=Infinity;for(let i=0;i<queue.length;i++){const [p,n]=queue[i];if(p===b){found=n;break;}for(const q of union.get(p)??[])if(!seen.has(q)){seen.add(q);queue.push([q,n+1]);}}cache.set(id,found);}return cache.get(id);};
 const goal=pkey(positions(level,'E')[0]),star=pkey(level.star);
 return state=>{const p=(state.world==='dual'?dkey:pkey)(state.player);return requireStar&&!state.starCollected?distance(p,star)+distance(star,goal):distance(p,goal);};
}
// A* with an admissible relaxed-union movement lower bound. Geometry,
// monsters and locks are relaxed only in the heuristic, never in transitions.
export function search(level, start = initialState(level), { maxExpanded = 200000, maxDepth = 48, requireStar = false, weight = 1, forbid = () => false } = {}) {
  const modes=[...new Set([start.topology,...level.modes.filter(value=>!forbid({type:'topology',value}))])];
  const heuristic = makeHeuristic(level, requireStar,modes), open = new Heap(), best = new Map(), actions = actionsFor(level).filter(a => !forbid(a));
  if(!Number.isFinite(heuristic(start)))return {actions:null,expanded:0,exhausted:true,reason:'No path in the optimistic union of every permitted geometry'};
  open.push({ state: start, depth: 0, parent: null, action: null, priority: 0 }); best.set(stateHash(start, level), 0);
  let expanded = 0;
  while (open.data.length && expanded < maxExpanded) {
    const node = open.pop();
    if (node.depth > best.get(stateHash(node.state, level))) continue;
    if (node.state.status === 'won' && (!requireStar || node.state.starCollected)) {
      const route = []; for (let p = node; p.parent; p = p.parent) route.push(p.action);
      return { actions: route.reverse(), expanded, exhausted: false };
    }
    if (node.depth >= maxDepth || node.state.status !== 'playing') continue;
    expanded++;
    for (const action of actions) {
      const next = applyAction(node.state, action, level, {feedback:false});
      if (next === node.state || next.status === 'lost' || (requireStar && next.status === 'won' && !next.starCollected)) continue;
      const hash = stateHash(next, level), depth = node.depth + 1;
      if ((best.get(hash) ?? Infinity) <= depth) continue;
      best.set(hash, depth);
      if (depth + heuristic(next) > maxDepth) continue;
      open.push({ state: next, depth, parent: node, action, priority: depth + weight * heuristic(next) });
    }
  }
  return { actions: null, expanded, exhausted: !open.data.length };
}
export function solve(level, start = initialState(level), options = {}) {
  const result = search(level, start, options); return result.actions ? result : null;
}
