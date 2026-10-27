// Inputs advance the pure engine in a short FIFO, independent of animation.
export function createActionQueue(consume, { schedule = callback => typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : setTimeout(callback, 0), cancel = id => typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id), limit = 6 } = {}) {
  let actions = [], timer = null;
  const tick = () => {
    timer = null; const action = actions.shift(); if (action) consume(action);
    if (actions.length) timer = schedule(tick);
  };
  return {
    push(action) { if (actions.length >= limit) return false; actions.push(action); if (timer === null) timer = schedule(tick); return true; },
    clear() { if (timer !== null) cancel(timer); timer = null; actions = []; },
    get length() { return actions.length; },
  };
}
export function swipeDirection(start, end, threshold = 24) {
  const dx = end.x - start.x, dy = end.y - start.y;
  if (Math.hypot(dx, dy) < threshold) return null;
  return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
}
export function cellFromClient(svg, x, y, cell = 56, padding = 23) {
  const matrix = svg.getScreenCTM(); if (!matrix) return null;
  const point = svg.createSVGPoint(); point.x = x; point.y = y;
  const local = point.matrixTransform(matrix.inverse());
  return { x: Math.floor((local.x - padding) / cell), y: Math.floor((local.y - padding) / cell) };
}
