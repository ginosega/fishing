import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishProviderTransport}
 from '../../experiments/p3/preview/src/d6-production-publish-provider-transport.mjs';
import {createD6ProductionFiveStepWiring}
 from '../../experiments/p3/preview/src/d6-production-five-step-wiring.mjs';
import {createD6ProductionPublishRecoveryLifecycle}
 from '../../experiments/p3/preview/src/d6-production-publish-recovery-lifecycle.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),RESULT='c'.repeat(40);
const OLD='1'.repeat(40),CANON='2'.repeat(40),NOTE='3'.repeat(40);
const MEDIA='4'.repeat(40),README='5'.repeat(40),SNAP='f'.repeat(64);
const ROOT='https://api.github.com/repos/'+REPO.name,AT=1800000040;
const IDX='Catches/catches.json',NT='Catches/content/catch-example.md';
const IMG='Catches/assets/catch-example/notes/photo.png';
const entry=(path,sha,mode='100644',type='blob')=>({path,sha,mode,type});
const TREE_PLAN={
 atomicTreeReady:true,sourceOnly:true,canSubmitTree:false,
 canPublish:false,isLive:false,
 requiresDurableGitStepFence:true,requiresIndependentTreeReadback:true,
 requiresSourceConflictRecheck:true,
 operationId:ID,repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN,
 baseTreeSha:BASE,domain:'catches',recordId:'catch-example',
 textCount:2,mediaCount:1,fileCount:3,canonicalJsonUnchanged:false,
 verifiedText:[{path:IDX,sha:CANON,bytes:200},
  {path:NT,sha:NOTE,bytes:180}],
 entries:[entry(IDX,CANON),entry(NT,NOTE),entry(IMG,MEDIA)],
};
const operation={
 operationId:ID,state:'Accepted',ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN,
 snapshotSha256:SNAP,domain:'catches',operation:'add',
 recordId:'catch-example',
};
const stored={operation,package:{
 domain:'catches',operation:'add',id:'catch-example',
 base:{sourceRevision:MAIN},
},mediaTickets:[]};
const auth=()=>new Request(
 ORIGIN+'/api/v3/operations/'+ID+'/begin',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
 },body:'{}',
});
const oldTree={
 sha:BASE,truncated:false,tree:[
  entry('pwa','9'.repeat(40),'040000','tree'),
  entry('pwa/'+IDX,OLD),entry('README.md',README),
 ],
};
const newTree={
 sha:RESULT,truncated:false,tree:[
  entry('pwa','8'.repeat(40),'040000','tree'),
  entry('pwa/'+IDX,CANON),entry('pwa/'+NT,NOTE),
  entry('pwa/'+IMG,MEDIA),entry('README.md',README),
 ],
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json'},
});
function harness({lostPost=false,moveAfterFence=false,originalChanged=false}={}){
 const calls={read:[],writes:[],d1Writes:0,tokenRead:0,tokenWrite:0,
  ownerChecks:0,mainReads:0};
 const fences=new Map(),hint=new Map(),proofs=new Map();
 const DB={prepare(sql){return{bind(...a){return{
  async first(){
   if(sql.includes('FROM d6_provider_step_fences'))
    return fences.get(a[1])??null;
   if(sql.includes('FROM d6_publish_tree_candidates'))
    return hint.get(a[0])??null;
   if(sql.includes('FROM d6_atomic_tree_verified'))
    return proofs.get('tree')??null;
   return null;
  },
  async run(){
   calls.d1Writes++;
   if(sql.startsWith('INSERT OR IGNORE INTO d6_provider_step_fences')){
    const [id,key,owner,repo,digest,time]=a;
    const present=fences.has(key);
    if(!present)fences.set(key,{
     operation_id:id,step_key:key,owner_github_id:owner,
     repository_id:repo,request_sha256:digest,
     state:'Unknown',created_at:time,
    });
    return {meta:{changes:present?0:1}};
   }
   if(sql.startsWith('INSERT OR IGNORE INTO d6_publish_tree_candidates')){
    const [id,owner,repo,ref,revision,digest,sha,time]=a;
    const present=hint.has(id);
    if(!present)hint.set(id,{
     operation_id:id,owner_github_id:owner,
     repository_id:repo,ref_name:ref,source_revision:revision,
     request_sha256:digest,result_tree_sha:sha,
     provenance:'server-provider-result',recorded_at:time,
    });
    return {meta:{changes:present?0:1}};
   }
   if(sql.startsWith('INSERT OR IGNORE INTO d6_atomic_tree_verified')){
    const [id,owner,repo,digest,source,base,result,changed,time]=a;
    const present=proofs.has('tree');
    if(!present)proofs.set('tree',{
     operation_id:id,owner_github_id:owner,repository_id:repo,
     request_sha256:digest,source_revision:source,
     base_tree_sha:base,result_tree_sha:result,changed_paths:changed,
     state:'VerifiedTree',verified_at:time,
    });
    return {meta:{changes:present?0:1}};
   }
   throw Error('Unexpected D1 mutation');
  },
 };}};}};
 const session={authorizeWrite:async()=>{
  calls.ownerChecks++;
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const provider=createD6ProductionPublishProviderTransport({
  enabled:()=>true,
  upstream:async(url,opts)=>{
   if(opts.method==='POST'){
    calls.writes.push({
     url,body:JSON.parse(opts.body),
     hadUnknown:fences.has('tree'),
    });
    if(lostPost)throw Error('Lost GitHub create-tree acknowledgement');
    assert.equal(url,ROOT+'/git/trees');
    return json({sha:RESULT},201);
   }
   calls.read.push(url);
   let data;
   if(url===ROOT)data={id:REPO.id,full_name:REPO.name,
    default_branch:'main'};
   else if(url===ROOT+'/git/ref/heads/main'){
    calls.mainReads++;
    const moved=originalChanged||
     moveAfterFence&&calls.mainReads>=3;
    data={ref:REPO.ref,
     object:{type:'commit',sha:moved?'0'.repeat(40):MAIN}};
   }else if(url===ROOT+'/git/commits/'+MAIN)
    data={sha:MAIN,tree:{sha:BASE}};
   else if(url===ROOT+'/git/trees/'+BASE+'?recursive=1')
    data=oldTree;
   else if(url===ROOT+'/git/trees/'+RESULT+'?recursive=1')
    data=newTree;
   else throw Error('unapproved GitHub URL '+url);
   return json(data);
  },
 });
 const loadAcceptedOperation=async()=>stored;
 const wiring=createD6ProductionFiveStepWiring({
  DB,session,atomicPlanner:{plan:async()=>TREE_PLAN},
  issueReadToken:async x=>{
   calls.tokenRead++;
   assert.deepEqual(x.permissions,{contents:'read'});
   return {repositoryId:REPO.id,permissions:{contents:'read'},
    token:'TEST-READ-CREDENTIAL-123456789012345'};
  },
  issueWriteToken:async x=>{
   calls.tokenWrite++;
   assert.deepEqual(x.permissions,{contents:'write'});
   return {repositoryId:REPO.id,permissions:{contents:'write'},
    token:'TEST-WRITE-CREDENTIAL-123456789012345'};
  },
  request:provider.request,enabled:()=>true,
  writeEnabled:()=>true,now:()=>AT,
 });
 const steps=wiring.createStepSet({
  loadAcceptedOperation,operationId:ID,authRequest:auth(),
 });
 const lifecycle=createD6ProductionPublishRecoveryLifecycle({
  DB,session,loadAcceptedOperation,
  reconcilers:steps.reconcilers,
  enabled:()=>true,now:()=>AT,
 });
 return {calls,steps,lifecycle,fences,hint,proofs};
}
test('WP3-JOIN01 real five-step tree writer + durable candidate + independent Git GET + lifecycle',async()=>{
 const x=harness();
 assert.equal((await x.lifecycle.inspect(auth(),ID)).state,
  'AwaitingAuthorizedWrite');
 const first=await x.steps.coordinators.tree.attempt(auth(),ID);
 assert.equal(first.state,'Unknown');
 assert.equal(x.calls.writes.length,1);
 assert.equal(x.calls.writes[0].hadUnknown,true);
 assert.equal(x.calls.writes[0].body.base_tree,BASE);
 assert.deepEqual(x.calls.writes[0].body.tree,TREE_PLAN.entries.map(
  x=>({...x,path:'pwa/'+x.path})));
 assert.equal(x.hint.get(ID).result_tree_sha,RESULT);
 assert.equal((await x.lifecycle.inspect(auth(),ID)).state,
  'ReconciliationRequired');
 const confirmed=await x.lifecycle.reconcile(auth(),ID);
 assert.equal(confirmed.state,'AwaitingAuthorizedWrite');
 assert.equal(confirmed.step,'branch');
 assert.deepEqual(confirmed.verifiedSteps,['tree']);
 assert.equal(x.proofs.get('tree').state,'VerifiedTree');
 assert.equal(x.proofs.get('tree').changed_paths,3);
 assert.equal(x.calls.writes.length,1);
 assert(x.calls.read.includes(ROOT+'/git/trees/'+BASE+'?recursive=1'));
 assert(x.calls.read.includes(ROOT+'/git/trees/'+RESULT+'?recursive=1'));
 assert.equal(confirmed.canPublish,false);
 assert.equal(confirmed.isLive,false);
});
test('WP3-JOIN02 lost HTTP acknowledgement stays Unknown and NEVER reposts',async()=>{
 const x=harness({lostPost:true});
 assert.equal((await x.steps.coordinators.tree.attempt(auth(),ID)).state,'Unknown');
 assert.equal(x.calls.writes.length,1);
 assert.equal(x.fences.get('tree').state,'Unknown');
 assert.equal(x.hint.size,0);
 await assert.rejects(x.lifecycle.reconcile(auth(),ID));
 assert.equal(x.proofs.size,0);
 assert.equal((await x.steps.coordinators.tree.attempt(auth(),ID)).state,'Unknown');
 assert.equal(x.calls.writes.length,1);
});
test('WP3-JOIN03 changed main after fence blocks outbound mutation',async()=>{
 const x=harness({moveAfterFence:true});
 await assert.rejects(x.steps.coordinators.tree.attempt(auth(),ID));
 assert.equal(x.fences.get('tree').state,'Unknown');
 assert.equal(x.calls.writes.length,0);
 assert.equal(x.hint.size,0);
 assert.equal((await x.lifecycle.inspect(auth(),ID)).state,
  'ReconciliationRequired');
});
test('WP3-JOIN04 changed initial main blocks even first Unknown D1 fence',async()=>{
 const x=harness({originalChanged:true});
 await assert.rejects(x.steps.coordinators.tree.attempt(auth(),ID));
 assert.equal(x.fences.size,0);
 assert.equal(x.calls.writes.length,0);
 assert.equal(x.hint.size,0);
});
