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
  { id: 3, title:'Loose Threads', subtitle:'编起道路', seed:307,
    map:['#######','.JJP###','###.###','#######','#######','####EJ.','#######'],
    scales:[1,2,3],modes:['plane','cylinder','mobius'],star:{x:3,y:2},starScale:2,
    bridges:[{from:[0,1],to:[1,1],distance:1.05}],
    slots:[{id:'bridge',x:1,y:1},{id:'middle',x:2,y:1},{id:'bend',x:5,y:5}],
    pieces:[{id:'reed',shape:'straight',rotation:0,color:'ochre'},{id:'bend',shape:'corner',rotation:3,color:'clay'},{id:'fork',shape:'tee',rotation:0,color:'sage'}],
    lesson:'接口要对上，连接范围也要够。',goalText:'拼起道路，找到终点。',
    hints:['每块碎片都能放在任意槽位。','看看虚线桥两侧的范围；碎片可以收回，再用一次。'] },
  { id:4,title:'Between the Paths',subtitle:'裂隙里的邻居',seed:409,
    map:['####.##','#PJ..##','##.#.##','#....##','#..#.##','##...##','####.E#'],
    scales:[1],modes:['plane','cylinder','mobius','torus'],star:{x:3,y:3},
    slots:[{id:'barrier',x:2,y:1}],pieces:[{id:'barrier',shape:'straight',rotation:0,color:'sage'}],
    shadow:[4,3],beacon:[1,4],shadowSpeed:3,
    lesson:'紫色地板有危险，虚线框预告下一回合。',goalText:'避开裂隙的影子，找到终点。',
    hints:['影子只影响它周围的地板，走远一点就安全。','转动碎片会改动紫色通道；环面也能从上下边界绕行。'] },
  { id:5,title:'Seamloom',subtitle:'织出另一条路',seed:503,
    map:['###.####','.#PJ###.','##..###.','##J....M','##.##..#','##...E.#','###.####','###.####'],
    scales:[1,2,3],modes:['plane','cylinder','mobius','torus'],star:{x:3,y:7},
    bridges:[{from:[2,3],to:[2,4],distance:1.05},{from:[3,1],to:[3,0],distance:1.32}],
    slots:[{id:'bridge',x:3,y:1},{id:'bend',x:2,y:3}],
    pieces:[{id:'reed',shape:'straight',rotation:0,color:'ochre'},{id:'bend',shape:'corner',rotation:0,color:'clay'}],
    hunterSpeed:1,alertRadius:5,shadow:[4,4],beacon:[6,5],shadowSpeed:3,
    lesson:'有危险时，可以等待，也可以织出另一条路。',goalText:'避开紫色地板，走到终点。',
    hints:['下方的缺口需要一块路和更大的连接范围。','星光就在上下相连的另一边；留意影子的下一步。'] },
];
export const levels = definitions.map(level => ({
  revision: level.id >= 3 ? 2 : 1, initialScale: 1, initialTopology: 'plane', radii: [.9,1.1,1.4], bridges: [], slots: [], pieces: [],
  levelObjectives: [{ type: 'reachGoal' }], ...level, width: level.map[0].length, height: level.map.length,
}));
for (const level of levels) {
  level.n3Opt ??= [10,9,14,13,13][level.id-1]; level.threeStarLimit ??= level.n3Opt + 2; level.par=level.threeStarLimit;
  const random = seededRandom(level.seed);
  level.bridges = level.bridges.map(e => { const dx=e.to[0]-e.from[0],dy=e.to[1]-e.from[1],d=Math.hypot(dx,dy),r=e.distance ?? level.radii[(e.birth ?? 1)-1]; const mx=(e.from[0]+e.to[0])/2,my=(e.from[1]+e.to[1])/2; return {...e,nodes:[{x:mx-dx/d*r/2+(random()-.5)*.008,y:my-dy/d*r/2+(random()-.5)*.008},{x:mx+dx/d*r/2+(random()-.5)*.008,y:my+dy/d*r/2+(random()-.5)*.008}]}; });
  level.pieces = level.pieces.map(p => ({...p, allowedSlots:level.slots.map(s=>s.id)}));
  level.levelObjectives = [{type:'reachGoal'}];
}
export const getLevel = id => levels.find(level => level.id === Number(id));
