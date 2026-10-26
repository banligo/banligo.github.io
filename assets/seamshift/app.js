import { levels, getLevel } from './levels.js';
import { createSession, disconnected, preview, requirements, shadowPaths } from './engine.js';
import { renderBoard } from './board.js';
import { primalGraph, shortestPath } from './graphs.js';
import { stateHash } from './solver.js';

const $ = selector => document.querySelector(selector);
const names = { plane: '平面', cylinder: '圆柱', mobius: '莫比乌斯' };
const modeEnglish = { plane: 'PLANE', cylinder: 'CYLINDER', mobius: 'MÖBIUS' };
const roman = ['I', 'II', 'III', 'IV', 'V'];
const storageKey = 'seamshift.progress.v1';
let progress = {};
try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) progress = saved; } catch { /* A blocked storage permission never blocks play. */ }
let level = levels[0], session = createSession(level), view = 'primal', previewState = null, previous = null;
let worker = null, hintRequest = 0, hintPending = false;

function persistWin() {
  if (session.state.status !== 'won') return;
  const prior = progress[level.id];
  if (!Number.isInteger(prior) || session.state.turn < prior) progress[level.id] = session.state.turn;
  try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* Private browsing can disable writes. */ }
}
function renderCampaign() {
  $('#level-list').innerHTML = levels.map(l => `<button class="level-option" data-level="${l.id}" aria-current="${level.id === l.id}" aria-label="第 ${l.id} 关 ${l.subtitle}${progress[l.id] ? '，已完成' : ''}"><span class="level-number">${roman[l.id - 1]}</span><span><strong>${l.subtitle}</strong><small>${l.title}</small></span><span class="level-check">${progress[l.id] ? '✓' : '·'}</span></button>`).join('');
  const count = levels.filter(l => Number.isInteger(progress[l.id])).length;
  $('#progress-text').textContent = `${count} / 5`; $('#progress-bar').style.width = `${count * 20}%`;
  $('#menu-levels').innerHTML = levels.map(l => `<button data-level="${l.id}" class="${progress[l.id] ? 'completed' : ''}" aria-label="开始第 ${l.id} 关：${l.subtitle}">${progress[l.id] ? '✓ ' : ''}0${l.id}</button>`).join('');
  const next = levels.find(l => !Number.isInteger(progress[l.id])) ?? levels[0];
  $('#start-button').innerHTML = `${count ? `继续探索 · 第 ${next.id} 关` : '开始探索'} <span>→</span>`;
  $('#start-button').dataset.level = next.id;
}
function renderControls() {
  const state = session.state;
  $('#scale-controls').innerHTML = [1, 2, 3].map(value => `<button data-scale="${value}" data-preview="scale" aria-label="选择尺度 ${value}" aria-pressed="${state.scale === value}" ${!level.scales.includes(value) || state.scale === value ? 'disabled' : ''}>${value}<small>r = ${value}</small></button>`).join('');
  $('#topology-controls').innerHTML = ['plane', 'cylinder', 'mobius'].map((value, i) => `<button data-topology="${value}" data-preview="topology" aria-label="切换到${names[value]}" aria-pressed="${state.topology === value}" ${!level.modes.includes(value) || state.topology === value ? 'disabled' : ''}><span class="mode-icon" aria-hidden="true">${['▱', '▥', '∞'][i]}</span><span class="mode-name">${names[value]}</span><small>${modeEnglish[value]}</small></button>`).join('');
  const conditions = requirements(state, level);
  $('#objective-count').textContent = `${conditions.filter(r => r.met).length} / ${conditions.length}`;
  $('#objectives').innerHTML = conditions.map(r => `<li class="${r.met ? 'met' : ''}">${r.label}</li>`).join('');
  $('#seal-requirements').innerHTML = level.seal ? `<div class="seal-objectives"><p>${state.sealActivated ? '✓ 封印已永久激活' : '封印台激活条件 · 站在 T 按 F'}</p>${state.sealActivated ? '' : `<ul>${requirements(state, level, level.seal).map(r => `<li class="${r.met ? 'met' : ''}">${r.label}</li>`).join('')}</ul>`}</div>` : '';
  $('#undo-button').disabled = !session.undoCount;
  $('#interact-button').hidden = !level.seal;
  $('#interact-button').disabled = state.status !== 'playing' || state.sealActivated;
  $('#wait-button').disabled = state.status !== 'playing';
  $('#hint-button').disabled = state.status !== 'playing' || hintPending;
}
function renderEnemies() {
  const state = session.state, lines = [];
  if (state.hunters.length) {
    const paths = state.hunters.map(p => shortestPath(primalGraph(level, state), p, state.player));
    const distance = Math.min(...paths.map(p => p ? p.length - 1 : Infinity));
    lines.push(`<div class="enemy-line"><strong>◆ 猎手</strong><span>${level.hunterSpeed - state.turn % level.hunterSpeed} 回合后行动</span></div><div class="enemy-line"><span>距你</span><span>${Number.isFinite(distance) ? `${distance} 步` : '当前不连通'}</span></div>`);
  }
  if (state.shadows.length) {
    const paths = shadowPaths(state, level), blocked = paths.every(p => !p);
    lines.push(`<div class="enemy-line shadow"><strong>◇ 暗影</strong><span>${level.shadowSpeed - state.turn % level.shadowSpeed} 回合后行动</span></div><div class="enemy-line ${blocked ? 'disconnected' : ''}"><span>${blocked ? '路径已隔断' : '距信标'}</span><span>${blocked ? 'DISCONNECTED' : `${Math.min(...paths.filter(Boolean).map(p => p.length - 1))} 步`}</span></div>`);
  }
  $('#enemy-panel').hidden = !lines.length; $('#enemy-info').innerHTML = lines.join('');
}
function renderMap() {
  $('#board').innerHTML = renderBoard(level, session.state, { view, previewState, previous });
  $('#coordinates').textContent = `POSITION ${String(session.state.player.x).padStart(2, '0')} : ${String(session.state.player.y).padStart(2, '0')}`;
  $('#world-label').textContent = `${modeEnglish[previewState?.topology ?? session.state.topology]} WORLD`;
  $('#board-status').className = previewState ? 'previewing' : '';
  $('#board-status').textContent = previewState ? `PREVIEW / r = ${previewState.scale}` : session.state.status === 'won' ? 'RECONSTRUCTION COMPLETE' : session.state.shadows.length && disconnected(session.state, level) ? 'SHADOW DISCONNECTED' : 'SPACE IS STABLE';
}
function message(text, kind = '') {
  $('#message').textContent = text; $('#message').className = `message ${kind}`;
}
function render() {
  const state = session.state;
  $('#chapter-label').textContent = `CHAPTER 0${level.id} / 05 — ${['SCALE', 'IDENTIFICATION', 'ORIENTATION', 'DUALITY', 'PARADOX'][level.id - 1]}`;
  $('#level-title').innerHTML = `${level.title}<small>${level.subtitle}</small>`;
  $('#lesson').textContent = level.lesson; $('#level-concept').textContent = level.concept;
  $('#turn').textContent = String(state.turn).padStart(2, '0');
  $('#best-score').textContent = `BEST ${progress[level.id] ?? '—'}`;
  renderCampaign(); renderControls(); renderEnemies(); renderMap();
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  message(state.events.join(' '));
  previous = null;
}
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
function chooseLevel(id) {
  level = getLevel(Number(id)) ?? levels[0]; session = createSession(level);
  previewState = null; previous = null; hintRequest++; hintPending = false;
  view = level.shadow ? 'combined' : 'primal'; closeDialogs(); render();
  $('#board').focus({ preventScroll: true });
}
function showMenu() { closeDialogs(); renderCampaign(); $('#menu-dialog').showModal(); }
function showResult() {
  const state = session.state, won = state.status === 'won';
  $('#result-eyebrow').textContent = won ? `SECTOR 0${level.id} / COMPLETE` : 'A DIFFERENT PATH IS POSSIBLE';
  $('#result-symbol').textContent = won ? '◇' : '↶'; $('#result-symbol').style.color = won ? '#72e5d3' : '#ff7385';
  $('#result-title').textContent = won ? level.id === 5 ? '重构完成。' : '空间已接通。' : '这条路没有出口。';
  $('#result-description').textContent = won ? `用 ${state.turn} 个回合完成「${level.subtitle}」。${level.id === 5 ? '你已完成全部五关。' : '下一段空间，有新的规则。'}` : `${state.events.at(-1)} 撤销可以完整回到上一回合。`;
  $('#result-actions').innerHTML = won ? `<button class="primary-button" data-result="${level.id < 5 ? 'next' : 'menu'}">${level.id < 5 ? '进入下一关' : '返回章节选择'} →</button><button data-result="undo">撤销最后一步</button><button data-result="restart">再试一次</button>` : '<button class="primary-button" data-result="undo">撤销一步，继续探索 ↶</button><button data-result="restart">重开这一关</button>';
  $('#result-dialog').showModal();
}
function act(action) {
  if (document.querySelector('dialog[open]')) return;
  const before = session.state, result = session.act(action);
  hintRequest++; hintPending = false; previewState = null;
  if (!result.valid) { renderControls(); message(result.message, 'error'); return; }
  previous = before; persistWin(); render();
  if (session.state.status !== 'playing') showResult();
}
function undo() { closeDialogs(); hintRequest++; hintPending = false; previewState = null; previous = null; if (session.undo()) { render(); message('已完整恢复上一回合。'); } $('#board').focus({ preventScroll: true }); }
function restart() { closeDialogs(); session.restart(); hintRequest++; hintPending = false; previewState = null; previous = null; render(); $('#board').focus({ preventScroll: true }); }
function cycleView() { view = ['primal', 'dual', 'combined'][(['primal', 'dual', 'combined'].indexOf(view) + 1) % 3]; renderMap(); document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view))); }
function cycleTopology() { const modes = level.modes; if (modes.length === 1) { message('本关的边界固定为平面。', 'error'); return; } act({ type: 'topology', value: modes[(modes.indexOf(session.state.topology) + 1) % modes.length] }); }
function previewAction(button) {
  if (!button || button.disabled || session.state.status !== 'playing') return;
  const action = button.dataset.preview === 'scale' ? { type: 'scale', value: Number(button.dataset.scale) } : { type: 'topology', value: button.dataset.topology };
  previewState = preview(session.state, action, level);
  renderMap();
  if (!previewState) { message('无法缩小：角色或箱子仍在即将消失的地板上。', 'error'); return; }
  const paths = shadowPaths(previewState, level), blocked = paths.length && paths.every(p => !p);
  const extra = paths.length ? blocked ? ' · 暗影路径将被隔断' : ` · 暗影距信标 ${Math.min(...paths.filter(Boolean).map(p => p.length - 1))} 步` : '';
  const hunterThreat = previewState.hunters.some(p => shortestPath(primalGraph(level, previewState), p, previewState.player)?.length <= 2);
  message(`预览：尺度 ${previewState.scale} · ${names[previewState.topology]}${extra}${hunterThreat ? ' · 注意：猎手在相邻位置' : ''}。青色新增，红色关闭；预览不消耗回合。`, 'hint');
}
function clearPreview() { if (!previewState) return; previewState = null; renderMap(); message(session.state.events.join(' ')); }
const actionLabel = action => ({ move: `向${({ up: '上', right: '右', down: '下', left: '左' })[action.direction]}移动`, scale: `切换到尺度 ${action.value}`, topology: `切换到${names[action.value]}`, interact: '按 F 激活封印', wait: '等待一回合' })[action.type];
async function requestHint() {
  if (session.state.status !== 'playing' || hintPending) return;
  hintPending = true; const request = ++hintRequest, signature = stateHash(session.state, level), levelId = level.id;
  renderControls(); message('正在搜索当前局面的合法通关路线…', 'hint');
  const finish = action => {
    if (request !== hintRequest || level.id !== levelId || signature !== stateHash(session.state, level)) return;
    hintPending = false; renderControls();
    message(action ? `建议下一步：${actionLabel(action)}。这条提示来自当前局面的实际求解。` : '搜索范围内未找到解。试试撤销箱子或空间操作，再重新提示。', action ? 'hint' : 'error');
  };
  try {
    if (!worker) worker = new Worker(new URL('./hint-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { if (data.request === request) finish(data.action); };
    worker.onerror = () => { worker?.terminate(); worker = null; finish(null); };
    worker.postMessage({ request, state: session.state, levelId });
  } catch {
    const { solve } = await import('./solver.js');
    setTimeout(() => finish(solve(level, session.state, { maxDepth: 70, maxExpanded: 15000 })?.actions[0]), 20);
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('button, a'); if (!button) return;
  if (button.dataset.level) { chooseLevel(button.dataset.level); return; }
  if (button.dataset.direction) { act({ type: 'move', direction: button.dataset.direction }); return; }
  if (button.dataset.scale) { act({ type: 'scale', value: Number(button.dataset.scale) }); return; }
  if (button.dataset.topology) { act({ type: 'topology', value: button.dataset.topology }); return; }
  if (button.dataset.view) { view = button.dataset.view; render(); return; }
  if (button.dataset.result) {
    const action = button.dataset.result;
    if (action === 'next') chooseLevel(level.id + 1); else if (action === 'menu') showMenu(); else if (action === 'undo') undo(); else restart();
    return;
  }
  if (button.id === 'menu-button' || button.id === 'back-menu') { event.preventDefault(); showMenu(); }
  else if (button.id === 'undo-button') undo();
  else if (button.id === 'restart-button') restart();
  else if (button.id === 'hint-button') requestHint();
  else if (button.id === 'wait-button') act({ type: 'wait' });
  else if (button.id === 'interact-button') act({ type: 'interact' });
  else if (button.id === 'help-button') { closeDialogs(); $('#help-dialog').showModal(); }
  else if (button.id === 'close-help') { $('#help-dialog').close(); $('#board').focus({ preventScroll: true }); }
});
document.addEventListener('pointerover', event => { const button = event.target.closest('[data-preview]'); if (button && !button.contains(event.relatedTarget)) previewAction(button); });
document.addEventListener('pointerout', event => { const button = event.target.closest('[data-preview]'); if (button && !button.contains(event.relatedTarget)) clearPreview(); });
document.addEventListener('focusin', event => { if (event.target.matches('[data-preview]')) previewAction(event.target); });
document.addEventListener('focusout', event => { if (event.target.matches('[data-preview]')) clearPreview(); });
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (document.querySelector('dialog[open]')) return;
  const key = event.key.toLowerCase();
  const movement = { arrowup: 'up', w: 'up', arrowright: 'right', d: 'right', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left' };
  // Preserve normal keyboard navigation when a native control has focus.
  if (['button', 'summary', 'a'].includes(event.target.tagName.toLowerCase()) && [' ', 'enter', 'tab'].includes(key)) return;
  if (movement[key]) { event.preventDefault(); act({ type: 'move', direction: movement[key] }); }
  else if (['1', '2', '3'].includes(key)) { event.preventDefault(); act({ type: 'scale', value: Number(key) }); }
  else if (key === 't') { event.preventDefault(); cycleTopology(); }
  else if (key === 'f') { event.preventDefault(); act({ type: 'interact' }); }
  else if (key === ' ') { event.preventDefault(); act({ type: 'wait' }); }
  else if (key === 'tab') { event.preventDefault(); cycleView(); }
  else if (key === 'z') { event.preventDefault(); undo(); }
  else if (key === 'r') { event.preventDefault(); restart(); }
  else if (key === 'h') { event.preventDefault(); requestHint(); }
  else if (key === 'escape') { event.preventDefault(); showMenu(); }
  else if (key === '?') { event.preventDefault(); $('#help-dialog').showModal(); }
});
// Prevent an Escape from closing the only usable result controls accidentally.
$('#result-dialog').addEventListener('cancel', event => { event.preventDefault(); undo(); });
render();
$('#menu-dialog').showModal();
