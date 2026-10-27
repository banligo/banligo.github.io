// visualViewport excludes mobile browser chrome; use the smaller visible height
// and limit long portrait screens so the controls remain within thumb reach.
export function gameHeight({ width, innerHeight, visualHeight = innerHeight, mobile = false }) {
  const visible = Math.floor(Math.min(innerHeight, visualHeight > 0 ? visualHeight : innerHeight));
  return mobile && visible > width ? Math.min(visible, Math.min(820, Math.max(560, width * 2))) : visible;
}
export function fitViewport(win, root, onModeChange = () => {}) {
  const mobile = win.matchMedia('(pointer: coarse), (max-width: 700px)');
  let frame = null, lastHeight = null;
  const update = () => {
    frame = null;
    const height = gameHeight({ width: win.innerWidth, innerHeight: win.innerHeight, visualHeight: win.visualViewport?.height, mobile: mobile.matches });
    if (height !== lastHeight) { root.style.setProperty('--app-height', `${height}px`); lastHeight = height; }
    root.classList.toggle('lightweight', mobile.matches); onModeChange(mobile.matches);
  };
  const queue = () => { if (frame === null) frame = win.requestAnimationFrame(update); };
  win.addEventListener('resize', queue); win.visualViewport?.addEventListener('resize', queue);
  mobile.addEventListener('change', queue); update();
  return { get lightweight() { return mobile.matches; } };
}
