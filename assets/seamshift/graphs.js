import { pieceAt, pieceSignature, portOpen } from './pieces.js';
export const key = p => `${p.x},${p.y}`;
export const point = k => { const [x, y] = k.split(',').map(Number); return { x, y }; };
export const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
export const directions = [
  { name: 'up', x: 0, y: -1 }, { name: 'right', x: 1, y: 0 },
  { name: 'down', x: 0, y: 1 }, { name: 'left', x: -1, y: 0 },
];
export const tile = (level, p) => level.map[p.y]?.[p.x] ?? '#';
export const birth = t => t === '#' ? Infinity : t === 'b' ? 3 : t === 'a' ? 2 : 1;
export const active = (level, p, scale, state) => birth(tile(level, p)) <= scale && (tile(level, p) !== 'J' || !!state && !!pieceAt(level, state, p));

export function neighbor(p, direction, level, topology) {
  let x = p.x + direction.x, y = p.y + direction.y;
  if (y < 0 || y >= level.height) return null;
  if (x < 0 || x >= level.width) {
    if (topology === 'plane') return null;
    x = (x + level.width) % level.width;
    if (topology === 'mobius') y = level.height - 1 - y;
  }
  return { x, y };
}

export function primalOpen(level, state, a, b) {
  if (!a || !b || !active(level, a, state.scale, state) || !active(level, b, state.scale, state)) return false;
  const direction = directions.findIndex(d => same(neighbor(a, d, level, state.topology), b));
  if (direction < 0 || !portOpen(level, state, a, direction) || !portOpen(level, state, b, (direction + 2) % 4)) return false;
  if (!state.hasKey && (tile(level, a) === 'D' || tile(level, b) === 'D')) return false;
  return !level.bridges.some(edge => (
    (same(a, { x: edge.from[0], y: edge.from[1] }) && same(b, { x: edge.to[0], y: edge.to[1] })) ||
    (same(b, { x: edge.from[0], y: edge.from[1] }) && same(a, { x: edge.to[0], y: edge.to[1] }))
  ) && state.scale < edge.birth);
}

export function primalGraph(level, state) {
  const graph = new Map();
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const p = { x, y };
    if (!active(level, p, state.scale, state) || (!state.hasKey && tile(level, p) === 'D')) continue;
    graph.set(key(p), []);
  }
  for (const [id, neighbors] of graph) for (const dir of directions) {
    const p = point(id), q = neighbor(p, dir, level, state.topology);
    if (q && graph.has(key(q)) && primalOpen(level, state, p, q)) neighbors.push(key(q));
  }
  return graph;
}

// Dual coordinates are CELL CORNERS, not room centers. Only interior y values
// exist: there is no exterior face through which a shadow could bypass a wall.
export function dualNode(p, level, topology) {
  let { x, y } = p;
  if (y <= 0 || y >= level.height) return null;
  if (topology === 'plane') return x > 0 && x < level.width ? { x, y } : null;
  if (x === level.width) {
    x = 0;
    if (topology === 'mobius') y = level.height - y;
  }
  return x >= 0 && x < level.width ? { x, y } : null;
}

export function remapDual(p, level, topology) {
  // A seam corner becomes its nearest interior corner when the seam is cut.
  // Each entity is mapped exactly once, independently of graph connectivity.
  return dualNode(p, level, topology) ?? { x: Math.max(1, Math.min(level.width - 1, p.x)), y: p.y };
}

const dualCache = new WeakMap();
export function dualGraph(level, state) {
  const signature = `${state.scale}:${state.topology}:${state.hasKey}:${pieceSignature(state)}`;
  if (!dualCache.has(level)) dualCache.set(level, new Map());
  const cached = dualCache.get(level);
  if (cached.has(signature)) return cached.get(signature);
  const graph = new Map(), crossings = [];
  for (let y = 1; y < level.height; y++) {
    for (let x = state.topology === 'plane' ? 1 : 0; x < level.width; x++) graph.set(key({ x, y }), []);
  }
  function cross(a, b, u, v, seam = false) {
    u = dualNode(u, level, state.topology); v = dualNode(v, level, state.topology);
    if (!u || !v || same(u, v)) return;
    const open = !primalOpen(level, state, a, b);
    crossings.push({ a, b, u, v, open, seam });
    if (open) {
      if (!graph.get(key(u)).includes(key(v))) graph.get(key(u)).push(key(v));
      if (!graph.get(key(v)).includes(key(u))) graph.get(key(v)).push(key(u));
    }
  }
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    if (x + 1 < level.width) cross({ x, y }, { x: x + 1, y }, { x: x + 1, y }, { x: x + 1, y: y + 1 });
    if (y + 1 < level.height) cross({ x, y }, { x, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 });
    if (x === level.width - 1 && state.topology !== 'plane') {
      const b = neighbor({ x, y }, directions[1], level, state.topology);
      cross({ x, y }, b, { x: level.width, y }, { x: level.width, y: y + 1 }, true);
    }
  }
  // Sort once to make all BFS ties deterministic, including seam corners.
  for (const neighbors of graph.values()) neighbors.sort();
  const result = { graph, crossings };
  if (cached.size > 600) cached.clear();
  cached.set(signature, result);
  return result;
}

export function shortestPath(graph, start, goal) {
  const a = typeof start === 'string' ? start : key(start), b = typeof goal === 'string' ? goal : key(goal);
  if (!graph.has(a) || !graph.has(b)) return null;
  const parent = new Map([[a, null]]), queue = [a];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (id === b) {
      const path = [];
      for (let k = b; k !== null; k = parent.get(k)) path.push(point(k));
      return path.reverse();
    }
    for (const next of graph.get(id)) if (!parent.has(next)) { parent.set(next, id); queue.push(next); }
  }
  return null;
}

export function seededRandom(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
