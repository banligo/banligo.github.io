import { active, directions, dualGraph, key, neighbor, primalGraph, primalOpen, same, seededRandom, shortestPath, tile } from './graphs.js';
import { beaconPosition, plateActive, requirements, shadowPaths } from './engine.js';

const C = 62, P = 35;
const colors = { cyan: '#72e5d3', blue: '#74beff', red: '#ff7385', purple: '#bd89ff', gold: '#f1ca77' };
const px = p => ({ x: P + (p.x + .5) * C, y: P + (p.y + .5) * C });
const corner = p => ({ x: P + p.x * C, y: P + p.y * C });
const line = (a, b, color, width, extra = '') => `<path d="M${a.x},${a.y}L${b.x},${b.y}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const centered = (p, content, before, seam = false) => {
  const start = before && !same(p, before) && !seam ? px(before) : null, end = px(p);
  return `<g transform="translate(${end.x} ${end.y})">${start ? `<animateTransform attributeName="transform" type="translate" from="${start.x} ${start.y}" to="${end.x} ${end.y}" dur=".15s"/>` : ''}${seam ? '<animate attributeName="opacity" values="0;1" dur=".3s"/>' : ''}${content}</g>`;
};
const edgeId = (a, b) => [key(a), key(b)].sort().join(':');

function primalEdges(level, state) {
  const edges = new Map();
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const a = { x, y };
    for (const dir of directions) {
      const b = neighbor(a, dir, level, state.topology);
      if (b && primalOpen(level, state, a, b)) edges.set(edgeId(a, b), { a, b });
    }
  }
  return edges;
}

function drawPrimalEdge(a, b, color, width, extra = '') {
  if (Math.abs(a.x - b.x) <= 1) return line(px(a), px(b), color, width, extra);
  const left = a.x < b.x ? a : b, right = a.x > b.x ? a : b;
  return line(px(left), { x: P - 10, y: px(left).y }, color, width, extra) + line(px(right), { x: px(right).x + C / 2 + 10, y: px(right).y }, color, width, extra);
}

function dualSegment(a, b, level, state, color, width, extra = '') {
  if (Math.abs(a.x - b.x) <= 1) return line(corner(a), corner(b), color, width, extra);
  const left = a.x < b.x ? a : b, right = a.x > b.x ? a : b;
  const out = { x: P + C * level.width, y: corner(right).y };
  return line(corner(right), out, color, width, extra) + `<circle cx="${corner(left).x}" cy="${corner(left).y}" r="3" fill="${color}"/>`;
}

export function renderBoard(level, state, { view = 'primal', previewState = null, previous = null } = {}) {
  const w = P * 2 + level.width * C, h = P * 2 + level.height * C;
  const random = seededRandom(level.seed), centers = new Map();
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) centers.set(`${x},${y}`, { x: (random() - .5) * 2, y: (random() - .5) * 2 });
  const floorParts = [], edges = primalEdges(level, state), floorItems = [], wallParts = [], dualParts = [], actors = [], previews = [];
  const shown = previewState ?? state, primalOpacity = view === 'dual' ? .25 : 1;
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const p = { x, y }, t = tile(level, p), c = px(p), jitter = centers.get(key(p)), on = active(level, p, state.scale);
    if (t === '#') {
      wallParts.push(`<rect x="${c.x - 21}" y="${c.y - 21}" width="42" height="42" rx="7" fill="#0c131b" stroke="#192630" stroke-width=".7"/><path d="M${c.x - 4} ${c.y}h8M${c.x} ${c.y - 4}v8" stroke="#253542" stroke-width=".7"/>`);
      continue;
    }
    const changing = previewState && active(level, p, shown.scale) !== on;
    floorParts.push(`<rect class="floor" x="${c.x - 24 + jitter.x}" y="${c.y - 24 + jitter.y}" width="48" height="48" rx="9" fill="${on ? '#1b2a35' : '#111e29'}" stroke="${changing ? (on ? '#ff7385' : '#72e5d3') : on ? '#30434e' : '#345268'}" stroke-width="${changing ? 1.8 : 1}" ${on ? '' : 'stroke-dasharray="3 4"'}/>`);
    if (t === 'a' || t === 'b') floorItems.push(`<text x="${c.x}" y="${c.y + 18}" text-anchor="middle" fill="${on ? '#72e5d3' : '#48667b'}" font-size="8" font-family="monospace">r ≥ ${t === 'a' ? 2 : 3}</text>`);
    if (t === 'K' && !state.hasKey) floorItems.push(centered(p, `<g stroke="${colors.gold}" fill="none" stroke-width="2.2"><circle cx="-5" cy="-3" r="5"/><path d="m-1 1 10 10m-4-4 3-3m-6 0 3-3"/></g>`));
    if (t === 'D') floorItems.push(centered(p, `<rect x="-11" y="-9" width="22" height="20" rx="4" fill="${state.hasKey ? '#1d3b32' : '#3b3120'}" stroke="${state.hasKey ? '#63917a' : colors.gold}"/><path d="M-6-9v-4a6 6 0 0 1 12 0v${state.hasKey ? '-3' : '4'}" fill="none" stroke="${state.hasKey ? '#63917a' : colors.gold}" stroke-width="2"/><circle cy="1" r="2" fill="${state.hasKey ? '#63917a' : colors.gold}"/>`));
    if (t === 'S') floorItems.push(centered(p, `<rect x="-18" y="-18" width="36" height="36" rx="5" fill="${plateActive(state, level) ? '#1e443d' : '#222635'}" stroke="${plateActive(state, level) ? colors.cyan : '#717a94'}" stroke-width="1.5"/><path d="M-11-11h22v22h-22Z" fill="none" stroke="#778193" stroke-width=".7"/>`));
    if (t === 'T') floorItems.push(centered(p, `<path d="M0-15 15 0 0 15-15 0Z" fill="${state.sealActivated ? '#324b39' : '#302c28'}" stroke="${state.sealActivated ? colors.cyan : colors.gold}" stroke-width="1.5"/><path d="M-6-6h12M0-6V7" stroke="${state.sealActivated ? colors.cyan : colors.gold}" stroke-width="2"/>`));
    if (t === 'E') {
      const ready = requirements(state, level).every(r => r.met), color = ready ? colors.cyan : '#527b70';
      floorItems.push(centered(p, `<rect x="-16" y="-18" width="32" height="36" rx="6" fill="${ready ? '#21463e' : '#182f2d'}" stroke="${color}" stroke-width="1.5"/><path d="M-7 0H7M2-5l5 5-5 5" fill="none" stroke="${color}" stroke-width="2"/><text y="29" text-anchor="middle" fill="${color}" font-size="7" letter-spacing="1">EXIT</text>`));
    }
  }
  for (const { a, b } of edges.values()) {
    const bridge = level.bridges.find(e => edgeId(a, b) === edgeId({ x: e.from[0], y: e.from[1] }, { x: e.to[0], y: e.to[1] }));
    edges.set(edgeId(a, b), { a, b });
    floorParts.unshift(drawPrimalEdge(a, b, bridge ? '#345f5b' : '#263a46', bridge ? 12 : 11));
    if (bridge) floorItems.push(drawPrimalEdge(a, b, colors.cyan, 2));
  }
  for (const bridge of level.bridges) if (state.scale < bridge.birth) {
    const a = px({ x: bridge.from[0], y: bridge.from[1] }), b = px({ x: bridge.to[0], y: bridge.to[1] });
    floorItems.push(line(a, b, '#9a7a4b', 2, 'stroke-dasharray="3 5"') + `<text x="${(a.x + b.x) / 2}" y="${a.y - 14}" font-family="monospace" font-size="8" text-anchor="middle" fill="#c9b07c">r ≥ ${bridge.birth}</text>`);
  }
  if (previewState) {
    const future = primalEdges(level, shown);
    for (const [id, { a, b }] of future) if (!edges.has(id)) previews.push(drawPrimalEdge(a, b, colors.cyan, 3, 'class="preview-edge"'));
    for (const [id, { a, b }] of edges) if (!future.has(id)) previews.push(drawPrimalEdge(a, b, colors.red, 3, 'class="preview-edge"'));
  }
  const { graph, crossings } = dualGraph(level, shown);
  if (view !== 'primal') {
    for (const crossing of crossings) {
      if (crossing.open) dualParts.push(dualSegment(crossing.u, crossing.v, level, shown, '#8159a4', 1.1, 'opacity=".48"'));
      else {
        const u = corner(crossing.u), v = corner(crossing.v);
        if (Math.abs(u.x - v.x) < C * 1.5 && Math.abs(u.y - v.y) < C * 1.5) dualParts.push(`<circle cx="${(u.x + v.x) / 2}" cy="${(u.y + v.y) / 2}" r="2" fill="#72e5d3" opacity=".55"/>`);
      }
    }
    for (const id of graph.keys()) { const [x, y] = id.split(',').map(Number), p = corner({ x, y }); dualParts.push(`<circle cx="${p.x}" cy="${p.y}" r="2" fill="#a27ec4" opacity=".6"/>`); }
  }
  const paths = shadowPaths(shown, level);
  if (state.shadows.length) {
    for (const path of paths) if (path) for (let i = 1; i < path.length; i++) dualParts.push(dualSegment(path[i - 1], path[i], level, shown, colors.purple, 2, `class="shadow-route" opacity="${view === 'primal' ? .4 : .85}"`));
    const beacon = corner(beaconPosition(shown, level));
    dualParts.push(`<g transform="translate(${beacon.x} ${beacon.y})"><circle r="14" fill="#281b40" stroke="${colors.purple}" stroke-width="1"/><circle r="21" fill="none" stroke="${colors.purple}" opacity=".3" class="beacon-pulse"/><path d="M0-7 7 0 0 7-7 0Z" fill="none" stroke="${colors.purple}"/><text y="-26" text-anchor="middle" fill="#9874bd" font-size="7" letter-spacing="1">BEACON</text></g>`);
    shown.shadows.forEach((p, index) => {
      const c = corner(p), next = paths[index]?.[1];
      if (next) { const q = corner(next); dualParts.push(`<path d="M${q.x} ${q.y - 8}l8 8-8 8-8-8Z" fill="none" stroke="${colors.purple}" opacity=".55" stroke-dasharray="2 3"/>`); }
      actors.push(`<g transform="translate(${c.x} ${c.y})" class="actor-glow"><path d="M0-12 10 0 0 12-10 0Z" fill="${colors.purple}"/><path d="m-4-1 4 4 4-4" fill="none" stroke="#3e2255" stroke-width="2"/></g>`);
    });
  }
  const hunterGraph = primalGraph(level, shown);
  state.hunters.forEach((p, i) => {
    const next = shortestPath(hunterGraph, p, state.player)?.[1];
    if (next) {
      const q = px(next);
      floorItems.push(drawPrimalEdge(p, next, colors.red, 1, 'opacity=".4" stroke-dasharray="3 4"') + `<path d="M${q.x} ${q.y - 12}l12 12-12 12-12-12Z" fill="none" stroke="${colors.red}" opacity=".45" stroke-dasharray="3 3"/>`);
    }
    actors.push(centered(p, `<g class="actor-glow"><path d="M0-15 13-3 10 11 0 15-10 11-13-3Z" fill="#482735" stroke="${colors.red}" stroke-width="1.6"/><path d="m-7-3 4 3m10-3-4 3" stroke="${colors.red}" stroke-width="2"/><path d="M-4 6h8" stroke="#fa97a2"/></g>`, previous?.hunters[i], previous && Math.abs(previous.hunters[i].x - p.x) > 1));
  });
  state.boxes.forEach((p, i) => floorItems.push(centered(p, '<rect x="-17" y="-17" width="34" height="34" rx="5" fill="#594734" stroke="#c3a17c" stroke-width="1.6"/><path d="M-11-11 11 11M11-11-11 11M-11-11h22v22h-22Z" fill="none" stroke="#9b7c5e" stroke-width="1.5"/>', previous?.boxes[i], previous && Math.abs(previous.boxes[i].x - p.x) > 1)));
  actors.push(centered(state.player, `<circle r="18" fill="#74beff" opacity=".08"/><circle r="11" fill="#20405a" stroke="${colors.blue}" stroke-width="1.7" class="actor-glow"/><circle r="5.3" fill="${colors.blue}"/><path d="M-3-17h6" stroke="${colors.blue}" stroke-width="1.5"/>`, previous?.player, previous && Math.abs(previous.player.x - state.player.x) > 1));

  const boundaries = [];
  if (shown.topology !== 'plane') for (let y = 0; y < level.height; y++) {
    const left = { x: 0, y }, right = { x: level.width - 1, y: shown.topology === 'mobius' ? level.height - 1 - y : y };
    if (!primalOpen(level, shown, left, right)) continue;
    const l = px(left), r = px(right), code = String.fromCharCode(65 + y);
    boundaries.push(`<path d="M${P + 5} ${l.y - 15}Q${P - 20} ${l.y} ${P + 5} ${l.y + 15}M${w - P - 5} ${r.y - 15}Q${w - P + 20} ${r.y} ${w - P - 5} ${r.y + 15}" fill="none" stroke="#72e5d3" stroke-width="1.3" opacity=".65"/><text x="${P - 20}" y="${l.y + 3}" text-anchor="middle" class="boundary-label">${code}</text><text x="${w - P + 20}" y="${r.y + 3}" text-anchor="middle" class="boundary-label">${code}</text>`);
  }
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${level.subtitle}，玩家位置 ${state.player.x},${state.player.y}，尺度 ${state.scale}，${state.topology}，回合 ${state.turn}"><defs><filter id="actor-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><text x="${P}" y="19" class="board-label">${previewState ? 'POSSIBLE WORLD / PREVIEW' : `SECTOR 0${level.id} / ${view.toUpperCase()}`}</text><g opacity="${view === 'dual' ? .65 : 1}">${wallParts.join('')}</g><g opacity="${primalOpacity}">${floorParts.join('')}${floorItems.join('')}</g>${dualParts.join('')}${previews.join('')}${boundaries.join('')}${actors.join('')}</svg>`;
}
