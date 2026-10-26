import { active, dualGraph, key } from './graphs.js';
import { initialState } from './engine.js';
export const SAVE_KEY = 'seamshift.adventure.v2';
export const freshProgress = () => ({ version: 2, currentLevel: 1, results: {}, seenTips: [], discoveries: [], snapshot: null });
export function unlockedLevel(progress) {
  let id = 1; while (id < 5 && progress.results[id]?.stars >= 1) id++; return id;
}
export function normalizeProgress(raw, legacy = null) {
  const result = freshProgress();
  if (raw?.version === 2) {
    for (let id = 1; id <= 5; id++) {
      const r = raw.results?.[id];
      if (r && Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 3 && Number.isInteger(r.bestTurns) && r.bestTurns > 0) {
        result.results[id] = { stars: r.stars, bestTurns: r.bestTurns };
      }
    }
    result.seenTips = Array.isArray(raw.seenTips) ? raw.seenTips.filter(x => typeof x === 'string') : [];
    result.discoveries = Array.isArray(raw.discoveries) ? raw.discoveries.filter(x => ['scale', 'cylinder', 'mobius', 'pieces', 'duality'].includes(x)) : [];
    result.currentLevel = Math.max(1, Math.min(unlockedLevel(result), Number.isInteger(raw.currentLevel) ? raw.currentLevel : unlockedLevel(result)));
    result.snapshot = raw.snapshot ?? null;
  } else if (legacy && typeof legacy === 'object') {
    // Old saves represent completed tutorials; preserve unlocks without claiming
    // stars that did not exist in that version of the game.
    for (let id = 1; id <= 5; id++) if (Number.isInteger(legacy[id]) && legacy[id] > 0) result.results[id] = { stars: 1, bestTurns: legacy[id] };
    result.currentLevel = unlockedLevel(result);
  }
  return result;
}
export function recordWin(progress, levelId, stars, turns) {
  const next = structuredClone(progress), old = next.results[levelId];
  next.results[levelId] = { stars: Math.max(stars, old?.stars ?? 0), bestTurns: Math.min(turns, old?.bestTurns ?? Infinity) };
  next.currentLevel = Math.min(5, levelId + 1); next.snapshot = null;
  return next;
}
export function validSnapshot(snapshot, level) {
  if (!snapshot?.state || !Array.isArray(snapshot.history)) return false;
  const valid = state => {
    if (!state || state.version !== 2 || state.levelId !== level.id || !level.scales.includes(state.scale) || !level.modes.includes(state.topology)) return false;
    if (!Number.isInteger(state.turn) || state.turn < 0 || !['playing', 'won', 'lost'].includes(state.status) || typeof state.hasKey !== 'boolean' || typeof state.starCollected !== 'boolean') return false;
    if (!Array.isArray(state.pieces) || state.pieces.length !== level.pieces.length || !Array.isArray(state.hunters) || !Array.isArray(state.shadows) || !Array.isArray(state.events)) return false;
    if (state.hunters.length !== initialState(level).hunters.length || state.shadows.length !== (level.shadow ? 1 : 0)) return false;
    if (new Set(state.pieces.map(p => p.id)).size !== state.pieces.length) return false;
    const occupied = state.pieces.filter(p => p.slot).map(p => p.slot);
    if (new Set(occupied).size !== occupied.length) return false;
    if (state.pieces.some(p => { const d = level.pieces.find(d => d.id === p.id); return !d || !Number.isInteger(p.rotation) || p.rotation < 0 || p.rotation > 3 || (p.slot !== null && !d.allowedSlots.includes(p.slot)); })) return false;
    const validPosition = p => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < level.width && p.y >= 0 && p.y < level.height;
    if (![state.player, ...state.hunters].every(p => validPosition(p) && active(level, p, state.scale, state))) return false;
    return state.shadows.every(p => validPosition(p) && dualGraph(level, state).graph.has(key(p)));
  };
  try { return valid(snapshot.state) && snapshot.history.every(valid); } catch { return false; }
}
export function loadProgress(storage, levels) {
  try {
    const read = name => { try { return JSON.parse(storage.getItem(name) || 'null'); } catch { return null; } };
    const result = normalizeProgress(read(SAVE_KEY), read('seamshift.progress.v1'));
    const level = levels.find(l => l.id === result.currentLevel);
    if (!validSnapshot(result.snapshot, level)) result.snapshot = null;
    if (result.snapshot?.state.status === 'won' && result.currentLevel < 5) { result.currentLevel++; result.snapshot = null; }
    return result;
  } catch { return freshProgress(); }
}
export function saveProgress(storage, progress) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
