import { active, dualGraph, key } from './graphs.js?v=7bce4805ffac';
import { initialState, collectStar } from './engine.js?v=7bce4805ffac';
import { levels as campaign } from './levels.js?v=7bce4805ffac';
const LAST = campaign.length;
export const SAVE_KEY = 'seamloom.adventure.v4';
export const freshProgress = () => ({ version: 6, campaignLength:LAST, currentLevel: 1, results: {}, seenTips: [], discoveries: [], snapshot: null, archivedAttempts: {} });
export function unlockedLevel(progress) {
  let id = 1; while (id < LAST && (progress.results[id]?.completed || progress.results[id]?.stars >= 1)) id++; return id;
}
export function normalizeProgress(raw, legacy = null) {
  const result = freshProgress();
  if ([2,3,4,5,6].includes(raw?.version)) {
    for (let id = 1; id <= LAST; id++) {
      const r = raw.results?.[id];
      if (r && Number.isInteger(r.stars) && r.stars >= 0 && r.stars <= 3 && (r.bestTurns===null || Number.isInteger(r.bestTurns) && r.bestTurns > 0)) {
        result.results[id] = { completed:!!r.completed || r.stars>0, stars: r.stars, bestTurns: r.bestTurns, bestThreeStarTurns: r.stars === 3 && Number.isInteger(r.bestThreeStarTurns) && r.bestThreeStarTurns > 0 ? r.bestThreeStarTurns : null, layoutRevision: Number.isInteger(r.layoutRevision) ? r.layoutRevision : campaign[id-1].legacyRevision ?? (id>=9 ? 2 : campaign[id-1].revision), ...(r.priorBest && typeof r.priorBest==='object' ? {priorBest:r.priorBest} : {}) };
      }
    }
    for(const [id,r] of Object.entries(result.results)) if(r.layoutRevision!==campaign[id-1].revision){
      result.results[id]={completed:r.completed,stars:0,bestTurns:null,bestThreeStarTurns:null,layoutRevision:campaign[id-1].revision,...(r.bestTurns?{priorBest:{layoutRevision:r.layoutRevision,stars:r.stars,bestTurns:r.bestTurns,bestThreeStarTurns:r.bestThreeStarTurns,...(r.priorBest?{earlier:r.priorBest}:{})}}:r.priorBest?{priorBest:r.priorBest}:{})};
    }
    result.seenTips = Array.isArray(raw.seenTips) ? raw.seenTips.filter(x => typeof x === 'string') : [];
    result.discoveries = Array.isArray(raw.discoveries) ? raw.discoveries.filter(x => typeof x==='string') : [];
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
  next.results[levelId] = { completed:true, stars: Math.max(stars, sameLayout ? old?.stars ?? 0 : 0), bestTurns: Math.min(turns, sameLayout ? old?.bestTurns ?? Infinity : Infinity), bestThreeStarTurns: stars === 3 ? Math.min(turns,sameLayout ? old?.bestThreeStarTurns ?? Infinity : Infinity) : sameLayout ? old?.bestThreeStarTurns ?? null : null, layoutRevision:revision, ...(priorBest ? {priorBest} : {}) };
  next.currentLevel = Math.min(LAST, levelId + 1); next.snapshot = null;
  return next;
}
export function validSnapshot(snapshot, level) {
  if (!snapshot?.state || !Array.isArray(snapshot.history)) return false;
  const valid = state => {
    if (!state || state.version !== 6 || state.layoutRevision !== level.revision || state.levelId !== level.id || !level.scales.includes(state.scale) || !level.modes.includes(state.topology)) return false;
    if (!Number.isInteger(state.turn) || state.turn < 0 || !['playing', 'won', 'lost'].includes(state.status) || typeof state.lampLit !== 'boolean' || typeof state.shadowReturning !== 'boolean' || typeof state.hunterAwake !== 'boolean' || typeof state.hasKey !== 'boolean' || typeof state.starCollected !== 'boolean') return false;
    if (!Array.isArray(state.pieces) || state.pieces.length !== level.pieces.length || !Array.isArray(state.hunters) || !Array.isArray(state.shadows) || !Array.isArray(state.events)) return false;
    if (state.hunters.length !== initialState(level).hunters.length || state.shadows.length !== (level.shadow ? 1 : 0)) return false;
    if (new Set(state.pieces.map(p => p.id)).size !== state.pieces.length) return false;
    const occupied = state.pieces.filter(p => p.slot).map(p => p.slot);
    if (new Set(occupied).size !== occupied.length) return false;
    if (state.pieces.some(p => { const d = level.pieces.find(d => d.id === p.id); return !d || !Number.isInteger(p.rotation) || p.rotation < 0 || p.rotation > 3 || (p.slot !== null && !d.allowedSlots.includes(p.slot)); })) return false;
    const validPosition = p => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < level.width && p.y >= 0 && p.y < level.height;
    if (![...(state.world==='dual'?[]:[state.player]), ...state.hunters].every(p => validPosition(p) && active(level, p, state.scale, state))) return false;
    if(!['primal','dual'].includes(state.world)||!validPosition(state.anchor))return false;
    if(!state.bridgeStates||level.bridges.some(b=>typeof state.bridgeStates[b.id]!=='boolean')||!Array.isArray(state.triggered))return false;
    if(!state.rooms||level.rooms.some(r=>!Number.isInteger(state.rooms[r.id])||state.rooms[r.id]<0||state.rooms[r.id]>3))return false;
    if(!Number.isInteger(state.energy)||state.energy!==state.lampCharge||!Number.isInteger(state.lampCharge)||state.lampCharge<0||state.lampCharge>(level.circuit?.maxCharge??2)||typeof state.lampStarted!=='boolean')return false;
    if(!Array.isArray(state.hunterStates)||state.hunterStates.length!==state.hunters.length||!state.hunterStates.every(m=>['sleeping','alert','chasing'].includes(m)))return false;
    if(!Array.isArray(state.hunterWakeReasons)||state.hunterWakeReasons.length!==state.hunters.length||state.hunterAwake!==state.hunterStates.some(m=>m!=='sleeping'))return false;
    if(!['unpowered','ready','charging','lit','shorted'].includes(state.lampStatus)||state.lampLit!==(state.lampStatus==='lit'))return false;
    const dual=dualGraph(level,state).graph;
    return [...state.shadows,...(state.world==='dual'?[state.player]:[])].every(p=>validPosition(p)&&dual.has(key(p)));
  };
  try { return valid(snapshot.state) && snapshot.history.every(valid); } catch { return false; }
}
export function loadProgress(storage, levels) {
  try {
    const read = name => { try { return JSON.parse(storage.getItem(name) || 'null'); } catch { return null; } };
    const latest = read(SAVE_KEY), old = read('geomaze.adventure.v3') ?? read('seamshift.adventure.v2');
    const raw = [4,5,6].includes(latest?.version) ? latest : old;
    const result = normalizeProgress(raw, read('seamshift.progress.v1'));
    const level = levels.find(l => l.id === result.currentLevel);
    // Compatible layouts retain their exact attempt and Undo history. Changed
    // monster/light layouts have a new revision and are archived below instead.
    if(result.snapshot?.state?.version===5&&result.snapshot.state.layoutRevision===level.revision&&Array.isArray(result.snapshot.history)){
      for(const state of [result.snapshot.state,...result.snapshot.history]){
        state.version=6;state.hunterStates=state.hunters.map(()=>state.hunterAwake?'chasing':'sleeping');state.hunterWakeReasons=state.hunters.map(()=>null);state.energy=state.lampCharge;
      }
    }
    if(result.snapshot?.state && Array.isArray(result.snapshot.history)) for(const s of [result.snapshot.state,...result.snapshot.history]) s.lampLit ??= false;
    if (!validSnapshot(result.snapshot, level)) {
      if(result.snapshot) result.archivedAttempts[level.id]=result.snapshot;
      result.snapshot = null;
    }
    if(result.snapshot?.state.status === 'playing') collectStar(result.snapshot.state,level);
    const previousLast = Number.isInteger(raw?.campaignLength) ? raw.campaignLength : 5;
    if(previousLast < LAST && raw?.currentLevel === previousLast && result.results[previousLast]?.completed && !result.snapshot) result.currentLevel = Math.min(unlockedLevel(result),previousLast+1);
    if(result.snapshot?.state.status==='won'){result.currentLevel=Math.min(LAST,result.currentLevel+1);result.snapshot=null;}
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
