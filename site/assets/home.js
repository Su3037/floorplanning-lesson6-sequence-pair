// Overview page: the four films of the module and the hero floorplan, drawn live by the course engine.
import { $, L } from './core.js';
import { mountVideo } from './media.js';
import { floorplan } from './fp-draw.js';
import * as SP from '../engines/sequence-pair.js';
import { DATA } from '../engines/fixtures.js';

const base = new URL('../', import.meta.url);
const g = DATA.presets.find(p => p.id === 'golden');
const hero = $('[data-fig="hero"]');
if (hero) {
  const r = SP.pack(DATA.fixture, g.pos, g.neg);
  hero.replaceChildren(floorplan({ rects: r.rects, outline: DATA.fixture.outline, theme: 'paper', unit: 34, title: L('教师示例的布图', 'The instructor example, packed') }));
}
mountVideo($('#intro-film-root'), new URL('media/m06-sequence-pair/film.json', base));
