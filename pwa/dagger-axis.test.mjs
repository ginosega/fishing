import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateGearBundle} from './gear-model.js';
import {readValidatedImage,detectImageType} from './image-validation.mjs';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const gear=read('./data/gear.seed.json');
assert.ok(validateGearBundle(gear).valid);
assert.equal(gear.schemaVersion,4);
assert.equal(gear.dataVersion,'2026-09-08-my-gear-v4-dagger-length-1');
assert.equal(gear.items.length,65);
const id='dagger-axis-10-5';
const url='https://www.confluenceoutdoor.com/products/dagger-axis-105-crossover-kayak-9030515209?_pos=1&_psq=axis&_psid=22657cf47&_ss=e';
const expected={id,category:'accessories',type:'Kayaks',name:'Dagger Axis 10.5',manufacturer:{name:'Dagger'},model:'Axis 10.5',specifications:[{label:'Length',value:'10\' 6"'},{label:'Height',value:'15.25"'},{label:'Width',value:'28.5"'},{label:'Weight',value:'50 lb'},{label:'Cockpit opening',value:'52.5"x23.5" (6.0 deck)'}],links:[{label:'Dagger',url}]};
assert.deepEqual(gear.items.filter(x=>x.id===id),[expected]);
const sources=read('./media-sources.json');
const owners=read('./media-owners.json');
const local=read('./local-media.json');
assert.equal(sources.items.filter(x=>x.id===id).length,1);
assert.equal(sources.items.find(x=>x.id===id).sourcePage,url);
assert.deepEqual(owners.items.find(x=>x.mediaId===id).owners,[{gearItemId:id}]);
const entry=local.gear.find(x=>x.mediaId===id);
assert.equal(entry.source,'./assets/gear-source/dagger-axis-10-5.png');
assert.deepEqual(entry.owners,[{gearItemId:id}]);
assert.equal(entry.destination,url);
assert.equal(local.gear.filter(x=>x.mediaId===id).length,1);
assert.equal(fs.existsSync(new URL('./gear-content/'+id+'.md',import.meta.url)),false);
const bytes=await readValidatedImage(fileURLToPath(new URL(entry.source,import.meta.url)));
assert.equal(detectImageType(bytes,entry.source),'png');
assert.ok(bytes.length>0);
// User-maintained image sources may be replaced. Preserve their identity and
// validate actual bytes; historical release hashes are not current-file locks.
if(process.argv.includes('--dist')) {
 const built=read('./dist/data/gear.seed.json');
 assert.deepEqual(built.items.find(x=>x.id===id),expected);
 const media=read('./dist/gear-media.json').find(x=>x.id===id);
 assert.ok(media);
 assert.equal(media.asset,'./assets/gear/dagger-axis-10-5.png');
 assert.deepEqual(media.owners,[{gearItemId:id}]);
 assert.equal(media.localSource,true);
 assert.equal(media.sourcePath,'pwa/assets/gear-source/dagger-axis-10-5.png');
 assert.deepEqual(fs.readFileSync(new URL('./dist/assets/gear/dagger-axis-10-5.png',import.meta.url)),bytes);
}
console.log('Dagger Axis facts, source format, ownership and exact built media validation passed.');
