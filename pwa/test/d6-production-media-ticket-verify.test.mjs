import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,createHash} from 'node:crypto';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_INTAKE_ORIGIN,D6_PUBLISH_REPOSITORY}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaTicketVerifier,D6MediaTicketError}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';
import {verifyD6CanonicalStagedGitBlobs}
 from '../../experiments/p3/preview/src/d6-production-media-blob-proof.mjs';

const now=1794528000; // fixed test clock
const origin=D6_PUBLISH_INTAKE_ORIGIN,secret='t'.repeat(48);
const fields=['version','operationId','repositoryId','ownerGitHubId',
 'ref','sourceRevision','snapshotSha256','path','blobSha','sha256',
 'bytes','mime','issuedAt','expiresAt'];
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const hashGit=bytes=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),Buffer.from(bytes)])).digest('hex');
const sign=(ticket,{key=secret,atOrigin=origin}={})=>createHmac('sha256',key)
 .update(JSON.stringify([atOrigin,...fields.map(field=>ticket[field])]))
 .digest('base64url');
const signed=(ticket,options)=>({...ticket,signature:sign(ticket,options)});
const operation=()=>({
 operationId:'123e4567-e89b-42d3-a456-426614174000',
 repositoryId:D6_PUBLISH_REPOSITORY.id,
 ownerGitHubId:D6_PUBLISH_REPOSITORY.ownerGitHubId,
 ref:D6_PUBLISH_REPOSITORY.ref,sourceRevision:'a'.repeat(40),
 snapshotSha256:'b'.repeat(64),state:'Accepted',
 domain:'catches',recordId:'catch-example',
});
const fixture=async()=>{
 const op=operation(),path='Catches/assets/catch-example/notes/photo.png';
 const ticket=signed({
  version:'fish-v3-media-ticket-v1',operationId:op.operationId,
  repositoryId:op.repositoryId,ownerGitHubId:op.ownerGitHubId,
  ref:op.ref,sourceRevision:op.sourceRevision,
  snapshotSha256:op.snapshotSha256,path,blobSha:hashGit(png),
  sha256:await sha256(png),bytes:png.length,mime:'image/png',
  issuedAt:now-30,expiresAt:now+600,
 });
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:op.recordId,record:{id:op.recordId,date:'2026-11-12'},
  sourceRevision:op.sourceRevision,
  text:'![Fish](../assets/catch-example/notes/photo.png)',
  notesImages:[{path,bytes:png.length,sha256:ticket.sha256}],
 });
 const blob={sha:ticket.blobSha,encoding:'base64',size:png.length,
  content:Buffer.from(png).toString('base64')};
 return {ticket,pkg,op,blob};
};
const verifier=(options={})=>createD6ProductionMediaTicketVerifier({
 origin,secret,now:()=>now,...options,
}).verifyTicket;
const fails=(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6MediaTicketError&&e.code===code);

test('WP3-TICKET01 valid signed media ticket passes exact-claim HMAC verification',async()=>{
 const {ticket,op}=await fixture();
 const proof=await verifier()(ticket,{operation:op,allowExpired:false});
 assert.equal(proof.path,ticket.path);
 assert.equal(proof.blobSha,ticket.blobSha);
 assert.equal(proof.operationId,op.operationId);
 assert.equal(proof.signature,undefined);
 assert.equal(Object.isFrozen(proof),true);
});

test('WP3-TICKET02 altered claims and forged signatures cannot pass',async()=>{
 const {ticket,op}=await fixture();
 for(const field of ['path','sha256','blobSha','bytes','mime','expiresAt',
  'operationId','snapshotSha256','sourceRevision']){
  const altered={...ticket,[field]:field==='bytes'?ticket.bytes+1:
   field==='expiresAt'?ticket.expiresAt-1:
   field==='operationId'?'123e4567-e89b-42d3-a456-426614174001':
   field==='sha256'?'0'.repeat(64):
   field==='blobSha'?'0'.repeat(40):
   field==='sourceRevision'?'0'.repeat(40):
   field==='snapshotSha256'?'0'.repeat(64):
   field==='mime'?'image/jpeg':
   'Catches/assets/catch-example/notes/different.png'};
  await assert.rejects(verifier()(altered,{operation:op}));
 }
 await fails(verifier()(signed({...ticket,signature:undefined},
  {key:'another-key-material-xxxxxxxxxxxxxxxxxxxxxxxx'}),{operation:op}),
  'SIGNATURE_UNVERIFIED');
});

test('WP3-TICKET03 expired, excessive lifetime and future-issued are denied',async()=>{
 const {ticket,op}=await fixture();
 await fails(verifier()(signed({...ticket,expiresAt:now}),{operation:op}),
  'EXPIRED_TICKET');
 await fails(verifier()(signed({...ticket,expiresAt:ticket.issuedAt+14401}),
  {operation:op}),'INVALID_TICKET');
 await fails(verifier()(signed({...ticket,issuedAt:now+120,
  expiresAt:now+500}),{operation:op}),'EXPIRED_TICKET');
 await fails(verifier()(ticket,{operation:op,allowExpired:true}),
  'UNSAFE_EXPIRED_READ');
});

test('WP3-TICKET04 origin, owner, record and extra-field boundaries',async()=>{
 const {ticket,op}=await fixture();
 await fails(verifier()(signed(ticket,{atOrigin:'https://elsewhere.invalid'}),
  {operation:op}),'SIGNATURE_UNVERIFIED');
 await fails(verifier()(ticket,{operation:{...op,
  operationId:'123e4567-e89b-42d3-a456-426614174001'}}),
  'TICKET_NOT_BOUND');
 await fails(verifier()(ticket,{operation:{...op,ownerGitHubId:3}}),
  'UNTRUSTED_OPERATION');
 await fails(verifier()(ticket,{operation:{...op,recordId:'other'}}),
  'UNSAFE_MEDIA_PATH');
 await fails(verifier()({...ticket,unapproved:true},{operation:op}),
  'INVALID_TICKET');
 await assert.rejects(async()=>createD6ProductionMediaTicketVerifier({
  origin:'https://elsewhere.invalid',secret}),e=>
   e instanceof D6MediaTicketError&&e.code==='INVALID_CONFIG');
});

test('WP3-TICKET05 fully signed original ticket works with independent Git readback',async()=>{
 const {ticket,pkg,op,blob}=await fixture();
 const result=await verifyD6CanonicalStagedGitBlobs({
  package:pkg,operation:op,media:[ticket],
  verifyTicket:verifier(),readGitBlob:async(q)=>{
   assert.equal(q.repositoryId,D6_PUBLISH_REPOSITORY.id);
   assert.equal(q.blobSha,ticket.blobSha);
   return blob;
  },
 });
 assert.equal(result.verified,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.isLive,false);
 assert.equal(result.files.length,1);
 const forged={...ticket,signature:ticket.signature.slice(0,-1)+
  (ticket.signature.at(-1)==='A'?'B':'A')};
 await assert.rejects(verifyD6CanonicalStagedGitBlobs({
  package:pkg,operation:op,media:[forged],
  verifyTicket:verifier(),readGitBlob:async()=>blob,
 }));
});
