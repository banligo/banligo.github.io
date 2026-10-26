export const shapePorts = { straight: [0, 2], corner: [0, 1], tee: [0, 1, 3], cross: [0, 1, 2, 3] };
export const ports = (piece, definition) => shapePorts[definition.shape].map(p => (p + piece.rotation) % 4);
export const slotAt = (level, p) => level.slots.find(s => s.x === p.x && s.y === p.y);
export function pieceAt(level, state, p) {
  const slot = slotAt(level, p);
  return slot && state.pieces.find(piece => piece.slot === slot.id);
}
export function portOpen(level, state, p, direction) {
  if (level.map[p.y]?.[p.x] !== 'J') return true;
  const piece = pieceAt(level, state, p);
  return !!piece && ports(piece, level.pieces.find(d => d.id === piece.id)).includes(direction);
}
export const pieceSignature = state => state.pieces.map(p => `${p.id}:${p.slot ?? '-'}:${p.rotation}`).join(';');
