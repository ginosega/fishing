import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateKbBundle,validateCatchBundle} from './kb-model.js';
import {materializeKbEntity,validateKbMediaBundle} from './kb-picture-model.js';
import {readValidatedImage,detectImageType} from './image-validation.mjs';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const kb=read('./data/kb.seed.json');
const gear=read('./data/gear.seed.json');
const catches=read('./data/catches.seed.json');
const local=read('./local-media.json');
const id='location-cranberry-lake-deception-pass';
const src='./assets/kb/entries/'+id+'.png';
const picture={src,alt:'Cranberry Lake',caption:'Cranberry Lake',credit:null,sourceUrl:null};
const expected={id,type:'location',name:'Cranberry Lake, Deception Pass State Park',description:'Freshwater fishing at Deception Pass State Park.',picture,content:'./kb-content/locations/cranberry-lake-deception-pass.md'};
assert.ok(validateKbBundle(kb).valid);
assert.ok(validateCatchBundle(catches,kb,gear).valid);
assert.equal(kb.dataVersion,'2026-09-08-kb-v1-cranberry-lake-picture-1');
assert.equal(kb.entities.length,54);
assert.deepEqual(kb.entities.filter(e=>e.id===id),[expected]);
assert.deepEqual(local.kb.filter(e=>e.entityId===id),[{entityId:id,source:src,alt:'Cranberry Lake',caption:'Cranberry Lake',credit:null,sourceUrl:null}]);
const source=await readValidatedImage(fileURLToPath(new URL(src,import.meta.url)));
assert.equal(detectImageType(source,src),'png');
assert.ok(source.length>0);
const markdown=fs.readFileSync(new URL('./'+expected.content.slice(2),import.meta.url));
assert.ok(markdown.length>0);
// User-maintained prose and image bytes are not fixed snapshots. Verify the
// current source and exact published copies rather than historical hashes.
if(process.argv.includes('--dist')) {
 const built=read('./dist/data/kb.seed.json');
 const builtGear=read('./dist/data/gear.seed.json');
 const media=read('./dist/gear-media.json');
 assert.ok(validateKbBundle(built).valid);
 assert.ok(validateCatchBundle(catches,built,builtGear).valid);
 assert.deepEqual(built.entities.find(e=>e.id===id),materializeKbEntity(expected,local,media,gear));
 assert.equal(built.entities.length,kb.entities.length);
 assert.deepEqual(fs.readFileSync(new URL('./dist/'+src.slice(2),import.meta.url)),source);
 assert.deepEqual(fs.readFileSync(new URL('./dist/'+expected.content.slice(2),import.meta.url)),markdown);
 assert.ok(read('./dist/kb-assets.json').includes(src));
}
console.log('Cranberry Lake identity, picture metadata, format and source-to-published preservation passed.');
