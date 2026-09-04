import fs from 'node:fs/promises';

const url = new URL('./data/gear.seed.json', import.meta.url);
const bundle = JSON.parse(await fs.readFile(url, 'utf8'));

const byId = () => new Map(bundle.items.map(item => [item.id, item]));

function replace(id, value) {
  const index = bundle.items.findIndex(item => item.id === id);
  if (index < 0) throw new Error(`Missing Gear item ${id}`);
  bundle.items[index] = { ...bundle.items[index], ...value, id };
}

function upsertAfter(anchorId, item) {
  bundle.items = bundle.items.filter(record => record.id !== item.id);
  const index = bundle.items.findIndex(record => record.id === anchorId);
  if (index < 0) throw new Error(`Missing Gear anchor ${anchorId}`);
  bundle.items.splice(index + 1, 0, item);
}

function appendNote(id, sentence) {
  const item = byId().get(id);
  if (!item) throw new Error(`Missing Gear item ${id}`);
  const old = String(item.notes || '').trim();
  if (old.includes(sentence)) return;
  item.notes = old ? `${old}\n\n${sentence}` : sentence;
}

bundle.dataVersion = '2026-09-03-my-gear-v2-content-1';

replace('booyah-pad-crasher', {
  manufacturer: { name: 'Booyah' },
  links: [{
    kind: 'retailer',
    label: "Dick's Sporting Goods",
    url: 'https://www.dickssportinggoods.com/p/booyah-pad-crasher-frog-assortment-3-pack-20byhupdcrshr3pkklur/20byhupdcrshr3pkklur'
  }]
});

replace('generic-0-inline-spinner-assortment', {
  name: 'South Bend 3-Piece Classic Dressed Spinners',
  manufacturer: { name: 'South Bend' },
  model: '3-Piece Classic Dressed Spinners',
  specifications: [
    { label: 'Size', value: '#0' },
    { label: 'Weight', value: '1/8 oz' },
    { label: 'Colors', value: 'Black/Yellow, Blue/Yellow, Chrome, Yellow Holographic' }
  ],
  links: []
});

replace('south-bend-hook-assortment', {
  name: 'South Bend 120-Piece Hook Assortment',
  manufacturer: { name: 'South Bend' },
  model: '120-Piece Hook Assortment',
  specifications: [
    { label: 'Material', value: 'Brass' },
    { label: 'Sizes', value: '2, 4, 6, 8, and 10' }
  ],
  links: []
});

upsertAfter('glass-beads', {
  id: 'south-bend-removable-split-shot-sinkers',
  category: 'weights',
  type: 'Split shot sinkers',
  name: 'South Bend 125-Piece Removable Split Shot Sinkers',
  manufacturer: { name: 'South Bend' },
  model: '125-Piece Removable Split Shot Sinkers',
  specifications: [
    { label: 'Material', value: 'Lead' },
    { label: 'Sizes', value: 'BB, 3/0, 7, 5, 4' }
  ],
  links: []
});

upsertAfter('tsuridamashii-ball-bearing-snap-swivels', {
  id: 'south-bend-assorted-brass-swivels',
  category: 'snaps-swivels',
  type: 'Swivels',
  name: 'South Bend 24-Piece Assorted Brass Swivels',
  manufacturer: { name: 'South Bend' },
  model: '24-Piece Assorted Brass Swivels',
  specifications: [
    { label: 'Material', value: 'Brass' },
    { label: 'Sizes', value: '5, 7, 10, 12' }
  ],
  links: []
});

const links = new Map([
  ['technique-chatterbait-bladed-jig', ['Chatterbait / Bladed Jig', ['zman-original-chatterbait', 'zman-elite-evo', 'zman-jack-hammer']]],
  ['technique-spinnerbait', ['Spinnerbait', ['strike-king-red-eyed-special', 'sixth-sense-divine-spinnerbait']]],
  ['technique-crankbait', ['Crankbait', ['rebel-crawfish', 'berkley-flicker-shad-5', 'strike-king-kvd-square-bill-1', 'berkley-money-badger', 'rapala-dt']]],
  ['technique-jerkbait', ['Jerkbait', ['berkley-stunna', 'rapala-original-floating', 'rapala-ripstop', 'rapala-husky-jerk']]],
  ['technique-jigs', ['Jigs', ['strike-king-premier-pro-model-jig', 'strike-king-tour-grade-football-jig']]],
  ['technique-swimbait-soft-jerk-shad', ['Swimbait / Soft Jerk Shad', ['sixth-sense-divine-swimbait', 'berkley-powerbait-power-jerk-shad', 'fin-sanity-bluegill']]],
  ['technique-wacky-worm', ['Wacky Worm', ['yamamoto-senko']]],
  ['technique-ned-rig', ['Ned Rig', ['zman-ned-rig-kit']]]
]);

for (const [kbId, [title, ids]] of links) {
  const sentence = `See [${title}](kb://${kbId}) for usage and technique.`;
  for (const id of ids) appendNote(id, sentence);
}

const ids = bundle.items.map(item => item.id);
if (ids.length !== 63) throw new Error(`Expected 63 Gear items, got ${ids.length}`);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate Gear IDs after Recovery B materialization.');

await fs.writeFile(url, JSON.stringify(bundle));
console.log(`Materialized Recovery B Gear seed: ${bundle.items.length} items.`);
