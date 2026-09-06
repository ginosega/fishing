import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const read = async name => JSON.parse(await fs.readFile(new URL(name, import.meta.url), 'utf8'));
const write = async (name, value) => fs.writeFile(new URL(name, import.meta.url), JSON.stringify(value, null, 2) + '\n');
const id = 'bonafide-rvr119';
const owners = await read('./media-owners.json');
const local = await read('./local-media.json');
const seed = await read('./data/gear.seed.json');
assert.equal(seed.items.filter(item => item.id === id).length, 1);
assert.equal(owners.version, 1);
assert.equal(local.version, 1);
assert.ok(!owners.items.some(item => item.mediaId === id));
assert.ok(!local.gear.some(item => item.mediaId === id));
const picturePath = new URL('./assets/gear-source/bonafide-rvr119.png', import.meta.url);
const bytes = await fs.readFile(picturePath);
assert.ok(bytes.length > 0 && bytes.length <= 10 * 1024 * 1024);
assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');

owners.items.push({mediaId:id, owners:[{gearItemId:id}]});
local.gear.push({
  mediaId:id,
  source:'./assets/gear-source/bonafide-rvr119.png',
  alt:'Bonafide RVR119 fishing kayak in Steel',
  destination:'https://bonafidefishing.com/products/rvr119',
  sourcePage:'https://bonafidefishing.com/products/rvr119'
});
await write('./media-owners.json', owners);
await write('./local-media.json', local);

const testFile = new URL('./final-content.test.mjs', import.meta.url);
let test = await fs.readFile(testFile, 'utf8');
const anchor = "const mediaSources = readJson('./media-sources.json');";
assert.equal(test.split(anchor).length, 2);
test = test.replace(anchor, anchor + `
const rvr119MediaId = 'bonafide-rvr119';
const rvr119Media = local.gear.find(record => record.mediaId === rvr119MediaId);
assert.equal(rvr119Media?.source, './assets/gear-source/bonafide-rvr119.png');
const rvr119Owners = readJson('./media-owners.json').items.find(record => record.mediaId === rvr119MediaId);
assert.deepEqual(rvr119Owners?.owners, [{gearItemId:rvr119MediaId}]);
assert.ok(fs.statSync(new URL(rvr119Media.source, import.meta.url)).size > 0);
`);
await fs.writeFile(testFile, test);
console.log('RVR119 media ownership and local source registered; existing configuration preserved.');
