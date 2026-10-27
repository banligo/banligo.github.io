import { boardMarkup } from './board.js';
const boardCache = new WeakMap();
const markupCache = new WeakMap();
export function setMarkupIfChanged(element, markup) {
  if (markupCache.get(element) === markup) return false;
  element.innerHTML = markup; markupCache.set(element, markup); return true;
}
// Keep the SVG, walls and floor alive during movement. Only changed layers are
// parsed and painted, rather than hundreds of SVG elements on every input.
export function patchBoard(container, frame) {
  const previous = boardCache.get(container);
  if (!previous) {
    container.innerHTML = boardMarkup(frame);
    const svg = container.querySelector('svg');
    boardCache.set(container, { frame, svg, layers: Object.fromEntries(['walls', 'terrain', 'overlay', 'actors'].map(name => [name, svg.querySelector(`[data-layer="${name}"]`)])) });
    return;
  }
  const { svg, layers } = previous;
  if (frame.viewBox !== previous.frame.viewBox) svg.setAttribute('viewBox', frame.viewBox);
  if (frame.role !== previous.frame.role) svg.setAttribute('role', frame.role);
  if (frame.label !== previous.frame.label) svg.setAttribute('aria-label', frame.label);
  if (frame.opacity !== previous.frame.opacity) for (const name of ['walls', 'terrain']) layers[name].setAttribute('opacity', frame.opacity);
  for (const name of ['walls', 'terrain', 'overlay', 'actors']) if (frame[name] !== previous.frame[name]) layers[name].innerHTML = frame[name];
  previous.frame = frame;
}
