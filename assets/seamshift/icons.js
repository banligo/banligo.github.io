const paths = {
  bridgeOff: '<path d="M3 7v10m18-10v10M3 10h6m6 0h6M3 14h6m6 0h6m-10-5-2 6m6-6-2 6"/>',
  bridgeOn: '<path d="M3 7v10m18-10v10M3 10h18M3 14h18M7 10v4m5-4v4m5-4v4"/>',
  levels: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  undo: '<path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12"/>',
  restart: '<path d="M4 10a8 8 0 1 1 1 9M4 3v7h7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  rotate: '<path d="M19 7a8 8 0 1 0 1 8M19 2v6h-6"/>',
  remove: '<path d="M5 7h14l-1 13H6ZM9 7V4h6v3M9 11v5M15 11v5"/>',
  hint: '<path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7ZM9 20h6M10 23h4"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-4-4 3-3m-6 0 3-3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  up: '<path d="m6 14 6-6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>', left: '<path d="m14 6-6 6 6 6"/>',
  plane: '<path d="M4 6h16v13H4ZM8 6v13M16 6v13"/>',
  cylinder: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  torus:'<ellipse cx="12" cy="12" rx="10" ry="7"/><ellipse cx="12" cy="12" rx="4" ry="2.5"/><path d="M4 7q8 5 16 0M4 17q8-5 16 0"/>',
  mobius: '<path d="M3 12c0-7 6-9 12 0s6 7 6 0-6-9-12 0-6 7-6 0Z"/>',
};
export function icon(name, extra = '') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths[name] || paths.help}</svg>`;
}
export const starPath = 'M0-12 3.6-4 12-3.7 5.4 2 7.4 11 0 6.5-7.4 11-5.4 2-12-3.7-3.6-4Z';
