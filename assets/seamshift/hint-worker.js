import { getLevel } from './levels.js';
import { solve } from './solver.js';
import { routeHint } from './route-hints.js';
self.onmessage = ({ data }) => {
  const known = routeHint(getLevel(data.levelId),data.state);
  if(known){self.postMessage({request:data.request,action:known});return;}
  const result = solve(getLevel(data.levelId), data.state, { weight: 4, maxDepth: 64, maxExpanded: 70000 });
  self.postMessage({ request: data.request, action: result?.actions[0] ?? null });
};
