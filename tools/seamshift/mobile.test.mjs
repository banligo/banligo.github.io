import test from 'node:test';
import assert from 'node:assert/strict';
import { gameHeight, fitViewport } from '../../assets/seamshift/viewport.js';
import { patchBoard, setMarkupIfChanged } from '../../assets/seamshift/renderer.js';
import { renderBoardLayers } from '../../assets/seamshift/board.js';
import { levels } from '../../assets/seamshift/levels.js';
import { initialState, applyAction, createSession } from '../../assets/seamshift/engine.js';

test('phone layout uses the actually visible viewport, including browser chrome', () => {
  assert.equal(gameHeight({ width: 390, innerHeight: 920, visualHeight: 690, mobile: true }), 690);
  assert.equal(gameHeight({ width: 320, innerHeight: 568, visualHeight: 530, mobile: true }), 530);
  assert.equal(gameHeight({ width: 844, innerHeight: 390, mobile: true }), 390);
  assert.equal(gameHeight({ width: 1280, innerHeight: 900 }), 900);
});
test('long-phone controls are raised rather than pinned to the far end of the screen', () => {
  assert.equal(gameHeight({ width: 375, innerHeight: 1100, mobile: true }), 750);
  assert.equal(gameHeight({ width: 390, innerHeight: 1000, mobile: true }), 780);
  assert.equal(gameHeight({ width: 430, innerHeight: 1100, mobile: true }), 820);
  assert.equal(gameHeight({ width: 320, innerHeight: 568, mobile: true }), 568);
});
test('viewport resizing coalesces updates and responds to actual visible height changes', () => {
  const handlers = {}, frames = [], values = [], modes = [], query = { matches: true, addEventListener: (name, fn) => handlers.media = fn };
  const win = { innerWidth: 390, innerHeight: 1000, visualViewport: { height: 940, addEventListener: (name, fn) => handlers.visual = fn }, matchMedia: () => query, addEventListener: (name, fn) => handlers.window = fn, requestAnimationFrame: fn => frames.push(fn) };
  const root = { style: { setProperty: (name, value) => values.push(value) }, classList: { toggle: (name, value) => modes.push(value) } };
  fitViewport(win, root);
  assert.deepEqual(values, ['780px']); handlers.window(); handlers.visual(); assert.equal(frames.length, 1);
  win.visualViewport.height = 660; frames.shift()(); assert.deepEqual(values, ['780px', '660px']);
  query.matches = false; handlers.media(); frames.shift()(); assert.equal(modes.at(-1), false);
});
class Node {
  writes = 0; attributes = {};
  set innerHTML(value) { this.markup = value; this.writes++; }
  setAttribute(name, value) { this.attributes[name] = value; }
}
test('walking preserves the SVG and static map layers, updating only the actors', () => {
  const layers = Object.fromEntries(['walls', 'terrain', 'overlay', 'actors'].map(name => [name, new Node()]));
  const svg = new Node(); svg.querySelector = selector => layers[selector.match(/data-layer="(.*?)"/)[1]];
  const container = new Node(); container.querySelector = () => svg;
  const level = {...levels[0],width:5,height:3,map:['#####','#P..#','#####'],controls:[],bridges:[]}; let state = initialState(level);
  patchBoard(container, renderBoardLayers(level, state));
  for (const direction of ['right', 'right', 'left', 'right', 'left', 'right']) {
    state = applyAction(state, { type: 'move', direction }, level); patchBoard(container, renderBoardLayers(level, state));
  }
  assert.equal(container.writes, 1); assert.equal(layers.walls.writes, 0); assert.equal(layers.terrain.writes, 0); assert.equal(layers.overlay.writes, 0); assert.equal(layers.actors.writes, 6);
  assert(svg.attributes['aria-label'].includes('6 步'));
});
test('unchanged buttons are not recreated, and bridge entry patches the actual map', () => {
  const button = new Node(); assert(setMarkupIfChanged(button, '<button>2</button>')); assert(!setMarkupIfChanged(button, '<button>2</button>')); assert.equal(button.writes, 1);
  const l = levels[0], state = initialState(l), old = renderBoardLayers(l, state), changed = renderBoardLayers(l, applyAction(state, {type:'move',direction:'right'}, l));
  assert.equal(old.walls, changed.walls); assert.notEqual(old.terrain, changed.terrain);
});
test('saving can serialize read-only live history without copying it on every input', () => {
  const s = createSession(levels[0]), live = s.snapshot({ clone: false }), copy = s.snapshot();
  s.act({ type: 'move', direction: 'right' });
  assert.equal(live.history.length, 1); assert.equal(copy.history.length, 0);
  assert.equal(JSON.parse(JSON.stringify(s.snapshot({ clone: false }))).state.turn, 1);
  s.undo(); assert.deepEqual(s.state, initialState(levels[0]));
});
test('phone scenery is simplified and cached without altering paths or actors', () => {
  const l = levels[4], s = initialState(l), full = renderBoardLayers(l, s), light = renderBoardLayers(l, s, { lightweight: true });
  assert.equal(light.walls,full.walls);
  assert.equal(light.terrain, full.terrain); assert.equal(light.actors, full.actors); assert.equal(light.overlay, full.overlay);
  assert.equal(renderBoardLayers(l, s).walls, full.walls);
  assert.equal(renderBoardLayers(l, s, { lightweight: true }).walls, light.walls);
});

test('tablets use their full visible height instead of the long-phone cap',()=>{
 assert.equal(gameHeight({width:768,innerHeight:1024,mobile:true}),1024);assert.equal(gameHeight({width:834,innerHeight:1194,visualHeight:1120,mobile:true}),1120);assert.equal(gameHeight({width:1024,innerHeight:1366,mobile:true}),1366);assert.equal(gameHeight({width:1194,innerHeight:834,mobile:true}),834);
});
