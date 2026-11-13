import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';
import {describeD6CanonicalMediaStageMetadata}
 from '../../experiments/p3/preview/src/d6-production-media-stage-fence.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionAcceptedOperationReader}
 from '../../experiments/p3/preview/src/d6-production-accepted-operation-reader.mjs';
import {createD6ProductionVerifiedMediaTicketIssuer}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-issuer.mjs';
import {createD6ProductionMediaTicketVerifier}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';
import {createD6ProductionVerifiedMediaOperationBinding,
 D6VerifiedMediaBindingError}
 from '../../experiments/p3/preview/src/d6-production-verified-media-operation-binding.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),AT=1800000005;
const SECRET='test-only-media-binding-key-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const SHA1=createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+PNG.length+'\0'),Buffer.from(PNG)
])).digest('hex');
const blob=()=>({sha:SHA1,encoding:'base64',size:PNG.length,
 content:Buffer.from(PNG).toString('base64')});
const req=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
 Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
 'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
 'Content-Type':'application/json'},body:'{}'});
async function packageFor(domain='gear',withOriginal=true){
 const digest=await sha256(PNG);
 const meta=path=>({path,bytes:PNG.length,sha256:digest});
 if(domain==='gear'){
  const record={id:'example-jig',category:'lures',type:'Jigs',
   name:'Example Jig'};
  const path='Gear/Lures/assets/example-jig.png';
  return prepareChange({domain,operation:'add',id:record.id,
   record,sourceRevision:MAIN,
   ...(withOriginal?{pictureAction:'add',picturePath:path,
    pictureFile:meta(path)}:{})});
 }
 if(domain==='catches'){
  const record={id:'catch-example',date:'2026-11-12'};
  const path='Catches/assets/catch-example/notes/photo.png';
  return prepareChange({domain,operation:'add',id:record.id,
   record,sourceRevision:MAIN,
   text:withOriginal?'![Photo](../assets/catch-example/notes/photo.png)':
    'Catch story',
   ...(withOriginal?{notesImages:[meta(path)]}:{})});
 }
 const record={id:'example-knot',name:'Example Knot',type:'knot'};
 const paths=[1,2].map(n=>
  'KB/Knots/assets/example-knot/step-0'+n+'.png');
 return prepareChange({domain:'kb',operation:'add',id:record.id,
  record,sourceRevision:MAIN,text:'# Knot',
  ...(withOriginal?{
   pictureAction:'add',picturePath:paths[1],
   pictureFile:meta(paths[1]),
   pictureSequenceAction:'set',pictureSequencePaths:paths,
   pictureSequenceFiles:paths.map(meta),
  }:{})});
}
async function makeRow(pkg){
 const raw=JSON.stringify({owner:REPO.ownerGitHubId,repositoryId:REPO.id,
  snapshot:{package:pkg,media:expectedD6CanonicalMedia(pkg)}});
 return {operation_id:ID,owner_github_id:REPO.ownerGitHubId,
  idempotency_key:'verified_media_binding_12345678',
  snapshot_sha256:await sha256(raw),snapshot_json:raw,
  candidate_sha256:'b'.repeat(64),source_revision:MAIN,
  domain:pkg.domain,operation_kind:pkg.operation,record_id:pkg.id,
  state:'Accepted',created_at:1800000000,updated_at:1800000000};
}
async function fixture({domain='gear',withOriginal=true,owner=true,
 enabled=true,sourceOk=true,missing=null,corrupt=null,
 invalidBlob=false,revokedAfterTicket=false}={}){
 const pkg=await packageFor(domain,withOriginal),row=await makeRow(pkg);
 const want=expectedD6CanonicalMedia(pkg);
 const claims=await Promise.all(want.map(x=>
  describeD6CanonicalMediaStageMetadata({
   operationId:ID,sourceRevision:MAIN,
   snapshotSha256:row.snapshot_sha256,path:x.path,
   bytes:x.bytes,mime:'image/png',sha256:x.sha256,
   expectedBlobSha:SHA1,
  })));
 const fences=claims.map(claim=>({
  operation_id:ID,step_key:claim.stepKey,
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:claim.requestSha256,state:'Unknown',
  created_at:1800000001,
 }));
 const proofs=claims.map((claim,i)=>({
  operation_id:ID,path:want[i].path,
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:claim.requestSha256,
  blob_sha:SHA1,sha256:want[i].sha256,bytes:want[i].bytes,
  mime:'image/png',state:'VerifiedStage',verified_at:1800000002,
 }));
 if(missing==='fence')fences.pop();
 if(missing==='proof')proofs.pop();
 if(corrupt==='blob'&&proofs.length)proofs[0].blob_sha='f'.repeat(40);
 if(corrupt==='hash'&&proofs.length)proofs[0].sha256='e'.repeat(64);
 const stats={dbReads:0,dbWrites:0,ownerChecks:0,signatures:0,
  providerBlobGets:0,providerWrites:0,sourceChecks:0};
 const DB={prepare(sql){return{bind(...args){return{
  async first(){
   stats.dbReads++;
   if(sql.includes('FROM d6_operation_receipts'))
    return row.operation_id===args[0]&&row.owner_github_id===args[1]?
     row:null;
   if(sql.includes('FROM d6_provider_step_fences'))
    return fences.find(x=>x.operation_id===args[0]&&
     x.step_key===args[1])??null;
   if(sql.includes('FROM d6_media_stage_verified'))
    return proofs.find(x=>x.operation_id===args[0]&&
     x.path===args[1])??null;
   throw Error('Unexpected D1 table');
  },
  async run(){stats.dbWrites++;throw Error('Unexpected D1 write');},
 };}};}};
 let active=enabled,isOwner=owner,goodSource=sourceOk,badBlob=invalidBlob;
 const session={authorizeWrite:async request=>{
  stats.ownerChecks++;
  assert.equal(request.method,'POST');
  assert.equal(request.headers.get('X-Fish-V3-Intent'),'publish');
  if(!isOwner)throw Error('Denied by D2');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const loadAcceptedOperation=createD6ProductionAcceptedOperationReader({
  DB,enabled:()=>active,
 }).loadAcceptedOperation;
 const actualIssuer=createD6ProductionVerifiedMediaTicketIssuer({
  DB,session,loadAcceptedOperation,
  secret:SECRET,enabled:()=>active,now:()=>AT,
  verifyCanonicalSource:async x=>{
   stats.sourceChecks++;
   return {...x,verified:goodSource};
  },
 });
 const issuer={issue:async(...args)=>{
  stats.signatures++;
  const result=await actualIssuer.issue(...args);
  if(revokedAfterTicket)isOwner=false;
  return result;
 }};
 const verifyTicket=createD6ProductionMediaTicketVerifier({
  secret:SECRET,origin:ORIGIN,now:()=>AT,
 }).verifyTicket;
 const readGitBlob=async({repositoryId,repositoryFullName,blobSha})=>{
  stats.providerBlobGets++;
  assert.equal(repositoryId,REPO.id);
  assert.equal(repositoryFullName,REPO.name);
  assert.equal(blobSha,SHA1);
  return badBlob?{...blob(),content:Buffer.from('bad').toString('base64')}:
   blob();
 };
 const binding=createD6ProductionVerifiedMediaOperationBinding({
  session,loadAcceptedOperation,issuer,verifyTicket,readGitBlob,
  enabled:()=>active,
 });
 return {binding,DB,row,pkg,want,fences,proofs,stats,
  disable:()=>{active=false},denyOwner:()=>{isOwner=false},
  sourceMoved:()=>{goodSource=false},
  corruptBlob:()=>{badBlob=true},
 };
}
const load=x=>x.binding.forRequest(req()).loadAcceptedOperation({
 operationId:ID,ownerGitHubId:REPO.ownerGitHubId});
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6VerifiedMediaBindingError&&e.code===code);

test('WP3-BIND01 text-only accepted record needs no tickets or Git media reads',async()=>{
 const x=await fixture({withOriginal:false});
 const r=await load(x);
 assert.equal(r.operation.state,'Accepted');
 assert.equal(r.operation.snapshotSha256,x.row.snapshot_sha256);
 assert.deepEqual(r.mediaTickets,[]);
 assert.deepEqual(r.pendingOriginals,[]);
 assert.equal(r.verifiedOriginalCount,0);
 assert.equal(r.completeOriginals,true);
 assert.equal(r.canPublish,false);
 assert.equal(r.isLive,false);
 assert.equal(x.stats.signatures,0);
 assert.equal(x.stats.providerBlobGets,0);
 assert.equal(x.stats.dbWrites,0);
 assert(Object.isFrozen(r.mediaTickets));
});

test('WP3-BIND02 Gear original: D1 VerifiedStage -> signed ticket -> independent Git bytes',async()=>{
 const x=await fixture();
 const r=await load(x);
 assert.equal(r.mediaTickets.length,1);
 assert.equal(r.verifiedOriginalCount,1);
 assert.equal(r.mediaTickets[0].path,x.want[0].path);
 assert.equal(r.mediaTickets[0].blobSha,SHA1);
 assert.equal(r.mediaTickets[0].snapshotSha256,x.row.snapshot_sha256);
 assert.equal(r.requiresAtomicSourceReview,true);
 assert.equal(r.requiresIndependentTreeReadback,true);
 assert.equal(r.canPublish,false);
 assert.equal(x.stats.providerBlobGets,1);
 assert.equal(x.stats.signatures,1);
 assert.equal(x.stats.dbWrites,0);
 assert.equal(x.stats.providerWrites,0);
});

test('WP3-BIND03 Catch original Notes image reuses canonical D1 operation',async()=>{
 const x=await fixture({domain:'catches'});
 const r=await load(x);
 assert.equal(r.operation.domain,'catches');
 assert.deepEqual(r.mediaTickets.map(x=>x.path),x.want.map(x=>x.path));
 assert.equal(x.stats.signatures,1);
 assert.equal(x.stats.providerBlobGets,1);
});

test('WP3-BIND04 Knot two ordered original frames require two signed proofs',async()=>{
 const x=await fixture({domain:'kb'});
 const r=await load(x);
 assert.equal(r.mediaTickets.length,2);
 assert.deepEqual(r.mediaTickets.map(t=>t.path),x.want.map(t=>t.path));
 assert.equal(r.verifiedOriginalCount,2);
 assert.equal(x.stats.signatures,2);
 assert.equal(x.stats.providerBlobGets,2);
 assert.equal(x.stats.dbWrites,0);
});

test('WP3-BIND05 missing original fence or receipt fails without publishing',async()=>{
 for(const missing of ['fence','proof']){
  const x=await fixture({domain:'kb',missing});
  await denied(load(x),'STAGE_OR_TICKET_UNVERIFIED');
  assert.equal(x.stats.providerBlobGets,0);
  assert.equal(x.stats.dbWrites,0);
 }
});

test('WP3-BIND06 altered durable stage SHA or digest fails before Git blob proof',async()=>{
 for(const corrupt of ['blob','hash']){
  const x=await fixture({corrupt});
  await denied(load(x),'STAGE_OR_TICKET_UNVERIFIED');
  assert.equal(x.stats.providerBlobGets,0);
  assert.equal(x.stats.dbWrites,0);
 }
});

test('WP3-BIND07 forged provider Git blob bytes fail independent verification',async()=>{
 const x=await fixture({invalidBlob:true});
 await denied(load(x),'ORIGINAL_GIT_BLOB_UNVERIFIED');
 assert.equal(x.stats.providerBlobGets,1);
 assert.equal(x.stats.dbWrites,0);
});

test('WP3-BIND08 unverified current canonical main stops ticket issuance',async()=>{
 const x=await fixture({sourceOk:false});
 await denied(load(x),'STAGE_OR_TICKET_UNVERIFIED');
 assert.equal(x.stats.providerBlobGets,0);
 assert.equal(x.stats.sourceChecks,1);
});

test('WP3-BIND09 disabled and foreign owner never read D1 or sign tickets',async()=>{
 const off=await fixture({enabled:false});
 await denied(Promise.resolve().then(()=>load(off)),'DISABLED');
 assert.equal(off.stats.dbReads,0);
 const other=await fixture({owner:false});
 await denied(load(other),'OWNER_DENIED');
 assert.equal(other.stats.dbReads,0);
 assert.equal(other.stats.signatures,0);
});

test('WP3-BIND10 missing or forged operation ID never reaches GitHub',async()=>{
 const x=await fixture();
 const forRequest=x.binding.forRequest(req());
 await denied(forRequest.loadAcceptedOperation({
  operationId:'123e4567-e89b-42d3-a456-426614174001',
  ownerGitHubId:REPO.ownerGitHubId,
 }),'OPERATION_UNAVAILABLE');
 await denied(forRequest.loadAcceptedOperation({
  operationId:ID,ownerGitHubId:10,
 }),'OWNER_DENIED');
 assert.equal(x.stats.providerBlobGets,0);
});

test('WP3-BIND11 changed D1 record after ticket issuance never returns ready',async()=>{
 const x=await fixture();
 const oldPrepare=x.DB.prepare.bind(x.DB);
 let reads=0;
 x.DB.prepare=sql=>{
  if(sql.includes('FROM d6_operation_receipts')){
   reads++;
   if(reads>=3)x.row.state='Unknown';
  }
  return oldPrepare(sql);
 };
 await denied(load(x),'OPERATION_UNAVAILABLE');
 assert.equal(x.stats.dbWrites,0);
});

test('WP3-BIND12 reauthorization after signing catches owner-session revocation',async()=>{
 const x=await fixture({revokedAfterTicket:true});
 await denied(load(x),'OWNER_DENIED');
 assert.equal(x.stats.providerBlobGets,1);
 assert.equal(x.stats.dbWrites,0);
});

test('WP3-BIND13 exact repeated owner reads do not POST or stage new originals',async()=>{
 const x=await fixture({domain:'catches'});
 const a=await load(x),b=await load(x);
 assert.deepEqual(a.mediaTickets,b.mediaTickets);
 assert.equal(x.stats.signatures,2);
 assert.equal(x.stats.providerBlobGets,2);
 assert.equal(x.stats.providerWrites,0);
 assert.equal(x.stats.dbWrites,0);
});

test('WP3-BIND14 operation remains source-only even with all original proofs',async()=>{
 const x=await fixture({domain:'kb'});
 const r=await load(x);
 assert.deepEqual(Object.keys(x.binding),['forRequest']);
 assert.deepEqual(Object.keys(x.binding.forRequest(req())),
  ['loadAcceptedOperation']);
 assert.equal(Object.hasOwn(r,'attempt'),false);
 assert.equal(Object.hasOwn(r,'publish'),false);
 assert.equal(r.sourceOnly,true);
 assert.equal(r.isLive,false);
});
