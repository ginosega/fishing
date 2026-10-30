import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD4GitBlobStage,D4StageError}
 from '../src/d4-git-blob-stage.mjs';

const ORIGIN='https://fishing.example',ID=1430581407,OWNER=265665562;
const SECRET='D4-sandbox-source-test-secret-key-at-least-32-bytes';
const BYTES=new Uint8Array([255,216,255,224,1,2,3,4,5,6]);
const PATH='Gear/Lures/assets/synthetic.jpg';
const sha=bytes=>createHash('sha1').update(
 Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const blob=sha(BYTES);
function setup({enabled=true,authorized=true,clock=1800000000,
 ghStatus=201,ghSha=blob}={}){
 let requests=0,grants=0,auths=0;
 const service=createD4GitBlobStage({
  origin:ORIGIN,secret:SECRET,
  enabled:()=>enabled,now:()=>clock,
  session:{authorizeMedia:async()=>{auths++;return authorized?
   {authorized:true,ownerGitHubId:OWNER}:null;}},
  issueWriteToken:async()=>{grants++;return {
   repositoryId:ID,permissions:{contents:'write',pull_requests:'write'},
   token:'synthetic-only-test-token',
  };},
  requestGitHub:async(url,opts)=>{
   requests++;
   assert.equal(url,'https://api.github.com/repos/ginosega/fishing-p3-sandbox/git/blobs');
   assert.equal(opts.method,'POST');
   assert.equal(opts.redirect,'manual');
   const data=JSON.parse(opts.body);
   assert.deepEqual(Buffer.from(data.content,'base64'),Buffer.from(BYTES));
   assert.equal(opts.headers.Authorization,'Bearer synthetic-only-test-token');
   return {ok:ghStatus===201,status:ghStatus,redirected:false,
    json:async()=>({sha:ghSha})};
  },
 });
 return {service,get requests(){return requests;},
  get grants(){return grants;},get auths(){return auths;}};
}
const req=(path=PATH,body=BYTES,contentType='image/jpeg')=>new Request(
 ORIGIN+'/api/v3/media',{method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media','X-Fish-D4-Path':encodeURIComponent(path),
  'Content-Type':contentType,
 },body});
test('D4-ST01 real original bytes stage to GitHub blob, signed proof verifies',async()=>{
 const x=setup(),response=await x.service.handle(req());
 assert.equal(response.status,201);
 const body=await response.json();
 assert.equal(body.staged,true);
 assert.equal(body.ticket.blobSha,blob);
 assert.equal(body.ticket.path,PATH);
 assert.equal(body.ticket.expiresAt,1800000000+4*60*60);
 const verified=await x.service.verifyTicket(body.ticket);
 assert.equal(verified.blobSha,blob);
 assert.equal(verified.bytes,BYTES.length);
 assert.equal(x.requests,1);
 assert.equal(x.grants,1);
});
test('D4-ST02 default hard-off and anonymous user never issue a write grant',async()=>{
 for(const settings of [{enabled:false},{authorized:false}]){
  const x=setup(settings),res=await x.service.handle(req());
  assert.notEqual(res.status,201);
  assert.equal(x.requests,0);
  assert.equal(x.grants,0);
 }
});
test('D4-ST03 wrong file magic, forged path and GitHub blob mismatch fail closed',async()=>{
 const x=setup();
 for(const item of [
  req('Gear/Lures/assets/Original.png'),
  req('Catches/assets/Forbidden.jpg'),
  req('Gear/Lures/assets/../Bad.jpg'),
  req(PATH,BYTES,'image/png'),
 ]){
  const res=await x.service.handle(item);
  assert.notEqual(res.status,201);
 }
 assert.equal(x.requests,0);
 const incorrect=setup({ghSha:'0'.repeat(40)});
 const result=await incorrect.service.handle(req());
 assert.equal(result.status,503);
 assert.equal((await result.json()).ok,false);
});
test('D4-ST04 receipt tampering, unknown MIME and expiry cannot bypass MAC',async()=>{
 const x=setup(),res=await x.service.handle(req());
 const valid=(await res.json()).ticket;
 for(const changed of [
  {...valid,bytes:valid.bytes+1},
  {...valid,path:'Gear/Lures/assets/Other.jpg'},
  {...valid,blobSha:'c'.repeat(40)},
  {...valid,signature:'a'.repeat(43)},
  {...valid,unknown:'hidden'},
 ]){
  await assert.rejects(x.service.verifyTicket(changed),
   e=>e instanceof D4StageError);
 }
 const future=setup({clock:valid.expiresAt});
 await assert.rejects(future.service.verifyTicket(valid),
  e=>e instanceof D4StageError&&e.code==='EXPIRED_TICKET');
 assert.equal((await future.service.verifyTicket(valid,{allowExpired:true})).bytes,
  BYTES.length);
});
test('D4-ST05 size cap rejects original image before GitHub token',async()=>{
 const x=setup();
 const big=new Uint8Array(10*1024*1024+1);
 big.set(BYTES);
 const res=await x.service.handle(req(PATH,big));
 assert.equal(res.status,413);
 assert.equal(x.requests,0);
 assert.equal(x.grants,0);
});
