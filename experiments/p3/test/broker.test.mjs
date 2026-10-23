import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createBroker,safeCanonicalPath,BrokerError} from '../src/broker.mjs';
import {fakeGitHub,memoryStore} from '../src/memory-adapters.mjs';

const ID=54321,REPO=98765,ORIGIN='https://preview.example.workers.dev';
const expires=4_000_000;
const session={githubId:ID,expiresAt:expires,csrf:'session-csrf-f9d23'};
const pkg={format:'fishing-companion-change-v2',domain:'gear',operation:'edit',id:'sample-rod',
 base:{schemaVersion:2,sourceRevision:'a'.repeat(40)},record:{id:'sample-rod',category:'rods-reels',type:'Spinning',name:'Sample rod'},
 changes:{set:{name:'Sample rod'},baseFields:{name:'Sample rod'}},notes:{action:'keep'},picture:{action:'keep'},pictureSequence:{action:'keep'}};
const sha=b=>createHash('sha256').update(b).digest('hex');
const request=()=>({session:{...session},http:{origin:ORIGIN,fetchSite:'same-origin',method:'POST',intent:'publish',csrf:session.csrf},
 repository:{id:REPO,name:'owner/disposable-test'},idempotencyKey:'unique-request-0001',package:structuredClone(pkg),media:[]});
function setup(now=()=>1_000_000){
 const store=memoryStore(),github=fakeGitHub();const events=[];
 const sourceAware={async promote({package:p,snapshot,media}){
   events.push({domain:p.domain,sourceRevision:snapshot.mainSha,mediaCount:media.length});
   if(p.id==='conflicting')throw new BrokerError('CONFLICT','Record changed');
   return {validated:true,changes:[{path:'Gear/Rods & Reels/content/sample.md',action:'write',body:'safe changes'}]};
 }};
 const broker=createBroker({store,github,sourceAware,ownerGitHubId:ID,repositoryId:REPO,
  repositoryName:'owner/disposable-test',origin:ORIGIN,now});
 return {broker,store,github,events,sourceAware};
}
async function drain(broker,id,limit=8){let result;for(let i=0;i<limit;i++){result=await broker.step(id);if(['Live','Failed','Conflict'].includes(result.state))break;}return result;}

// Negative authorization paths are tested before ANY mock mutation.
test('P3-001 rejects anonymous and non-owner sessions without creating operation',async()=>{
 const x=setup();for(const bad of [null,{...session,githubId:111},{...session,expiresAt:5}]){
  const req=request();req.session=bad;
  await assert.rejects(x.broker.submit(req),e=>e.code==='UNAUTHORIZED');
 }assert.equal(x.store.size(),0);
});
test('P3-002 exact Origin, Fetch Metadata, CSRF proof, HTTP method and intent mandatory',async()=>{
 const x=setup();const edits=[['origin','https://evil.example'],['fetchSite','cross-site'],['fetchSite',undefined],['csrf','wrong'],['csrf',undefined],['method','GET'],['intent','signout']];
 for(const [k,v] of edits){const req=request();req.http[k]=v;await assert.rejects(x.broker.submit(req),e=>e.code==='CSRF');}
 assert.equal(x.store.size(),0);
});
test('P3-003 rejects alternate or malformed repository identity',async()=>{
 const x=setup();for(const repo of [{id:REPO,name:'evil/other'},{id:123,name:'owner/disposable-test'},{id:REPO,name:'OWNER/disposable-test'}]){
  const req=request();req.repository=repo;await assert.rejects(x.broker.submit(req),e=>e.code==='REPOSITORY_DENIED');
 }assert.equal(x.store.size(),0);
});
test('P3-004 validates change format, domain, base and id',async()=>{
 const x=setup();for(const patch of [{format:'bad'},{domain:'catches'},{id:'../../evil'},{base:{schemaVersion:1,sourceRevision:'a'}}]){
  const req=request();Object.assign(req.package,patch);await assert.rejects(x.broker.submit(req),e=>e.code==='INVALID_PACKAGE');
 }assert.equal(x.store.size(),0);
});
test('P3-005 media path traversal, non-asset locations, oversize and digest mismatch fail',async()=>{
 const x=setup(),data=Uint8Array.from([1,2,3]);
 for(const [path,bytes,hash] of [
  ['Gear/../admin/private.png',data,sha(data)],['KB/gear/assets/a.png',data,sha(data)],
  ['Gear/Rods/assets/a.exe',data,sha(data)],['Gear/Rods/assets/a.png',data,'0'.repeat(64)],
  ['Gear/Rods/assets/a.png',new Uint8Array(3_000_001),'0'.repeat(64)]]){
   const req=request();req.media=[{path,content:bytes,sha256:hash}];
   await assert.rejects(x.broker.submit(req),e=>['MEDIA','INVALID_PATH'].includes(e.code));
  }assert.equal(x.store.size(),0);
});
test('P3-006 accepts valid media and commits exact digest to immutable snapshot',async()=>{
 const x=setup(),data=Uint8Array.from([0,1,2,255]);const req=request();
 req.media=[{path:'Gear/Rods/assets/photo.png',sha256:sha(data),content:data}];
 const a=await x.broker.submit(req);data[0]=7;assert.equal(a.inserted,true);
 const result=await drain(x.broker,a.id);assert.equal(result.state,'Live');assert.equal(x.events[0].mediaCount,1);
});
test('P3-007 idempotency repeat returns same operation without extra GitHub PR',async()=>{
 const x=setup(),req=request();const a=await x.broker.submit(req);const b=await x.broker.submit(req);
 assert.equal(a.id,b.id);assert.equal(a.inserted,true);assert.equal(b.inserted,false);
 assert.equal((await drain(x.broker,a.id)).state,'Live');
 assert.equal((await x.broker.submit(req)).state,'Live');assert.deepEqual(x.github.stats(),{created:1,merges:1});
});
test('P3-008 idempotency key reused with changed snapshot is rejected',async()=>{
 const x=setup(),req=request();await x.broker.submit(req);req.package.record.name='different';
 await assert.rejects(x.broker.submit(req),e=>e.code==='IDEMPOTENCY_CONFLICT');assert.equal(x.store.size(),1);
});
test('P3-009 progression requires matching CI SHA and successful branch rules',async()=>{
 const x=setup();const {id}=await x.broker.submit(request());
 await x.broker.step(id);await x.broker.step(id);
 x.github.config.check='pending';assert.equal((await x.broker.step(id)).state,'Checking');assert.equal(x.github.stats().merges,0);
 x.github.config.check='failed';assert.equal((await x.broker.step(id)).state,'Failed');assert.equal(x.github.stats().merges,0);
});
test('P3-010 moving main prevents merge of stale PR',async()=>{
 const x=setup();const {id}=await x.broker.submit(request());await x.broker.step(id);await x.broker.step(id);await x.broker.step(id);
 x.github.setMainSha('f'.repeat(40));const result=await x.broker.step(id);
 assert.equal(result.state,'Conflict');assert.equal(x.github.stats().merges,0);
});
test('P3-011 merged is never Live until hosted source SHA AND release identity verified',async()=>{
 const x=setup();const {id}=await x.broker.submit(request());for(let i=0;i<4;i++)await x.broker.step(id);
 assert.equal((await x.broker.status(id,session)).state,'Deploying');
 x.github.config.deployment='pending';assert.equal((await x.broker.step(id)).state,'Deploying');
 x.github.config.deployment='success';x.github.config.deployedSha='f'.repeat(40);
 assert.equal((await x.broker.step(id)).state,'Failed');
 assert.equal((await x.broker.status(id,session)).state,'Failed');
});
test('P3-012 successful mock lifecycle ends only after source-bound hosted verification',async()=>{
 const x=setup();const {id}=await x.broker.submit(request());
 const seen=[];for(let i=0;i<6;i++)seen.push((await x.broker.step(id)).state);
 assert.deepEqual(seen,['Validating','Checking','Merging','Deploying','Live','Live']);
 const state=await x.broker.status(id,session);assert.equal(state.releaseId,'d'.repeat(32));assert.equal(state.mergedSha,'c'.repeat(40));
 assert.equal(x.github.stats().created,1);assert.equal(x.github.stats().merges,1);
});
test('P3-013 status endpoint denies anonymous and expired sessions',async()=>{
 const x=setup(),{id}=await x.broker.submit(request());
 for(const other of [null,{...session,githubId:777},{...session,expiresAt:12}])await assert.rejects(x.broker.status(id,other),e=>e.code==='UNAUTHORIZED');
 await assert.rejects(x.broker.status('random',session),e=>e.code==='NOT_FOUND');
});
test('P3-014 canonical paths disallow case-insensitive git dir, traversal, percent encoding',()=>{
 for(const path of ['Gear/../.env','Gear\\Asset/a.png','Gear/%2e%2e/file','Gear/.git/config','KB/assets/file.png','Gear//item','/Gear/a']){
  assert.throws(()=>safeCanonicalPath(path,'gear'),e=>e.code==='INVALID_PATH');
 }
 assert.equal(safeCanonicalPath('KB/Knots/assets/my photo.png','kb'),'KB/Knots/assets/my photo.png');
});
test('P3-015 server-side source-aware adapter rejection fails closed',async()=>{
 const x=setup();const req=request();req.package.id='conflicting';
 const {id}=await x.broker.submit(req);await x.broker.step(id);
 assert.equal((await x.broker.step(id)).state,'Conflict');assert.equal(x.github.stats().created,0);
});
test('P3-016 candidate validator may not assert unvalidated source',async()=>{
 const x=setup();x.sourceAware.promote=async()=>({validated:false,changes:[{path:'Gear/a',action:'write'}]});
 const {id}=await x.broker.submit(request());await x.broker.step(id);
 assert.equal((await x.broker.step(id)).state,'Failed');assert.equal(x.github.stats().created,0);
});


test('P3-017 accepts canonical edit packages without record and requires add record',async()=>{
 const x=setup();
 const edit=request();delete edit.package.record;
 assert.equal((await x.broker.submit(edit)).inserted,true);
 const badAdd=request();badAdd.idempotencyKey='another-unique-0002';
 badAdd.package.operation='add';delete badAdd.package.record;
 await assert.rejects(x.broker.submit(badAdd),e=>e.code==='INVALID_PACKAGE');
 const missingBase=request();missingBase.idempotencyKey='another-unique-0003';
 delete missingBase.package.record;delete missingBase.package.changes;
 await assert.rejects(x.broker.submit(missingBase),e=>e.code==='INVALID_PACKAGE');
});
