import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionAcceptedOperationReader,
 D6AcceptedOperationReadError}
 from '../../experiments/p3/preview/src/d6-production-accepted-operation-reader.mjs';

const REPO=D6_PUBLISH_REPOSITORY,MAIN='a'.repeat(40);
const UUID='123e4567-e89b-42d3-a456-426614174000',NOW=1800000001;
const DIGEST='c'.repeat(64);
const meta=path=>({path,bytes:99,sha256:DIGEST});
const gear=()=>prepareChange({domain:'gear',operation:'add',
 id:'example-jig',record:{id:'example-jig',category:'lures',
  type:'Jigs',name:'Example Jig'},sourceRevision:MAIN});
const gearPicture=()=>prepareChange({domain:'gear',operation:'add',
 id:'example-jig',record:{id:'example-jig',category:'lures',
  type:'Jigs',name:'Example Jig'},sourceRevision:MAIN,
 pictureAction:'add',picturePath:'Gear/Lures/assets/example.png',
 pictureFile:meta('Gear/Lures/assets/example.png')});
const catchNotes=()=>prepareChange({domain:'catches',operation:'add',
 id:'catch-example',record:{id:'catch-example',date:'2026-11-12'},
 sourceRevision:MAIN,
 text:'![Original](../assets/catch-example/notes/photo.png)',
 notesImages:[meta('Catches/assets/catch-example/notes/photo.png')]});
const knot=()=>prepareChange({domain:'kb',operation:'add',
 id:'sample-knot',record:{id:'sample-knot',type:'knot',
  name:'Sample Knot'},sourceRevision:MAIN,
 text:'# Sample Knot',
 pictureAction:'add',picturePath:'KB/Knots/assets/sample-knot/step-02.png',
 pictureFile:meta('KB/Knots/assets/sample-knot/step-02.png'),
 pictureSequenceAction:'set',
 pictureSequencePaths:[
  'KB/Knots/assets/sample-knot/step-01.png',
  'KB/Knots/assets/sample-knot/step-02.png',
 ],
 pictureSequenceFiles:[
  meta('KB/Knots/assets/sample-knot/step-01.png'),
  meta('KB/Knots/assets/sample-knot/step-02.png'),
 ]});
async function row(pkg){
 const snapshot={package:pkg,media:expectedD6CanonicalMedia(pkg)};
 const snapshot_json=JSON.stringify({owner:REPO.ownerGitHubId,
  repositoryId:REPO.id,snapshot});
 return {operation_id:UUID,owner_github_id:REPO.ownerGitHubId,
  idempotency_key:'immutable_media_operation_123456789',
  snapshot_sha256:await sha256(snapshot_json),
  snapshot_json,candidate_sha256:'f'.repeat(64),
  source_revision:MAIN,domain:pkg.domain,
  operation_kind:pkg.operation,record_id:pkg.id,
  state:'Accepted',created_at:NOW,updated_at:NOW};
}
function setup(value,{enabled=true,storeDown=false}={}){
 const stats={reads:0,writes:0,sql:null,args:null};
 const DB={prepare(sql){
  stats.sql=sql;
  if(storeDown)throw Error('Missing table');
  return {bind(...args){
   stats.args=args;
   return {async first(){stats.reads++;return value;}};
  }};
 }};
 const reader=createD6ProductionAcceptedOperationReader({
  DB,enabled:()=>enabled});
 return {reader,stats};
}
const read=x=>x.reader.loadAcceptedOperation({
 operationId:UUID,ownerGitHubId:REPO.ownerGitHubId});
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6AcceptedOperationReadError&&e.code===code);

test('WP3-LOAD01 accepted Gear text-only snapshot yields immutable non-Live operation',async()=>{
 const pkg=await gear(),record=await row(pkg),x=setup(record);
 const stored=await read(x);
 assert.deepEqual(stored.operation,{
  operationId:UUID,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,snapshotSha256:record.snapshot_sha256,
  domain:'gear',operation:'add',recordId:'example-jig',
  state:'Accepted',
 });
 assert.deepEqual(stored.package,pkg);
 assert.deepEqual(stored.mediaTickets,[]);
 assert.deepEqual(stored.pendingOriginals,[]);
 assert.equal(stored.requiresSignedStaging,false);
 assert.equal(stored.canPublish,false);
 assert.equal(stored.isLive,false);
 assert(Object.isFrozen(stored.operation));
 assert(Object.isFrozen(stored.package));
 assert(Object.isFrozen(stored));
 assert.equal(x.stats.reads,1);
 assert.equal(x.stats.writes,0);
 assert.match(x.stats.sql,/WHERE operation_id=\? AND owner_github_id=\?/);
 assert.deepEqual(x.stats.args,[UUID,REPO.ownerGitHubId]);
});

test('WP3-LOAD02 Gear new-original metadata is pending, not a signed ticket',async()=>{
 const pkg=await gearPicture(),x=setup(await row(pkg));
 const result=await read(x);
 assert.deepEqual(result.pendingOriginals,expectedD6CanonicalMedia(pkg));
 assert.equal(result.pendingOriginals.length,1);
 assert.deepEqual(result.mediaTickets,[]);
 assert.equal(result.requiresSignedStaging,true);
 assert.equal(result.requiresIndependentBlobReadback,true);
 assert.equal(result.canPublish,false);
 assert(Object.isFrozen(result.pendingOriginals[0]));
});

test('WP3-LOAD03 Catch Notes originals preserve immutable operation binding',async()=>{
 const pkg=await catchNotes(),result=await read(setup(await row(pkg)));
 assert.equal(result.operation.domain,'catches');
 assert.equal(result.package.notes.images.length,1);
 assert.equal(result.pendingOriginals[0].path,
  'Catches/assets/catch-example/notes/photo.png');
 assert.deepEqual(result.mediaTickets,[]);
});

test('WP3-LOAD04 Knot ordered originals cannot be reordered by a loader',async()=>{
 const pkg=await knot(),result=await read(setup(await row(pkg)));
 assert.deepEqual(result.pendingOriginals.map(m=>m.path),
  pkg.pictureSequence.paths);
 assert.equal(result.pendingOriginals.length,2);
 assert.equal(result.requiresSignedStaging,true);
});

test('WP3-LOAD05 disabled or wrong-owner requests never query D1',async()=>{
 const x=setup(await row(await gear()),{enabled:false});
 await denied(read(x),'DISABLED');
 assert.equal(x.stats.reads,0);
 const good=setup(await row(await gear()));
 await denied(good.reader.loadAcceptedOperation({
  operationId:UUID,ownerGitHubId:456}),'OWNER_DENIED');
 await denied(good.reader.loadAcceptedOperation({
  operationId:'wrong',ownerGitHubId:REPO.ownerGitHubId,
 }),'OWNER_DENIED');
 assert.equal(good.stats.reads,0);
});

test('WP3-LOAD06 absent schema, row or Unknown never returns Accepted',async()=>{
 const source=await row(await gear());
 await denied(read(setup(source,{storeDown:true})),
  'STORE_UNAVAILABLE');
 await denied(read(setup(null)),'RECEIPT_UNVERIFIED');
 await denied(read(setup({...source,state:'Unknown'})),
  'RECEIPT_UNVERIFIED');
 await denied(read(setup({...source,state:'Live'})),
  'RECEIPT_UNVERIFIED');
});

test('WP3-LOAD07 forged snapshot bytes, whitespace or SHA mismatch are denied',async()=>{
 const source=await row(await gear());
 for(const bad of [
  {...source,snapshot_sha256:'e'.repeat(64)},
  {...source,snapshot_json:source.snapshot_json+' '},
  {...source,snapshot_json:source.snapshot_json.slice(0,-1)},
  {...source,snapshot_json:'not-json'},
  {...source,snapshot_json:'x'.repeat(132000)},
 ]){
  await assert.rejects(read(setup(bad)));
 }
});

test('WP3-LOAD08 poisoned or foreign repository and owner in D1 are denied',async()=>{
 const pkg=await gear(),source=await row(pkg);
 const poison=[
  {...source,owner_github_id:42},
  {...source,domain:'kb'},
  {...source,record_id:'other-jig'},
  {...source,operation_kind:'edit'},
  {...source,source_revision:'b'.repeat(40)},
  {...source,candidate_sha256:'untrusted'},
  {...source,idempotency_key:'short'},
 ];
 for(const p of poison)await assert.rejects(read(setup(p)));
 for(const bad of [
  {owner:42,repositoryId:REPO.id,snapshot:{package:pkg,media:[]}},
  {owner:REPO.ownerGitHubId,repositoryId:42,
   snapshot:{package:pkg,media:[]}},
  {owner:REPO.ownerGitHubId,repositoryId:REPO.id,
   snapshot:{package:pkg,media:[]},__proto__:null},
 ]){
  const json=JSON.stringify(bad);
  const v={...source,snapshot_json:json,snapshot_sha256:await sha256(json)};
  if(json===source.snapshot_json)continue;
  await assert.rejects(read(setup(v)));
 }
});

test('WP3-LOAD09 tampered or undeclared media metadata cannot be read as trusted',async()=>{
 const source=await row(await gearPicture());
 const original=JSON.parse(source.snapshot_json);
 for(const media of [
  [],[{...original.snapshot.media[0],bytes:100}],
  [{...original.snapshot.media[0],blobSha:'d'.repeat(40)}],
  [original.snapshot.media[0],original.snapshot.media[0]],
 ]){
  const snapshot={...original,
   snapshot:{...original.snapshot,media}};
  const json=JSON.stringify(snapshot);
  const bad={...source,snapshot_json:json,
   snapshot_sha256:await sha256(json)};
  await denied(read(setup(bad)),'MEDIA_METADATA_MISMATCH');
 }
});

test('WP3-LOAD10 failed read does not alter durable operation or issue tickets',async()=>{
 const pkg=await gearPicture(),record=await row(pkg),x=setup(record);
 const a=await read(x),b=await read(x);
 assert.deepEqual(a,b);
 assert.deepEqual(a.mediaTickets,[]);
 assert.equal(x.stats.reads,2);
 assert.equal(x.stats.writes,0);
 assert.equal(record.state,'Accepted');
 assert.equal(record.snapshot_json,JSON.stringify({
  owner:REPO.ownerGitHubId,repositoryId:REPO.id,
  snapshot:{package:pkg,media:expectedD6CanonicalMedia(pkg)},
 }));
});
