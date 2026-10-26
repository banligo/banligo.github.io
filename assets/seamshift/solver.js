import { applyAction, initialState, plateActive, positions } from './engine.js';
import { directions, key, primalGraph, shortestPath } from './graphs.js';

const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const period = level => ((level.hunterSpeed || 1) * (level.shadowSpeed || 1)) / gcd(level.hunterSpeed || 1, level.shadowSpeed || 1);
export function stateHash(state, level) {
  return [key(state.player), state.boxes.map(key).sort().join(';'), state.hunters.map(key).join(';'), state.shadows.map(key).join(';'),
    state.hasKey ? 1 : 0, state.scale, state.topology, state.sealActivated ? 1 : 0, state.turn % period(level)].join('|');
}
export const actionsFor = level => [
  ...directions.map(dir => ({ type: 'move', direction: dir.name })),
  ...level.scales.map(value => ({ type: 'scale', value })),
  ...level.modes.map(value => ({ type: 'topology', value })),
  { type: 'interact' }, { type: 'wait' },
];

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

function makeHeuristic(level) {
  // Relaxed union of all permitted geometries. This is search guidance only;
  // every candidate is still advanced through the real engine, with enemies.
  const union = new Map();
  for (const topology of level.modes) {
    const graph = primalGraph(level, { ...initialState(level), topology, scale: Math.max(...level.scales), hasKey: true }, { boxes: false });
    for (const [id, ns] of graph) union.set(id, [...new Set([...(union.get(id) || []), ...ns])]);
  }
  const cache = new Map();
  const distance = (a, b) => {
    if (!a || !b) return 0;
    const id = `${key(a)}:${key(b)}`;
    if (!cache.has(id)) cache.set(id, (shortestPath(union, a, b)?.length ?? 41) - 1);
    return cache.get(id);
  };
  const plate = positions(level, 'S')[0], consolePosition = positions(level, 'T')[0], exit = positions(level, 'E')[0], item = positions(level, 'K')[0];
  return state => {
    if (plate && !plateActive(state, level)) {
      const box = state.boxes[0];
      // Boxes in a dead end cannot be pulled back. The relaxed distance still
      // leaves actual push legality to the engine rather than guessing it.
      return 32 + 3 * distance(box, plate) + Math.max(0, distance(state.player, box) - 1);
    }
    if (!state.hasKey) return 22 + distance(state.player, item);
    if (consolePosition && !state.sealActivated) return 10 + distance(state.player, consolePosition) + (state.scale === 3 ? 0 : 1) + (state.topology === 'plane' ? 0 : 1);
    return distance(state.player, exit) + (level.exit.scale && state.scale !== level.exit.scale ? 1 : 0) + (level.exit.topology && state.topology !== level.exit.topology ? 1 : 0);
  };
}

// Weighted A*: returns a verified route, not a claim of an optimal route.
export function solve(level, start = initialState(level), { maxExpanded = 180000, maxDepth = 50 } = {}) {
  if (start.status === 'won') return { actions: [], expanded: 0 };
  if (start.status !== 'playing') return null;
  const heuristic = makeHeuristic(level), open = new Heap(), best = new Map(), actions = actionsFor(level);
  const root = { state: start, depth: 0, parent: null, action: null, priority: 0 };
  open.push(root); best.set(stateHash(start, level), 0);
  let expanded = 0;
  while (open.data.length && expanded < maxExpanded) {
    const node = open.pop();
    if (node.depth > best.get(stateHash(node.state, level))) continue;
    if (node.state.status === 'won') {
      const route = []; for (let p = node; p.parent; p = p.parent) route.push(p.action);
      return { actions: route.reverse(), expanded };
    }
    if (node.depth >= maxDepth) continue;
    expanded++;
    for (const action of actions) {
      const next = applyAction(node.state, action, level);
      if (next === node.state || next.status === 'lost') continue;
      const id = stateHash(next, level), depth = node.depth + 1;
      if ((best.get(id) ?? Infinity) <= depth) continue;
      best.set(id, depth);
      open.push({ state: next, depth, parent: node, action, priority: depth + 3 * heuristic(next) - (next.status === 'won' ? 1000 : 0) });
    }
  }
  return null;
}
