import { active, directions, dualGraph, neighbor, primalGraph, primalOpen, remapDual, same, shortestPath, tile } from './graphs.js';

export function positions(level, symbol) {
  const found = [];
  level.map.forEach((row, y) => [...row].forEach((t, x) => { if (t === symbol) found.push({ x, y }); }));
  return found;
}
export function initialState(level) {
  return {
    levelId: level.id, player: positions(level, 'P')[0], boxes: positions(level, 'B'), hunters: positions(level, 'M'),
    shadows: level.shadow ? [{ x: level.shadow[0], y: level.shadow[1] }] : [],
    scale: level.initialScale, topology: level.initialTopology, hasKey: false, sealActivated: false,
    turn: 0, status: 'playing', events: ['空间已就绪。每次有效行动推进一回合。'],
  };
}
export const plateActive = (state, level) => positions(level, 'S').every(p => state.boxes.some(b => same(p, b)));
export const beaconPosition = (state, level) => level.beacon ? remapDual({ x: level.beacon[0], y: level.beacon[1] }, level, state.topology) : null;
export function shadowPaths(state, level) {
  if (!state.shadows.length) return [];
  const { graph } = dualGraph(level, state), beacon = beaconPosition(state, level);
  return state.shadows.map(p => shortestPath(graph, p, beacon));
}
export const disconnected = (state, level) => state.shadows.length > 0 && shadowPaths(state, level).every(p => !p);
export function requirements(state, level, conditions = level.exit) {
  return [
    ...(conditions.key ? [{ label: '取得钥匙', met: state.hasKey }] : []),
    ...(conditions.plate ? [{ label: '箱子压住机关', met: plateActive(state, level) }] : []),
    ...(conditions.sealed ? [{ label: '激活封印', met: state.sealActivated }] : []),
    ...(conditions.scale ? [{ label: `尺度 ${conditions.scale}`, met: state.scale === conditions.scale }] : []),
    ...(conditions.topology ? [{ label: ({ plane: '平面', cylinder: '圆柱', mobius: '莫比乌斯' })[conditions.topology], met: state.topology === conditions.topology }] : []),
    ...(conditions.disconnected ? [{ label: '暗影与信标不连通', met: disconnected(state, level) }] : []),
  ];
}
export const rejected = (state, message) => ({ state, valid: false, message });

// Full snapshots live outside this pure transition function. Invalid actions
// return the original object and never advance an enemy's clock.
export function transition(state, action, level) {
  if (state.status !== 'playing') return rejected(state, '关卡已结束，可以撤销或重开。');
  const next = structuredClone(state), events = [];
  const previouslyDisconnected = state.shadows.length ? disconnected(state, level) : false;
  if (action.type === 'move') {
    const dir = directions.find(d => d.name === action.direction);
    if (!dir) return rejected(state, '未知方向。');
    const target = neighbor(state.player, dir, level, state.topology);
    if (!target || !primalOpen(level, state, state.player, target)) return rejected(state, '道路尚未接通。试试尺度或空间切换。');
    const boxIndex = state.boxes.findIndex(p => same(p, target));
    if (boxIndex >= 0) {
      const beyond = neighbor(target, dir, level, state.topology);
      if (!beyond || !primalOpen(level, state, target, beyond) || state.boxes.some(p => same(p, beyond)) || state.hunters.some(p => same(p, beyond)) || same(beyond, state.player)) return rejected(state, '箱子前方没有可用空间。');
      next.boxes[boxIndex] = beyond;
    }
    next.player = target;
    if (Math.abs(target.x - state.player.x) > 1) events.push(state.topology === 'mobius' ? '边界穿越：上下位置翻转。' : '边界穿越：到达世界另一端。');
    if (tile(level, target) === 'K' && !state.hasKey) { next.hasKey = true; events.push('取得钥匙，所有金色锁门已开启。'); }
  } else if (action.type === 'scale') {
    if (!level.scales.includes(action.value) || state.scale === action.value) return rejected(state, '当前关卡不支持该尺度，或尺度没有变化。');
    if ([state.player, ...state.boxes, ...state.hunters].some(p => !active(level, p, action.value))) return rejected(state, '无法缩小：角色或箱子仍在即将消失的地板上。');
    next.scale = action.value;
    events.push(action.value > state.scale ? '尺度放大：新的桥梁出现。' : '尺度缩小：高阈值道路关闭。');
  } else if (action.type === 'topology') {
    if (!level.modes.includes(action.value) || state.topology === action.value) return rejected(state, '当前关卡不支持该空间，或空间没有变化。');
    next.topology = action.value;
    next.shadows = state.shadows.map(p => remapDual(p, level, next.topology));
    events.push(({ plane: '切开边界，回到平面。', cylinder: '左右边界已连接。', mobius: '边界已扭转：左右连接，上下翻转。' })[next.topology]);
  } else if (action.type === 'interact') {
    if (tile(level, state.player) !== 'T' || !level.seal) return rejected(state, '站在封印台 T 上，按 F 激活。');
    if (state.sealActivated) return rejected(state, '封印已经激活。');
    const missing = requirements(state, level, level.seal).filter(r => !r.met);
    if (missing.length) return rejected(state, `封印还需要：${missing.map(r => r.label).join('、')}。`);
    next.sealActivated = true; events.push('封印已激活，将在这次关卡中永久保留。');
  } else if (action.type === 'wait') events.push('等待一回合。');
  else return rejected(state, '未知操作。');
  next.turn++;
  if (positions(level, 'S').length && plateActive(next, level) !== plateActive(state, level)) events.push(plateActive(next, level) ? '压力板已激活。' : '压力板已释放。');
  const nowDisconnected = next.shadows.length ? disconnected(next, level) : false;
  if (nowDisconnected !== previouslyDisconnected) events.push(nowDisconnected ? '暗影路径已切断。' : '暗影路径重新接通。');

  // Entering an occupied hunter cell loses even if that hunter would move away.
  if (next.hunters.some(p => same(p, next.player))) { next.status = 'lost'; events.push('撞上猎手。撤销一步，换条路试试。'); }
  if (level.hunterSpeed && next.turn % level.hunterSpeed === 0) {
    const graph = primalGraph(level, next);
    next.hunters = next.hunters.map(p => shortestPath(graph, p, next.player)?.[1] ?? p);
    if (next.hunters.some(p => same(p, next.player))) { next.status = 'lost'; events.push('猎手追上了你。'); }
  }
  if (level.shadowSpeed && next.turn % level.shadowSpeed === 0) {
    const paths = shadowPaths(next, level);
    next.shadows = next.shadows.map((p, i) => paths[i]?.[1] ?? p);
  }
  if (next.shadows.some(p => same(p, beaconPosition(next, level)))) { next.status = 'lost'; events.push('暗影抵达信标。'); }
  if (next.status === 'playing' && tile(level, next.player) === 'E') {
    const missing = requirements(next, level).filter(r => !r.met);
    if (!missing.length) { next.status = 'won'; events.push('出口已开启。空间重构完成。'); }
    else events.push(`出口还需要：${missing.map(r => r.label).join('、')}。`);
  }
  next.events = events.length ? events : ['行动完成。'];
  return { state: next, valid: true, message: next.events.join(' ') };
}
export const applyAction = (state, action, level) => transition(state, action, level).state;
export function preview(state, action, level) {
  // A preview changes geometry only, without moving monsters or advancing time.
  if (action.type === 'scale' && (!level.scales.includes(action.value) || [state.player, ...state.boxes, ...state.hunters].some(p => !active(level, p, action.value)))) return null;
  if (action.type === 'topology' && !level.modes.includes(action.value)) return null;
  return { ...state, scale: action.type === 'scale' ? action.value : state.scale, topology: action.type === 'topology' ? action.value : state.topology, shadows: state.shadows.map(p => remapDual(p, level, action.type === 'topology' ? action.value : state.topology)) };
}
export function createSession(level) {
  let state = initialState(level); const history = [];
  return {
    get state() { return state; }, get undoCount() { return history.length; },
    act(action) { const result = transition(state, action, level); if (result.valid) { history.push(state); state = result.state; } return result; },
    undo() { if (!history.length) return false; state = history.pop(); return true; },
    restart() { state = initialState(level); history.length = 0; },
  };
}
