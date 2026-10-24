import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {prepareChange} from '../src/handoff.mjs';
import {createCanonicalSourceAware} from '../../experiments/p3/src/source-aware.mjs';

const SHA='a'.repeat(40);
const baseGear={id:'test-rod',category:'rods-reels',type:'Spinning rod',name:'Test Rod',manufacturer:'OldCo'};
const baseKb={id:'location-lake',type:'location',name:'Lake',content:'KB/Locations/content/Lake.md'};
const adapter=createCanonicalSourceAware();
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fish-p3-fixture-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const d of ['Gear','KB/Locations/content','Catches'])await fs.mkdir(path.join(root,d),{recursive:true});
 await fs.writeFile(path.join(root,'Gear/gear.json'),JSON.stringify({schemaVersion:2,items:[baseGear]},null,2));
 await fs.writeFile(path.join(root,'KB/kb.json'),JSON.stringify({schemaVersion:2,entities:[baseKb]},null,2));
 await fs.writeFile(path.join(root,'Catches/catches.json'),JSON.stringify({schemaVersion:2,catches:[]},null,2));
 await fs.writeFile(path.join(root,'KB/Locations/content/Lake.md'),'A valid lake description.');
 return {root,mainSha:SHA};
}
async function editGear({base=baseGear,record={...baseGear,name:'Updated Rod'},sourceRevision=SHA}={}){
 return prepareChange({domain:'gear',operation:'edit',id:base.id,baseRecord:base,record,sourceRevision});
}
const promote=(pkg,snapshot,media=[])=>adapter.promote({package:pkg,snapshot,media});
test('P3-S01 actual v2 promoter preserves a newer unrelated Gear field on current main',async t=>{
 const s=await fixture(t);
 const current={...baseGear,manufacturer:'Updated by another editor'};
 await fs.writeFile(path.join(s.root,'Gear/gear.json'),JSON.stringify({schemaVersion:2,items:[current]},null,2));
 const result=await promote(await editGear(),s);
 assert.equal(result.validated,true);
 assert.equal(result.changes.length,1);
 const json=JSON.parse(result.changes[0].body);
 assert.equal(json.items[0].manufacturer,'Updated by another editor');
 assert.equal(json.items[0].name,'Updated Rod');
 assert.equal((await fs.readFile(path.join(s.root,'Gear/gear.json'),'utf8')).includes('Updated Rod'),false,'trusted snapshot must not be mutated');
});
test('P3-S02 real source-aware field conflict fails closed without candidate changes',async t=>{
 const s=await fixture(t);
 await fs.writeFile(path.join(s.root,'Gear/gear.json'),JSON.stringify({schemaVersion:2,items:[{...baseGear,name:'Concurrent rename'}]}));
 await assert.rejects(promote(await editGear(),s),e=>e.code==='CONFLICT');
});
test('P3-S03 candidate with invalid taxonomy fails complete source inventory',async t=>{
 const s=await fixture(t);
 const invalid={...baseGear,type:'Unknown rod type'};
 const pkg=await editGear({record:invalid});
 await assert.rejects(promote(pkg,s),e=>e.code==='VALIDATION');
});
test('P3-S04 KB Markdown image referring to nonexistent asset is rejected',async t=>{
 const s=await fixture(t);
 const pkg=await prepareChange({domain:'kb',operation:'edit',id:baseKb.id,baseRecord:baseKb,
  record:baseKb,baseText:'A valid lake description.',text:'![Missing image](../assets/missing.png)',
  sourceRevision:SHA});
 await assert.rejects(promote(pkg,s),e=>e.code==='VALIDATION');
});
test('P3-S05 real KB Add creates narrative and bundle in one validated candidate',async t=>{
 const s=await fixture(t);
 const kb={id:'location-new-bay',type:'location',name:'New Bay',description:'Sample shore fishing'};
 const pkg=await prepareChange({domain:'kb',operation:'add',id:kb.id,record:kb,text:'A simple new bay.',
  sourceRevision:SHA});
 const result=await promote(pkg,s);
 assert.equal(result.validated,true);
 assert.deepEqual(result.changes.map(x=>x.action),['write','write']);
 assert(result.changes.some(x=>x.path==='KB/Locations/content/New Bay.md'));
 assert.equal(JSON.parse(result.changes[0].body).entities.length,2);
});
test('P3-S06 image addition missing authoritative bytes and hash metadata is rejected',async t=>{
 const s=await fixture(t);
 const pkg=await prepareChange({domain:'gear',operation:'edit',id:baseGear.id,baseRecord:baseGear,
  record:{...baseGear,picture:{src:'Gear/Rods-Reels/assets/a.png'}},
  sourceRevision:SHA,pictureAction:'add',picturePath:'Gear/Rods-Reels/assets/a.png'});
 await assert.rejects(promote(pkg,s),e=>e.code==='VALIDATION');
});
test('P3-S07 narrative addition cannot overwrite an existing file without review',async t=>{
 const s=await fixture(t);
 const record={id:'location-other-lake',name:'Lake',type:'location'};
 const pkg=await prepareChange({domain:'kb',operation:'add',id:record.id,record,text:'Different lake text',sourceRevision:SHA});
 await assert.rejects(promote(pkg,s),e=>e.code==='CONFLICT');
});
test('P3-S08 malformed source snapshot rejected without mutating original',async t=>{
 const s=await fixture(t),pkg=await editGear();
 await assert.rejects(promote(pkg,{...s,mainSha:'wrong'}),e=>e.code==='VALIDATION');
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(s.root,'Gear/gear.json'),'utf8')).items,[baseGear]);
});

test('P3-S09 broker accepts only a fully validated canonical candidate before simulated PR creation',async t=>{
 const s=await fixture(t);
 const {createBroker}=await import('../../experiments/p3/src/broker.mjs');
 const {memoryStore,fakeGitHub}=await import('../../experiments/p3/src/memory-adapters.mjs');
 const github=fakeGitHub();
 github.readSnapshot=async()=>s;
 const broker=createBroker({store:memoryStore(),github,sourceAware:adapter,
  ownerGitHubId:54321,repositoryId:98765,repositoryName:'owner/disposable-test',
  origin:'https://preview.example.workers.dev',now:()=>1_000_000});
 const req={session:{githubId:54321,expiresAt:4_000_000,csrf:'secret'},
  http:{origin:'https://preview.example.workers.dev',fetchSite:'same-origin',method:'POST',intent:'publish',csrf:'secret'},
  repository:{id:98765,name:'owner/disposable-test'},idempotencyKey:'example-idempotency-0001',
  package:await editGear(),media:[]};
 const accepted=await broker.submit(req);
 assert.equal((await broker.step(accepted.id)).state,'Validating');
 assert.equal((await broker.step(accepted.id)).state,'Checking');
 assert.equal(github.stats().created,1);
});
