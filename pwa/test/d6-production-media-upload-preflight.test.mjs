import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaUploadPreflight,D6MediaPreflightError}
 from '../../experiments/p3/preview/src/d6-production-media-upload-preflight.mjs';

const origin=D6_PUBLISH_INTAKE_ORIGIN,operationId='123e4567-e89b-42d3-a456-426614174000';
const revision='a'.repeat(40),snapshotSha256='b'.repeat(64);
const path='Catches/assets/catch-example/notes/photo.png';
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const operation=()=>({
 operationId,ownerGitHubId:D6_PUBLISH_REPOSITORY.ownerGitHubId,
 repositoryId:D6_PUBLISH_REPOSITORY.id,ref:D6_PUBLISH_REPOSITORY.ref,
 state:'Accepted',domain:'catches',recordId:'catch-example',
 sourceRevision:revision,snapshotSha256,
});
const fixture=async()=>{
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:'catch-example',record:{id:'catch-example',date:'2026-11-12'},
  text:'![Photo](../assets/catch-example/notes/photo.png)',
  sourceRevision:revision,notesImages:[{path,bytes:png.length,
   sha256:await sha256(png)}]});
 const op=operation();
 return {pkg,op};
};
function request({
 bytes=png,mediaPath=path,id=operationId,type='image/png',extra={},
}={}){
 const headers={'Origin':origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-CSRF':'fake-but-injected-session-validates-it',
  'X-Fish-V3-Operation':id,'X-Fish-V3-Media-Path':
    encodeURIComponent(mediaPath),
  'Content-Type':type,...extra};
 return new Request(origin+'/api/v3/media',{method:'POST',
  headers,body:bytes});
}
function setup({enabled=true,authenticated=true,stored}={}){
 let authCalls=0,loadCalls=0;
 const session={authorizeMedia:async req=>{
  authCalls++;
  assert.equal(req.headers.get('X-Fish-V3-Intent'),'stage-media');
  if(!authenticated)throw Error('unauthorized');
  return {authorized:true,ownerGitHubId:D6_PUBLISH_REPOSITORY.ownerGitHubId};
 }};
 const impl=createD6ProductionMediaUploadPreflight({
  session,loadAcceptedOperation:async()=>{
   loadCalls++;return stored;
  },enabled:()=>enabled});
 return {impl,calls:()=>({authCalls,loadCalls})};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6MediaPreflightError&&e.code===code);

test('WP3-STAGE01 accepted owner original-byte preflight never publishes',async()=>{
 const stored=await fixture(),s=setup({stored});
 const result=await s.impl.preflight(request());
 assert.equal(result.verifiedOriginal,true);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.path,path);
 assert.equal(result.bytes,png.length);
 assert.equal(result.sha256,await sha256(png));
 assert.deepEqual(result.originalBytes,png);
 assert.equal(result.requiresDurableWriteFence,true);
 assert.deepEqual(s.calls(),{authCalls:1,loadCalls:1});
});

test('WP3-STAGE02 disabled and unauthenticated paths never access source',async()=>{
 const stored=await fixture();
 const off=setup({stored,enabled:false});
 await denied(off.impl.preflight(request()),'DISABLED');
 assert.deepEqual(off.calls(),{authCalls:0,loadCalls:0});
 const no=setup({stored,authenticated:false});
 await denied(no.impl.preflight(request()),'OWNER_DENIED');
 assert.deepEqual(no.calls(),{authCalls:1,loadCalls:0});
});

test('WP3-STAGE03 mismatched operation and foreign record fail before read',async()=>{
 const stored=await fixture(),s=setup({stored});
 await denied(s.impl.preflight(request({id:'123e4567-e89b-42d3-a456-426614174001'})),
  'UNTRUSTED_OPERATION');
 await denied(s.impl.preflight(request({mediaPath:
  'Catches/assets/different/notes/photo.png'})),
  'UNEXPECTED_MEDIA_PATH');
 const foreign=setup({stored:{...stored,op:{...stored.op,
  ownerGitHubId:3}}});
 await denied(foreign.impl.preflight(request()),'UNTRUSTED_OPERATION');
});

test('WP3-STAGE04 MIME and original SHA-256 cannot be forged',async()=>{
 const stored=await fixture(),s=setup({stored});
 await denied(s.impl.preflight(request({type:'image/jpeg'})),
  'MEDIA_TYPE_MISMATCH');
 const modified=Uint8Array.from(png);modified[modified.length-3]^=1;
 await denied(s.impl.preflight(request({bytes:modified})),
  'MEDIA_DIGEST_MISMATCH');
 const altered=new Uint8Array(png.length);
 await denied(s.impl.preflight(request({bytes:altered})),
  'MEDIA_SIGNATURE_MISMATCH');
});

test('WP3-STAGE05 oversized, truncated or streaming length mismatch denied',async()=>{
 const stored=await fixture(),s=setup({stored});
 const small=png.slice(0,-1);
 await denied(s.impl.preflight(request({bytes:small})),
  'MEDIA_LENGTH_MISMATCH');
 const tooMany=new Uint8Array(png.length+1);tooMany.set(png);
 await denied(s.impl.preflight(request({bytes:tooMany})),
  'MEDIA_LENGTH_MISMATCH');
 await denied(s.impl.preflight(request({extra:{'Content-Length':
  String(10*1024*1024+1)}})),'MEDIA_TOO_LARGE');
});

test('WP3-STAGE06 missing operation, invalid path and callback failures denied',async()=>{
 const stored=await fixture(),s=setup({stored});
 await denied(s.impl.preflight(request({id:'not-uuid'})),
  'INVALID_OPERATION_ID');
 await denied(s.impl.preflight(request({mediaPath:'../path.png'})),
  'UNEXPECTED_MEDIA_PATH');
 const bad=setup({stored:null});
 await denied(bad.impl.preflight(request()),'OPERATION_UNAVAILABLE');
 const noAck=setup({stored:{...stored,op:{...stored.op,
  state:'Unknown'}}});
 await denied(noAck.impl.preflight(request()),'UNTRUSTED_OPERATION');
});
