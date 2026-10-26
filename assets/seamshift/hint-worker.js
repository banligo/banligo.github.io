import { getLevel } from './levels.js';
import { solve } from './solver.js';
self.onmessage = ({ data }) => {
  const result = solve(getLevel(data.levelId), data.state, { maxDepth: 64, maxExpanded: 70000 });
  self.postMessage({ request: data.request, action: result?.actions[0] ?? null });
};
