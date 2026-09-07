import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { validateGearBundle } from './gear-model.js';
import { validateKbBundle, validateCatchBundle } from './kb-model.js';
import { materializeKbEntity,validateKbMediaBundle } from './kb-picture-model.js';
import { stableJson } from './authoring-common.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(here,'dist');
const read=async name=>JSON.parse(await fs.readFile(path.join(dist,name),'utf8'));
const gear=await read('data/gear.seed.json');
const kb=await read('data/kb.seed.json');
const catches=await read('data/catches.seed.json');
for(const [label,result] of [['Gear',validateGearBundle(gear)],['KB',validateKbBundle(kb)],['Catch',validateCatchBundle(catches,kb,gear)]]) assert.ok(result.valid,`${label}: ${result.errors.join('; ')}`);
const gearIds=new Set(gear.items.map(item=>item.id));
assert.equal(gearIds.size,gear.items.length);
const assets=new Set();
for(const manifest of ['gear-notes-assets.json','catch-notes-assets.json','kb-assets.json']) {
  const paths=await read(manifest);
  assert.ok(Array.isArray(paths),`${manifest} must be an array`);
  for(const entry of paths) {
    assert.ok(typeof entry==='string'&&entry.startsWith('./')&&!entry.includes('\\')&&!entry.includes('..'),`Unsafe asset ${entry}`);
    const absolute=path.resolve(dist,entry);
    assert.ok(absolute.startsWith(dist+path.sep),`Asset escapes bundle: ${entry}`);
    assert.ok((await fs.stat(absolute)).isFile(),`Missing asset: ${entry}`);
    assets.add(entry);
  }
}
const media=await read('gear-media.json');
const mediaIds=new Set();
for(const image of media) {
  assert.ok(image.id&&!mediaIds.has(image.id),`Duplicate media ID ${image.id}`);
  mediaIds.add(image.id);
  assert.ok(Array.isArray(image.owners)&&image.owners.length,`Missing owners for ${image.id}`);
  for(const owner of image.owners) assert.ok(gearIds.has(owner.gearItemId),`Unknown owner ${owner.gearItemId}`);
  assert.ok(image.asset?.startsWith('./assets/gear/'),`Unsafe media asset ${image.asset}`);
  assert.ok((await fs.stat(path.resolve(dist,image.asset))).isFile(),`Missing media ${image.asset}`);
  if(image.sourcePath) {
    assert.ok(image.sourcePath.startsWith('pwa/assets/gear-source/'),`Invalid repository source ${image.sourcePath}`);
    assert.equal(image.localSource,true);
  }
}
const sourceKb=await read('kb-authoring-source.json');
const kbMedia=await read('kb-media.json');
const sourceValidation=validateKbBundle(sourceKb);
assert.ok(sourceValidation.valid,sourceValidation.errors.join('; '));
const sourceOnDisk=JSON.parse(await fs.readFile(path.join(here,'data/kb.seed.json'),'utf8'));
assert.equal(stableJson(sourceKb),stableJson(sourceOnDisk),'Authoring snapshot must equal repository source.');
const localMedia=JSON.parse(await fs.readFile(path.join(here,'local-media.json'),'utf8'));
assert.equal(stableJson(kbMedia.kb),stableJson(localMedia.kb),'Deployed overlay must match repository media ownership.');
const overlayValidation=validateKbMediaBundle(kbMedia,sourceKb,gear,media);
assert.ok(overlayValidation.valid,overlayValidation.errors.join('; '));
assert.equal(stableJson(kb),stableJson({...sourceKb,entities:sourceKb.entities.map(entity=>materializeKbEntity(entity,kbMedia,media,gear))}),
  'Every deployed KB entity must be the exact materialization of its canonical source and media overlay.');
for(const item of kbMedia.kb) if(item.source) {
  const filename=path.resolve(dist,item.source);
  assert.ok(filename.startsWith(dist+path.sep));
  assert.ok((await fs.stat(filename)).isFile(),`Missing KB picture ${item.source}`);
}
assert.equal(gear.schemaVersion,4);
assert.ok(gear.items.length>=64);
const rvr=gear.items.find(item=>item.id==='bonafide-rvr119');
assert.ok(rvr);
assert.deepEqual(rvr.links.map(link=>link.label),['Bonafide','Eco Fishing']);
console.log(`Final transformed bundle validated: ${gear.items.length} Gear, ${kb.entities.length} KB, ${catches.catches.length} catches, ${media.length} media, ${assets.size} offline document assets.`);
