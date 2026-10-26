import { active, directions, dualGraph, key, neighbor, primalGraph, primalOpen, same, seededRandom, shortestPath, tile } from './graphs.js';
import { beaconPosition, disconnected, objectiveMet, shadowPaths } from './engine.js';
import { pieceAt, ports } from './pieces.js';
import { starPath } from './icons.js';
export const CELL = 56, PADDING = 23;
const center = p => ({ x: PADDING + (p.x + .5) * CELL, y: PADDING + (p.y + .5) * CELL });
const corner = p => ({ x: PADDING + p.x * CELL, y: PADDING + p.y * CELL });
const palette = { ochre: ['#c9a368', '#80613e'], clay: ['#be846a', '#86523e'], sage: ['#92a485', '#5d735e'] };
const line = (a, b, stroke, width = 2, extra = '') => `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
export function pieceDrawing(piece, definition, previous = null) {
  const [fill, stroke] = palette[definition.color] ?? palette.ochre;
  const arms = ports({ ...piece, rotation: 0 }, definition).map(i => `M0 0L${directions[i].x * 25} ${directions[i].y * 25}`).join(' ');
  const from = (previous?.rotation ?? piece.rotation) * 90;
  const to = from + ((piece.rotation - (previous?.rotation ?? piece.rotation) + 4) % 4) * 90;
  return `<g class="puzzle-art"><path d="M-22-22h15q0-7 7-7t7 7h15v15q-7 0-7 7t7 7v15H7q0-7-7-7t-7 7h-15V7q7 0 7-7t-7-7Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><g transform="rotate(${piece.rotation * 90})">${previous && from !== to ? `<animateTransform attributeName="transform" type="rotate" from="${from}" to="${to}" dur=".14s"/>` : ''}<path d="${arms}" fill="none" stroke="${stroke}" stroke-width="13" stroke-linecap="butt"/><path d="${arms}" fill="none" stroke="#f5e7c3" stroke-width="8" stroke-linecap="butt"/><circle r="4" fill="#f5e7c3"/></g><path d="M-17-16h4M15 15h3" stroke="${stroke}" opacity=".5" stroke-linecap="round"/></g>`;
}
export function pieceIcon(piece, definition) {
  return `<svg viewBox="-31 -32 62 64" aria-hidden="true">${pieceDrawing(piece, definition)}</svg>`;
}
function actor(p, contents, previous, cornerActor = false) {
  const coordinates = cornerActor ? corner : center, c = coordinates(p);
  const old = previous && coordinates(previous);
  const wraps = previous && Math.abs(previous.x - p.x) > 1;
  return `<g transform="translate(${c.x} ${c.y})">${old && !same(p, previous) && !wraps ? `<animateTransform attributeName="transform" type="translate" from="${old.x} ${old.y}" to="${c.x} ${c.y}" dur=".115s"/>` : ''}${wraps ? '<animate attributeName="opacity" values="0;1" dur=".18s"/>' : ''}${contents}</g>`;
}
function segment(a, b, level, coordinates, color, width, extra = '') {
  if (Math.abs(a.x - b.x) <= 1) return line(coordinates(a), coordinates(b), color, width, extra);
  const left = a.x < b.x ? a : b, right = a.x > b.x ? a : b;
  return line(coordinates(right), { x: PADDING + level.width * CELL + 11, y: coordinates(right).y }, color, width, extra) + line({ x: PADDING - 11, y: coordinates(left).y }, coordinates(left), color, width, extra);
}
export function renderBoard(level, state, { previous = null, selected = null, view = 'primal', previewState = null } = {}) {
  const width = level.width * CELL + PADDING * 2, height = level.height * CELL + PADDING * 2;
  const random = seededRandom(level.seed), ground = [], markings = [], overlay = [], actors = [];
  const shown = previewState ?? state;
  const borders = [];
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const p = { x, y }, t = tile(level, p), c = center(p), variation = random();
    if (t === '#') {
      const fill = variation < .35 ? '#b8b097' : variation < .7 ? '#c3bba3' : '#bdb59c';
      ground.push(`<g class="wall"><rect x="${c.x - 26}" y="${c.y - 22}" width="52" height="51" rx="5" fill="#98927c"/><rect x="${c.x - 26}" y="${c.y - 27}" width="52" height="48" rx="5" fill="${fill}"/><path d="M${c.x - 18} ${c.y - 19}h${15 + Math.floor(variation * 15)}M${c.x + 13} ${c.y + 13}h6" stroke="#dbd3bb" stroke-width="2" stroke-linecap="round" opacity=".6"/>${variation < .2 ? `<path d="M${c.x - 18} ${c.y + 14}q5-8 12-2t8-3" fill="none" stroke="#7d8d6c" stroke-width="3" stroke-linecap="round"/>` : ''}</g>`);
      continue;
    }
    const on = active(level, p, state.scale, state), oldOn = previous && active(level, p, previous.scale, previous);
    const piece = pieceAt(level, state, p), slot = level.slots.find(s => same(s, p));
    if (slot && !piece) {
      const highlighted = selected && level.pieces.find(d => d.id === selected)?.allowedSlots.includes(slot.id);
      ground.push(`<g data-slot="${slot.id}" role="button" tabindex="0" aria-label="拼图空位 ${level.slots.indexOf(slot) + 1}" class="puzzle-slot ${highlighted ? 'slot-highlight' : ''}"><rect x="${c.x - 25}" y="${c.y - 25}" width="50" height="50" rx="4" fill="${highlighted ? '#f1da9b' : '#b4ac95'}" stroke="${highlighted ? '#876338' : '#8a8069'}" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M${c.x - 9} ${c.y}h18M${c.x} ${c.y - 9}v18" stroke="#897f65" opacity=".55"/><text x="${c.x + 17}" y="${c.y + 19}" font-size="9" text-anchor="middle" fill="#6d654f">${['Ⅰ', 'Ⅱ', 'Ⅲ'][level.slots.indexOf(slot)]}</text></g>`);
      continue;
    }
    const changed = previous && on !== oldOn;
    ground.push(`<g opacity="${on ? 1 : .42}" class="floor">${changed ? `<animate attributeName="opacity" values="${on ? '0;1' : '1;.42'}" dur=".17s"/>` : ''}<rect x="${c.x - 26}" y="${c.y - 23}" width="52" height="52" rx="4" fill="#b5a789"/><rect x="${c.x - 26}" y="${c.y - 27}" width="52" height="50" rx="4" fill="${t === 'a' || t === 'b' ? '#d7d4ad' : '#ded1ad'}" stroke="${on ? '#c5b791' : '#8e9a78'}" stroke-width="1" ${on ? '' : 'stroke-dasharray="4 3"'}/></g>`);
    if (!piece) {
      const arms = directions.flatMap((d, i) => {
        const q = neighbor(p, d, level, state.topology);
        return q && primalOpen(level, state, p, q) ? [`M${c.x} ${c.y}l${d.x * 28} ${d.y * 28}`] : [];
      }).join(' ');
      ground.push(`<path d="${arms}" fill="none" stroke="#eee2c4" stroke-width="15" stroke-linejoin="round"/>`);
    }
    if (t === 'a' || t === 'b') markings.push(`<g fill="${on ? '#798462' : '#798867'}">${Array.from({ length: t === 'a' ? 2 : 3 }, (_, i) => `<rect x="${c.x - 9 + i * 7}" y="${c.y + 16}" width="4" height="3" rx="1"/>`).join('')}</g>`);
    if (piece) {
      const definition = level.pieces.find(d => d.id === piece.id), prior = previous?.pieces.find(d => d.id === piece.id);
      markings.push(`<g transform="translate(${c.x} ${c.y})" data-slot="${slot.id}" data-map-piece="${piece.id}" role="button" tabindex="0" aria-label="旋转拼图 ${level.pieces.indexOf(definition) + 1}" class="placed-piece ${selected === piece.id ? 'selected-piece' : ''}"><rect x="-27" y="-29" width="54" height="56" rx="4" fill="transparent"/>${pieceDrawing(piece, definition, prior)}${selected === piece.id ? '<rect x="-27" y="-28" width="54" height="55" rx="5" fill="none" stroke="#685b3b" stroke-width="1.8" stroke-dasharray="3 3"/>' : ''}</g>`);
    }
    if (t === 'D') markings.push(actor(p, `<path d="M-20-19h40v38h-40Z" fill="${state.hasKey ? '#b0b28a' : '#8c775b'}" stroke="#66563f" stroke-width="2"/><path d="M-13-18v36M0-18v36M13-18v36" stroke="#d7bd89" stroke-width="2"/>${state.hasKey ? '<path d="M-10 0h20" stroke="#607758" stroke-width="3"/>' : '<rect x="-6" y="-5" width="12" height="13" rx="2" fill="#deb25d" stroke="#765c36"/><path d="M-4-5v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#deb25d" stroke-width="2"/>'}`));
    if (t === 'K' && !state.hasKey) markings.push(actor(p, '<g fill="none" stroke="#8c6234" stroke-width="3"><circle cx="-5" cy="-5" r="6" fill="#e9c475"/><path d="m-1-1 12 12m-5-5 4-4m-8 0 4-4"/></g>'));
    if (t === 'E') {
      const ready = level.levelObjectives.filter(o => o.type !== 'reachGoal').every(o => objectiveMet(o, state, level));
      markings.push(actor(p, `<ellipse cy="9" rx="21" ry="13" fill="#a1b18a"/><path d="M-15 11V-6a15 15 0 0 1 30 0v17Z" fill="${ready ? '#6d8b6c' : '#a0a789'}" stroke="#53644a" stroke-width="2"/><path d="M-8 11V-5a8 8 0 0 1 16 0v16Z" fill="${ready ? '#ebdbaa' : '#c5c4a2'}"/>${ready ? '<path d="M-4 1h8m-3-3 3 3-3 3" fill="none" stroke="#7e966a" stroke-width="2"/>' : '<circle r="3" fill="#7c7e60"/>'}<path d="M-20 13h40" stroke="#5d7052" stroke-width="3" stroke-linecap="round"/>`));
    }
  }
  if (!state.starCollected && Math.abs(state.player.x - level.star.x) + Math.abs(state.player.y - level.star.y) <= 3) {
    markings.push(actor(level.star, `<ellipse cy="13" rx="11" ry="3" fill="#ad985f" opacity=".2"/><g class="star-shard"><path d="${starPath}" fill="#e9b54e" stroke="#ad7f32" stroke-width="1.4"/><path d="m-2-4 2-4 1 4" stroke="#fff0b4" fill="none" stroke-width="1.6"/></g>`));
  }
  const { graph, crossings } = dualGraph(level, shown);
  if (view !== 'primal') {
    for (const e of crossings) if (e.open) overlay.push(segment(e.u, e.v, level, corner, '#79637b', 1.3, 'opacity=".42"'));
    for (const id of graph.keys()) { const [x, y] = id.split(',').map(Number), c = corner({ x, y }); overlay.push(`<circle cx="${c.x}" cy="${c.y}" r="1.8" fill="#8d738d" opacity=".5"/>`); }
  }
  if (state.shadows.length) {
    const paths = shadowPaths(shown, level);
    paths.forEach(path => { if (path) for (let i = 1; i < path.length; i++) overlay.push(segment(path[i - 1], path[i], level, corner, '#79607e', 2, 'stroke-dasharray="3 5" class="shadow-trail"')); });
    const beacon = beaconPosition(shown, level);
    overlay.push(actor(beacon, '<ellipse cy="13" rx="12" ry="4" fill="#6a586a" opacity=".18"/><path d="M-7 9V-5h14V9Z" fill="#b1a0a9" stroke="#655467" stroke-width="1.5"/><path d="M-10-6h20M-9 10H9M-3-9q3-5 6 0" fill="none" stroke="#655467" stroke-width="2"/><path d="M0 5c-5-3-2-7 0-10 3 4 5 7 0 10" fill="#eeddbb"/>', null, true));
    shown.shadows.forEach((p, i) => {
      const next = paths[i]?.[1];
      if (next) { const c = corner(next); overlay.push(`<circle cx="${c.x}" cy="${c.y}" r="7" fill="none" stroke="#8a7389" stroke-width="1.2" stroke-dasharray="2 3"/>`); }
      actors.push(actor(p, `<ellipse cy="10" rx="12" ry="4" fill="#544358" opacity=".2"/><path d="M-12 7C-12-15 12-15 12 7l-5-2-4 5-5-4-8 4Z" fill="#67536e" stroke="#4b3d50" stroke-width="1.5"/><ellipse cx="-4" cy="-2" rx="2" ry="3" fill="#f7e7c6"/><ellipse cx="4" cy="-2" rx="2" ry="3" fill="#f7e7c6"/>${disconnected(shown, level) ? '<path d="M-4 4h8" stroke="#ad9bad" stroke-width="1.4"/>' : ''}`, previous?.shadows[i], true));
    });
  }
  const hunterGraph = primalGraph(level, shown);
  state.hunters.forEach((p, i) => {
    const next = shortestPath(hunterGraph, p, state.player)?.[1];
    if (next) {
      const c = center(next); overlay.push(segment(p, next, level, center, '#a1604d', 1.3, 'stroke-dasharray="2 4" opacity=".6"') + `<path d="M${c.x - 3} ${c.y + 4}l3-5 3 5" fill="none" stroke="#a1604d" opacity=".65"/>`);
    }
    actors.push(actor(p, '<ellipse cy="13" rx="19" ry="5" fill="#786048" opacity=".25"/><path d="m-17 4-2-12 8 5 3-10 7 7 7-8 3 11 10-4-2 13Z" fill="#97674f" stroke="#77513e" stroke-width="1.5"/><ellipse cy="4" rx="16" ry="11" fill="#bb8060" stroke="#77513e" stroke-width="1.4"/><path d="M-9 11v5M9 11v5" stroke="#77513e" stroke-width="3" stroke-linecap="round"/><circle cx="-6" cy="1" r="2" fill="#443c30"/><circle cx="6" cy="1" r="2" fill="#443c30"/><ellipse cy="7" rx="4" ry="3" fill="#d29a79"/>', previous?.hunters[i]));
  });
  actors.push(actor(state.player, '<ellipse cy="17" rx="13" ry="4" fill="#8e7e60" opacity=".25"/><path d="M-8 12v6M6 12v6" stroke="#66563f" stroke-width="5" stroke-linecap="round"/><path d="M-10-1Q-14 9-9 14H9Q12 5 8-1Z" fill="#b97053" stroke="#825c44" stroke-width="1.5"/><path d="M-10 0q-6 2-3 10" stroke="#748566" stroke-width="5" stroke-linecap="round"/><path d="M-11-5a11 11 0 0 1 22 0v5h-22Z" fill="#e7d7af" stroke="#8b7957" stroke-width="1.5"/><path d="M-7-3h14v5H-7Z" fill="#eedfbe"/><circle cx="-4" cy="-1" r="1.4" fill="#514634"/><circle cx="4" cy="-1" r="1.4" fill="#514634"/><path d="M-10 4h18l5 7-8-3H-8Z" fill="#73886c" stroke="#5a7055" stroke-width=".8"/>', previous?.player));
  if (shown.topology !== 'plane') for (let y = 0; y < level.height; y++) {
    const a = { x: 0, y }, b = { x: level.width - 1, y: shown.topology === 'mobius' ? level.height - 1 - y : y };
    if (!primalOpen(level, shown, a, b)) continue;
    const l = center(a), r = center(b), label = String.fromCharCode(65 + y);
    borders.push(`<g class="seam-port"><path d="M${PADDING - 3} ${l.y - 15}q-15 15 0 30M${width - PADDING + 3} ${r.y - 15}q15 15 0 30" fill="none" stroke="${shown.topology === 'mobius' ? '#a6746a' : '#728967'}" stroke-width="2"/><text x="${PADDING - 14}" y="${l.y + 3}" text-anchor="middle" fill="#756748" font-size="9">${label}</text><text x="${width - PADDING + 14}" y="${r.y + 3}" text-anchor="middle" fill="#756748" font-size="9">${label}</text></g>`);
  }
  if (previewState) for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const a = { x, y };
    for (const d of directions.slice(1, 3)) {
      const b = neighbor(a, d, level, shown.topology); if (!b) continue;
      const old = primalOpen(level, state, a, b), future = primalOpen(level, shown, a, b);
      if (old !== future) overlay.push(segment(a, b, level, center, future ? '#648461' : '#ae6f56', 3, 'stroke-dasharray="4 4"'));
    }
  }
  return `<svg viewBox="0 0 ${width} ${height}" role="${level.pieces.length ? 'group' : 'img'}" aria-label="第 ${level.id} 关，玩家 ${state.player.x},${state.player.y}，${state.turn} 步，尺度 ${state.scale}，${state.topology}" style="--map-width:${width};--map-height:${height}"><g opacity="${view === 'dual' ? .45 : 1}">${ground.join('')}${markings.join('')}</g>${overlay.join('')}${borders.join('')}${actors.join('')}</svg>`;
}
