import { applyAction, disconnected, initialState, positions } from './engine.js';
import { directions, key, neighbor, same, shortestPath, tile, dualGraph } from './graphs.js';
import { pieceSignature, ports } from './pieces.js';
const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const period = level => ((level.hunterSpeed || 1) * (level.shadowSpeed || 1)) / gcd(level.hunterSpeed || 1, level.shadowSpeed || 1);
export function stateHash(state, level) {
  return [key(state.player), state.hunters.map(key).join(';'), state.shadows.map(key).join(';'),
    pieceSignature(state), +state.hasKey, +state.starCollected, state.scale, state.topology, state.turn % period(level), +!!state.hunterAwake, +!!state.shadowReturning, +!!state.lampLit].join('|');
}
export function actionsFor(level) {
  return [...directions.map(d => ({ type: 'move', direction: d.name })),
    ...level.scales.map(value => ({ type: 'scale', value })), ...level.modes.map(value => ({ type: 'topology', value })),
    ...level.pieces.flatMap(p => [{ type: 'rotate', pieceId: p.id }, { type: 'remove', pieceId: p.id }, ...p.allowedSlots.map(slotId => ({ type: 'place', pieceId: p.id, slotId }))]),
    { type: 'wait' }];
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

function makeHeuristic(level, requireStar) {
  const union = new Map(), distanceCache = new Map();
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const p = { x, y }; if (tile(level, p) === '#') continue;
    const ns = [];
    for (const mode of level.modes) for (const d of directions) {
      const q = neighbor(p, d, level, mode); if (q && tile(level, q) !== '#') ns.push(key(q));
    }
    union.set(key(p), [...new Set(ns)]);
  }
  const distance = (a, b) => {
    const id = `${key(a)}:${key(b)}`;
    if (!distanceCache.has(id)) distanceCache.set(id, (shortestPath(union, a, b)?.length ?? 40) - 1);
    return distanceCache.get(id);
  };
  const goal = positions(level, 'E')[0], item = positions(level, 'K')[0];
  return state => {
    const needStar = requireStar && !state.starCollected, needKey = item && !state.hasKey;
    if (needStar && needKey) return Math.min(distance(state.player,level.star)+distance(level.star,item)+distance(item,goal),distance(state.player,item)+distance(item,level.star)+distance(level.star,goal));
    const target = needStar ? level.star : needKey ? item : goal;
    return distance(state.player,target) + (target === goal ? 0 : distance(target,goal));
  };
}
// A* with an admissible relaxed-union movement lower bound. Geometry,
// monsters and locks are relaxed only in the heuristic, never in transitions.
export function search(level, start = initialState(level), { maxExpanded = 200000, maxDepth = 48, requireStar = false, weight = 1, forbid = () => false } = {}) {
  const heuristic = makeHeuristic(level, requireStar), open = new Heap(), best = new Map(), actions = actionsFor(level).filter(a => !forbid(a));
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
