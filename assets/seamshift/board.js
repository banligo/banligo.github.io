import {bridgeIsOpen,roomAt,territoryAt} from './world.js';
import {hunterArt,shadowArt,trapArt,riftArt,controlArt,lampArt,energyArt,bridgeArt,keyArt,playerArt,darkFloorArt,noiseArt} from './sprites.js';
import { active, directions, dualGraph, key, neighbor, primalGraph, primalOpen, same, remapDual, seededRandom, shortestPath, tile } from './graphs.js';
import { beaconPosition, disconnected, starActive, shadowDanger, shadowPaths, predictTurn, darkDanger, dangerCells, hunterMode, hunterAlertCells, lampSupply } from './engine.js';
import { pieceAt, ports } from './pieces.js';
import { starPath } from './icons.js';
export const CELL = 56, PADDING = 23;
export const cellCenter = p => ({ x: PADDING + (p.x + .5) * CELL, y: PADDING + (p.y + .5) * CELL });
export const dualCorner = p => ({ x: PADDING + p.x * CELL, y: PADDING + p.y * CELL });
const center=cellCenter,corner=dualCorner;
const wallCache = new WeakMap();
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
  if (Math.abs(a.x-b.x)<=1 && Math.abs(a.y-b.y)>1) {
    const top=a.y<b.y?a:b,bottom=a.y>b.y?a:b;
    return line(coordinates(top),{x:coordinates(top).x,y:PADDING-11},color,width,extra)+line(coordinates(bottom),{x:coordinates(bottom).x,y:PADDING+level.height*CELL+11},color,width,extra);
  }
  if (Math.abs(a.x - b.x) <= 1) return line(coordinates(a), coordinates(b), color, width, extra);
  const left = a.x < b.x ? a : b, right = a.x > b.x ? a : b;
  return line(coordinates(right), { x: PADDING + level.width * CELL + 11, y: coordinates(right).y }, color, width, extra) + line({ x: PADDING - 11, y: coordinates(left).y }, coordinates(left), color, width, extra);
}
export function renderBoardLayers(level, state, { previous = null, selected = null, view = 'primal', previewState = null, lightweight = false } = {}) {
  const width = level.width * CELL + PADDING * 2, height = level.height * CELL + PADDING * 2;
  const random = seededRandom(level.seed), walls = [], ground = [], markings = [], overlay = [], actors = [];
  const shown = previewState ?? state, prediction=predictTurn(shown,level), wallVariant = 'simple', cachedWalls = wallCache.get(level)?.[wallVariant];
  const borders = [];
  for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const p = { x, y }, t = tile(level, p), c = center(p), variation = random();
    if (t === '#') {
      if (cachedWalls !== undefined) continue;
      const fill = variation < .35 ? '#e4dfd2' : variation < .7 ? '#eae5d9' : '#e6e1d5';
      walls.push(`<rect class="wall" x="${c.x - 26}" y="${c.y - 27}" width="52" height="52" rx="4" fill="${fill}" stroke="#c9c2ae" stroke-width=".6"/>`); continue;
    }
    const on = active(level, p, state.scale, state), oldOn = previous && active(level, p, previous.scale, previous);
    const piece = pieceAt(level, state, p), slot = level.slots.find(s => same(s, p));
    if (slot && !piece) {
      const highlighted = false;
      ground.push(`<g data-slot="${slot.id}" role="button" tabindex="0" aria-label="空白建路地面 ${x},${y}" class="puzzle-slot ${highlighted ? 'slot-highlight' : ''}"><rect x="${c.x - 25}" y="${c.y - 25}" width="50" height="50" rx="4" fill="#e5decc" stroke="${highlighted ? '#876338' : '#8a8069'}" stroke-width="1.5" /><path d="M${c.x - 16} ${c.y+15}h3m23 0h3" stroke="#b5a88e" opacity=".5"/><text x="${c.x + 17}" y="${c.y + 19}" font-size="9" text-anchor="middle" fill="#6d654f"></text></g>`);
      continue;
    }
    if(t==='R'&&!on){ground.push(`<rect x="${c.x-26}" y="${c.y-26}" width="52" height="52" rx="3" fill="#dbd7c9"/>`);continue;}
    if(t==='B'){ground.push(`<rect x="${c.x-25}" y="${c.y-25}" width="50" height="50" fill="#d5cfbd" rx="3"/>`);continue;}
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
    if(t==='K'&&!state.hasKey)markings.push(actor(p,keyArt()+(level.keyNoise?noiseArt():'')));
    if (t === 'E') {
      const ready = !level.circuit || state.lampLit;
      markings.push(actor(p, `<ellipse cy="9" rx="21" ry="13" fill="#a1b18a"/><path d="M-15 11V-6a15 15 0 0 1 30 0v17Z" fill="${ready ? '#6d8b6c' : '#a0a789'}" stroke="#53644a" stroke-width="2"/><path d="M-8 11V-5a8 8 0 0 1 16 0v16Z" fill="${ready ? '#ebdbaa' : '#c5c4a2'}"/>${ready ? '<path d="M-4 1h8m-3-3 3 3-3 3" fill="none" stroke="#7e966a" stroke-width="2"/>' : '<circle r="3" fill="#7c7e60"/>'}<path d="M-20 13h40" stroke="#5d7052" stroke-width="3" stroke-linecap="round"/>`));
    }
  }
  if (!state.starCollected) {
    actors.push(actor(level.star, `<ellipse cy="13" rx="11" ry="3" fill="#ad985f" opacity=".2"/><g class="star-shard" opacity="${starActive(state,level) ? 1 : .28}"><path d="${starPath}" fill="#e9b54e" stroke="#ad7f32" stroke-width="1.4"/><path d="m-2-4 2-4 1 4" stroke="#fff0b4" fill="none" stroke-width="1.6"/></g>`));
  }
  const { graph, crossings } = view !== 'primal' || state.shadows.length || level.rifts.length || state.world==='dual' ? dualGraph(level, shown) : { graph: new Map(), crossings: [] };
  if (view !== 'primal' || state.shadows.length || level.rifts.length || state.world==='dual') {
    for (const e of crossings) if (e.open) overlay.push(segment(e.u, e.v, level, corner, '#795c85', view === 'primal' ? 1.7 : 2.6, `opacity="${view === 'primal' ? '.25' : '.9'}" class="dual-channel"`));
    for (const id of graph.keys()) { const [x, y] = id.split(',').map(Number), c = corner({ x, y }); overlay.push(`<circle cx="${c.x}" cy="${c.y}" r="2" fill="#795c85" opacity="${view === 'primal' ? .25 : .75}"/>`); }
  }
  if (state.shadows.length) {
    const paths = shadowPaths(shown, level);
    if(level.shadowSpeed) paths.forEach(path => { if (path) for (let i = 1; i < path.length; i++) overlay.push(segment(path[i - 1], path[i], level, corner, '#674571', 2.6, 'opacity=".9" class="shadow-trail"')); });
    if(previous) {
      const old=dualGraph(level,previous).crossings;
      for(const e of crossings) if(!e.open && old.some(o=>o.open && same(o.a,e.a) && same(o.b,e.b))) {
        overlay.push(segment(e.a,e.b,level,center,'#719f9e',5,'opacity=".65"')+segment(e.u,e.v,level,corner,'#b8aeb5',4,'stroke-dasharray="3 5" opacity=".8"'));
      }
    }
    shown.shadows.forEach((p, i) => {
      const next = prediction.shadows[i]&&!same(prediction.shadows[i],p)?prediction.shadows[i]:null;
      if (next) {
        const c=corner(next),dx=next.x-p.x,dy=next.y-p.y;
        const angle=Math.abs(dx)>1 ? (dx<0?0:180) : Math.abs(dy)>1 ? (dy<0?90:-90) : Math.atan2(dy,dx)*180/Math.PI;
        overlay.push(`<g data-shadow-next="true" class="shadow-next-arrow" transform="translate(${c.x} ${c.y}) rotate(${angle})"><title>箭头：影子下次移动的方向与落点</title><path d="M-10 0H5M0-5l5 5-5 5" fill="none" stroke="#765080" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>`);
      }
      actors.push(actor(p, shadowArt(), previous?.shadows[i], true));
    });
  }
  if(level.circuit) {
    const p=remapDual({x:level.circuit.lamp[0],y:level.circuit.lamp[1]},level,state.topology),c=corner(p);
    const goal=level.map.flatMap((r,y)=>[...r].flatMap((t,x)=>t==='E'?[{x,y}]:[]))[0],g=center(goal),lit=!!state.lampLit;
    const supply=lampSupply(state,level),labels={unpowered:'供能断开',ready:'发电 OFF',charging:'充电中',lit:'灯亮 · 安全',shorted:'短路 · 归零'};
    overlay.push(`<g class="lamp-circuit" data-lamp-lit="${lit}" data-lamp-status="${state.lampStatus}" data-charge="${state.lampCharge}"><path d="M${c.x} ${c.y}L${g.x} ${g.y}" fill="none" stroke="${lit?'#c19b4b':'#9e8f7b'}" stroke-width="2" opacity=".6"/><g transform="translate(${c.x} ${c.y})">${lampArt(lit)}${energyArt(state.lampCharge,supply.shorted,supply.maxCharge)}<text y="-26" text-anchor="middle" font-size="10" fill="#79617c">${labels[state.lampStatus]}</text></g></g>`);
    if(supply.path)for(let i=1;i<supply.path.length;i++)overlay.push(segment(supply.path[i-1],supply.path[i],level,center,supply.started?'#ba9847':'#9e9581',supply.started?3:1.5,`class="${supply.started&&supply.powered&&!supply.shorted?'energy-flow':''}" opacity=".65" stroke-dasharray="${supply.started?'5 4':'2 5'}" pointer-events="none"`));
    if(level.circuit.source)overlay.push(actor(level.circuit.source,`<g data-generator="${supply.started?'on':'off'}"><circle r="14" fill="${supply.started?'#e9cb71':'#bbb39f'}" stroke="#a38443" stroke-width="2"/><path d="M-7 0H7M0-7V7" stroke="#9d7435" stroke-width="2"/><text y="-21" text-anchor="middle" font-size="10" fill="#98723e">${supply.started?'ON':'OFF'}</text></g>`));

  }
  state.hunters.forEach((p,i)=>{
    const mode=hunterMode(state,i),next=prediction.hunters[i],moving=next&&!same(next,p);
    if(mode==='sleeping')for(const q of hunterAlertCells(shown,level,i)){if(same(p,q))continue;const c=center(q);overlay.push(`<rect data-alert-range="${i}:${key(q)}" x="${c.x-22}" y="${c.y-22}" width="44" height="44" rx="4" fill="#b9995a" fill-opacity=".07" stroke="#b9995a" stroke-width=".8" stroke-dasharray="2 4" opacity=".6" pointer-events="none"/>`);}
    overlay.push(actor(p,`<g data-hunter-state="${mode}" data-wake-reason="${state.hunterWakeReasons[i]??''}"><text y="-22" text-anchor="middle" font-size="11" fill="${mode==='alert'?'#ae833d':'#9b5745'}">${mode==='sleeping'?'z':mode==='alert'?'! 警觉':moving?'追击':'受阻'}</text></g>`));
    if(mode!=='sleeping'&&moving){const c=center(next);overlay.push(`<g data-hunter-next="${key(next)}">${segment(p,next,level,center,'#ae7053',2,'opacity=".8"')}<rect x="${c.x-20}" y="${c.y-20}" width="40" height="40" rx="4" fill="#b67455" fill-opacity=".08" stroke="#b67455" stroke-opacity=".5" stroke-width="1"/><path d="M${c.x-5} ${c.y+6}l5-9 5 9Z" fill="none" stroke="#a1604d" stroke-width="1.8"/></g>`);}
    actors.push(actor(p,hunterArt(mode!=='sleeping'),previous?.hunters[i]));
    if(previous&&previous.hunterStates[i]==='sleeping'&&mode==='alert')overlay.push(actor(p,'<circle r="20" fill="none" stroke="#c09747" stroke-width="2"><animate attributeName="r" values="12;26" dur=".3s"/><animate attributeName="opacity" values="1;0" dur=".3s" fill="freeze"/></circle>'));
  });
  actors.push(actor(state.player, playerArt(), previous?.world===state.world?previous?.player:null,state.world==='dual'));
  if (shown.topology !== 'plane') for (let y = 0; y < level.height; y++) {
    const a = { x: 0, y }, b = { x: level.width - 1, y: shown.topology === 'mobius' ? level.height - 1 - y : y };
    if (!primalOpen(level, shown, a, b)) continue;
    const l = center(a), r = center(b), label = String.fromCharCode(65 + y);
    borders.push(`<g class="seam-port"><path d="M${PADDING - 3} ${l.y - 15}q-15 15 0 30M${width - PADDING + 3} ${r.y - 15}q15 15 0 30" fill="none" stroke="${shown.topology === 'mobius' ? '#a6746a' : '#728967'}" stroke-width="2"/><text x="${PADDING - 14}" y="${l.y + 3}" text-anchor="middle" fill="#756748" font-size="9">${label}</text><text x="${width - PADDING + 14}" y="${r.y + 3}" text-anchor="middle" fill="#756748" font-size="9">${label}</text></g>`);
  }
  if(shown.topology==='torus') for(let x=0;x<level.width;x++) {
    const a={x,y:0},b={x,y:level.height-1}; if(!primalOpen(level,shown,a,b))continue;
    const t=center(a),d=center(b),label=String(x+1);
    borders.push(`<g class="seam-port torus-port"><path d="M${t.x-14} ${PADDING-3}q14-14 28 0M${d.x-14} ${height-PADDING+3}q14 14 28 0" fill="none" stroke="#6b8874" stroke-width="2"/><text x="${t.x}" y="${PADDING-13}" text-anchor="middle" font-size="10" fill="#687b61">${label}</text><text x="${d.x}" y="${height-PADDING+19}" text-anchor="middle" font-size="10" fill="#687b61">${label}</text></g>`);
  }
  for(const bridge of level.bridges){
    const open=bridgeIsOpen(state,bridge),color=bridge.color==='clay'?'#ae775e':'#9b7846';
    const first=center({x:bridge.cells[0][0],y:bridge.cells[0][1]}),last=center({x:bridge.cells.at(-1)[0],y:bridge.cells.at(-1)[1]});
    const angle=Math.atan2(last.y-first.y,last.x-first.x)*180/Math.PI,length=Math.hypot(last.x-first.x,last.y-first.y)+CELL*.9;
    overlay.push(`<g data-mechanism-bridge="${bridge.id}" data-bridge-open="${open}" class="mechanism-bridge" transform="translate(${(first.x+last.x)/2} ${(first.y+last.y)/2}) rotate(${angle})">${previous&&bridgeIsOpen(previous,bridge)!==open?'<animate attributeName="opacity" values=".3;1" dur=".2s"/>':''}${bridgeArt(open,color,length)}</g>`);
  }
  const colors={blue:'#78939c',clay:'#b18065',sage:'#89987b'};
  for(const c of level.controls){const b=level.bridges.find(b=>b.id===c.bridge),color=c.kind==='room'?colors[territoryAt(level,c)]:b?.color==='clay'?'#ae775e':'#9b7846';overlay.push(actor(c,`<g data-control="${c.id}" ${c.kind==='ignite'?`data-generator-control="${state.lampStarted?'on':'off'}"`:''}>${controlArt(c.kind,color,c.direction)}${c.kind==='ignite'?`<circle cx="14" cy="-14" r="4" fill="${state.lampStarted?'#e3bd51':'#817d70'}"/>${previous&&!previous.lampStarted&&state.lampStarted?'<animate attributeName="opacity" values=".3;1;.3;1" dur=".3s"/>':''}`:''}</g>`));}
  for(const r of level.rifts){overlay.push(actor(r.primal,riftArt()));const c=corner(r.dual);overlay.push(`<g transform="translate(${c.x} ${c.y}) scale(.55)" opacity="${state.world==='dual'?1:.55}">${riftArt()}</g>`);}
  const hazards=dangerCells(shown,level);
  for(const p of hazards){const c=center(p);overlay.push(`<g class="hazard-cell" data-hazard="${key(p)}" data-hazard-kind="${p.kind}" ${p.kind==='shadow'?`data-danger="${key(p)}"`:`data-dark="${key(p)}"`} transform="translate(${c.x} ${c.y})" aria-label="${p.kind==='shadow'?'紫色裂痕陷阱':'灰灯印地板：灯灭时危险'}">${p.kind==='shadow'?trapArt():darkFloorArt()}</g>`);}
  for(const p of prediction.danger)if(!hazards.some(q=>same(p,q))){const c=center(p);overlay.push(`<path data-next-danger="${key(p)}" data-next-kind="${p.kind}" d="M${c.x} ${c.y-10}l9 10-9 10-9-10Z" fill="none" stroke="${p.kind==='shadow'?'#96799b':'#777887'}" stroke-width="1.5" opacity=".8" pointer-events="none"/>`);}
  if(level.keyNoise&&state.hasKey&&previous&&!previous.hasKey){const p=level.map.flatMap((r,y)=>[...r].flatMap((t,x)=>t==='K'?[{x,y}]:[]))[0];overlay.push(actor(p,noiseArt()));}
  for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++)if(tile(level,{x,y})!=='#'&&level.territories.length){const c=center({x,y}),region=territoryAt(level,{x,y}),color=colors[region];overlay.push(`<rect x="${c.x-25}" y="${c.y-25}" width="50" height="50" fill="${color}" opacity=".09" pointer-events="none"/>`);for(const d of [directions[1],directions[2]]){const q={x:x+d.x,y:y+d.y};if(territoryAt(level,q)!==region)overlay.push(line({x:c.x+(d.x?27:-27),y:c.y+(d.y?27:-27)},{x:c.x+27,y:c.y+27},color,2,'opacity=".65"'));}}
  for(const room of level.rooms){const a={x:PADDING+room.x*CELL,y:PADDING+room.y*CELL},size=room.size*CELL;overlay.push(`<g class="rotating-room" data-room="${room.id}" data-rotation="${state.rooms[room.id]}"><rect x="${a.x}" y="${a.y}" width="${size}" height="${size}" rx="6" fill="none" stroke="${colors[room.territory]}" stroke-width="3"/><path d="M${a.x+size-23} ${a.y+8}q14 0 14 14m-5-4 5 4 4-5" fill="none" stroke="${colors[room.territory]}" stroke-width="2"/></g>`);}
  if (previewState) for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
    const a = { x, y };
    for (const d of directions.slice(1, 3)) {
      const b = neighbor(a, d, level, shown.topology); if (!b) continue;
      const old = primalOpen(level, state, a, b), future = primalOpen(level, shown, a, b);
      if (old !== future) overlay.push(segment(a, b, level, center, future ? '#648461' : '#ae6f56', 3, 'stroke-dasharray="4 4"'));
    }
  }
  if (cachedWalls === undefined) wallCache.set(level, { ...wallCache.get(level), [wallVariant]: walls.join('') });
  return {
    viewBox: `0 0 ${width} ${height}`, role: level.pieces.length ? 'group' : 'img',
    label: `第 ${level.id} 关，玩家 ${state.player.x},${state.player.y}，${state.turn} 步，${state.topology}`,
    opacity: view === 'dual' ? '.45' : '1',
    walls: wallCache.get(level)[wallVariant], terrain: ground.join('') + markings.join(''),
    overlay: overlay.join('') + borders.join(''), actors: actors.join(''),
  };
}
export function boardMarkup(frame) {
  return `<svg viewBox="${frame.viewBox}" role="${frame.role}" aria-label="${frame.label}"><g data-layer="walls" opacity="${frame.opacity}">${frame.walls}</g><g data-layer="terrain" opacity="${frame.opacity}">${frame.terrain}</g><g data-layer="overlay">${frame.overlay}</g><g data-layer="actors">${frame.actors}</g></svg>`;
}
export function renderBoard(level, state, options = {}) {
  return boardMarkup(renderBoardLayers(level, state, options));
}
