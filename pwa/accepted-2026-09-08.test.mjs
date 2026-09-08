import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validateGearBundle} from './gear-model.js';
import {validateKbBundle,validateCatchBundle} from './kb-model.js';
import {materializeKbEntity,validateKbMediaBundle} from './kb-picture-model.js';
import {readValidatedImage as readImageFile} from './image-validation.mjs';
import {fileURLToPath} from 'node:url';
const readValidatedImage=filename=>readImageFile(filename instanceof URL?fileURLToPath(filename):filename);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const digest=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const gear=read('./data/gear.seed.json');
const kb=read('./data/kb.seed.json');
const catches=read('./data/catches.seed.json');
const local=read('./local-media.json');
const plans=[{"id":"technique-fishing-line","name":"Fishing Line","description":"Braid, fluorocarbon, mono, leader, knot, and spooling guidance.","path":"./kb-content/techniques/fishing-line.md","filename":"technique-fishing-line.jpg","alt":"Sufix 832 fishing line","gearItemId":"sufix-832-15","markdownBlob":"f5b4b1f11638c7630889e9ecc2a59bd94b1ffc70","imageBlob":"6bbf79095fb60cda21ea086553a1ec3bf64132cb","imageBytes":34540},{"id":"technique-walking-bait","name":"Walking Bait","description":"Walk-the-dog tackle, line, cadence, color guidance, and bait examples.","path":"./kb-content/techniques/walking-bait.md","filename":"technique-walking-bait.jpg","alt":"Heddon Zara Spook","markdownBlob":"766aa8bbb0445184b9804abf5119bc2274089900","imageBlob":"9181d2b9a5767ae01855bbcdffdfa5d6c7dcd7d8","imageBytes":65306},{"id":"technique-rods-reels","name":"Rods & Reels","description":"Spinning and baitcasting selection, setup, adjustment, and casting guidance.","path":"./kb-content/techniques/rods-reels.md","filename":"technique-rods-reels.png","alt":"Baitcasting reel","caption":"Baitcasting reel","markdownBlob":"50e36182db41b7a222a5231c545799ad25bbc270","imageBlob":"0304c3a3c3964f280db88ab70edca52e593a49e2","imageBytes":133226}];
export async function verifyAcceptedBatch(dist=false){
 assert.ok(validateGearBundle(gear).valid);
 assert.ok(validateKbBundle(kb).valid);
 assert.ok(validateCatchBundle(catches,kb,gear).valid);
 assert.equal(gear.schemaVersion,4);
 assert.equal(gear.dataVersion,'2026-09-08-my-gear-v4-perception-joyride-1');
 assert.equal(gear.items.length,66);
 assert.equal(kb.schemaVersion,1);
 assert.equal(kb.dataVersion,'2026-09-08-kb-v1-rods-reels-caption-1');
 assert.equal(kb.entities.length,54);
 assert.equal(catches.catches.length,5);
 const dagger=gear.items.find(x=>x.id==='dagger-axis-10-5');
 assert.equal(dagger.specifications.find(x=>x.label==='Length').value,'10\' 6"');
 const expected=structuredClone(dagger);
 expected.specifications.find(x=>x.label==='Length').value='12\' 6"';
 assert.deepEqual({...dagger,specifications:expected.specifications},expected);
 for(const p of plans){
  const src='./assets/kb/entries/'+p.filename;
  const desired={src,alt:p.alt,caption:p.caption??null,credit:null,sourceUrl:null,...(p.gearItemId?{gearItemId:p.gearItemId}:{})};
  assert.deepEqual(kb.entities.filter(x=>x.id===p.id),[{id:p.id,type:'equipment',name:p.name,description:p.description,picture:desired,content:p.path}]);
  assert.deepEqual(local.kb.filter(x=>x.entityId===p.id),[{entityId:p.id,source:src,alt:p.alt,caption:p.caption??null,credit:null,sourceUrl:null,...(p.gearItemId?{gearItemId:p.gearItemId}:{})}]);
  const bytes=await readValidatedImage(new URL('./'+src.slice(2),import.meta.url));
  assert.equal(bytes.length,p.imageBytes);
  assert.equal(digest(bytes),p.imageBlob);
  const markdown=fs.readFileSync(new URL('./'+p.path.slice(2),import.meta.url));
  assert.equal(digest(markdown),p.markdownBlob);
 }
 if(dist){
  const builtGear=read('./dist/data/gear.seed.json');
  const builtKb=read('./dist/data/kb.seed.json');
  const media=read('./dist/gear-media.json');
  assert.deepEqual(builtGear,gear);
  assert.ok(validateKbBundle(builtKb).valid);
  assert.ok(validateCatchBundle(catches,builtKb,builtGear).valid);
  assert.equal(builtKb.dataVersion,'2026-09-08-kb-v1-rods-reels-caption-1');
  for(const p of plans){
   const expected=materializeKbEntity(kb.entities.find(x=>x.id===p.id),local,media,gear);
   assert.deepEqual(builtKb.entities.find(x=>x.id===p.id),expected);
   const source=fs.readFileSync(new URL('./assets/kb/entries/'+p.filename,import.meta.url));
   assert.deepEqual(fs.readFileSync(new URL('./dist/assets/kb/entries/'+p.filename,import.meta.url)),source);
   assert.ok(read('./dist/kb-assets.json').includes('./assets/kb/entries/'+p.filename));
  }
 }
}
await verifyAcceptedBatch(process.argv.includes('--dist'));
console.log('Accepted kayak length and three KB image source/bundle checks passed.');
