import { getLevel } from './levels.js';
import { solve } from './solver.js';
self.onmessage = ({ data }) => {
  const result = solve(getLevel(data.levelId), data.state, { maxDepth: 70, maxExpanded: 90000 });
  self.postMessage({ request: data.request, action: result?.actions[0] ?? null });
};
