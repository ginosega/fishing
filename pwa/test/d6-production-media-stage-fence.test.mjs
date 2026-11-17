import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256} from '../src/shared.mjs';
import {prepareChange} from '../src/handoff.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaUploadPreflight}
 from '../../experiments/p3/preview/src/d6-production-media-upload-preflight.mjs';
import {createD6ProductionMediaStageFence,D6MediaStageFenceError}
 from '../../experiments/p3/preview/src/d6-production-media-stage-fence.mjs';
import {D6_PROVIDER_STEP_SQL}
 from '../../experiments/p3/preview/src/d6-production-github-step-writer.mjs';

const REPO=D6_PUBLISH_REPOSITORY,origin=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),SNAPSHOT='b'.repeat(64);
const PATH='Catches/assets/catch-example/notes/photo.png';
const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const gitSha=bytes=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),Buffer.from(bytes)])).digest('hex');
const info=async()=>{
 const pkg=await prepareChange({domain:'catches',operation:'add',
  id:'catch-example',record:{id:'catch-example',date:'2026-11-12'},
  sourceRevision:MAIN,text:'![Fish](../assets/catch-example/notes/photo.png)',
  notesImages:[{path:PATH,bytes:png.length,sha256:await sha256(png)}]});
 const op={operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,state:'Accepted',domain:'catches',
  recordId:'catch-example',sourceRevision:MAIN,snapshotSha256:SNAPSHOT};
 return {operation:op,package:pkg};
};
const upload=(bytes=png)=>new Request(origin+'/api/v3/media',{
 method:'POST',headers:{
  'Origin':origin,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'stage-media',
  'X-Fish-V3-CSRF':'test-only-csrf-placeholder',
  'X-Fish-V3-Operation':ID,
  'X-Fish-V3-Media-Path':encodeURIComponent(PATH),
  'Content-Type':'image/png',
 },body:bytes,
});
function memoryD1({lostAck=false,unavailable=false}={}){
 const rows=[],stats={reads:0,writes:0};let lose=lostAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('missing schema');
  return {bind(...args){return {
   async first(){
    stats.reads++;assert(sql.startsWith('SELECT '));
    const [id,key]=args;
    return rows.find(x=>x.operation_id===id&&x.step_key===key)??null;
   },
   async run(){
    stats.writes++;assert(sql.startsWith('INSERT OR IGNORE '));
    const [id,key,owner,repo,digest,at]=args;
    const existing=rows.find(x=>x.operation_id===id&&x.step_key===key);
    if(!existing)rows.push({operation_id:id,step_key:key,
     owner_github_id:owner,repository_id:repo,
     request_sha256:digest,state:'Unknown',created_at:at});
    if(lose){lose=false;throw Error('lost D1 ack');}
    return {meta:{changes:existing?0:1}};
   },
  };}};}};return {DB,rows,stats};
}
async function setup({
 enabled=true,authenticated=true,db=memoryD1(),tokenOk=true,
 networkFail=false,revoke='',precondition=true,
}={}){
 const stored=await info();
 const state={enabled,network:[],token:[],preconditions:[],
  ownerChecks:0,loads:0};
 const session={authorizeMedia:async()=>{
  state.ownerChecks++;
  if(!authenticated)throw Error('owner denied');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const preflight=createD6ProductionMediaUploadPreflight({
  session,loadAcceptedOperation:async()=>{
   state.loads++;return stored;
  },enabled:()=>state.enabled});
 const writer=createD6ProductionMediaStageFence({
  DB:db.DB,preflight,enabled:()=>state.enabled,
  now:()=>1800000000,
  verifyPrerequisite:async args=>{
   state.preconditions.push(args);
   if(revoke==='precondition')state.enabled=false;
   if(precondition===false||
    (precondition==='first-only'&&state.preconditions.length>1))
    return {verified:false};
   return {verified:true,operationId:args.operationId,
    repositoryId:args.repositoryId,ownerGitHubId:args.ownerGitHubId,
    requestSha256:args.requestSha256,
    expectedBlobSha:args.expectedBlobSha};
  },
  issueWriteToken:async args=>{
   state.token.push(args);
   if(revoke==='token')state.enabled=false;
   return tokenOk?{repositoryId:REPO.id,
    permissions:{contents:'write'},
    token:'TEST-ONLY-DO-NOT-USE-123456789'}:
    {repositoryId:REPO.id,permissions:{contents:'read'},
     token:'bad'};
  },
  request:async(url,options)=>{
   state.network.push({url,options});
   if(networkFail)throw Error('GitHub lost response');
   return new Response(JSON.stringify({sha:gitSha(png)}),
    {status:201,headers:{'Content-Type':'application/json'}});
  },
 });
 return {writer,db,state,stored};
}
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6MediaStageFenceError&&e.code===code);

test('WP3-FENCE01 default OFF never reads source, D1 or provider',async()=>{
 const x=await setup({enabled:false});
 await denied(x.writer.attempt(upload()),'DISABLED');
 assert.deepEqual(x.db.stats,{reads:0,writes:0});
 assert.equal(x.state.ownerChecks,0);assert.equal(x.state.loads,0);
 assert.equal(x.state.token.length,0);
 assert.equal(x.state.network.length,0);
 assert.match(D6_PROVIDER_STEP_SQL,/PRIMARY KEY\(operation_id,step_key\)/);
});

test('WP3-FENCE02 one exact original Git blob POST is fenced before request',async()=>{
 const x=await setup();
 const outcome=await x.writer.attempt(upload());
 assert.equal(outcome.state,'Unknown');
 assert.equal(outcome.canPublish,false);assert.equal(outcome.isLive,false);
 assert.equal(outcome.attemptedNow,true);
 assert.equal(outcome.expectedBlobSha,gitSha(png));
 assert.equal(outcome.stepKey,'media:'+PATH);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.db.rows[0].state,'Unknown');
 assert.equal(x.db.rows[0].request_sha256,outcome.requestSha256);
 assert.equal(x.state.preconditions.length,2);
 assert.deepEqual(x.state.token[0],{
  repositoryId:REPO.id,permissions:{contents:'write'},
 });
 assert.equal(x.state.network.length,1);
 const {url,options}=x.state.network[0];
 assert.equal(url,'https://api.github.com/repos/ginosega/fishing/git/blobs');
 assert.equal(options.method,'POST');
 assert.equal(options.credentials,'omit');
 assert.equal(options.redirect,'manual');
 assert.deepEqual(JSON.parse(options.body),{
  encoding:'base64',content:Buffer.from(png).toString('base64'),
 });
 assert.match(options.headers.Authorization,/^Bearer TEST-ONLY/);
});

test('WP3-FENCE03 retry of same bytes cannot repeat a provider POST',async()=>{
 const x=await setup();
 await x.writer.attempt(upload());
 const retry=await x.writer.attempt(upload());
 assert.equal(retry.state,'Unknown');
 assert.equal(retry.attemptedNow,false);
 assert.equal(x.db.rows.length,1);assert.equal(x.db.stats.writes,1);
 assert.equal(x.state.network.length,1);
 assert.equal(x.state.token.length,1);
 assert.equal(x.state.ownerChecks,2); // no auth bypass on retry
});

test('WP3-FENCE04 timeout/HTTP responses never become staged or Live',async()=>{
 const x=await setup({networkFail:true});
 assert.equal((await x.writer.attempt(upload())).state,'Unknown');
 assert.equal((await x.writer.attempt(upload())).attemptedNow,false);
 assert.equal(x.state.network.length,1);
 assert.equal(x.state.token.length,1);
});

test('WP3-FENCE05 lost D1 write acknowledgment cannot trigger a POST',async()=>{
 const db=memoryD1({lostAck:true}),x=await setup({db});
 await denied(x.writer.attempt(upload()),'STORE_UNAVAILABLE');
 assert.equal(db.rows.length,1);
 assert.equal(x.state.network.length,0);
 const retry=await x.writer.attempt(upload());
 assert.equal(retry.state,'Unknown');
 assert.equal(retry.attemptedNow,false);
 assert.equal(x.state.network.length,0);
 assert.equal(x.state.token.length,0);
});

test('WP3-FENCE06 concurrent identical submissions can post at most once',async()=>{
 const x=await setup();
 const results=await Promise.all([x.writer.attempt(upload()),
  x.writer.attempt(upload())]);
 assert.deepEqual(results.map(x=>x.state),['Unknown','Unknown']);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.state.network.length,1);
 assert.equal(x.state.token.length,1);
});

test('WP3-FENCE07 denied owner and bad preflight never claim D1',async()=>{
 const no=await setup({authenticated:false});
 await assert.rejects(no.writer.attempt(upload()));
 assert.deepEqual(no.db.stats,{reads:0,writes:0});
 assert.equal(no.state.token.length,0);
 const x=await setup();
 const corrupted=Uint8Array.from(png);corrupted[15]^=1;
 await assert.rejects(x.writer.attempt(upload(corrupted)));
 assert.deepEqual(x.db.stats,{reads:0,writes:0});
 assert.equal(x.state.network.length,0);
});

test('WP3-FENCE08 stale prerequisites block POST and cannot replay claim',async()=>{
 const before=await setup({precondition:false});
 await denied(before.writer.attempt(upload()),'PRECONDITION_UNVERIFIED');
 assert.equal(before.db.rows.length,0);
 const after=await setup({precondition:'first-only'});
 await denied(after.writer.attempt(upload()),'PRECONDITION_UNVERIFIED');
 assert.equal(after.db.rows.length,1);
 assert.equal(after.state.network.length,0);
 const retry=await after.writer.attempt(upload());
 assert.equal(retry.state,'Unknown');
 assert.equal(after.state.network.length,0);
});

test('WP3-FENCE09 denied token/revoked activation leaves sticky Unknown',async()=>{
 const noScope=await setup({tokenOk:false});
 assert.equal((await noScope.writer.attempt(upload())).state,'Unknown');
 assert.equal(noScope.state.network.length,0);
 assert.equal((await noScope.writer.attempt(upload())).attemptedNow,false);
 const revoked=await setup({revoke:'token'});
 await denied(revoked.writer.attempt(upload()),'DISABLED');
 assert.equal(revoked.db.rows.length,1);
 assert.equal(revoked.state.network.length,0);
});

test('WP3-FENCE10 mismatched/damaged D1 row cannot authorize replay',async()=>{
 const x=await setup();
 await x.writer.attempt(upload());
 x.db.rows[0].request_sha256='f'.repeat(64);
 await denied(x.writer.attempt(upload()),'FENCE_MISMATCH');
 assert.equal(x.state.network.length,1);
 const notReady=await setup({db:memoryD1({unavailable:true})});
 await denied(notReady.writer.attempt(upload()),'STORE_UNAVAILABLE');
 assert.equal(notReady.state.network.length,0);
});
