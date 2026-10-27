import { active, dualGraph, key } from './graphs.js';
import { initialState, collectStar } from './engine.js';
import { levels as campaign } from './levels.js';
const LAST = campaign.length;
export const SAVE_KEY = 'seamloom.adventure.v4';
export const freshProgress = () => ({ version: 4, campaignLength:LAST, currentLevel: 1, results: {}, seenTips: [], discoveries: [], snapshot: null, archivedAttempts: {} });
export function unlockedLevel(progress) {
  let id = 1; while (id < LAST && progress.results[id]?.stars >= 1) id++; return id;
}
export function normalizeProgress(raw, legacy = null) {
  const result = freshProgress();
  if ([2,3,4].includes(raw?.version)) {
    for (let id = 1; id <= LAST; id++) {
      const r = raw.results?.[id];
      if (r && Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 3 && Number.isInteger(r.bestTurns) && r.bestTurns > 0) {
        result.results[id] = { stars: r.stars, bestTurns: r.bestTurns, bestThreeStarTurns: r.stars === 3 && Number.isInteger(r.bestThreeStarTurns) && r.bestThreeStarTurns > 0 ? r.bestThreeStarTurns : null, layoutRevision: Number.isInteger(r.layoutRevision) ? r.layoutRevision : campaign[id-1].legacyRevision ?? (id>=9 ? 2 : campaign[id-1].revision), ...(r.priorBest && Number.isInteger(r.priorBest.bestTurns) ? {priorBest:r.priorBest} : {}) };
      }
    }
    result.seenTips = Array.isArray(raw.seenTips) ? raw.seenTips.filter(x => typeof x === 'string') : [];
    result.discoveries = Array.isArray(raw.discoveries) ? raw.discoveries.filter(x => ['scale', 'cylinder', 'mobius', 'torus', 'pieces', 'duality'].includes(x)) : [];
    result.currentLevel = Math.max(1, Math.min(unlockedLevel(result), Number.isInteger(raw.currentLevel) ? raw.currentLevel : unlockedLevel(result)));
    result.snapshot = raw.snapshot ?? null;
    result.archivedAttempts = raw.archivedAttempts && typeof raw.archivedAttempts === 'object' ? raw.archivedAttempts : {};
  } else if (legacy && typeof legacy === 'object') {
    // Old saves represent completed tutorials; preserve unlocks without claiming
    // stars that did not exist in that version of the game.
    for (let id = 1; id <= LAST; id++) if (Number.isInteger(legacy[id]) && legacy[id] > 0) result.results[id] = { stars: 1, bestTurns: legacy[id] };
    result.currentLevel = unlockedLevel(result);
  }
  return result;
}
export function recordWin(progress, levelId, stars, turns) {
  const next = structuredClone(progress), old = next.results[levelId], revision=campaign[levelId-1].revision;
  const sameLayout = (old?.layoutRevision ?? (campaign[levelId-1].legacyRevision ?? (levelId>=9 ? 2 : revision))) === revision;
  const priorBest = !sameLayout && old ? {layoutRevision:old.layoutRevision??campaign[levelId-1].legacyRevision??1,stars:old.stars,bestTurns:old.bestTurns,bestThreeStarTurns:old.bestThreeStarTurns,...(old.priorBest?{earlier:old.priorBest}:{})} : old?.priorBest;
  next.results[levelId] = { stars: Math.max(stars, old?.stars ?? 0), bestTurns: Math.min(turns, sameLayout ? old?.bestTurns ?? Infinity : Infinity), bestThreeStarTurns: stars === 3 ? Math.min(turns,sameLayout ? old?.bestThreeStarTurns ?? Infinity : Infinity) : sameLayout ? old?.bestThreeStarTurns ?? null : null, layoutRevision:revision, ...(priorBest ? {priorBest} : {}) };
  next.currentLevel = Math.min(LAST, levelId + 1); next.snapshot = null;
  return next;
}
export function validSnapshot(snapshot, level) {
  if (!snapshot?.state || !Array.isArray(snapshot.history)) return false;
  const valid = state => {
    if (!state || state.version !== 4 || state.layoutRevision !== level.revision || state.levelId !== level.id || !level.scales.includes(state.scale) || !level.modes.includes(state.topology)) return false;
    if (!Number.isInteger(state.turn) || state.turn < 0 || !['playing', 'won', 'lost'].includes(state.status) || typeof state.lampLit !== 'boolean' || typeof state.shadowReturning !== 'boolean' || typeof state.hunterAwake !== 'boolean' || typeof state.hasKey !== 'boolean' || typeof state.starCollected !== 'boolean') return false;
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
    const latest = read(SAVE_KEY), old = read('geomaze.adventure.v3') ?? read('seamshift.adventure.v2');
    const raw = latest?.version === 4 ? latest : old;
    const result = normalizeProgress(raw, read('seamshift.progress.v1'));
    const level = levels.find(l => l.id === result.currentLevel);
    if(result.snapshot && raw?.version !== 4 && raw?.version === 3 && level.id <= 2) {
      for(const state of [result.snapshot.state,...(result.snapshot.history??[])]) {
        state.version=4; state.layoutRevision=level.revision; state.shadowReturning=false; state.hunterAwake=!!state.hunterAwake;
      }
    }
    if(result.snapshot?.state && Array.isArray(result.snapshot.history)) for(const s of [result.snapshot.state,...result.snapshot.history]) s.lampLit ??= false;
    if (!validSnapshot(result.snapshot, level)) {
      if(result.snapshot) result.archivedAttempts[level.id]=result.snapshot;
      result.snapshot = null;
    }
    if(result.snapshot?.state.status === 'playing') collectStar(result.snapshot.state,level);
    const previousLast = Number.isInteger(raw?.campaignLength) ? raw.campaignLength : 5;
    if(previousLast < LAST && raw?.currentLevel === previousLast && result.results[previousLast]?.stars && !result.snapshot) result.currentLevel = Math.min(unlockedLevel(result),previousLast+1);
    if (result.snapshot?.state.status === 'won' && result.currentLevel < LAST) { result.currentLevel++; result.snapshot = null; }
    return result;
  } catch { return freshProgress(); }
}
export function saveProgress(storage, progress) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}

export function resetProgress(storage) {
  for (const name of [SAVE_KEY,'geomaze.adventure.v3','seamshift.adventure.v2','seamshift.progress.v1']) storage.removeItem(name);
  return freshProgress();
}
