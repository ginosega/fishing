import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionFiveStepWiring,D6FiveStepWiringError}
 from '../../experiments/p3/preview/src/d6-production-five-step-wiring.mjs';
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),RESULT='e'.repeat(40);
const SNAP='f'.repeat(64),C='c'.repeat(40),D='d'.repeat(40);
const ROOT='https://api.github.com/repos/'+REPO.name,AT=1800000002;
const req=(method='POST')=>new Request(ORIGIN+'/api/v3/operations/'+ID+'/begin',{
 method,headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
 },...(method==='POST'?{body:'{}'}:{}),
});
const operation={
 operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,domain:'catches',
 operation:'add',recordId:'catch-example',
 sourceRevision:MAIN,snapshotSha256:SNAP,state:'Accepted',
};
const pkg={
 domain:'catches',operation:'add',id:'catch-example',
 base:{sourceRevision:MAIN},
};
const PLAN=Object.freeze({
 atomicTreeReady:true,sourceOnly:true,canSubmitTree:false,
 canPublish:false,isLive:false,
 requiresDurableGitStepFence:true,
 requiresIndependentTreeReadback:true,
 requiresSourceConflictRecheck:true,
 operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:MAIN,baseTreeSha:BASE,
 domain:'catches',recordId:'catch-example',
 textCount:2,mediaCount:1,fileCount:3,
 canonicalJsonUnchanged:false,
 verifiedText:[
  {path:'Catches/catches.json',sha:C,bytes:100},
  {path:'Catches/content/catch-example.md',sha:D,bytes:40},
 ],
 entries:[
  {path:'Catches/catches.json',mode:'100644',type:'blob',sha:C},
  {path:'Catches/content/catch-example.md',mode:'100644',type:'blob',sha:D},
  {path:'Catches/assets/catch-example/notes/photo.png',
   mode:'100644',type:'blob',sha:RESULT},
 ],
});
function fixture({enabled=true,writeEnabled=true,owner=true,
 sourceMoved=false,badTreeResponse=false,DBUnavailable=false}={}){
 const flags={enabled,writeEnabled,owner,sourceMoved,badTreeResponse};
 const calls={dbReads:0,dbWrites:0,auth:0,plans:0,
  readToken:0,writeToken:0,providerReads:[],providerWrites:[]};
 const fences=new Map(),hints=new Map();
 const DB={prepare(sql){
  if(DBUnavailable)throw Error('D1 unavailable');
  return {bind(...a){return {
   async first(){
    calls.dbReads++;
    if(sql.includes('FROM d6_provider_step_fences'))
     return fences.get(a[1])??null;
    if(sql.includes('FROM d6_publish_tree_candidates'))
     return hints.get(a[0])??null;
    return null;
   },
   async run(){
    calls.dbWrites++;
    if(sql.startsWith('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repo,hash,when]=a;
     const prior=fences.get(key);
     if(!prior)fences.set(key,{
      operation_id:id,step_key:key,owner_github_id:owner,
      repository_id:repo,request_sha256:hash,state:'Unknown',
      created_at:when,
     });
     return {meta:{changes:prior?0:1}};
    }
    if(sql.startsWith('INSERT OR IGNORE INTO d6_publish_tree_candidates')){
     const [id,owner,repo,ref,revision,hash,sha,when]=a;
     const prior=hints.get(id);
     if(!prior)hints.set(id,{
      operation_id:id,owner_github_id:owner,
      repository_id:repo,ref_name:ref,source_revision:revision,
      request_sha256:hash,result_tree_sha:sha,
      provenance:'server-provider-result',recorded_at:when,
     });
     return {meta:{changes:prior?0:1}};
    }
    throw Error('unapproved D1 mutation');
   },
  };}};}};
 const session={authorizeWrite:async request=>{
  calls.auth++;
  assert.equal(request.method,'POST');
  if(!flags.owner)throw Error('owner denied');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const request=async(url,opts)=>{
  if(opts.method==='POST'){
   calls.providerWrites.push({url,opts,fencePresent:fences.has('tree')});
   assert.equal(url,ROOT+'/git/trees');
   return new Response(flags.badTreeResponse?'invalid':JSON.stringify({
    sha:RESULT,
   }),{status:201,headers:{'Content-Type':'application/json'}});
  }
  assert.equal(opts.method,'GET');
  calls.providerReads.push(url);
  let json;
  if(url===ROOT)json={
   id:REPO.id,full_name:REPO.name,default_branch:'main',
  };
  else if(url===ROOT+'/git/ref/heads/main')json={
   ref:REPO.ref,object:{type:'commit',sha:
    flags.sourceMoved?'9'.repeat(40):MAIN},
  };
  else if(url===ROOT+'/git/commits/'+MAIN)json={
   sha:MAIN,tree:{sha:BASE},
  };
  else throw Error('unexpected Git endpoint '+url);
  return new Response(JSON.stringify(json),{
   headers:{'Content-Type':'application/json'},
  });
 };
 const stepFactory=createD6ProductionFiveStepWiring({
  DB,session,
  atomicPlanner:{plan:async x=>{
   calls.plans++;
   assert.equal(x.operation,operation);
   assert.equal(x.package,pkg);
   return PLAN;
  }},
  issueReadToken:async a=>{
   calls.readToken++;
   assert.equal(a.repositoryId,REPO.id);
   return {repositoryId:REPO.id,
    permissions:{...a.permissions},
    token:'TEST-ONLY-READ-TOKEN-00000000000'};
  },
  issueWriteToken:async a=>{
   calls.writeToken++;
   assert.equal(a.repositoryId,REPO.id);
   return {repositoryId:REPO.id,
    permissions:{...a.permissions},
    token:'TEST-ONLY-WRITE-TOKEN-00000000000'};
  },
  request,enabled:()=>flags.enabled,
  writeEnabled:()=>flags.writeEnabled,
  now:()=>AT,
 });
 const create=()=>stepFactory.createStepSet({
  loadAcceptedOperation:async a=>{
   assert.equal(a.operationId,ID);
   assert.equal(a.ownerGitHubId,REPO.ownerGitHubId);
   return {operation,package:pkg,mediaTickets:[]};
  },
  operationId:ID,authRequest:req(),
 });
 return {flags,calls,create,stepFactory,fences,hints};
}
const denied=promise=>assert.rejects(promise);
test('WP3-WIRE01 source-only default-off: no D1, auth, network or writer',async()=>{
 const x=fixture({enabled:false});
 await assert.rejects(async()=>x.create(),e=>
  e instanceof D6FiveStepWiringError&&e.code==='DISABLED');
 assert.deepEqual(x.calls.providerReads,[]);
 assert.deepEqual(x.calls.providerWrites,[]);
 assert.equal(x.calls.dbReads,0);
 assert.deepEqual(Object.keys(x.stepFactory),['createStepSet']);
});
test('WP3-WIRE02 exact real five coordinator+independent readback pairs',()=>{
 const x=fixture(),steps=x.create();
 assert.deepEqual(Object.keys(steps.coordinators),
  ['tree','branch','commit','advance','pr']);
 assert.deepEqual(Object.keys(steps.reconcilers),
  ['tree','branch','commit','advance','pr']);
 for(const s of ['tree','branch','commit','advance','pr']){
  assert.equal(typeof steps.coordinators[s].attempt,'function');
  assert.equal(typeof steps.reconcilers[s].reconcile,'function');
 }
 assert(Object.isFrozen(steps));
 assert(Object.isFrozen(steps.coordinators));
 assert.equal(x.calls.dbReads,0);assert.equal(x.calls.writeToken,0);
 assert.equal(x.calls.providerReads.length,0);
});
test('WP3-WIRE03 real tree coordinator stores result only after sticky Unknown',async()=>{
 const x=fixture(),steps=x.create();
 const r=await steps.coordinators.tree.attempt(req(),ID);
 assert.equal(r.state,'Unknown');assert.equal(r.isLive,false);
 assert.equal(r.requiresIndependentTreeReadback,true);
 assert.equal(x.calls.providerWrites.length,1);
 assert.equal(x.calls.providerWrites[0].fencePresent,true);
 assert.equal(x.calls.providerWrites[0].opts.method,'POST');
 assert.equal(x.calls.writeToken,1);
 assert.equal(x.calls.readToken,2);
 assert.equal(x.hints.get(ID).result_tree_sha,RESULT);
 assert.equal(x.hints.get(ID).provenance,'server-provider-result');
 assert.equal(x.calls.dbWrites,2);
 assert.equal(x.calls.providerReads.length,8);
 assert.equal(x.fences.size,1);
 // Existing Unknown never replays even after a fully acknowledged HTTP 201.
 assert.equal((await steps.coordinators.tree.attempt(req(),ID)).state,'Unknown');
 assert.equal(x.calls.providerWrites.length,1);
});
test('WP3-WIRE04 invalid provider result stays Unknown with NO fabricated SHA',async()=>{
 const x=fixture({badTreeResponse:true});
 const r=await x.create().coordinators.tree.attempt(req(),ID);
 assert.equal(r.state,'Unknown');
 assert.equal(x.hints.size,0);assert.equal(x.fences.size,1);
 assert.equal(x.calls.providerWrites.length,1);
});
test('WP3-WIRE05 stale main blocks BEFORE any D1 fence or provider POST',async()=>{
 const x=fixture({sourceMoved:true});
 await denied(x.create().coordinators.tree.attempt(req(),ID));
 assert.equal(x.calls.dbWrites,0);
 assert.equal(x.calls.providerWrites.length,0);
 assert.equal(x.calls.writeToken,0);
});
test('WP3-WIRE06 revocable server write gate blocks both paths before D1',async()=>{
 const x=fixture({writeEnabled:false}),steps=x.create();
 await assert.rejects(steps.coordinators.tree.attempt(req(),ID),e=>
  e instanceof D6FiveStepWiringError&&e.code==='WRITE_DISABLED');
 await assert.rejects(steps.reconcilers.tree.reconcile(req(),ID),e=>
  e instanceof D6FiveStepWiringError&&e.code==='WRITE_DISABLED');
 assert.equal(x.calls.dbReads,0);
 assert.equal(x.calls.providerReads.length,0);
 assert.equal(x.calls.providerWrites.length,0);
 x.flags.writeEnabled=true;
 x.flags.enabled=false;
 await denied(steps.coordinators.tree.attempt(req(),ID));
 assert.equal(x.calls.dbReads,0);
});
test('WP3-WIRE07 denied owner cannot write fence or call provider',async()=>{
 const x=fixture({owner:false});
 await denied(x.create().coordinators.tree.attempt(req(),ID));
 assert.equal(x.calls.dbWrites,0);
 assert.equal(x.calls.providerReads.length,0);
 assert.equal(x.calls.providerWrites.length,0);
});
test('WP3-WIRE08 missing D1 stops before the first provider POST',async()=>{
 const x=fixture({DBUnavailable:true});
 await denied(x.create().coordinators.tree.attempt(req(),ID));
 assert.equal(x.calls.dbWrites,0);
 assert.equal(x.calls.providerWrites.length,0);
});
test('WP3-WIRE09 no client-selected step, foreign operation, or release method',async()=>{
 const x=fixture();
 for(const input of [
  {loadAcceptedOperation:async()=>({}),operationId:'wrong',authRequest:req()},
  {loadAcceptedOperation:null,operationId:ID,authRequest:req()},
  {loadAcceptedOperation:async()=>({}),operationId:ID,
   authRequest:req('GET')},
 ]){
  assert.throws(()=>x.stepFactory.createStepSet(input),
   D6FiveStepWiringError);
 }
 const steps=x.create();
 for(const name of ['fetch','publish','merge','deploy','start',
  'createOperation','issueWriteToken','authorizeStep','retry'])
  assert.equal(name in x.stepFactory,false);
 assert.equal('retry' in steps.coordinators.tree,false);
});
