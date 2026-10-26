import { active, directions, dualGraph, neighbor, primalGraph, primalOpen, remapDual, same, shortestPath, tile } from './graphs.js';
export function positions(level, symbol) {
  return level.map.flatMap((row, y) => [...row].flatMap((t, x) => t === symbol ? [{ x, y }] : []));
}
export function initialState(level) {
  return { version: 2, levelId: level.id, player: positions(level, 'P')[0], hunters: positions(level, 'M'),
    shadows: level.shadow ? [{ x: level.shadow[0], y: level.shadow[1] }] : [],
    pieces: level.pieces.map(p => ({ id: p.id, rotation: p.rotation, slot: null })),
    scale: level.initialScale, topology: level.initialTopology, hasKey: false, starCollected: false,
    turn: 0, status: 'playing', events: [] };
}
export const beaconPosition = (state, level) => level.beacon ? remapDual({ x: level.beacon[0], y: level.beacon[1] }, level, state.topology) : null;
export function shadowPaths(state, level) {
  if (!state.shadows.length) return [];
  const { graph } = dualGraph(level, state);
  return state.shadows.map(p => shortestPath(graph, p, beaconPosition(state, level)));
}
export const disconnected = (state, level) => !!state.shadows.length && shadowPaths(state, level).every(p => !p);
export function objectiveMet(objective, state, level) {
  switch (objective.type) {
    case 'reachGoal': return tile(level, state.player) === 'E';
    case 'key': return state.hasKey;
    case 'shadowDisconnected': return disconnected(state, level);
    case 'scale': return state.scale === objective.value;
    case 'topology': return state.topology === objective.value;
    case 'piecesPlaced': return state.pieces.every(p => p.slot !== null);
    default: throw new Error(`Unknown objective: ${objective.type}`);
  }
}
export const isLevelComplete = (state, level) => state.status !== 'lost' && level.levelObjectives.every(o => objectiveMet(o, state, level));
export function score(state, level) {
  if (state.status !== 'won') return 0;
  return 1 + Number(state.turn <= level.par) + Number(state.turn <= level.par && state.starCollected);
}
export const rejected = (state, message) => ({ state, valid: false, message });
function geometryChange(state, action, level) {
  const next = structuredClone(state);
  if (action.type === 'scale') {
    if (!level.scales.includes(action.value) || state.scale === action.value) return rejected(state, '这一档还不能用。');
    if ([state.player, ...state.hunters].some(p => !active(level, p, action.value, state))) return rejected(state, '先离开将要消失的道路。');
    next.scale = action.value;
  } else if (action.type === 'topology') {
    if (!level.modes.includes(action.value) || state.topology === action.value) return rejected(state, '这条边界还不能改变。');
    next.topology = action.value; next.shadows = next.shadows.map(p => remapDual(p, level, action.value));
  } else if (['rotate', 'place', 'remove'].includes(action.type)) {
    const piece = next.pieces.find(p => p.id === action.pieceId), definition = level.pieces.find(p => p.id === action.pieceId);
    if (!piece || !definition) return rejected(state, '先选一块碎片。');
    if (action.type === 'rotate') piece.rotation = (piece.rotation + 1) % 4;
    else {
      if (piece.slot) {
        const oldSlot = level.slots.find(s => s.id === piece.slot);
        if ([state.player, ...state.hunters].some(p => same(p, oldSlot))) return rejected(state, '有人站在这块路上；可旋转，或先移开。');
      }
      if (action.type === 'remove') {
        if (!piece.slot) return rejected(state, '碎片已在背包里。');
        piece.slot = null;
      } else {
        const slot = level.slots.find(s => s.id === action.slotId);
        if (!slot || !definition.allowedSlots.includes(slot.id)) return rejected(state, '试试带有相同纹样的空位。');
        if (state.pieces.some(p => p.slot === slot.id)) return rejected(state, '空位已有碎片，可先收回。');
        piece.slot = slot.id;
      }
    }
  } else return rejected(state, '无法预览这个操作。');
  return { state: next, valid: true };
}
export function preview(state, action, level) {
  const result = geometryChange(state, action, level); return result.valid ? result.state : null;
}
export function transition(state, action, level) {
  if (state.status !== 'playing') return rejected(state, '可撤销一步，或重来。');
  let next; const events = [];
  if (action.type === 'move') {
    const dir = directions.find(d => d.name === action.direction), target = dir && neighbor(state.player, dir, level, state.topology);
    if (!target || !primalOpen(level, state, state.player, target)) return rejected(state, tile(level, target || state.player) === 'D' ? '那扇门需要钥匙。' : '路还没接上。试试另一种办法。');
    next = structuredClone(state); next.player = target;
    if (Math.abs(target.x - state.player.x) > 1) events.push(state.topology === 'mobius' ? '另一边，上下倒了过来。' : '原来两边连在一起。');
    if (tile(level, target) === 'K' && !state.hasKey) { next.hasKey = true; events.push('钥匙找到了。'); }
    if (same(target, level.star) && !state.starCollected) { next.starCollected = true; events.push('捡到一片星光。'); }
  } else if (action.type === 'wait') next = structuredClone(state);
  else {
    const result = geometryChange(state, action, level); if (!result.valid) return result;
    next = result.state;
    events.push(({ rotate: '道路转了一个方向。', place: '碎片落位。两端要对上才能走。', remove: '碎片收回了。', scale: '有些路改变了。', topology: '世界的边缘改变了。' })[action.type]);
  }
  next.turn++;
  if (state.shadows.length && disconnected(state, level) !== disconnected(next, level)) events.push(disconnected(next, level) ? '影子停住了。' : '影子又找到路了。');
  if (next.hunters.some(p => same(p, next.player))) next.status = 'lost';
  if (level.hunterSpeed && next.turn % level.hunterSpeed === 0) {
    const graph = primalGraph(level, next);
    next.hunters = next.hunters.map(p => shortestPath(graph, p, next.player)?.[1] ?? p);
    if (next.hunters.some(p => same(p, next.player))) next.status = 'lost';
  }
  if (level.shadowSpeed && next.turn % level.shadowSpeed === 0) {
    const paths = shadowPaths(next, level); next.shadows = next.shadows.map((p, i) => paths[i]?.[1] ?? p);
  }
  if (next.shadows.some(p => same(p, beaconPosition(next, level)))) next.status = 'lost';
  if (next.status === 'lost') events.push('没关系，撤销一步就好。');
  else if (isLevelComplete(next, level)) { next.status = 'won'; events.push('找到路了。'); }
  else if (tile(level, next.player) === 'E') events.push(level.goalText);
  next.events = events;
  return { state: next, valid: true, message: events.at(-1) || '' };
}
export const applyAction = (state, action, level) => transition(state, action, level).state;
export function createSession(level, snapshot = null) {
  let state = snapshot?.state ? structuredClone(snapshot.state) : initialState(level);
  const history = snapshot?.history ? structuredClone(snapshot.history) : [];
  return { get state() { return state; }, get undoCount() { return history.length; },
    snapshot: () => ({ state: structuredClone(state), history: structuredClone(history) }),
    act(action) { const result = transition(state, action, level); if (result.valid) { history.push(state); state = result.state; } return result; },
    undo() { if (!history.length) return false; state = history.pop(); return true; },
    restart() { state = initialState(level); history.length = 0; } };
}
