import { seededRandom } from './graphs.js';
const definitions = [
  { id: 1, title: 'Broken Path', subtitle: '断开的路', seed: 103,
    map: ['######', '#P...#', '#..#.#', '#.##.#', '#...E#', '######'],
    bridges: [{from:[1,1],to:[1,2],distance:1.05}, { from: [3,1], to: [4,1], distance: 1.05 }, { from: [4,2], to: [4,3], distance: 1.32 }, { from:[1,3], to:[1,4], distance:1.32 }],
    scales: [1, 2, 3], modes: ['plane'], star: { x: 2, y: 2 },
    lesson: '改变连接范围，让道路相遇。', goalText: '找到通往终点的路。',
    hints: ['留意那块半透明的道路。', '试着把尺度放大一档。'], par: 9 },
  { id: 2, title: 'Other Side', subtitle: '另一边', seed: 211,
    map: ['#######', '.P####K', '.######', '.######', 'M######', 'DE#####', '#######'],
    scales: [1], modes: ['plane', 'cylinder', 'mobius'], hunterSpeed: 1, wakeOnKey: true, star: { x: 0, y: 2 },
    lesson: '先绕到钥匙，再把边界翻过来；小兽也会过边界。', goalText: '绕开小兽，走到终点。',
    hints: ['地图的左右两侧看起来很接近。', '选择圆柱，再试着走过左边界。'], par: 8 },
  { id: 3, title: 'Missing Piece', subtitle: '缺失的碎片', seed: 307,
    map: ['#######', '.JP####', '##.####', '#######', '#####E#', '#####J.', '#######'],
    scales: [1], modes: ['plane', 'cylinder', 'mobius'], star: { x: 2, y: 2 },
    slots: [{ id: 'bridge', x: 1, y: 1 }, { id: 'bend', x: 5, y: 5 }],
    pieces: [
      { id: 'reed', shape: 'straight', rotation: 0, allowedSlots: ['bridge'], color: 'ochre' },
      { id: 'bend', shape: 'corner', rotation: 3, allowedSlots: ['bend'], color: 'clay' }],
    lesson: '碎片没有固定位置，试着改变道路的方向。', goalText: '拼好道路，穿过扭转的边界。',
    hints: ['缺口两侧的道路，需要对得上。', '先让接口对上；碎片可以跨槽位移动，边界也能帮你。'], par: 12 },
  { id: 4, title: 'Shadow Maze', subtitle: '影子迷宫', seed: 409,
    map: ['###.###', '#P....#', '#.#.###', '#...#.#', '###J###', '#...E.#', '###.###'],
    slots: [{id:'barrier',x:3,y:4}], pieces:[{id:'barrier',shape:'straight',rotation:1,color:'sage'}],
    scales: [1], modes: ['plane','cylinder','mobius'], star: { x: 5, y: 1 }, starGuarded:true, shadowSpeed: 6, shadow: [2, 4], beacon: [5, 4],
    lesson: '你打开的道路，可能会挡住别的东西。', goalText: '挡住影子，走到终点。',

    hints: ['观察紫色影子脚下那条细路。', '把直路转向上下并放进缺口，留意紫色道路和边界。'], par: 12 },
  { id: 5, title: 'GeoMaze', subtitle: '缝隙之间', seed: 503,
    map: ['#########', '.JP..##K.', '##.####.#', '#J.###M.#', '#..######', '#########', '######E##', '######JD.', '#########'],
    scales: [1, 2, 3], modes: ['plane', 'cylinder', 'mobius'], hunterSpeed: 1, wakeOnKey: true, shadowSpeed: 8,
    shadow: [2, 4], beacon: [6, 4], star: { x: 1, y: 4 }, starGuarded:true,
    bridges: [{from:[0,1],to:[1,1],distance:1.32}, {from:[1,4],to:[2,4],distance:1.05}],
    slots: [{ id: 'bridge', x: 1, y: 1 }, {id:'ring',x:1,y:3}, { id: 'bend', x: 6, y: 7 }],
    pieces: [
      { id: 'reed', shape: 'straight', rotation: 0, allowedSlots: ['bridge'], color: 'ochre' },
      { id: 'bend', shape: 'corner', rotation: 3, allowedSlots: ['bend'], color: 'clay' }],

    lesson: '路可以拼起来，世界也可以。', goalText: '拼起道路，取钥匙，再折叠空间抵达终点。',
    hints: ['先看看影子身边那圈没有闭合的路。', '弯路闭合小环可隔开影子；碎片还能收回再用，圆柱通往钥匙。'], par: 28 },
];
export const levels = definitions.map(level => ({
  initialScale: 1, initialTopology: 'plane', radii: [.9,1.1,1.4], bridges: [], slots: [], pieces: [],
  levelObjectives: [{ type: 'reachGoal' }], ...level, width: level.map[0].length, height: level.map.length,
}));
for (const level of levels) {
  level.n3Opt = [10,9,12,13,29][level.id-1]; level.threeStarLimit = level.n3Opt + (level.id === 5 ? 3 : 2); level.par=level.threeStarLimit;
  const random = seededRandom(level.seed);
  level.bridges = level.bridges.map(e => { const dx=e.to[0]-e.from[0],dy=e.to[1]-e.from[1],d=Math.hypot(dx,dy),r=e.distance ?? level.radii[(e.birth ?? 1)-1]; const mx=(e.from[0]+e.to[0])/2,my=(e.from[1]+e.to[1])/2; return {...e,nodes:[{x:mx-dx/d*r/2+(random()-.5)*.008,y:my-dy/d*r/2+(random()-.5)*.008},{x:mx+dx/d*r/2+(random()-.5)*.008,y:my+dy/d*r/2+(random()-.5)*.008}]}; });
  level.pieces = level.pieces.map(p => ({...p, allowedSlots:level.slots.map(s=>s.id)}));
  level.levelObjectives = [{type:'reachGoal'}];
}
export const getLevel = id => levels.find(level => level.id === Number(id));
