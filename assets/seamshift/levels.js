const definitions = [
  {
    id: 1, title: 'Broken Bridge', subtitle: '断桥', seed: 103,
    map: ['#######', '#P..KE#', '#######'],
    scales: [1, 2], modes: ['plane'],
    bridges: [{ from: [2, 1], to: [3, 1], birth: 2 }],
    exit: { key: true, scale: 1 },
    lesson: '放大尺度，让断桥出现。拿到钥匙后缩回尺度 1，再走向出口。',
    concept: '尺度越大，道路越多。但出口也有自己的尺度要求。',
  },
  {
    id: 2, title: 'Around the World', subtitle: '世界的另一端', seed: 211,
    map: ['#######', '.P###K.', '.#####.', '.E###M.', '#######'],
    scales: [1], modes: ['plane', 'cylinder'], hunterSpeed: 2,
    exit: { key: true },
    lesson: '切换圆柱，让左右边界相连。绕到另一端取钥匙，小心每两回合行动的猎手。',
    concept: '圆柱把左右边界的同一行接起来。猎手也能使用这条路。',
  },
  {
    id: 3, title: 'Twisted Room', subtitle: '扭转的房间', seed: 307,
    map: ['#######', '.P#####', '#B#####', '#S#####', '#######', '####K.E', '#######'],
    scales: [1], modes: ['plane', 'mobius'],
    exit: { key: true, plate: true, topology: 'mobius' },
    lesson: '向下推动箱子压住机关。回到左边界，用莫比乌斯扭转去往右下方。',
    concept: '莫比乌斯边界上下翻转：第 1 行连接到第 5 行。箱子只能推，不能拉。',
  },
  {
    id: 4, title: 'Shadow Barrier', subtitle: '暗影屏障', seed: 409,
    map: ['###.###', '#P..K.#', '#.#D###', '#...#.#', '###a###', '#...E.#', '###.###'],
    scales: [1, 2], modes: ['plane'],
    shadowSpeed: 5, shadow: [2, 4], beacon: [5, 4],
    exit: { key: true, disconnected: true },
    lesson: '拿钥匙开门，放大尺度接通竖向道路。你的道路会成为暗影无法穿过的屏障。',
    concept: '青色道路和紫色道路互补：打开一条原始边，就关闭穿过它的对偶边。',
  },
  {
    id: 5, title: 'Topological Paradox', subtitle: '拓扑悖论', seed: 503,
    map: ['####.####', '.P.BS##K.', '#.##D##.#', '#T..b#M.#', '#.##a####', '##...#..E', '####.####'],
    scales: [1, 2, 3], modes: ['plane', 'cylinder', 'mobius'],
    hunterSpeed: 3, shadowSpeed: 8, shadow: [2, 4], beacon: [6, 4],
    seal: { key: true, plate: true, topology: 'plane', scale: 3, disconnected: true },
    exit: { key: true, plate: true, sealed: true, scale: 2, topology: 'mobius' },
    lesson: '压住机关，经圆柱取钥匙。在平面、尺度 3 下隔断暗影并按 F 封印；再以尺度 2 和莫比乌斯抵达出口。',
    concept: '平面的屏障能分开两个区域；周期边界却允许绕行。先在平面完成封印，再扭转空间离开。',
  },
];

export const levels = definitions.map(level => ({
  initialScale: 1, initialTopology: 'plane', bridges: [], ...level,
  width: level.map[0].length, height: level.map.length,
}));
export const getLevel = id => levels.find(level => level.id === id);
