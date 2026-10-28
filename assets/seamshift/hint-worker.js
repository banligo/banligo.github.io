import { getLevel } from './levels.js?v=7bce4805ffac';
import { solve } from './solver.js?v=7bce4805ffac';
import { routeHint } from './route-hints.js?v=7bce4805ffac';
self.onmessage = ({ data }) => {
  const known = routeHint(getLevel(data.levelId),data.state);
  if(known){self.postMessage({request:data.request,action:known});return;}
  const result = solve(getLevel(data.levelId), data.state, { weight: 4, maxDepth: 64, maxExpanded: 70000 });
  self.postMessage({ request: data.request, action: result?.actions[0] ?? null });
};
