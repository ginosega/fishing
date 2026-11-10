import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionGitHubStepWriter,D6ProviderStepError,
 D6_PROVIDER_STEP_SQL}
 from '../../experiments/p3/preview/src/d6-production-github-step-writer.mjs';

const OWNER=265665562,REPO=1350909744;
const ID='00000000-0000-4000-8000-000000000001';
const MAIN='a'.repeat(40),TREE='b'.repeat(40),COMMIT='c'.repeat(40);
const BLOB='d'.repeat(40),DIGEST='e'.repeat(64);
const PREFIX='https://api.github.com/repos/ginosega/fishing';
const BRANCH='fish-v3/publish/'+ID;
const SCOPE={contents:'write',pull_requests:'write'};
const op=()=>({operationId:ID,ownerGitHubId:OWNER,
 repositoryId:REPO,ref:'refs/heads/main',state:'Accepted',
 sourceRevision:MAIN,candidateSha256:DIGEST,domain:'gear',
 operation:'edit'});
const plans={
 branch:{},
 blob:{path:'Gear/Lures/content/Sample.md',content:'# Text'},
 tree:{baseTreeSha:TREE,entries:[
  {path:'Gear/gear.json',mode:'100644',type:'blob',sha:BLOB},
  {path:'Gear/Lures/content/Sample.md',
   mode:'100644',type:'blob',sha:BLOB},
 ]},
 commit:{treeSha:TREE},
 advance:{commitSha:COMMIT},
 pr:{},
};
const copy=v=>structuredClone(v);
function memoryD1({unavailable=false,lostAck=false}={}){
 const rows=[],stats={reads:0,writes:0};let shouldLose=lostAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('unapplied schema');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    assert(sql.startsWith('SELECT '));
    const [id,key]=args;
    return rows.find(r=>r.operation_id===id&&r.step_key===key)??null;
   },
   async run(){
    stats.writes++;
    assert(sql.startsWith('INSERT OR IGNORE '));
    const [id,key,owner,repo,digest,at]=args;
    const existing=rows.find(r=>r.operation_id===id&&r.step_key===key);
    if(!existing)rows.push({operation_id:id,step_key:key,
     owner_github_id:owner,repository_id:repo,
     request_sha256:digest,state:'Unknown',created_at:at});
    if(shouldLose){shouldLose=false;throw Error('D1 ack lost');}
    return {meta:{changes:existing?0:1}};
   },
  };}};
 }};
 return {DB,rows,stats};
}
function setup({db=memoryD1(),enabled=true,actor=op(),
 planPatch={},prerequisite=true,tokenOk=true,
 networkError=false,revokeAt='',at=1800000000}={}){
 const state={enabled,network:[],auth:[],planned:[],requirements:[],
  reads:0};
 const writer=createD6ProductionGitHubStepWriter({
  DB:db.DB,now:()=>at,enabled:()=>state.enabled,
  readOperation:async id=>{state.reads++;assert.equal(id,ID);return actor;},
  planStep:async({operationId,step})=>{
   state.planned.push(step);
   return {operationId,ownerGitHubId:OWNER,repositoryId:REPO,
    sourceRevision:MAIN,candidateSha256:DIGEST,step,
    sourceOnly:true,...copy(plans[step]),...copy(planPatch)};
  },
  verifyPrerequisite:async ctx=>{
   state.requirements.push(ctx);
   if(revokeAt==='prereq')state.enabled=false;
   return prerequisite?{repositoryId:REPO,operationId:ctx.operationId,
    step:ctx.step,requestSha256:ctx.requestSha256,verified:true}:
    {verified:false};
  },
  issueWriteToken:async args=>{
   state.auth.push(args);
   if(revokeAt==='token')state.enabled=false;
   return tokenOk?{repositoryId:REPO,permissions:SCOPE,
    token:'FAKE-TEST-TOKEN-NOT-REAL-1234567890'}:
    {repositoryId:REPO,permissions:{contents:'read'},token:'fake'};
  },
  request:async(url,options)=>{
   state.network.push({url,options});
   if(networkError)throw Error('GitHub write timed out');
   return new Response(JSON.stringify({sha:COMMIT}),{status:201,
    headers:{'Content-Type':'application/json'}});
  },
 });
 return {writer,db,state};
}
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6ProviderStepError&&e.code===code);

test('D6-GSTEP01 default OFF makes zero D1, signer or network calls',async()=>{
 const x=setup({enabled:false});
 await denied(x.writer.attempt(ID,'branch'),'DISABLED');
 await denied(x.writer.inspectFence(ID,'branch'),'DISABLED');
 assert.deepEqual(x.db.stats,{reads:0,writes:0});
 assert.equal(x.state.network.length,0);
 assert.equal(x.state.auth.length,0);
 assert.match(D6_PROVIDER_STEP_SQL,/PRIMARY KEY\(operation_id,step_key\)/);
 assert.match(D6_PROVIDER_STEP_SQL,/CHECK\(state='Unknown'\)/);
 assert.deepEqual(Object.keys(x.writer),['attempt','inspectFence']);
});

test('D6-GSTEP02 only trusted, fenced branch creation to exact repo',async()=>{
 const x=setup(),r=await x.writer.attempt(ID,'branch');
 assert.equal(r.state,'Unknown');
 assert.equal(r.attemptedNow,true);
 assert.equal(r.canMerge,false);assert.equal(r.isLive,false);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.state.network.length,1);
 const call=x.state.network[0];
 assert.equal(call.url,PREFIX+'/git/refs');
 assert.equal(call.options.method,'POST');
 assert.deepEqual(JSON.parse(call.options.body),{
  ref:'refs/heads/'+BRANCH,sha:MAIN,
 });
 assert.equal(call.options.redirect,'manual');
 assert.equal(call.options.credentials,'omit');
 assert.equal(call.options.cache,'no-store');
 assert.deepEqual(x.state.auth[0],{
  repositoryId:REPO,permissions:SCOPE,
 });
});

test('D6-GSTEP03 deterministic Gear/KB text-only blob, no media',async()=>{
 const x=setup(),r=await x.writer.attempt(ID,'blob');
 assert.equal(r.stepKey,'blob:Gear/Lures/content/Sample.md');
 assert.equal(x.state.network[0].url,PREFIX+'/git/blobs');
 assert.deepEqual(JSON.parse(x.state.network[0].options.body),{
  content:'# Text',encoding:'utf-8',
 });
 for(const invalid of [
  {path:'Catches/catches.json'},
  {path:'Gear/Lures/assets/image.png'},
  {path:'Gear/../KB/kb.json'},
  {path:'Gear/Lures/content/a.md',content:''},
  {path:'Gear/Lures/content/a.md',content:'z'.repeat(131073)},
 ]){
  const other=setup({planPatch:invalid});
  await denied(other.writer.attempt(ID,'blob'),'UNSAFE_BLOB');
  assert.equal(other.db.stats.writes,0);
  assert.equal(other.state.auth.length,0);
 }
});

test('D6-GSTEP04 trees restrict file paths and require Gear JSON update',async()=>{
 const x=setup();await x.writer.attempt(ID,'tree');
 const call=x.state.network[0];
 assert.equal(call.url,PREFIX+'/git/trees');
 assert.deepEqual(JSON.parse(call.options.body),{
  base_tree:TREE,tree:plans.tree.entries,
 });
 for(const entries of [
  [{path:'KB/kb.json',mode:'100644',type:'blob',sha:BLOB}],
  [{path:'Gear/gear.json',mode:'100644',type:'blob',sha:'bad'}],
  [{path:'Gear/gear.json',mode:'100755',type:'blob',sha:BLOB}],
  [{path:'Gear/gear.json',mode:'100644',type:'tree',sha:BLOB}],
  [plans.tree.entries[0],plans.tree.entries[0]],
  [plans.tree.entries[0],{...plans.tree.entries[1],
   path:'Gear/Lures/assets/photo.png'}],
 ]){
  const s=setup({planPatch:{entries}});
  await denied(s.writer.attempt(ID,'tree'),'UNSAFE_TREE');
  assert.equal(s.db.stats.writes,0);
 }
});

test('D6-GSTEP05 commit is immutable child of reviewed main and tree',async()=>{
 const x=setup();await x.writer.attempt(ID,'commit');
 assert.equal(x.state.network[0].url,PREFIX+'/git/commits');
 assert.deepEqual(JSON.parse(x.state.network[0].options.body),{
  message:'Fishing Companion V3 content update '+ID,
  tree:TREE,parents:[MAIN],
 });
 const s=setup({planPatch:{treeSha:'bad'}});
 await denied(s.writer.attempt(ID,'commit'),'UNSAFE_COMMIT');
});

test('D6-GSTEP06 update affects operation branch only, NEVER force/main',async()=>{
 const x=setup();await x.writer.attempt(ID,'advance');
 const call=x.state.network[0];
 assert.equal(call.url,PREFIX+'/git/refs/heads/'+BRANCH);
 assert.equal(call.options.method,'PATCH');
 assert.deepEqual(JSON.parse(call.options.body),{
  sha:COMMIT,force:false,
 });
 for(const commitSha of ['bad',MAIN]){
  const s=setup({planPatch:{commitSha}});
  await denied(s.writer.attempt(ID,'advance'),'UNSAFE_ADVANCE');
 }
});

test('D6-GSTEP07 PR only from exact operation branch to main',async()=>{
 const x=setup();await x.writer.attempt(ID,'pr');
 const call=x.state.network[0];
 assert.equal(call.url,PREFIX+'/pulls');
 assert.deepEqual(JSON.parse(call.options.body),{
  head:BRANCH,base:'main',draft:false,
  title:'Fishing Companion V3: gear '+ID,
  body:'Canonical Gear/KB text-only operation '+ID+
   '\nBase: '+MAIN+'\nCandidate digest: '+DIGEST,
 });
 assert.equal(x.db.rows[0].state,'Unknown');
});

test('D6-GSTEP08 same substep, even after HTTP 201, never auto-replays',async()=>{
 const x=setup();
 const first=await x.writer.attempt(ID,'branch');
 const repeated=await x.writer.attempt(ID,'branch');
 assert.equal(first.state,'Unknown');
 assert.equal(repeated.attemptedNow,false);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.db.stats.writes,1);
 assert.equal(x.state.network.length,1);
 assert.equal((await x.writer.inspectFence(ID,'branch')).state,'Unknown');
});

test('D6-GSTEP09 concurrent double clicks cannot submit two mutations',async()=>{
 const x=setup();
 const results=await Promise.all([
  x.writer.attempt(ID,'pr'),x.writer.attempt(ID,'pr'),
 ]);
 assert.equal(results.length,2);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.state.network.length,1);
});

test('D6-GSTEP10 changed immutable step payload is a conflict',async()=>{
 const x=setup();await x.writer.attempt(ID,'blob');
 plans.blob.content='# Text'; // baseline is unchanged
 const [row]=x.db.rows;
 row.request_sha256='a'.repeat(64);
 await denied(x.writer.attempt(ID,'blob'),'FENCE_MISMATCH');
 assert.equal(x.state.network.length,1);
});

test('D6-GSTEP11 uncertain provider timeout is permanently fenced',async()=>{
 const x=setup({networkError:true});
 const first=await x.writer.attempt(ID,'branch');
 const retry=await x.writer.attempt(ID,'branch');
 assert.equal(first.state,'Unknown');
 assert.equal(retry.state,'Unknown');
 assert.equal(x.state.network.length,1);
 assert.equal(x.db.rows.length,1);
});

test('D6-GSTEP12 lost durable D1 acknowledgment NEVER sends provider call',async()=>{
 const x=setup({db:memoryD1({lostAck:true})});
 await denied(x.writer.attempt(ID,'branch'),'STORE_UNAVAILABLE');
 assert.equal(x.db.rows.length,1);
 assert.equal(x.state.network.length,0);
 const retry=await x.writer.attempt(ID,'branch');
 assert.equal(retry.state,'Unknown');
 assert.equal(x.state.network.length,0);
});

test('D6-GSTEP13 missing migration and bad prereq prevent external writes',async()=>{
 const a=setup({db:memoryD1({unavailable:true})});
 await denied(a.writer.attempt(ID,'branch'),'STORE_UNAVAILABLE');
 assert.equal(a.state.network.length,0);
 const b=setup({prerequisite:false});
 await denied(b.writer.attempt(ID,'branch'),'PRECONDITION_UNVERIFIED');
 assert.equal(b.db.stats.writes,0);
 assert.equal(b.state.network.length,0);
});

test('D6-GSTEP14 invalid actor, injected plan and cross-repo denied',async()=>{
 for(const bad of [
  {repositoryId:0},{ownerGitHubId:0},
  {sourceRevision:COMMIT},{state:'Unknown'},
  {state:'Live'},{domain:'catches'},
  {candidateSha256:'bad'}, {ref:'refs/heads/dev'},
 ]){
  const x=setup({actor:{...op(),...bad}});
  // A different syntactically valid source SHA is allowed until trusted
  // independent plan/source proof; it must still match our fixed plan.
  if(bad.sourceRevision===COMMIT){
   await denied(x.writer.attempt(ID,'branch'),'UNTRUSTED_STEP_PLAN');
  }else{
   await denied(x.writer.attempt(ID,'branch'),'UNTRUSTED_OPERATION');
  }
  assert.equal(x.state.network.length,0);
 }
 for(const patch of [
  {repositoryId:0},{ownerGitHubId:0},
  {candidateSha256:'a'.repeat(64)},{sourceOnly:false},
 ]){
  const x=setup({planPatch:patch});
  await denied(x.writer.attempt(ID,'branch'),'UNTRUSTED_STEP_PLAN');
  assert.equal(x.db.stats.writes,0);
 }
});

test('D6-GSTEP15 provider token denied and revocation keep Unknown',async()=>{
 const a=setup({tokenOk:false});
 const result=await a.writer.attempt(ID,'branch');
 assert.equal(result.state,'Unknown');
 assert.equal(a.state.network.length,0);
 const b=setup({revokeAt:'token'});
 const revoked=await b.writer.attempt(ID,'branch');
 assert.equal(revoked.state,'Unknown');
 assert.equal(b.state.network.length,0);
 assert.equal(b.db.rows.length,1);
 await denied(b.writer.attempt(ID,'branch'),'DISABLED');
});

test('D6-GSTEP16 every mutation uses same pinned API and never merges',async()=>{
 const x=setup();
 for(const step of ['branch','blob','tree','commit','advance','pr']){
  await x.writer.attempt(ID,step);
 }
 assert.equal(x.state.network.length,6);
 for(const {url,options} of x.state.network){
  assert(url.startsWith(PREFIX+'/'));
  assert(!url.includes('/merges'));
  assert(!url.includes('/git/refs/heads/main'));
  assert(options.method==='POST'||options.method==='PATCH');
  assert.equal(options.headers.Authorization,
   'Bearer FAKE-TEST-TOKEN-NOT-REAL-1234567890');
  assert.equal(options.redirect,'manual');
 }
});

test('D6-GSTEP17 no HTTP route, credentials or preinstalled D1 bindings',()=>{
 assert.throws(()=>createD6ProductionGitHubStepWriter({
  DB:memoryD1().DB,readOperation:()=>{},
  planStep:()=>{},verifyPrerequisite:()=>{},
  issueWriteToken:null,request:()=>{},
 }),e=>e instanceof D6ProviderStepError&&e.code==='INVALID_CONFIG');
 assert.equal(D6_PROVIDER_STEP_SQL.includes('UPDATE '),false);
 const x=setup();
 assert.equal(Object.hasOwn(x.writer,'fetch'),false);
 assert.equal(Object.hasOwn(x.writer,'merge'),false);
 assert.equal(Object.hasOwn(x.writer,'publish'),false);
});

test('D6-GSTEP18 invalid ID and step never call DB or network',async()=>{
 const x=setup();
 await denied(x.writer.attempt('bad','branch'),'INVALID_OPERATION');
 await denied(x.writer.attempt(ID,'merge'),'INVALID_STEP');
 assert.equal(x.db.stats.writes,0);
 assert.equal(x.state.network.length,0);
});
