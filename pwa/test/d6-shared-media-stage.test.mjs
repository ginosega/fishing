import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';
import {validateD6MediaPath,validateD6MediaBytes,
 createD6SharedMediaStage,D6_MEDIA_LIMIT_BYTES,validateD6GifFrameStructure}
 from '../server/d6-shared-media-stage.mjs';
import {D6_MEDIA_SCHEMA_SQL} from '../tools/d6-media-schema.mjs';

const origin='https://fishing-d6-wp2-test.ginosega.workers.dev';
const uri=origin+'/api/v3/media/stage',cookie='__Host-fish_p0_session='+'A'.repeat(43);
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+i1ZkAAAAASUVORK5CYII=','base64'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const path=domain=>domain==='gear'?
 'Gear/Lures/assets/lure-owner-01/notes/test.png':
 domain==='kb'?
 'KB/Species/assets/species-owner-01/notes/test.png':
 'Catches/assets/catch-owner-01/notes/test.png';
const category=domain=>domain==='gear'?'lures':domain==='kb'?'species':'';
const id=domain=>domain==='gear'?'lure-owner-01':
 domain==='kb'?'species-owner-01':'catch-owner-01';
function fixture(){
 let writes=0;
 const objects=new Map();
 const R2={
  async put(key,bytes,options){
   if(objects.has(key))return null;
   assert.deepEqual(options.onlyIf,{etagDoesNotMatch:'*'});
   assert.equal(options.sha256,digest(bytes));
   const stored={key,size:bytes.length,
    httpMetadata:options.httpMetadata,
    customMetadata:options.customMetadata};
   objects.set(key,stored);writes++;
   return stored;
  },
  async head(key){return objects.get(key)??null;},
 };
 const AUTH_DB={prepare(){
  return {bind:()=>({first:async()=>({
   github_id:265665562,expires_at:1003600,
  })})};
 }};
 const options={origin,AUTH_DB,R2,csrfKey:'S'.repeat(64),
  now:()=>1000000};
 const session=createD2UnifiedOwnerSession({
  AUTH_DB,ownerGitHubId:265665562,origin,csrfKey:options.csrfKey,
  now:options.now,
 });
 const header=(domain,csrf,withCookie=true)=>({
  Origin:origin,'Sec-Fetch-Site':'same-origin',
  ...(withCookie?{Cookie:cookie}:{}),
  'Content-Type':'image/png','X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-CSRF':csrf,
  'X-Fish-V3-Media-Domain':domain,
  'X-Fish-V3-Media-Record':id(domain),
  'X-Fish-V3-Media-Category':category(domain),
  'X-Fish-V3-Media-Path':path(domain),
  'X-Fish-V3-SHA256':digest(png),
 });
 async function token(){
  const proof=await session.describe(new Request(uri,{
   headers:{'Sec-Fetch-Site':'same-origin',Cookie:cookie},
  }));
  assert.equal(proof.authorized,true);
  return proof.csrfToken;
 }
 return {options,session,R2,objects,token,header,writes:()=>writes};
}
test('V3-MEDIA-STAGE01 disabled by default, no R2 calls or live routes',async()=>{
 const f=fixture();
 const media=createD6SharedMediaStage(f.options);
 const result=await media.handle(new Request(uri,{method:'POST',body:png,
  headers:f.header('gear','A'.repeat(43))}));
 assert.equal(result.status,503);
 assert.equal(f.writes(),0);
 assert.equal((await media.handle(new Request(origin+'/api/v3/media/anything'))).status,404);
});
test('V3-MEDIA-STAGE02 shared path contract allows Gear, KB, Catches Notes only',()=>{
 for(const domain of ['gear','kb','catches']){
  const record={id:id(domain),category:category(domain),
   type:category(domain)};
  assert.equal(validateD6MediaPath({domain,record,
   logicalPath:path(domain)}).mime,'image/png');
  assert.throws(()=>validateD6MediaPath({domain,record,
   logicalPath:'Other/'+path(domain)}),/MEDIA_INVALID/);
  assert.throws(()=>validateD6MediaPath({domain,record,
   logicalPath:path(domain).replace('test.png','../../etc.png')}));
 }
});
test('V3-MEDIA-STAGE03 signed owner can stage immutable object, repeat is idempotent',async()=>{
 const f=fixture(),token=await f.token();
 const stage=createD6SharedMediaStage({...f.options,enabled:()=>true});
 for(const domain of ['gear','kb','catches']){
  const request=new Request(uri,{method:'POST',headers:f.header(domain,token),
   body:png});
  const response=await stage.handle(request);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.published,false);
  assert.equal(result.logicalPath,path(domain));
  assert.equal(result.sha256,digest(png));
  assert.match(result.storageKey,/^staged\/v1\/sha256\/[a-f0-9]{64}$/);
 }
 // Same bytes across domains map to the same content-addressed R2 object.
 assert.equal(f.writes(),1);
 assert.equal(f.objects.size,1);
});
test('V3-MEDIA-STAGE04 auth and CSRF denials cannot write R2',async()=>{
 const f=fixture(),token=await f.token();
 const stage=createD6SharedMediaStage({...f.options,enabled:()=>true});
 for(const headers of [
  {...f.header('gear',token),Cookie:undefined},
  {...f.header('gear',token),'Sec-Fetch-Site':'cross-site'},
  {...f.header('gear','A'.repeat(43))},
  {...f.header('gear',token),'X-Fish-V3-Intent':'save-gear'},
  {...f.header('gear',token),Origin:'https://other.invalid'},
 ]){
  const h=new Headers(headers);h.delete('Cookie'); // independently set cookie when present
  if(headers.Cookie)h.set('Cookie',headers.Cookie);
  const res=await stage.handle(new Request(uri,{method:'POST',headers:h,body:png}));
  assert.equal(res.status,403);
 }
 assert.equal(f.writes(),0);
});
test('V3-MEDIA-STAGE05 rejects invalid content, paths and exaggerated size',async()=>{
 const f=fixture(),token=await f.token();
 const stage=createD6SharedMediaStage({...f.options,enabled:()=>true});
 const attempts=[
  [{'X-Fish-V3-SHA256':'0'.repeat(64)},400],
  [{'Content-Type':'image/svg+xml'},403],
  [{'Content-Type':'image/jpeg'},400],
  [{'X-Fish-V3-Media-Path':'Catches/elsewhere/evil.png'},400],
 ];
 for(const [change,expected] of attempts){
  const res=await stage.handle(new Request(uri,{method:'POST',
   headers:{...f.header('catches',token),...change},body:png}));
  assert.equal(res.status,expected);
 }
 assert.equal(f.writes(),0);
 assert.equal(D6_MEDIA_LIMIT_BYTES,10485760);
 await assert.rejects(validateD6MediaBytes({bytes:new Uint8Array(0),
  contentType:'image/png',expectedSha256:digest(png)}),/size/);
});
test('V3-MEDIA-STAGE06 proposed D1 media tables are source-only',()=>{
 assert.match(D6_MEDIA_SCHEMA_SQL,/CREATE TABLE IF NOT EXISTS d6_media_objects/);
 assert.match(D6_MEDIA_SCHEMA_SQL,/CREATE TABLE IF NOT EXISTS d6_media_refs/);
 assert.match(D6_MEDIA_SCHEMA_SQL,/FOREIGN KEY|REFERENCES d6_media_objects/);
 assert.doesNotMatch(D6_MEDIA_SCHEMA_SQL,/\b(?:UPDATE|DELETE|DROP|REPLACE)\s+d6_/i);
});

/** Structural GIF fixture: each frame uses a bounded 1x1 image block. */
function gifFixture(frames,{width=1,height=1}={}){
 const b=[71,73,70,56,57,97,width&255,width>>8,
  height&255,height>>8,0x80,0,0,0,0,0,255,255,255];
 for(let i=0;i<frames;i++)b.push(
  0x2c,0,0,0,0,1,0,1,0,0,2,2,0x4c,1,0);
 b.push(0x3b);
 return Uint8Array.from(b);
}
test('V3-M02 GIF upload boundary enforces frame and decode budgets',async()=>{
 const ordinary=gifFixture(2);
 assert.equal(validateD6GifFrameStructure(ordinary,1,1),2);
 assert.equal((await validateD6MediaBytes({bytes:ordinary,
  contentType:'image/gif',expectedSha256:digest(ordinary)})).width,1);
 const maximum=gifFixture(512);
 assert.equal(validateD6GifFrameStructure(maximum,1,1),512);
 const tooMany=gifFixture(513);
 await assert.rejects(validateD6MediaBytes({bytes:tooMany,
  contentType:'image/gif',expectedSha256:digest(tooMany)}),
  /GIF animation decode budget/);
 // Even small frames would overrun the browser's full canvas decode budget.
 const largeCanvas=gifFixture(15,{width:6000,height:6000});
 await assert.rejects(validateD6MediaBytes({bytes:largeCanvas,
  contentType:'image/gif',expectedSha256:digest(largeCanvas)}),
  /GIF animation decode budget/);
});
test('V3-M02 malformed GIF subblocks and incomplete frames fail closed',async()=>{
 const missingBlockEnd=gifFixture(1);
 missingBlockEnd[missingBlockEnd.length-2]=2;
 const noFrame=gifFixture(0);
 const invalidDescriptor=gifFixture(1);
 // Image width is zero, despite a nonzero logical screen.
 invalidDescriptor[24]=0;
 for(const candidate of [missingBlockEnd,noFrame,invalidDescriptor]){
  await assert.rejects(validateD6MediaBytes({bytes:candidate,
   contentType:'image/gif',expectedSha256:digest(candidate)}),
   /GIF/);
 }
});
