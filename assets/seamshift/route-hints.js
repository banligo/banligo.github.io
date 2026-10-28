import { walkthroughs } from './walkthroughs.js?v=06fbbcc5c4e0';
import { initialState, applyAction } from './engine.js?v=06fbbcc5c4e0';
import { stateHash } from './solver.js?v=06fbbcc5c4e0';
const cache = new WeakMap();
export function routeHint(level, state) {
  const route = walkthroughs.find(p => p.id === level.id && p.revision === level.revision);
  if (!route) return null;
  if (!cache.has(level)) {
    const hints = new Map(); let replay = initialState(level);
    for (const action of route.actions) {
      hints.set(stateHash(replay, level), action);
      replay = applyAction(replay, action, level, { feedback: false });
    }
    cache.set(level, hints);
  }
  return cache.get(level).get(stateHash(state, level)) ?? null;
}
