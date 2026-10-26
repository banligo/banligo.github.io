import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../../assets/seamshift/levels.js';
import { active, directions, dualGraph, dualNode, key, neighbor, primalGraph, primalOpen, remapDual, same, seededRandom, shortestPath } from '../../assets/seamshift/graphs.js';
import { applyAction, beaconPosition, createSession, disconnected, initialState, plateActive, preview, requirements, transition } from '../../assets/seamshift/engine.js';
import { actionsFor, period, solve, stateHash } from '../../assets/seamshift/solver.js';
import { renderBoard } from '../../assets/seamshift/board.js';

const move = direction => ({ type: 'move', direction });
const scale = value => ({ type: 'scale', value });
const topology = value => ({ type: 'topology', value });

test('five exact map templates have consistent dimensions and deterministic seeds', () => {
  assert.deepEqual(levels.map(l => [l.width, l.height]), [[7, 3], [7, 5], [7, 7], [7, 7], [9, 7]]);
  levels.forEach(level => {
    assert(level.map.every(row => row.length === level.width));
    assert.equal(level.map.join('').split('P').length, 2);
    assert.equal(level.map.join('').split('E').length, 2);
    const a = seededRandom(level.seed), b = seededRandom(level.seed);
    assert.deepEqual(Array.from({ length: 20 }, a), Array.from({ length: 20 }, b));
  });
});
test('Plane has closed boundaries; Cylinder maps equal rows in both directions', () => {
  const level = levels[1], p = { x: 0, y: 1 };
  assert.equal(neighbor(p, directions[3], level, 'plane'), null);
  assert.deepEqual(neighbor(p, directions[3], level, 'cylinder'), { x: 6, y: 1 });
  assert.deepEqual(neighbor({ x: 6, y: 1 }, directions[1], level, 'cylinder'), p);
  assert.equal(neighbor({ x: 0, y: 0 }, directions[0], level, 'cylinder'), null);
});
test('Möbius maps cell rows H-1-y and is an involution', () => {
  const level = levels[2];
  for (let y = 0; y < level.height; y++) {
    const p = { x: 0, y }, q = neighbor(p, directions[3], level, 'mobius');
    assert.deepEqual(q, { x: 6, y: 6 - y });
    assert.deepEqual(neighbor(q, directions[1], level, 'mobius'), p);
  }
});
test('dual corners use H-j rather than H-1-j', () => {
  assert.deepEqual(dualNode({ x: 7, y: 1 }, levels[2], 'mobius'), { x: 0, y: 6 });
  assert.deepEqual(dualNode({ x: 7, y: 1 }, levels[2], 'cylinder'), { x: 0, y: 1 });
  assert.equal(dualNode({ x: 0, y: 1 }, levels[2], 'plane'), null);
  assert.equal(dualNode({ x: 1, y: 0 }, levels[2], 'mobius'), null);
});
test('geometry filtration is monotone with fixed keys and topology', () => {
  for (const level of levels) for (const mode of level.modes) for (const hasKey of [false, true]) {
    let prior = new Set();
    for (const r of [1, 2, 3]) {
      const state = { ...initialState(level), topology: mode, scale: r, hasKey };
      const graph = primalGraph(level, state, { boxes: false });
      const current = new Set([...graph].flatMap(([a, ns]) => ns.map(b => `${a}:${b}`)));
      prior.forEach(edge => assert(current.has(edge), `${level.id}/${mode}/${r} lost ${edge}`));
      prior = current;
    }
  }
});
test('every actual dual crossing complements its primal edge in all modes', () => {
  for (const level of levels) for (const mode of level.modes) for (const r of level.scales) for (const hasKey of [false, true]) {
    const state = { ...initialState(level), topology: mode, scale: r, hasKey };
    const { graph, crossings } = dualGraph(level, state);
    for (const cross of crossings) {
      assert.equal(cross.open, !primalOpen(level, state, cross.a, cross.b));
      // These maps are wide enough to avoid parallel primal correspondences.
      assert.equal(graph.get(key(cross.u)).includes(key(cross.v)), cross.open);
    }
  }
});
test('topology rebuilds primal and dual adjacency; plane has no external dual ring', () => {
  const level = levels[4], state = initialState(level);
  const plane = dualGraph(level, state).graph;
  const cylinder = dualGraph(level, { ...state, topology: 'cylinder' }).graph;
  const mobius = dualGraph(level, { ...state, topology: 'mobius' }).graph;
  assert.equal(plane.size, (level.width - 1) * (level.height - 1));
  assert.equal(cylinder.size, level.width * (level.height - 1));
  assert.notDeepEqual([...cylinder], [...mobius]);
  assert.notDeepEqual([...primalGraph(level, state)], [...primalGraph(level, { ...state, topology: 'cylinder' })]);
});
test('Level 4 is connected at scale 1 and disconnected at scale 2 with key', () => {
  const level = levels[3], state = initialState(level);
  assert.equal(disconnected(state, level), false);
  assert.equal(disconnected({ ...state, hasKey: true }, level), false);
  assert.equal(disconnected({ ...state, scale: 2, hasKey: true }, level), true);
});
test('Level 5 barrier separates in Plane r=3; Cylinder and Möbius can bypass it', () => {
  const level = levels[4], state = { ...initialState(level), hasKey: true };
  assert.equal(disconnected({ ...state, scale: 2 }, level), false);
  assert.equal(disconnected({ ...state, scale: 3 }, level), true);
  assert.equal(disconnected({ ...state, scale: 3, topology: 'cylinder' }, level), false);
  assert.equal(disconnected({ ...state, scale: 3, topology: 'mobius' }, level), false);
});
test('disconnection checks current shadow position, never its initial position', () => {
  const level = levels[3], state = { ...initialState(level), scale: 2, hasKey: true, shadows: [{ x: 4, y: 4 }] };
  assert.equal(disconnected(state, level), false);
});
test('a box blocks actors without deleting its geometric primal edge', () => {
  const level = levels[2], state = initialState(level), a = { x: 1, y: 1 }, b = { x: 1, y: 2 };
  assert.equal(primalOpen(level, state, a, b), true);
  assert.equal(primalGraph(level, state).has(key(b)), false);
  assert.equal(primalGraph(level, state, { boxes: false }).has(key(b)), true);
});
test('pushing, plate activation, release and player-only occupation are distinct', () => {
  const level = levels[2], start = initialState(level), next = applyAction(start, move('down'), level);
  assert.equal(plateActive(start, level), false); assert.equal(plateActive(next, level), true);
  assert.deepEqual(next.boxes, [{ x: 1, y: 3 }]); assert.deepEqual(start.boxes, [{ x: 1, y: 2 }]);
  assert.equal(plateActive({ ...next, boxes: [{ x: 1, y: 2 }], player: { x: 1, y: 3 } }, level), false);
  assert.equal(applyAction(next, move('down'), level), next);
});
test('a key opens actual door edges and changes the dual graph', () => {
  const level = levels[3], state = initialState(level), a = { x: 3, y: 1 }, b = { x: 3, y: 2 };
  assert.equal(primalOpen(level, state, a, b), false);
  assert.equal(primalOpen(level, { ...state, hasKey: true }, a, b), true);
  assert.notDeepEqual(dualGraph(level, state).graph, dualGraph(level, { ...state, hasKey: true }).graph);
});
test('illegal actions and duplicate scale/topology selections take no turn', () => {
  const level = levels[0], state = initialState(level);
  for (const action of [move('up'), scale(1), scale(3), topology('cylinder'), { type: 'interact' }]) {
    assert.equal(applyAction(state, action, level), state); assert.equal(state.turn, 0);
  }
});
test('shrinking forbids removing floors beneath any player, box or hunter', () => {
  const level = levels[4], base = { ...initialState(level), scale: 3 };
  for (const change of [{ player: { x: 4, y: 3 } }, { boxes: [{ x: 4, y: 3 }] }, { hunters: [{ x: 4, y: 3 }] }]) {
    const state = { ...base, ...change }; assert.equal(applyAction(state, scale(2), level), state);
    assert.equal(preview(state, scale(2), level), null);
  }
});
test('seam mapping remaps one shadow exactly once when a boundary is cut', () => {
  const level = levels[4], state = { ...initialState(level), topology: 'cylinder', shadows: [{ x: 0, y: 3 }], turn: 0 };
  const next = applyAction(state, topology('plane'), level);
  assert.equal(next.shadows.length, 1); assert.deepEqual(next.shadows[0], { x: 1, y: 3 });
  assert(dualGraph(level, next).graph.has(key(next.shadows[0])));
  assert.deepEqual(remapDual({ x: 0, y: 3 }, level, 'plane'), next.shadows[0]);
});
test('seal activation validates key, plate, position, scale, topology and graph', () => {
  const level = levels[4], ready = { ...initialState(level), player: { x: 1, y: 3 }, boxes: [{ x: 4, y: 1 }], hasKey: true, scale: 3, topology: 'plane' };
  assert(requirements(ready, level, level.seal).every(r => r.met));
  for (const change of [{ hasKey: false }, { boxes: [{ x: 3, y: 1 }] }, { scale: 2 }, { topology: 'cylinder' }, { player: { x: 1, y: 2 } }, { shadows: [{ x: 6, y: 3 }] }]) {
    const state = { ...ready, ...change }; assert.equal(applyAction(state, { type: 'interact' }, level), state);
  }
  const sealed = applyAction(ready, { type: 'interact' }, level);
  assert.equal(sealed.sealActivated, true);
  assert.equal(applyAction(applyAction(sealed, scale(2), level), topology('mobius'), level).sealActivated, true);
});
test('full undo restores every state field including enemy clocks and keys', () => {
  const level = levels[4], session = createSession(level), result = solve(level);
  const snapshots = [structuredClone(session.state)];
  for (const action of result.actions) { assert(session.act(action).valid); snapshots.push(structuredClone(session.state)); }
  assert.equal(session.state.status, 'won');
  for (let i = snapshots.length - 2; i >= 0; i--) { assert(session.undo()); assert.deepEqual(session.state, snapshots[i]); }
  assert.equal(session.undo(), false);
  session.act(move('right')); session.restart(); assert.deepEqual(session.state, initialState(level)); assert.equal(session.undoCount, 0);
});
test('monster periods are in the solver hash and waiting cannot be conflated', () => {
  const level = levels[4], state = initialState(level);
  assert.equal(period(level), 24);
  assert.notEqual(stateHash(state, level), stateHash({ ...state, turn: 1 }, level));
  assert.equal(stateHash(state, level), stateHash({ ...state, turn: 24 }, level));
  for (const field of ['player', 'boxes', 'hunters', 'shadows', 'hasKey', 'scale', 'topology', 'sealActivated']) {
    const change = { player: { x: 2, y: 1 }, boxes: [{ x: 4, y: 1 }], hunters: [{ x: 7, y: 3 }], shadows: [{ x: 3, y: 4 }], hasKey: true, scale: 2, topology: 'cylinder', sealActivated: true };
    assert.notEqual(stateHash(state, level), stateHash({ ...state, [field]: change[field] }, level));
  }
});
test('entering a hunter cell loses even on its movement turn; exit cannot override death', () => {
  const level = levels[1];
  const state = { ...initialState(level), player: { x: 6, y: 3 }, turn: 1 };
  assert.equal(applyAction(state, move('left'), level).status, 'lost');
  const exitState = { ...state, player: { x: 0, y: 3 }, hunters: [{ x: 1, y: 3 }], hasKey: true };
  assert.equal(applyAction(exitState, move('right'), level).status, 'lost');
});
test('a shadow reaching its beacon loses; legal waits advance actual clocks', () => {
  const level = levels[3], state = { ...initialState(level), shadows: [{ x: 4, y: 4 }], turn: 4 };
  const next = applyAction(state, { type: 'wait' }, level);
  assert.equal(next.turn, 5); assert.equal(next.status, 'lost'); assert(same(next.shadows[0], beaconPosition(next, level)));
});
test('BFS ties are deterministic; isolated enemies remain in place', () => {
  const graph = new Map([['0,0', ['1,0', '0,1']], ['1,0', ['1,1']], ['0,1', ['1,1']], ['1,1', []]]);
  assert.deepEqual(shortestPath(graph, { x: 0, y: 0 }, { x: 1, y: 1 }), [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]);
  const level = levels[1], state = { ...initialState(level), turn: 1 };
  assert.deepEqual(applyAction(state, { type: 'wait' }, level).hunters, state.hunters);
});
test('preview is pure and changes geometry without moving actors or clocks', () => {
  const level = levels[4], state = initialState(level), snapshot = structuredClone(state);
  const next = preview(state, topology('mobius'), level);
  assert.deepEqual(state, snapshot); assert.deepEqual(next.hunters, state.hunters); assert.equal(next.turn, state.turn);
  assert.equal(next.topology, 'mobius');
});

for (const level of levels) test(`Level ${level.id}: solver discovers and replays a complete <=50-turn win with legal enemy edges`, () => {
  const solution = solve(level); assert(solution, 'No winning route'); assert(solution.actions.length <= 50);
  let state = initialState(level);
  for (const action of solution.actions) {
    const before = structuredClone(state), next = applyAction(state, action, level);
    assert.notEqual(next, state); assert.notEqual(next.status, 'lost'); assert.deepEqual(state, before);
    const geometryAfterAction = { ...next, hunters: before.hunters };
    before.hunters.forEach((p, i) => {
      const q = next.hunters[i]; if (same(p, q)) return;
      assert.equal(next.turn % level.hunterSpeed, 0);
      assert(primalGraph(level, geometryAfterAction).get(key(p))?.includes(key(q)));
    });
    before.shadows.forEach((p, i) => {
      const mapped = remapDual(p, level, next.topology), q = next.shadows[i]; if (same(mapped, q)) return;
      assert.equal(next.turn % level.shadowSpeed, 0);
      assert(dualGraph(level, next).graph.get(key(mapped))?.includes(key(q)));
    });
    state = next;
  }
  assert.equal(state.status, 'won');
  let repeated = initialState(level); solution.actions.forEach(action => { repeated = applyAction(repeated, action, level); });
  assert.deepEqual(repeated, state);
  console.log(`Level ${level.id}: ${solution.actions.length} turns, ${solution.expanded} states expanded`);
});
test('hint search resolves a deviated, still-solvable state using the current state', () => {
  const level = levels[4]; let state = applyAction(initialState(level), { type: 'wait' }, level);
  const solution = solve(level, state); assert(solution);
  solution.actions.forEach(action => { state = applyAction(state, action, level); }); assert.equal(state.status, 'won');
});
test('all views and geometry previews render actual SVG without undefined/NaN', () => {
  for (const level of levels) for (const view of ['primal', 'dual', 'combined']) {
    const state = initialState(level);
    const svg = renderBoard(level, state, { view, previewState: preview(state, scale(Math.max(...level.scales)), level) });
    assert(svg.startsWith('<svg')); assert(!/undefined|NaN/.test(svg)); assert(svg.includes('role="img"'));
  }
});
