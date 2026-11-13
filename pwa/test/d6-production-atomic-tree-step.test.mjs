import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {D6_PROVIDER_STEP_SQL}
 from '../../experiments/p3/preview/src/d6-production-github-step-writer.mjs';
import {createD6ProductionAtomicTreeStep,
 describeD6AtomicTreeStep,D6AtomicTreeStepError}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),SNAP='f'.repeat(64);
const C='c'.repeat(40),D='d'.repeat(40),E='e'.repeat(40);
const auth=()=>new Request(ORIGIN+'/api/v3/operations',{method:'POST',
 headers:{Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
  'Content-Type':'application/json'},body:'{}'});
const op=(domain='catches')=>({
 operationId:ID,repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
 ref:REPO.ref,state:'Accepted',sourceRevision:MAIN,
 snapshotSha256:SNAP,domain,operation:'add',recordId:'catch-example',
});
function plan(domain='catches'){
 const json=domain==='gear'?'Gear/gear.json':
  domain==='kb'?'KB/kb.json':'Catches/catches.json';
 const note=domain==='gear'?'Gear/Lures/content/Sample.md':
  domain==='kb'?'KB/Knots/content/Sample.md':
  'Catches/content/catch-example.md';
 const media=domain==='gear'?'Gear/Lures/assets/catch-example/notes/photo.png':
  domain==='kb'?'KB/Knots/assets/catch-example/step-01.png':
  'Catches/assets/catch-example/notes/photo.png';
 return {
  atomicTreeReady:true,sourceOnly:true,canSubmitTree:false,
  canPublish:false,isLive:false,
  requiresDurableGitStepFence:true,
  requiresIndependentTreeReadback:true,
  requiresSourceConflictRecheck:true,
  operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,baseTreeSha:BASE,
  domain,recordId:'catch-example',
  textCount:2,mediaCount:1,fileCount:3,
  verifiedText:[{path:json,sha:C,bytes:100},{path:note,sha:D,bytes:40}],
  entries:[
   {path:json,mode:'100644',type:'blob',sha:C},
   {path:note,mode:'100644',type:'blob',sha:D},
   {path:media,mode:'100644',type:'blob',sha:E},
  ],
 };
}
function memoryD1({unavailable=false,lostAck=false}={}){
 const rows=[],stats={reads:0,writes:0};let lose=lostAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('D1 unavailable');
  return {bind(...args){return {
   async first(){
    stats.reads++;assert(sql.startsWith('SELECT '));
    const [id,key]=args;
    return rows.find(r=>r.operation_id===id&&r.step_key===key)??null;
   },
   async run(){
    stats.writes++;assert(sql.startsWith('INSERT OR IGNORE '));
    const [id,key,owner,repo,requestSha256,createdAt]=args;
    const existing=rows.find(r=>r.operation_id===id&&r.step_key===key);
    if(!existing)rows.push({operation_id:id,step_key:key,
     owner_github_id:owner,repository_id:repo,
     request_sha256:requestSha256,state:'Unknown',
     created_at:createdAt});
    if(lose){lose=false;throw Error('D1 insert ack lost');}
    return {meta:{changes:existing?0:1}};
   },
  };}};}};return {DB,rows,stats};
}
function setup({
 enabled=true,owner=true,domain='catches',db=memoryD1(),
 forgedPlan={},precondition=true,tokenValid=true,
 revokeAt='',networkError=false,
}={}){
 const stored={operation:op(domain),package:{
  domain,operation:'add',id:'catch-example',
  base:{sourceRevision:MAIN},
 },mediaTickets:[{signed:'proof-only-fake-test-ticket'}]};
 const state={enabled,owner,checks:0,loads:0,plans:0,
  prerequisites:[],tokens:[],requests:[]};
 const writer=createD6ProductionAtomicTreeStep({
  DB:db.DB,enabled:()=>state.enabled,now:()=>1800000000,
  session:{authorizeWrite:async req=>{
   state.checks++;
   assert.equal(req.method,'POST');
   if(!state.owner)throw Error('unauthorized');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  }},
  loadAcceptedOperation:async({operationId,ownerGitHubId})=>{
   state.loads++;assert.equal(operationId,ID);
   assert.equal(ownerGitHubId,REPO.ownerGitHubId);
   return stored;
  },
  atomicPlanner:{plan:async args=>{
   state.plans++;
   assert.equal(args.operation,stored.operation);
   assert.equal(args.package,stored.package);
   assert.equal(args.mediaTickets,stored.mediaTickets);
   return {...plan(domain),...structuredClone(forgedPlan)};
  }},
  verifyPrerequisite:async ctx=>{
   state.prerequisites.push(ctx);
   if(revokeAt==='prerequisite')state.enabled=false;
   if(!precondition||(precondition==='first-only'&&
    state.prerequisites.length>1))return {verified:false};
   return {verified:true,operationId:ctx.operationId,
    ownerGitHubId:ctx.ownerGitHubId,repositoryId:ctx.repositoryId,
    ref:ctx.ref,sourceRevision:ctx.sourceRevision,
    baseTreeSha:ctx.baseTreeSha,
    requestSha256:ctx.requestSha256};
  },
  issueWriteToken:async args=>{
   state.tokens.push(args);
   if(revokeAt==='token')state.enabled=false;
   return tokenValid?{repositoryId:REPO.id,
    permissions:{contents:'write'},
    token:'TEST-ONLY-WRITE-CREDENTIAL-1234567890'}:
    {repositoryId:REPO.id,permissions:{contents:'read'},
     token:'wrong'};
  },
  request:async(url,options)=>{
   state.requests.push({url,options,
    fencePresent:db.rows.some(r=>r.step_key==='tree')});
   if(networkError)throw Error('HTTP ack lost');
   return new Response(JSON.stringify({sha:'b'.repeat(40)}),{
    status:201,headers:{'Content-Type':'application/json'},
   });
  },
 });
 return {writer,db,state,stored};
}
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6AtomicTreeStepError&&e.code===code);

test('WP3-TREE01 disabled means no owner, D1, provider or token reads',async()=>{
 const x=setup({enabled:false});
 await denied(x.writer.attempt(auth(),ID),'DISABLED');
 assert.deepEqual(x.db.stats,{reads:0,writes:0});
 assert.equal(x.state.checks,0);assert.equal(x.state.loads,0);
 assert.equal(x.state.requests.length,0);
 assert.match(D6_PROVIDER_STEP_SQL,/PRIMARY KEY\(operation_id,step_key\)/);
});

test('WP3-TREE02 trusted atomic plan binds one durable Unknown before POST',async()=>{
 const x=setup(),r=await x.writer.attempt(auth(),ID);
 assert.equal(r.state,'Unknown');assert.equal(r.attemptedNow,true);
 assert.equal(r.canPublish,false);assert.equal(r.isLive,false);
 assert.equal(r.requiresIndependentTreeReadback,true);
 assert.equal(x.db.rows.length,1);
 assert.equal(x.db.rows[0].request_sha256,r.requestSha256);
 assert.equal(x.state.requests.length,1);
 const q=x.state.requests[0];
 assert.equal(q.fencePresent,true);
 assert.equal(q.url,'https://api.github.com/repos/ginosega/fishing/git/trees');
 assert.equal(q.options.method,'POST');
 assert.equal(q.options.redirect,'manual');
 assert.equal(q.options.credentials,'omit');
 assert.equal(q.options.headers.Authorization,
  'Bearer TEST-ONLY-WRITE-CREDENTIAL-1234567890');
 assert.deepEqual(JSON.parse(q.options.body),{
  base_tree:BASE,tree:plan().entries});
 assert.deepEqual(x.state.tokens[0],{
  repositoryId:REPO.id,permissions:{contents:'write'}});
 assert.equal(x.state.prerequisites.length,2);
});

test('WP3-TREE03 repeat and concurrent attempts cannot POST twice',async()=>{
 const x=setup();
 const pair=await Promise.all([
  x.writer.attempt(auth(),ID),x.writer.attempt(auth(),ID),
 ]);
 assert.equal(x.state.requests.length,1);
 assert.equal(x.db.rows.length,1);
 assert.deepEqual(pair.map(p=>p.state),['Unknown','Unknown']);
 assert.equal((await x.writer.attempt(auth(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.length,1);
 assert.equal(x.db.stats.writes,1);
 assert.equal(x.state.checks,3); // no auth bypass for retries
});

test('WP3-TREE04 lost D1 acknowledgment remains Unknown and never POSTs',async()=>{
 const db=memoryD1({lostAck:true}),x=setup({db});
 await denied(x.writer.attempt(auth(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.rows.length,1);
 assert.equal(x.state.requests.length,0);
 assert.equal((await x.writer.attempt(auth(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,0);
 assert.equal(x.state.tokens.length,0);
});

test('WP3-TREE05 loss of provider response never permits a replay',async()=>{
 const x=setup({networkError:true});
 assert.equal((await x.writer.attempt(auth(),ID)).state,'Unknown');
 assert.equal(x.state.requests.length,1);
 assert.equal((await x.writer.attempt(auth(),ID)).attemptedNow,false);
 assert.equal(x.state.requests.length,1);
});

test('WP3-TREE06 stale main before/after token minting fails closed',async()=>{
 const before=setup({precondition:false});
 await denied(before.writer.attempt(auth(),ID),'PRECONDITION_UNVERIFIED');
 assert.equal(before.db.rows.length,0);
 assert.equal(before.state.requests.length,0);
 const after=setup({precondition:'first-only'});
 await denied(after.writer.attempt(auth(),ID),'PRECONDITION_UNVERIFIED');
 assert.equal(after.db.rows.length,1);
 assert.equal(after.state.requests.length,0);
 assert.equal((await after.writer.attempt(auth(),ID)).state,'Unknown');
 assert.equal(after.state.requests.length,0);
});

test('WP3-TREE07 malicious owner, token scope and revoked flag block writes',async()=>{
 const notOwner=setup({owner:false});
 await denied(notOwner.writer.attempt(auth(),ID),'OWNER_DENIED');
 assert.equal(notOwner.state.loads,0);
 const token=setup({tokenValid:false});
 assert.equal((await token.writer.attempt(auth(),ID)).state,'Unknown');
 assert.equal(token.state.requests.length,0);
 const revoked=setup({revokeAt:'token'});
 await denied(revoked.writer.attempt(auth(),ID),'DISABLED');
 assert.equal(revoked.db.rows.length,1);
 assert.equal(revoked.state.requests.length,0);
});

test('WP3-TREE08 forged plan, missing media and collisions denied before D1',async()=>{
 for(const forgedPlan of [
  {canSubmitTree:true},
  {mediaCount:0},
  {sourceRevision:'f'.repeat(40)},
  {baseTreeSha:'not-a-sha'},
  {verifiedText:[{path:'Catches/catches.json',sha:D,bytes:1}]},
  {entries:[...plan().entries,plan().entries[0]],fileCount:4},
 ]){
  const x=setup({forgedPlan});
  await assert.rejects(x.writer.attempt(auth(),ID));
  assert.deepEqual(x.db.stats,{reads:0,writes:0});
  assert.equal(x.state.requests.length,0);
 }
});

test('WP3-TREE09 record domain and immutable fingerprint cannot drift on retry',async()=>{
 const x=setup();
 await x.writer.attempt(auth(),ID);
 x.stored.operation.snapshotSha256='e'.repeat(64);
 await denied(x.writer.attempt(auth(),ID),'FENCE_MISMATCH');
 assert.equal(x.state.requests.length,1);
 for(const domain of ['gear','kb']){
  const d=setup({domain});
  const r=await d.writer.attempt(auth(),ID);
  assert.equal(r.state,'Unknown');
  assert.equal(d.state.requests.length,1);
  assert.equal(d.state.requests[0].fencePresent,true);
 }
});

test('WP3-TREE10 unavailable D1 or missing metadata never reaches network',async()=>{
 const unavailable=setup({db:memoryD1({unavailable:true})});
 await denied(unavailable.writer.attempt(auth(),ID),'STORE_UNAVAILABLE');
 assert.equal(unavailable.state.requests.length,0);
 const x=setup();x.stored.mediaTickets=[];
 // Planner input must be truly trusted; a changed snapshot is not
 // accepted without revalidating it at the atomic source planner.
 x.stored.operation.repositoryId=123;
 await denied(x.writer.attempt(auth(),ID),'UNTRUSTED_OPERATION');
 assert.deepEqual(x.db.stats,{reads:0,writes:0});
});
