import { levels, getLevel } from './levels.js';
import { referenceLessons, lessonCards,notebookCards,observeDiscoveries,pocketDiscoveryCards } from './teaching.js';
import { createSession, preview, score, riftAccess, lampSupply } from './engine.js';
import { slotAt } from './pieces.js';
import { renderBoardLayers, pieceIcon, CELL, PADDING } from './board.js';
import { patchBoard, setMarkupIfChanged } from './renderer.js';
import { fitViewport } from './viewport.js';
import { icon } from './icons.js';
import { createActionQueue, swipeDirection, cellFromClient } from './input.js';
import { loadProgress, recordWin, saveProgress, unlockedLevel, resetProgress } from './progress.js';
const $ = selector => document.querySelector(selector);
const modeNames = { plane: '平面', cylinder: '环绕', mobius: '扭转', torus:'环面' };
const shapeNames = { straight: '直路', corner: '弯路', tee: '三岔路', cross: '十字路' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const storage = { getItem: name => localStorage.getItem(name), removeItem: name => localStorage.removeItem(name), setItem: (name, value) => localStorage.setItem(name, value) };
let progress = loadProgress(storage, levels), level = getLevel(progress.currentLevel);
let session = createSession(level, progress.snapshot), selected = null, view = session.state.world==='dual'?'dual':'primal', previewState = null;
let toastTimer, advanceTimer, gesture = null, ignorePieceClickUntil = 0, hintCount = 0, hintRequest = 0, worker = null, advancing = false, longPressTimer, suppressHintClick = false, saveTimer = null, lightweight = false;
fitViewport(window, document.documentElement, enabled => { const changed = lightweight !== enabled; lightweight = enabled; if (changed && $('#board svg')) renderMap(); });
const actionQueue = createActionQueue(perform);
const starsMarkup = count => [1, 2, 3].map(n => icon('star', `class="${n <= count ? 'lit' : ''}"`)).join('');
function hydrateIcons() { document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); }); }
function toast(text = '', kind = '', duration = 2800) {
  clearTimeout(toastTimer); $('#message').textContent = text; $('#message').className = `message ${kind}`;
  if (text) toastTimer = setTimeout(() => $('#message').classList.add('faded'), duration);
}
function flushPersistence() {
  clearTimeout(saveTimer); saveTimer = null;
  progress.currentLevel = level.id; progress.snapshot = session.snapshot({ clone: false });
  saveProgress(storage, progress);
}
function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(flushPersistence, 140); }
function setWorld(topology) {
  const game = $('#game'); if (game.className !== `game world-${topology}`) game.className = `game world-${topology}`;
  if (document.body.dataset.world !== topology) document.body.dataset.world = topology;
}
function renderMap(previous = null) {
  patchBoard($('#board'), renderBoardLayers(level, session.state, { selected, view, previewState, lightweight, previous: reduceMotion || lightweight ? null : previous }));
  $('#view-button').setAttribute('aria-pressed', String(view === 'dual'));
  $('#view-button').setAttribute('aria-label', `当前${view === 'dual' ? '裂隙' : '道路'}视图，点击切换`);
}
function renderTray() {
  $('#puzzle-tray').hidden = !level.pieces.length;
  setMarkupIfChanged($('#pieces'), session.state.pieces.map((piece, i) => {
    const definition = level.pieces.find(p => p.id === piece.id);
    return `<button class="piece-button ${piece.slot ? 'placed' : ''}" data-piece="${piece.id}" aria-pressed="${piece.id === selected}" aria-label="${shapeNames[definition.shape]}碎片 ${i + 1}${piece.slot ? '，已放置' : '，选择后点击空位'}" title="${piece.id === selected ? '再点旋转' : '选择碎片'}">${pieceIcon(piece, definition)}</button>`;
  }).join(''));
  const piece = session.state.pieces.find(p => p.id === selected);
  $('#rotate-button').disabled = !piece || session.state.status !== 'playing';
  $('#remove-button').disabled = !piece?.slot || session.state.status !== 'playing';
}
function renderControls() {
  const state = session.state;
  if($('#mode-buttons').dataset.count !== String(level.modes.length)) $('#mode-buttons').dataset.count=String(level.modes.length);
  setMarkupIfChanged($('#mode-buttons'), level.modes.map(value => `<button data-topology="${value}" aria-label="${modeNames[value]}空间" aria-pressed="${state.topology === value}" ${!level.modes.includes(value) || state.topology === value ? 'disabled' : ''}>${icon(value)}<span>${modeNames[value]}</span></button>`).join(''));
  $('#shift-button').hidden=!level.rifts.length;
  $('#shift-button').textContent=state.world==='dual'?'回到道路 · E':'进入裂隙 · E';
  const access=riftAccess(state,level);$('#shift-button').disabled=!access.available;$('#shift-button').title=access.message;
  $('#shift-button').setAttribute('aria-label',state.world==='dual'?'返回道路世界（E）':'进入裂隙（E）');
  $('#power-status').hidden=!level.circuit;
  if(level.circuit){const supply=lampSupply(state,level),names={unpowered:'断供',ready:'待启动',charging:'充电',lit:'灯亮',shorted:'短路'};$('#power-status').textContent=`发电 ${supply.started?'ON':'OFF'} · 电量 ${state.lampCharge}/${supply.maxCharge} · ${names[state.lampStatus]}`;}
  $('#game').dataset.layer=state.world;
  $('#undo-button').disabled = !session.undoCount; $('#hint-button').disabled = state.status !== 'playing'; renderTray();
}
function render() {
  const state = session.state;
  setWorld(state.topology);
  renderNewMechanisms();
  $('#map-stage').style.setProperty('--map-aspect', (level.width * CELL + PADDING * 2) / (level.height * CELL + PADDING * 2));
  $('#level-title').textContent = level.subtitle; $('#chapter-number').textContent = `${String(level.id).padStart(2,'0')} / ${String(levels.length).padStart(2,'0')}`;
  $('#moves').textContent = `${state.turn} 步`;
  $('#best-stars').innerHTML = starsMarkup(progress.results[level.id]?.stars || 0);
  $('#best-stars').setAttribute('aria-label', `本关历史 ${progress.results[level.id]?.stars || 0} 星`);
  $('#held-star').classList.toggle('collected', state.starCollected);
  $('#held-star').setAttribute('aria-label', state.starCollected ? '已收集可选星片' : '尚未收集可选星片');
  $('#current-goal').textContent = level.goalText; $('#lost-overlay').hidden = state.status !== 'lost';
  renderControls(); renderMap();
}
function renderNewMechanisms(){
 $('#new-discovery-button').title=`第 ${level.id} 关的新发现，已收入口袋说明书`;
}
function teachOnce(){
 for(const id of observeDiscoveries(level,session.state))discover(id);
 renderNewMechanisms();persist();
}

function discover(id) { if (!progress.discoveries.includes(id)) { progress.discoveries.push(id); $('#discovery-dot').hidden = false; } }
function checkDiscoveries(before, action) {
  for(const id of observeDiscoveries(level,session.state,action,before)) discover(id);
  renderNewMechanisms();
}
function flashInvalid(text) {
  toast(text, 'error'); if (lightweight) return; const board = $('#board'); board.classList.remove('invalid'); void board.offsetWidth; board.classList.add('invalid');
  setTimeout(() => board.classList.remove('invalid'), 180);
}
function burst(position, color = '#c49b51') {
  if (reduceMotion || lightweight) return;
  const svg = $('#board svg'), matrix = svg?.getScreenCTM(); if (!matrix) return;
  const point = svg.createSVGPoint(); point.x = PADDING + (position.x + .5) * CELL; point.y = PADDING + (position.y + .5) * CELL;
  const screen = point.matrixTransform(matrix), bounds = $('#arena').getBoundingClientRect();
  $('#particles').innerHTML = Array.from({ length: 10 }, (_, i) => `<i class="particle" style="left:${screen.x - bounds.left}px;top:${screen.y - bounds.top}px;background:${color};--dx:${Math.cos(i * Math.PI / 5) * 42}px;--dy:${Math.sin(i * Math.PI / 5) * 35}px"></i>`).join('');
}
function perform(action) {
  if (session.state.status !== 'playing' || document.querySelector('dialog[open]') || advancing) return;
  const before = session.state, result = session.act(action); previewState = null; hintRequest++;
  if (!result.valid) { flashInvalid(result.message); return; }
  checkDiscoveries(before, action); renderControls(); renderMap(before);
  setWorld(session.state.topology); $('#moves').textContent = `${session.state.turn} 步`;
  $('#held-star').classList.toggle('collected', session.state.starCollected);
  $('#held-star').setAttribute('aria-label', session.state.starCollected ? '已收集可选星片' : '尚未收集可选星片');
  if(action.type==='shift'){view=session.state.world==='dual'?'dual':'primal';renderMap();}
  if (action.type === 'place') burst(level.slots.find(s => s.id === action.slotId), '#a18e5d');
  if (!before.starCollected && session.state.starCollected) burst(level.star);
  if (action.type === 'topology' && !lightweight) { $('#arena').classList.remove('world-change'); void $('#arena').offsetWidth; $('#arena').classList.add('world-change'); }
  if (session.state.status === 'won') { finishLevel(); return; }
  persist();
  if (session.state.status === 'lost') { actionQueue.clear(); $('#lost-overlay').hidden = false; toast('没关系，撤销一步就好。', 'error'); }
  else if (result.message) toast(result.message);
  else if(session.state.hunterStates.includes('alert'))toast('小兽警觉了：棕色箭头是下一有效回合。');
}
function finishLevel() {
  clearTimeout(saveTimer); saveTimer = null;
  actionQueue.clear(); discover('math-search');discover('math-shortest'); advancing = true; const count = score(session.state, level);
  progress = recordWin(progress, level.id, count, session.state.turn); saveProgress(storage, progress);
  $('#best-stars').innerHTML = starsMarkup(progress.results[level.id].stars);
  $('#best-stars').setAttribute('aria-label', `本关历史 ${progress.results[level.id].stars} 星`);
  $('#clear-title').textContent = level.id === levels.length ? '这段旅程完成了。' : '找到路了。';
  $('#clear-stars').innerHTML = [1, 2, 3].map(n => icon('star', `class="${n <= count ? 'earned' : ''}"`)).join('');
  $('#clear-stars').setAttribute('aria-label', `获得 ${count} 星`);
  $('#clear-score').textContent = `${session.state.turn} 步 · 最佳 ${progress.results[level.id].bestTurns} 步`;
  $('#clear-overlay').hidden = false; toast(); advanceTimer = setTimeout(advance, reduceMotion ? 900 : 1850);
}
function advance() {
  if (!advancing) return;
  clearTimeout(advanceTimer); advancing = false; $('#clear-overlay').hidden = true;
  if (level.id < levels.length) chooseLevel(level.id + 1);
  else { persist(); $('#ending-score').textContent = `共 ${levels.length} 段旅程，收集 ${Object.values(progress.results).reduce((sum, r) => sum + r.stars, 0)} / ${levels.length*3} 颗星。`; $('#ending-dialog').showModal(); render(); }
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
function chooseLevel(id) {
  const chosen = getLevel(id); if (!chosen || chosen.id > unlockedLevel(progress)) return false;
  clearTimeout(advanceTimer); advancing = false; actionQueue.clear(); closeDialogs(); $('#clear-overlay').hidden = true;
  level = chosen; session = createSession(level); selected = null; view = 'primal'; previewState = null; hintCount = 0; hintRequest++;
  render(); persist(); teachOnce(); $('#board').focus({ preventScroll: true }); return true;
}
function undo() {
  clearTimeout(advanceTimer); advancing = false; actionQueue.clear(); closeDialogs(); $('#clear-overlay').hidden = true;
  if (session.undo()) { previewState = null; hintRequest++; render(); persist(); toast('回到上一步。'); }
  $('#board').focus({ preventScroll: true });
}
function resetAll() {
  clearTimeout(saveTimer); clearTimeout(advanceTimer);
  try { progress = resetProgress(storage); } catch { toast('存储无法清除，请检查浏览器设置。','error'); return; }
  chooseLevel(1); flushPersistence();
}
function restart() {
  clearTimeout(advanceTimer); advancing = false; actionQueue.clear(); closeDialogs(); $('#clear-overlay').hidden = true;
  session.restart(); selected = null; previewState = null; hintRequest++; render(); persist(); toast('再走一次，路还在。'); $('#board').focus({ preventScroll: true });
}
function renderLevels() {
  const unlocked = unlockedLevel(progress);
  $('#level-list').innerHTML = levels.map(l => `<button class="level-option" data-level="${l.id}" aria-current="${l.id === level.id}" ${l.id > unlocked ? 'disabled' : ''}><span class="level-number">${l.id}</span><span><strong>${l.subtitle}</strong><small>${l.title}</small>${progress.results[l.id]?.priorBest?.bestTurns?`<small>旧版 ${progress.results[l.id].priorBest.stars} 星 · ${progress.results[l.id].priorBest.bestTurns} 步</small>`:''}</span><span class="level-rating">${l.id > unlocked ? icon('lock', 'class="lock"') : starsMarkup(progress.results[l.id]?.stars || 0)}</span></button>`).join('');
}
function showDialog(id) {
  if (advancing) return;
  actionQueue.clear(); previewState = null; renderMap(); closeDialogs();
  if (id === 'levels-dialog') renderLevels();
  if(id==='help-dialog'){
    setMarkupIfChanged($('#pocket-current-rules'),pocketDiscoveryCards(level,session.state,progress));
    setMarkupIfChanged($('#help-rule-cards'),lessonCards(referenceLessons(level,progress)));
  }
  if (id === 'discoveries-dialog') {
    $('#discovery-dot').hidden = true;
    $('#discovery-cards').innerHTML=notebookCards(level,progress);
  }
  $(`#${id}`).showModal();
  if(id==='help-dialog')$('#help-dialog').scrollTop=0;
}
function selectPiece(id) { if (session.state.status !== 'playing') return; selected = id; renderTray(); renderMap(); }
function cycleView() { view = view === 'primal' ? 'dual' : 'primal'; renderMap(); }
function cycleTopology() { const modes = level.modes; if (modes.length > 1) actionQueue.push({ type: 'topology', value: modes[(modes.indexOf(session.state.topology) + 1) % modes.length] }); }
function actionLabel(action) {
  if (action.type === 'move') return `向${({ up: '上', right: '右', down: '下', left: '左' })[action.direction]}走一步`;
  if (action.type === 'topology') return `试试${modeNames[action.value]}空间`;
  if (action.type === 'rotate') return `旋转第 ${level.pieces.findIndex(p => p.id === action.pieceId) + 1} 块碎片`;
  if (action.type === 'place') return `把第 ${level.pieces.findIndex(p => p.id === action.pieceId) + 1} 块碎片放在空白地面`;
  if(action.type==='shift')return '在双色裂隙切换世界';
  if (action.type === 'remove') return '收回这块碎片再试试';
  return '等一回合，看看小兽的下一步';
}
function hint() {
  if (session.state.status !== 'playing' || advancing) return;
  hintCount++;
  const tell = text => { toast(text, 'hint', 5500);  };
  if (hintCount <= 2) { tell(level.hints[hintCount - 1]); return; }
  const request = ++hintRequest, hintState = session.state, id = level.id;
  tell('让我看看，这一步可以怎么走…');
  const finish = action => {
    if (request !== hintRequest || level.id !== id || session.state !== hintState) return;
    discover('math-search');persist();
    tell(action ? `下一步可以${actionLabel(action)}。` : '当前搜索没找到出口；试着收回碎片，或撤销几步。');
  };
  try {
    worker ||= new Worker(new URL('./hint-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { if (data.request === request) finish(data.action); };
    worker.onerror = () => { worker?.terminate(); worker = null; finish(null); };
    worker.postMessage({ request, state: session.state, levelId: id });
  } catch {
    import('./solver.js').then(({ solve }) => setTimeout(() => finish(solve(level, session.state, { maxDepth: 60, maxExpanded: 12000 })?.actions[0]), 0));
  }
}
function clearGesture() {
  if (gesture?.dragFrame) cancelAnimationFrame(gesture.dragFrame);
  if (gesture) { try { $('#game').releasePointerCapture(gesture.id); } catch {} }
  gesture = null; $('#drag-ghost').hidden = true;
}
function inside(bounds, x, y) { return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom; }
document.addEventListener('pointerdown', event => {
  if (!event.isPrimary) { clearGesture(); return; }
  if (event.button !== 0 || document.querySelector('dialog[open]') || advancing || session.state.status !== 'playing') return;
  const source = event.target.closest('[data-piece],[data-map-piece]'), inBoard = event.target.closest('#board');
  if (!source && !inBoard) return;
  event.preventDefault();
  const pieceId = source?.dataset.piece || source?.dataset.mapPiece;
  const replaceWith = source?.dataset.mapPiece && selected && selected !== pieceId ? selected : null;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, pieceId, replaceWith, placed: !!source?.dataset.mapPiece, selectedBefore: selected, dragged: false };
  $('#game').setPointerCapture(event.pointerId);
  if (pieceId && !replaceWith) selectPiece(pieceId); else $('#board').focus({ preventScroll: true });
});
document.addEventListener('pointermove', event => {
  if (!gesture || event.pointerId !== gesture.id) return;
  if (gesture.pieceId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 9) {
    if (!gesture.dragged && gesture.replaceWith) { selectPiece(gesture.pieceId); gesture.replaceWith = null; }
    gesture.dragged = true;
    if (!gesture.ghostReady) {
      const piece = session.state.pieces.find(p => p.id === gesture.pieceId), definition = level.pieces.find(p => p.id === gesture.pieceId);
      $('#drag-ghost').innerHTML = pieceIcon(piece, definition); $('#drag-ghost').hidden = false; gesture.ghostReady = true;
    }
    gesture.dragX = event.clientX; gesture.dragY = event.clientY;
    if (!gesture.dragFrame) gesture.dragFrame = requestAnimationFrame(() => {
      if (!gesture) return;
      $('#drag-ghost').style.transform = `translate3d(${gesture.dragX}px,${gesture.dragY}px,0) translate(-50%,-65%)`;
      gesture.dragFrame = null;
    });
  }
});
document.addEventListener('pointerup', event => {
  clearTimeout(longPressTimer);
  if (!gesture || event.pointerId !== gesture.id) return;
  const g = gesture; clearGesture(); ignorePieceClickUntil = performance.now() + 400;
  if (g.pieceId) {
    if (g.dragged) {
      const svg = $('#board svg'), p = svg && cellFromClient(svg, event.clientX, event.clientY, CELL, PADDING), slot = p && slotAt(level, p);
      if (slot) actionQueue.push({ type: 'place', pieceId: g.pieceId, slotId: slot.id });
      else if (inside($('#puzzle-tray').getBoundingClientRect(), event.clientX, event.clientY)) actionQueue.push({ type: 'remove', pieceId: g.pieceId });
      else flashInvalid('拖到空白地面，或放回碎片栏。');
    } else if (g.replaceWith) {
      const slotId = session.state.pieces.find(p=>p.id===g.pieceId)?.slot;
      if (slotId) actionQueue.push({type:'place',pieceId:g.replaceWith,slotId});
    } else if (g.placed || g.selectedBefore === g.pieceId) actionQueue.push({ type: 'rotate', pieceId: g.pieceId });
    else toast('点空白地面放下；再点碎片旋转。');
  } else {
    const direction = swipeDirection({ x: g.x, y: g.y }, { x: event.clientX, y: event.clientY });
    if (direction) actionQueue.push({ type: 'move', direction });
    else {
      const svg = $('#board svg'), p = svg && cellFromClient(svg, event.clientX, event.clientY, CELL, PADDING), slot = p && slotAt(level, p);
      if (slot && selected) actionQueue.push({ type: 'place', pieceId: selected, slotId: slot.id });
      else if (slot) toast('先从下方选一块碎片。');
    }
  }
});
document.addEventListener('pointercancel', () => { clearTimeout(longPressTimer); clearGesture(); });
$('#hint-button').addEventListener('pointerdown', () => { suppressHintClick = false; longPressTimer = setTimeout(() => { suppressHintClick = true; showDialog('help-dialog'); }, 500); });
$('#hint-button').addEventListener('pointerleave', () => clearTimeout(longPressTimer));
document.addEventListener('click', event => {
  if (event.target.closest('#clear-overlay')) { advance(); return; }
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.hasAttribute('data-close')) { closeDialogs(); $('#board').focus({ preventScroll: true }); return; }
  if (button.dataset.level) { chooseLevel(button.dataset.level); return; }
  if (button.dataset.piece) {
    if (performance.now() < ignorePieceClickUntil) return;
    if (selected === button.dataset.piece) actionQueue.push({ type: 'rotate', pieceId: selected }); else selectPiece(button.dataset.piece);
    return;
  }
  if (button.dataset.direction) { actionQueue.push({ type: 'move', direction: button.dataset.direction }); return; }
  if (button.dataset.topology) { actionQueue.push({ type: 'topology', value: button.dataset.topology }); return; }
  const actions = {
    'menu-restart-button': restart, 'reset-all-button': () => showDialog('reset-dialog'), 'confirm-reset': resetAll,
    'levels-button': () => showDialog('levels-dialog'), 'help-button': () => showDialog('help-dialog'), 'new-discovery-button':()=>showDialog('help-dialog'),
    'discoveries-button': () => showDialog('discoveries-dialog'), 'undo-button': undo, 'recover-button': undo,
    'restart-button': restart, 'lost-restart-button': restart, 'view-button': cycleView,
    'hint-button': () => { if (!suppressHintClick) hint(); suppressHintClick = false; },
    'shift-button':()=>actionQueue.push({type:'shift'}),
    'desktop-wait': () => actionQueue.push({type:'wait'}),
    'wait-button': () => actionQueue.push({ type: 'wait' }),
    'rotate-button': () => selected && actionQueue.push({ type: 'rotate', pieceId: selected }),
    'remove-button': () => selected && actionQueue.push({ type: 'remove', pieceId: selected }),
    'ending-levels': () => showDialog('levels-dialog'), 'ending-replay': () => chooseLevel(levels.length),
  };
  actions[button.id]?.();
});
function showPreview(button) {
  if (lightweight || !button || button.disabled || session.state.status !== 'playing' || advancing) return;
  const action = {type:'topology',value:button.dataset.topology};
  previewState = preview(session.state, action, level); renderMap();
}
document.addEventListener('pointerover', event => {
  if (event.pointerType !== 'mouse') return;
  const button = event.target.closest('[data-topology]'); if (button && !button.contains(event.relatedTarget)) showPreview(button);
});
document.addEventListener('pointerout', event => {
  if (event.pointerType !== 'mouse') return;
  const button = event.target.closest('[data-topology]');
  if (button && !button.contains(event.relatedTarget) && previewState) { previewState = null; renderMap(); }
});
let lastKey = 0;
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
  const key = event.key.toLowerCase();
  if (advancing) { if (['enter', ' '].includes(key)) { event.preventDefault(); advance(); } return; }
  if (event.target.matches('[data-map-piece],[data-slot]') && ['enter', ' '].includes(key)) {
    event.preventDefault(); const pieceId = event.target.dataset.mapPiece;
    if (pieceId && selected && selected !== pieceId) actionQueue.push({type:'place',pieceId:selected,slotId:event.target.dataset.slot});
    else if (pieceId) { selected = pieceId; actionQueue.push({ type: 'rotate', pieceId }); }
    else if (selected) actionQueue.push({ type: 'place', pieceId: selected, slotId: event.target.dataset.slot });
    return;
  }
  if (event.target.closest('button,a') && ['enter', ' ', 'tab'].includes(key)) return;
  if (event.repeat && (performance.now() - lastKey < 75 || !['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key))) return;
  lastKey = performance.now();
  const movement = { arrowup: 'up', w: 'up', arrowright: 'right', d: 'right', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left' };
  if (movement[key]) { event.preventDefault(); actionQueue.push({ type: 'move', direction: movement[key] }); }
  else if(key==='e'){event.preventDefault();actionQueue.push({type:'shift'});}
  else if (key === 't') { event.preventDefault(); cycleTopology(); }
  else if (key === ' ') { event.preventDefault(); actionQueue.push({ type: 'wait' }); }
  else if (key === 'z') { event.preventDefault(); undo(); }
  else if (key === 'r') { event.preventDefault(); restart(); }
  else if (key === 'h') { event.preventDefault(); hint(); }
  else if (key === 'tab' && (event.target.id === 'board' || event.target === document.body)) { event.preventDefault(); cycleView(); }
  else if (key === 'escape') showDialog('levels-dialog');
  else if (key === '?') showDialog('help-dialog');
});
window.addEventListener('pagehide', () => { if (!advancing) flushPersistence(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !advancing) flushPersistence(); });
hydrateIcons(); render();
if (session.state.status === 'won' && level.id === levels.length) {
  $('#ending-score').textContent = `共 ${levels.length} 段旅程，收集 ${Object.values(progress.results).reduce((s, r) => s + r.stars, 0)} / ${levels.length*3} 颗星。`;
  $('#ending-dialog').showModal();
} else { persist(); teachOnce(); }

setTimeout(()=>$('#boot-fade').remove(),900);
