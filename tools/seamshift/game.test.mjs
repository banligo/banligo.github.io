import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { levels } from '../../assets/seamshift/levels.js';
import { directions, active, dualGraph, dualNode, key, neighbor, primalGraph, primalOpen, remapDual, same, seededRandom, shortestPath, tile } from '../../assets/seamshift/graphs.js';
import { applyAction, beaconPosition, createSession, disconnected, initialState, isLevelComplete, preview, score } from '../../assets/seamshift/engine.js';
import { ports } from '../../assets/seamshift/pieces.js';
import { actionsFor, period, solve, stateHash } from '../../assets/seamshift/solver.js';
import { renderBoard } from '../../assets/seamshift/board.js';
import { freshProgress, loadProgress, normalizeProgress, recordWin, saveProgress, SAVE_KEY, unlockedLevel, validSnapshot } from '../../assets/seamshift/progress.js';
import { createActionQueue, swipeDirection, cellFromClient } from '../../assets/seamshift/input.js';
const move = direction => ({ type: 'move', direction });
const scale = value => ({ type: 'scale', value });
const topology = value => ({ type: 'topology', value });
const place = (pieceId, slotId) => ({ type: 'place', pieceId, slotId });
const rotate = pieceId => ({ type: 'rotate', pieceId });
const replay = (level, actions, start = initialState(level)) => actions.reduce((state, action) => {
  const snapshot = structuredClone(state), next = applyAction(state, action, level);
  assert.notEqual(next, state, `Invalid ${JSON.stringify(action)}`); assert.notEqual(next.status, 'lost'); assert.deepEqual(state, snapshot); return next;
}, start);
const fixture = (map, extra = {}) => ({ ...levels[2], id: 99, map, width: map[0].length, height: map.length, slots: [], pieces: [], ...extra });

test('five teaching maps are bounded, seeded and free of retired mechanisms', () => {
  assert.deepEqual(levels.map(l => l.title), ['Broken Path', 'Other Side', 'Missing Piece', 'Shadow Maze', 'Seamshift']);
  for (const level of levels) {
    assert(level.map.every(row => row.length === level.width));
    assert.equal(level.map.join('').split('P').length, 2); assert.equal(level.map.join('').split('E').length, 2);
    assert(!/[BST]/.test(level.map.join(''))); assert(!('exit' in level)); assert(!('seal' in level));
    const a = seededRandom(level.seed), b = seededRandom(level.seed);
    assert.deepEqual(Array.from({ length: 20 }, a), Array.from({ length: 20 }, b));
  }
});
test('Plane blocks seams and vertical boundaries; Cylinder maps equal rows both ways', () => {
  const l = levels[1], p = { x: 0, y: 1 };
  assert.equal(neighbor(p, directions[3], l, 'plane'), null);
  assert.deepEqual(neighbor(p, directions[3], l, 'cylinder'), { x: 6, y: 1 });
  assert.deepEqual(neighbor({ x: 6, y: 1 }, directions[1], l, 'cylinder'), p);
  for (const mode of ['plane', 'cylinder', 'mobius']) assert.equal(neighbor({ x: 0, y: 0 }, directions[0], l, mode), null);
});
test('Möbius room rows use H-1-y and corner rows use H-j', () => {
  const l = levels[2];
  for (let y = 0; y < l.height; y++) {
    const p = { x: 0, y }, q = neighbor(p, directions[3], l, 'mobius');
    assert.deepEqual(q, { x: 6, y: 6 - y }); assert.deepEqual(neighbor(q, directions[1], l, 'mobius'), p);
  }
  assert.deepEqual(dualNode({ x: 7, y: 1 }, l, 'mobius'), { x: 0, y: 6 });
  assert.deepEqual(dualNode({ x: 7, y: 1 }, l, 'cylinder'), { x: 0, y: 1 });
  assert.equal(dualNode({ x: 1, y: 0 }, l, 'plane'), null);
});
test('all four supported puzzle shapes rotate their actual ports modulo four', () => {
  for (const [shape, base] of Object.entries({ straight: [0, 2], corner: [0, 1], tee: [0, 1, 3], cross: [0, 1, 2, 3] })) {
    for (let r = 0; r < 4; r++) assert.deepEqual(ports({ rotation: r }, { shape }), base.map(p => (p + r) % 4));
  }
});
test('placing and rotating a puzzle changes BOTH actual graphs and invalidates cached geometry', () => {
  const l = levels[2], initial = initialState(l), placed = applyAction(initial, place('reed', 'bridge'), l), turned = applyAction(placed, rotate('reed'), l);
  const a = { x: 1, y: 1 }, b = { x: 2, y: 1 };
  assert(!active(l, a, 1, initial)); assert(active(l, a, 1, placed));
  assert(!primalOpen(l, placed, a, b)); assert(primalOpen(l, turned, a, b));
  assert.notDeepEqual(primalGraph(l, placed), primalGraph(l, turned));
  assert.notDeepEqual(dualGraph(l, placed).graph, dualGraph(l, turned).graph);
  assert.equal(dualGraph(l, placed), dualGraph(l, placed));
  assert.equal(turned.turn, 2); assert.equal(initial.pieces[0].slot, null);
});
test('adjacent pieces need BOTH matching ports', () => {
  const l = fixture(['#####', '#PJJ#', '###E#', '#####'], {
    slots: [{ id: 'a', x: 2, y: 1 }, { id: 'b', x: 3, y: 1 }],
    pieces: [{ id: 'a', shape: 'straight', rotation: 1, allowedSlots: ['a'] }, { id: 'b', shape: 'corner', rotation: 0, allowedSlots: ['b'] }],
  });
  let state = replay(l, [place('a', 'a'), place('b', 'b')]);
  assert(!primalOpen(l, state, { x: 2, y: 1 }, { x: 3, y: 1 }));
  state = replay(l, [rotate('b'), rotate('b')], state);
  assert(primalOpen(l, state, { x: 2, y: 1 }, { x: 3, y: 1 }));
});
test('scale filtration remains monotone for every topology, key and fixed puzzle layout', () => {
  for (const l of levels) for (const mode of l.modes) for (const hasKey of [false, true]) {
    for (const filled of [false, true]) {
      const base = initialState(l); if (filled) base.pieces.forEach((p, i) => { p.slot = l.pieces[i].allowedSlots[0]; p.rotation = 1; });
      let prior = new Set();
      for (const r of [1, 2, 3]) {
        const graph = primalGraph(l, { ...base, topology: mode, scale: r, hasKey });
        const edges = new Set([...graph].flatMap(([a, ns]) => ns.map(b => `${a}:${b}`)));
        prior.forEach(edge => assert(edges.has(edge))); prior = edges;
      }
    }
  }
});
test('every internal and seam dual edge is the complement of its crossing primal edge', () => {
  for (const l of levels) for (const mode of l.modes) for (const r of l.scales) for (const orientation of [0, 1, 2, 3]) {
    const state = { ...initialState(l), scale: r, topology: mode, hasKey: true };
    state.pieces.forEach((p, i) => { p.slot = l.pieces[i].allowedSlots[0]; p.rotation = orientation; });
    const { graph, crossings } = dualGraph(l, state);
    for (const e of crossings) {
      assert.equal(e.open, !primalOpen(l, state, e.a, e.b));
      assert.equal(graph.get(key(e.u)).includes(key(e.v)), e.open);
    }
  }
});
test('plane dual has no exterior bypass; topology rebuilds adjacency', () => {
  const l = levels[4], state = initialState(l), plane = dualGraph(l, state).graph;
  const cylinder = dualGraph(l, { ...state, topology: 'cylinder' }).graph, mobius = dualGraph(l, { ...state, topology: 'mobius' }).graph;
  assert.equal(plane.size, (l.width - 1) * (l.height - 1)); assert.equal(cylinder.size, l.width * (l.height - 1));
  assert.notDeepEqual(cylinder, mobius);
});
test('Level 4 road creates a real shadow barrier; current shadow location controls disconnection', () => {
  const l = levels[3], initial = initialState(l), changed = { ...initial, scale: 2 };
  assert(!disconnected(initial, l)); assert(disconnected(changed, l));
  assert(!disconnected({ ...changed, shadows: [{ x: 4, y: 4 }] }, l));
});
test('Level 5 puzzle ring traps its shadow across all three topologies', () => {
  const l = levels[4], trapped = replay(l, [place('ring', 'ring'), rotate('ring'), scale(2)]);
  assert(disconnected(trapped, l));
  for (const mode of l.modes) assert(disconnected({ ...trapped, topology: mode }, l));
  assert(!disconnected({ ...trapped, scale: 1 }, l));
});
test('door edges depend on the actual collected key', () => {
  const l = levels[4], s = initialState(l), a = { x: 7, y: 7 }, b = { x: 8, y: 7 };
  assert(!primalOpen(l, s, a, b)); assert(primalOpen(l, { ...s, hasKey: true }, a, b));
});
test('invalid actions, duplicate geometry and wrong puzzle sockets consume no turns', () => {
  const l = levels[2], s = initialState(l);
  for (const a of [move('up'), scale(3), topology('cylinder'), topology('plane'), place('reed', 'bend'), rotate('missing'), { type: 'remove', pieceId: 'reed' }]) assert.equal(applyAction(s, a, l), s);
  assert.equal(s.turn, 0);
});
test('removal is reversible; occupied pieces cannot disappear beneath actors', () => {
  const l = levels[2], ready = replay(l, [rotate('reed'), place('reed', 'bridge')]);
  const removed = applyAction(ready, { type: 'remove', pieceId: 'reed' }, l);
  assert.equal(removed.pieces[0].slot, null);
  const occupied = { ...ready, player: { x: 1, y: 1 } };
  assert.equal(applyAction(occupied, { type: 'remove', pieceId: 'reed' }, l), occupied);
  assert.notEqual(applyAction(occupied, rotate('reed'), l), occupied);
});
test('shrinking cannot delete a player or hunter floor; previews remain pure', () => {
  const l = levels[0], state = { ...initialState(l), scale: 2, player: { x: 4, y: 2 } };
  assert.equal(applyAction(state, scale(1), l), state); assert.equal(preview(state, scale(1), l), null);
  const snapshot = structuredClone(state), p = preview(state, scale(2), l); assert.equal(p, null); assert.deepEqual(state, snapshot);
});
test('cutting a seam maps each shadow deterministically to one valid corner', () => {
  const l = levels[4], s = { ...initialState(l), topology: 'cylinder', shadows: [{ x: 0, y: 3 }] };
  const next = applyAction(s, topology('plane'), l);
  assert.deepEqual(next.shadows, [{ x: 1, y: 3 }]); assert(dualGraph(l, next).graph.has('1,3'));
  assert.deepEqual(remapDual({ x: 0, y: 3 }, l, 'plane'), next.shadows[0]);
});
test('unified objectives are the only win gate; a loss cannot be overwritten by reaching the goal', () => {
  const l = levels[4], s = { ...initialState(l), player: { x: 6, y: 6 } };
  assert(!isLevelComplete(s, l)); assert(!isLevelComplete({ ...s, hasKey: true }, l));
  const goalOnly = { ...l, levelObjectives: [{ type: 'reachGoal' }] };
  assert(isLevelComplete(s, goalOnly)); assert(!isLevelComplete({ ...s, status: 'lost' }, goalOnly));
});
test('collision includes entering a hunter cell on its moving turn', () => {
  const l = levels[1], s = { ...initialState(l), player: { x: 6, y: 3 }, turn: 3 };
  assert.equal(applyAction(s, move('left'), l).status, 'lost');
});
test('shadow reaching its real beacon loses on the correct movement clock', () => {
  const l = levels[3], s = { ...initialState(l), shadows: [{ x: 4, y: 4 }], turn: 5 };
  const next = applyAction(s, { type: 'wait' }, l);
  assert.equal(next.status, 'lost'); assert(same(next.shadows[0], beaconPosition(next, l)));
});
test('score distinguishes success, Par and optional star without lowering old achievements', () => {
  const l = levels[0], s = { ...initialState(l), status: 'won', turn: l.par + 1, starCollected: true };
  assert.equal(score(s, l), 1); assert.equal(score({ ...s, turn: l.par, starCollected: false }, l), 2);
  assert.equal(score({ ...s, turn: l.par }, l), 3); assert.equal(score({ ...s, status: 'playing' }, l), 0);
  let p = recordWin(freshProgress(), 1, 3, 9); p = recordWin(p, 1, 1, 20);
  assert.deepEqual(p.results[1], { stars: 3, bestTurns: 9 });
});
for (const level of levels) for (const requireStar of [false, true]) test(`Level ${level.id}: search and replay ${requireStar ? 'three-star' : 'normal'} route`, () => {
  const solution = solve(level, undefined, { requireStar }); assert(solution); assert(solution.actions.length <= 32);
  const state = replay(level, solution.actions); assert.equal(state.status, 'won'); assert(isLevelComplete(state, level));
  if (requireStar) { assert(state.starCollected); assert.equal(score(state, level), 3); assert.equal(solution.actions.length, level.par); }
  assert.deepEqual(replay(level, solution.actions), state);
  console.log(`Level ${level.id} ${requireStar ? '3 stars' : 'normal'}: ${solution.actions.length} moves / Par ${level.par}`);
});
test('Level 5 physically requires Cylinder, Möbius, scale 3 and puzzle placement', () => {
  const l = levels[4];
  // This relaxed graph allows every direction on every piece and ignores locks,
  // hunters and shadows. Unreachability here proves no real route can bypass it.
  function relaxed({ modes = l.modes, maxScale = 3, pieces = true } = {}) {
    const graph = new Map();
    const present = p => tile(l, p) !== '#' && (pieces || tile(l, p) !== 'J') && (tile(l, p) !== 'b' || maxScale >= 3);
    for (let y = 0; y < l.height; y++) for (let x = 0; x < l.width; x++) {
      const p = { x, y }; if (!present(p)) continue;
      graph.set(key(p), [...new Set(modes.flatMap(mode => directions.flatMap(d => {
        const q = neighbor(p, d, l, mode); return q && present(q) ? [key(q)] : [];
      })))]);
    }
    return graph;
  }
  const start = initialState(l).player, goal = { x: 6, y: 6 }, item = { x: 7, y: 1 };
  assert(shortestPath(relaxed(), start, item)); assert(shortestPath(relaxed(), start, goal));
  assert.equal(shortestPath(relaxed({ modes: ['plane', 'mobius'] }), start, item), null);
  assert.equal(shortestPath(relaxed({ modes: ['plane', 'cylinder'] }), start, goal), null);
  assert.equal(shortestPath(relaxed({ maxScale: 2 }), start, item), null);
  assert.equal(shortestPath(relaxed({ pieces: false }), start, goal), null);
  const route = solve(l).actions;
  assert(route.some(a => a.type === 'topology' && a.value === 'cylinder'));
  assert(route.some(a => a.type === 'topology' && a.value === 'mobius'));
  assert(route.some(a => a.type === 'place')); assert(route.some(a => a.type === 'scale'));
});
test('monsters only traverse actual current edges, including geometry changes on their turn', () => {
  for (const l of levels) {
    const route = solve(l, undefined, { requireStar: true }).actions; let state = initialState(l);
    for (const action of route) {
      const next = applyAction(state, action, l);
      state.hunters.forEach((p, i) => {
        if (same(p, next.hunters[i])) return;
        assert.equal(next.turn % l.hunterSpeed, 0);
        assert(primalGraph(l, next).get(key(p))?.includes(key(next.hunters[i])));
      });
      state.shadows.forEach((p, i) => {
        const mapped = remapDual(p, l, next.topology); if (same(mapped, next.shadows[i])) return;
        assert.equal(next.turn % l.shadowSpeed, 0);
        assert(dualGraph(l, next).graph.get(key(mapped))?.includes(key(next.shadows[i])));
      });
      state = next;
    }
  }
});
test('BFS ties, unreachable enemies and repeated transitions are deterministic', () => {
  const graph = new Map([['0,0', ['1,0', '0,1']], ['1,0', ['1,1']], ['0,1', ['1,1']], ['1,1', []]]);
  assert.deepEqual(shortestPath(graph, '0,0', '1,1'), [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]);
  const l = levels[1], state = { ...initialState(l), turn: 3 };
  assert.deepEqual(applyAction(state, { type: 'wait' }, l).hunters, state.hunters);
});
test('solver hashes every puzzle, collectible, enemy, geometry and clock field', () => {
  const l = levels[4], state = initialState(l); assert.equal(period(l), 8);
  const changes = [s => s.player.x++, s => s.hunters[0].x++, s => s.shadows[0].x++, s => s.pieces[0].rotation++, s => s.pieces[0].slot = 'bridge', s => s.hasKey = true, s => s.starCollected = true, s => s.scale = 2, s => s.topology = 'mobius', s => s.turn++];
  for (const change of changes) { const next = structuredClone(state); change(next); assert.notEqual(stateHash(state, l), stateHash(next, l)); }
  assert.equal(stateHash(state, l), stateHash({ ...state, turn: 8 }, l));
});
test('undo fully restores all snapshots, including a won state and a lost state', () => {
  const l = levels[4], session = createSession(l), route = solve(l, undefined, { requireStar: true }).actions;
  const snapshots = [session.snapshot()];
  route.forEach(a => { assert(session.act(a).valid); snapshots.push(session.snapshot()); });
  assert.equal(session.state.status, 'won');
  for (let i = snapshots.length - 2; i >= 0; i--) { assert(session.undo()); assert.deepEqual(session.snapshot(), snapshots[i]); }
  assert.equal(session.undo(), false);
  const enemyLevel = levels[1], lost = createSession(enemyLevel, { state: { ...initialState(enemyLevel), player: { x: 6, y: 3 }, turn: 3 }, history: [] });
  const before = lost.snapshot(); lost.act(move('left')); assert.equal(lost.state.status, 'lost'); lost.undo(); assert.deepEqual(lost.snapshot(), before);
});
test('arbitrary wrong puzzle rotations have recoverable paths and occupied pieces can be repaired', () => {
  const l = levels[2], wrong = replay(l, [place('reed', 'bridge'), rotate('reed'), move('left'), rotate('reed')]);
  assert.equal(wrong.player.x, 1);
  const solution = solve(l, wrong); assert(solution); assert.equal(replay(l, solution.actions, wrong).status, 'won');
});
test('storage restores the exact current state AND undo history; restart resets only current attempt', () => {
  const l = levels[2], session = createSession(l); [rotate('reed'), place('reed', 'bridge'), move('down')].forEach(a => session.act(a));
  const p = recordWin(recordWin(freshProgress(), 1, 1, 10), 2, 2, 7);
  p.currentLevel = 3; p.snapshot = session.snapshot();
  const values = new Map(), storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  assert(saveProgress(storage, p)); const restored = loadProgress(storage, levels);
  assert.equal(restored.currentLevel, 3); assert.deepEqual(restored.snapshot, session.snapshot());
  const restoredSession = createSession(l, restored.snapshot); assert(restoredSession.undo()); assert.equal(restoredSession.state.turn, 2);
  restoredSession.restart(); assert.deepEqual(restoredSession.state, initialState(l)); assert.equal(restored.results[1].stars, 1);
});
test('one star unlocks the next level; stars and best scores never regress on replay', () => {
  let p = freshProgress(); assert.equal(unlockedLevel(p), 1);
  for (let id = 1; id <= 5; id++) { p = recordWin(p, id, 1, 20); assert.equal(unlockedLevel(p), Math.min(id + 1, 5)); }
  p = recordWin(p, 2, 3, 8); p = recordWin(p, 2, 1, 25); assert.deepEqual(p.results[2], { stars: 3, bestTurns: 8 });
  assert.equal(normalizeProgress({ version: 2, currentLevel: 5, results: {} }).currentLevel, 1);
});
test('corrupt, obsolete and inaccessible storage cannot block play', () => {
  assert.deepEqual(loadProgress({ getItem: () => '{bad' }, levels), freshProgress());
  assert.deepEqual(loadProgress({ getItem: () => { throw Error('denied'); } }, levels), freshProgress());
  assert.equal(saveProgress({ setItem: () => { throw Error('quota'); } }, freshProgress()), false);
  const legacy = normalizeProgress(null, { 1: 6, 2: 9 }); assert.equal(legacy.currentLevel, 3); assert.equal(legacy.results[1].stars, 1);
  const snap = createSession(levels[2]).snapshot(); snap.state.pieces[0].rotation = NaN; assert(!validSnapshot(snap, levels[2]));
  const malicious = { ...freshProgress(), snapshot: { state: {}, history: [] } };
  assert.equal(loadProgress({ getItem: k => k === SAVE_KEY ? JSON.stringify(malicious) : null }, levels).snapshot, null);
});
test('winning save unlocks and records the next level before the animation can be interrupted', () => {
  const p = recordWin(freshProgress(), 1, 3, 9), raw = JSON.stringify(p);
  const loaded = loadProgress({ getItem: k => k === SAVE_KEY ? raw : null }, levels);
  assert.equal(loaded.currentLevel, 2); assert.equal(loaded.snapshot, null); assert.equal(unlockedLevel(loaded), 2);
});
test('a damaged legacy save cannot erase a valid new save, and valid legacy data survives a damaged new save', () => {
  const p = recordWin(freshProgress(), 1, 3, 9);
  const loaded = loadProgress({ getItem: k => k === SAVE_KEY ? JSON.stringify(p) : '{broken' }, levels);
  assert.equal(loaded.currentLevel, 2); assert.equal(loaded.results[1].stars, 3);
  const migrated = loadProgress({ getItem: k => k === SAVE_KEY ? '{broken' : '{"1":6}' }, levels);
  assert.equal(migrated.currentLevel, 2); assert.equal(migrated.results[1].stars, 1);
});
test('queued fast inputs execute once in FIFO order, independent of render animations', () => {
  const scheduled = new Map(); let id = 0; const received = [];
  const queue = createActionQueue(a => received.push(a.direction), { schedule: fn => { scheduled.set(++id, fn); return id; }, cancel: i => scheduled.delete(i), limit: 3 });
  assert(queue.push(move('left'))); assert(queue.push(move('up'))); assert(queue.push(move('right'))); assert(!queue.push(move('down')));
  while (scheduled.size) { const [i, fn] = scheduled.entries().next().value; scheduled.delete(i); fn(); }
  assert.deepEqual(received, ['left', 'up', 'right']); assert.equal(queue.length, 0);
  queue.push(move('down')); queue.clear(); assert.equal(scheduled.size, 0); assert.equal(queue.length, 0);
});
test('swipes reject taps and yield exactly one dominant-axis direction', () => {
  const p = { x: 50, y: 50 };
  assert.equal(swipeDirection(p, { x: 51, y: 60 }), null);
  assert.equal(swipeDirection(p, { x: 90, y: 55 }), 'right');
  assert.equal(swipeDirection(p, { x: 10, y: 45 }), 'left');
  assert.equal(swipeDirection(p, { x: 52, y: 90 }), 'down');
  assert.equal(swipeDirection(p, { x: 47, y: 10 }), 'up');
});
test('touch coordinate conversion respects SVG scaling and letterbox translation', () => {
  const svg = { getScreenCTM: () => ({ inverse: () => ({}) }), createSVGPoint: () => ({ x: 0, y: 0, matrixTransform() { return { x: (this.x - 10) / 2, y: (this.y - 30) / 2 }; } }) };
  const screen = { x: 10 + 2 * (23 + 1.5 * 56), y: 30 + 2 * (23 + 3.5 * 56) };
  assert.deepEqual(cellFromClient(svg, screen.x, screen.y), { x: 1, y: 3 });
});
test('render all levels/views/preview states as deterministic valid SVG', () => {
  for (const l of levels) for (const view of ['primal', 'dual', 'combined']) {
    const s = initialState(l), svg = renderBoard(l, s, { view, selected: l.pieces[0]?.id });
    assert(svg.startsWith('<svg')); assert(!/undefined|NaN/.test(svg)); assert.equal(svg, renderBoard(l, s, { view, selected: l.pieces[0]?.id }));
    assert(!/undefined|NaN/.test(renderBoard(l, s, { view, previewState: preview(s, scale(2), l) })));
  }
});
test('app controls resolve to unique HTML IDs, load without a start gate, and use relative asset paths', () => {
  const html = readFileSync(new URL('../../seamshift/index.html', import.meta.url), 'utf8'), app = readFileSync(new URL('../../assets/seamshift/app.js', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
  const references = [...app.matchAll(/\$\('#([\w-]+)'\)/g)].map(m => m[1]); references.forEach(id => assert(ids.includes(id), `Missing control ${id}`));
  assert(!/id="(?:start-button|menu-dialog|seal-requirements)"/.test(html)); assert(html.includes('viewport-fit=cover'));
  assert(html.includes('../assets/seamshift/app.js')); assert(!html.includes('src="/assets/'));
});
