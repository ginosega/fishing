import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {verifyD6CanonicalStagedGitBlobs,D6MediaBlobProofError}
 from '../../experiments/p3/preview/src/d6-production-media-blob-proof.mjs';

const sourceRevision='a'.repeat(40);
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const gitSha=bytes=>createHash('sha1').update(
 Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),Buffer.from(bytes)])).digest('hex');
const path='Catches/assets/catch-example/notes/photo.png';
const operation=()=>({
 operationId:'123e4567-e89b-42d3-a456-426614174000',
 ownerGitHubId:D6_PUBLISH_REPOSITORY.ownerGitHubId,
 repositoryId:D6_PUBLISH_REPOSITORY.id,
 ref:D6_PUBLISH_REPOSITORY.ref,
 state:'Accepted',sourceRevision,
 snapshotSha256:'b'.repeat(64),domain:'catches',recordId:'catch-example',
});
const setup=async()=>{
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:'catch-example',record:{id:'catch-example',date:'2026-11-12'},
  sourceRevision,
  text:'![Fish](../assets/catch-example/notes/photo.png)',
  notesImages:[{path,bytes:png.length,sha256:await sha256(png)}],
 });
 const op=operation(),blobSha=gitSha(png);
 const ticket={path,bytes:png.length,sha256:await sha256(png),
  blobSha,mime:'image/png',operationId:op.operationId,
  repositoryId:op.repositoryId,ownerGitHubId:op.ownerGitHubId,
  sourceRevision:op.sourceRevision,snapshotSha256:op.snapshotSha256};
 const blob={sha:blobSha,encoding:'base64',size:png.length,
  content:Buffer.from(png).toString('base64')};
 return {pkg,op,ticket,blob};
};
const error=(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6MediaBlobProofError&&e.code===code);
const inspect=({pkg,op,ticket,blob},overrides={})=>
 verifyD6CanonicalStagedGitBlobs({
  package:pkg,operation:op,media:[ticket],
  verifyTicket:async(t,{operation:o,allowExpired})=>{
   assert.equal(allowExpired,false);
   assert.equal(o.operationId,op.operationId);
   return t;
  },
  readGitBlob:async(q)=>{
   assert.equal(q.repositoryId,D6_PUBLISH_REPOSITORY.id);
   assert.equal(q.repositoryFullName,'ginosega/fishing');
   return blob;
  },
  ...overrides,
 });

test('WP3-BLOB01 ticket and original Git blob are independently matched',async()=>{
 const x=await setup(),r=await inspect(x);
 assert.equal(r.verified,true);
 assert.equal(r.canPublish,false);
 assert.equal(r.isLive,false);
 assert.equal(r.fileCount,1);
 assert.equal(r.files[0].blobSha,x.ticket.blobSha);
 assert.equal(r.files[0].sha256,x.ticket.sha256);
 assert.equal(r.requiresAtomicTree,true);
});

test('WP3-BLOB02 cross-operation and source digest ticket replay denied',async()=>{
 const x=await setup();
 for(const field of ['operationId','repositoryId','ownerGitHubId',
  'sourceRevision','snapshotSha256']){
  const t={...x.ticket,[field]:field==='repositoryId'?0:'wrong'};
  await error(inspect({...x,ticket:t}),'TICKET_NOT_BOUND');
 }
 const wrong={...x,op:{...x.op,ownerGitHubId:1}};
 await error(inspect(wrong),'UNTRUSTED_OPERATION');
});

test('WP3-BLOB03 verified ticket is not proof of actual blob bytes',async()=>{
 const x=await setup();
 await error(inspect({...x,blob:{...x.blob,sha:'c'.repeat(40)}}),
  'BLOB_UNVERIFIED');
 const altered=Uint8Array.from(png);altered[12]^=1;
 await error(inspect({...x,blob:{...x.blob,
  content:Buffer.from(altered).toString('base64')}}),
  'BLOB_DIGEST_MISMATCH');
 await error(inspect({...x,blob:{...x.blob,size:999}}),
  'BLOB_UNVERIFIED');
 await error(inspect({...x,blob:{...x.blob,content:'$notbase64'}}),
  'BLOB_UNVERIFIED');
});

test('WP3-BLOB04 missing, forged or failed ticket/ref proof denied',async()=>{
 const x=await setup();
 await error(inspect(x,{media:[]}), 'INVALID_MEDIA_REQUEST');
 await error(inspect({...x,ticket:{...x.ticket,path:'Catches/assets/other/notes/photo.png'}}),
  'MEDIA_TICKET_MISMATCH');
 await error(inspect({...x,ticket:{...x.ticket,sha256:'0'.repeat(64)}}),
  'MEDIA_TICKET_MISMATCH');
 await error(inspect(x,{verifyTicket:async()=>{throw Error('expired')}}),
  'TICKET_UNVERIFIED');
 await error(inspect(x,{readGitBlob:async()=>{throw Error('timeout')}}),
  'BLOB_READ_UNKNOWN');
});

test('WP3-BLOB05 no extra or duplicate staged image claims are allowed',async()=>{
 const x=await setup();
 await error(inspect(x,{media:[x.ticket,x.ticket]}),
  'INVALID_MEDIA_REQUEST');
 const notExpected={...x.ticket,path:'Catches/assets/other/notes/photo.png'};
 await error(inspect(x,{media:[notExpected]}),'MEDIA_TICKET_MISMATCH');
});
