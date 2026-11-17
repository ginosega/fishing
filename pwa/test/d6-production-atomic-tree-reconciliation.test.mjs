import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionAtomicTreeStep}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {createD6ProductionAtomicTreeReconciliation,
 D6AtomicTreeReconciliationError,D6_ATOMIC_TREE_PROOF_SQL}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-reconciliation.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),RESULT='c'.repeat(40);
const SNAP='d'.repeat(64),OLD='1'.repeat(40),JSON_SHA='2'.repeat(40);
const NOTE_SHA='3'.repeat(40),IMAGE_SHA='4'.repeat(40),README='5'.repeat(40);
const ROOT='https://api.github.com/repos/ginosega/fishing';
const INDEX='Catches/catches.json',NOTE='Catches/content/catch-example.md';
const MEDIA='Catches/assets/catch-example/notes/photo.png';
const op=()=>({operationId:ID,state:'Accepted',repositoryId:REPO.id,
 ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
 sourceRevision:MAIN,snapshotSha256:SNAP,
 domain:'catches',operation:'add',recordId:'catch-example'});
const request=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','X-Fish-V3-CSRF':'test-only',
  'Content-Type':'application/json',
 },body:'{}',
});
const entry=(path,sha,mode='100644',type='blob')=>({
 path,sha,mode,type,
});
const plan=()=>({
 atomicTreeReady:true,sourceOnly:true,canSubmitTree:false,
 canPublish:false,isLive:false,requiresDurableGitStepFence:true,
 requiresIndependentTreeReadback:true,
 requiresSourceConflictRecheck:true,
 operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:MAIN,baseTreeSha:BASE,domain:'catches',
 recordId:'catch-example',textCount:2,mediaCount:1,fileCount:3,
 verifiedText:[{path:INDEX,sha:JSON_SHA,bytes:98},
  {path:NOTE,sha:NOTE_SHA,bytes:64}],
 entries:[entry(INDEX,JSON_SHA),entry(NOTE,NOTE_SHA),
  entry(MEDIA,IMAGE_SHA)],
});
const gitTree=(sha,items)=>({
 sha,truncated:false,tree:items,
});
const oldTree=()=>gitTree(BASE,[
 entry('pwa','0'.repeat(40),'040000','tree'),
 entry('pwa/'+INDEX,OLD),entry('README.md',README),
]);
const newTree=()=>gitTree(RESULT,[
 entry('pwa','0'.repeat(40),'040000','tree'),
 entry('pwa/'+INDEX,JSON_SHA),entry('pwa/'+NOTE,NOTE_SHA),
 entry('pwa/'+MEDIA,IMAGE_SHA),entry('README.md',README),
]);
function provider(){
 return new Map([
  [ROOT+'/git/ref/heads/main',{
   ref:'refs/heads/main',object:{type:'commit',sha:MAIN},
  }],
  [ROOT+'/git/commits/'+MAIN,{sha:MAIN,tree:{sha:BASE}}],
  [ROOT+'/git/trees/'+BASE+'?recursive=1',oldTree()],
  [ROOT+'/git/trees/'+RESULT+'?recursive=1',newTree()],
 ]);
}
const json=(value,{status=200,headers={}}={})=>new Response(
 JSON.stringify(value),{status,headers:{
  'Content-Type':'application/json',...headers,
 }});
function memoryD1({lostProofAck=false,unavailable=false}={}){
 const fences=[],proofs=[],stats={reads:0,writes:0};
 let lose=lostProofAck;
 const DB={prepare(sql){
  if(unavailable)throw Error('D1 unavailable');
  return {bind(...args){return {
   async first(){
    stats.reads++;
    if(sql.includes('FROM d6_provider_step_fences')){
     const [id,key]=args;
     return fences.find(x=>x.operation_id===id&&x.step_key===key)??null;
    }
    assert(sql.includes('FROM d6_atomic_tree_verified'));
    return proofs.find(x=>x.operation_id===args[0])??null;
   },
   async run(){
    stats.writes++;
    if(sql.includes('INSERT OR IGNORE INTO d6_provider_step_fences')){
     const [id,key,owner,repo,digest,at]=args;
     const existing=fences.find(x=>x.operation_id===id&&x.step_key===key);
     if(!existing)fences.push({
      operation_id:id,step_key:key,owner_github_id:owner,
      repository_id:repo,request_sha256:digest,
      state:'Unknown',created_at:at,
     });
     return {meta:{changes:existing?0:1}};
    }
    assert(sql.includes('INSERT OR IGNORE INTO d6_atomic_tree_verified'));
    const [id,owner,repo,digest,source,base,result,changed,at]=args;
    const existing=proofs.find(x=>x.operation_id===id);
    if(!existing)proofs.push({
     operation_id:id,owner_github_id:owner,
     repository_id:repo,request_sha256:digest,
     source_revision:source,base_tree_sha:base,
     result_tree_sha:result,changed_paths:changed,
     state:'VerifiedTree',verified_at:at,
    });
    if(lose){lose=false;throw Error('lost D1 proof ack');}
    return {meta:{changes:existing?0:1}};
   },
  };}};}};return {DB,fences,proofs,stats};
}
function setup({enabled=true,owner=true,db=memoryD1(),
 providerMap=provider(),hintAvailable=true,readScope=true,
 sourceOnly=true,networkError=false,planOverride=null}={}){
 const state={enabled,owner,providerMap,hintAvailable,
  readScope,networkError,sourceOnly,
  authCount:0,loads:0,planCount:0,hintCount:0,
  postCount:0,readRequests:[],readTokens:0};
 const operation=op();
 const stored={operation,package:{
  domain:'catches',id:'catch-example',operation:'add',
  base:{sourceRevision:MAIN},
 },mediaTickets:[{test:true}]};
 const session={authorizeWrite:async req=>{
  state.authCount++;
  assert.equal(req.method,'POST');
  assert.equal(req.headers.get('X-Fish-V3-Intent'),'publish');
  if(!state.owner)throw Error('not authorized');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const loadAcceptedOperation=async()=>{
  state.loads++;return stored;
 };
 const atomicPlanner={plan:async()=>{
  state.planCount++;return {...(planOverride??plan()),sourceOnly:state.sourceOnly};
 }};
 const writer=createD6ProductionAtomicTreeStep({
  DB:db.DB,session,loadAcceptedOperation,atomicPlanner,
  enabled:()=>state.enabled,now:()=>1800000000,
  verifyPrerequisite:async args=>({
   verified:true,operationId:args.operationId,
   ownerGitHubId:args.ownerGitHubId,
   repositoryId:args.repositoryId,ref:args.ref,
   sourceRevision:args.sourceRevision,baseTreeSha:args.baseTreeSha,
   requestSha256:args.requestSha256,
  }),
  issueWriteToken:async()=>({
   repositoryId:REPO.id,permissions:{contents:'write'},
   token:'TEST-WRITE-CREDENTIAL-NOT-A-REAL-TOKEN',
  }),
  request:async()=>{
   state.postCount++;
   return json({sha:RESULT},{status:201});
  },
 });
 const verifier=createD6ProductionAtomicTreeReconciliation({
  DB:db.DB,session,loadAcceptedOperation,atomicPlanner,
  enabled:()=>state.enabled,now:()=>1800000001,
  loadCandidateTreeHint:async args=>{
   state.hintCount++;
   if(!state.hintAvailable)return null;
   return {provenance:'server-provider-result',
    operationId:args.operationId,repositoryId:args.repositoryId,
    ref:args.ref,sourceRevision:args.sourceRevision,
    requestSha256:args.requestSha256,resultTreeSha:RESULT};
  },
  issueReadToken:async args=>{
   state.readTokens++;
   assert.deepEqual(args,{repositoryId:REPO.id,
    permissions:{contents:'read'}});
   return state.readScope?{repositoryId:REPO.id,
    permissions:{contents:'read'},
    token:'TEST-READ-CREDENTIAL-NOT-A-REAL-TOKEN'}:
    {repositoryId:REPO.id,permissions:{contents:'write'},
     token:'bad'};
  },
  request:async(url,options)=>{
   state.readRequests.push({url,options});
   if(state.networkError)throw Error('transport unavailable');
   if(!state.providerMap.has(url))
    return json({message:'missing'},{status:404});
   return json(state.providerMap.get(url));
  },
 });
 return {writer,verifier,db,state,stored};
}
const denied=(p,code)=>assert.rejects(p,e=>
 e instanceof D6AtomicTreeReconciliationError&&e.code===code);

test('WP3-TRBK01 independently verified all-or-nothing tree becomes durable non-Live proof',async()=>{
 const x=setup();
 const result=await x.writer.attempt(request(),ID);
 assert.equal(result.state,'Unknown');assert.equal(x.state.postCount,1);
 const proof=await x.verifier.reconcile(request(),ID);
 assert.equal(proof.state,'VerifiedTree');
 assert.equal(proof.verifiedTree,true);
 assert.equal(proof.canPublish,false);assert.equal(proof.isLive,false);
 assert.equal(proof.changedPaths,3);
 assert.equal(proof.baseTreeSha,BASE);assert.equal(proof.resultTreeSha,RESULT);
 assert.equal(proof.originalRequestSha256,result.requestSha256);
 assert.equal(proof.requiresIndependentCommitReadback,true);
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.db.fences[0].state,'Unknown');
 assert.equal(x.state.readRequests.length,5);
 assert(x.state.readRequests.every(v=>v.options.method==='GET'));
 assert(x.state.readRequests.every(v=>v.options.redirect==='manual'));
 assert(x.state.readRequests.every(v=>v.options.credentials==='omit'));
 assert.equal(x.state.readRequests[2].url,
  ROOT+'/git/trees/'+BASE+'?recursive=1');
 assert.equal(x.state.readRequests[3].url,
  ROOT+'/git/trees/'+RESULT+'?recursive=1');
 assert.match(D6_ATOMIC_TREE_PROOF_SQL,
  /PRIMARY KEY/);
 assert.match(D6_ATOMIC_TREE_PROOF_SQL,/CHECK\(state='VerifiedTree'\)/);
});
test('WP3-TRBK02 default OFF and denied owner do not touch source or D1',async()=>{
 const off=setup({enabled:false});
 await denied(off.verifier.reconcile(request(),ID),'DISABLED');
 assert.equal(off.state.authCount,0);
 assert.deepEqual(off.db.stats,{reads:0,writes:0});
 const no=setup({owner:false});
 await denied(no.verifier.reconcile(request(),ID),'OWNER_DENIED');
 assert.equal(no.state.loads,0);
 assert.deepEqual(no.db.stats,{reads:0,writes:0});
});
test('WP3-TRBK03 missing Unknown fence denies any provider read',async()=>{
 const x=setup();
 await denied(x.verifier.reconcile(request(),ID),'FENCE_UNVERIFIED');
 assert.equal(x.state.readRequests.length,0);
 assert.equal(x.state.readTokens,0);
 assert.equal(x.db.proofs.length,0);
});
test('WP3-TRBK04 lost provider SHA stays Unknown with no blind retry',async()=>{
 const x=setup({hintAvailable:false});
 await x.writer.attempt(request(),ID);
 await denied(x.verifier.reconcile(request(),ID),'RESULT_SHA_UNKNOWN');
 assert.equal(x.state.readRequests.length,0);
 assert.equal(x.state.postCount,1);
 assert.equal(x.db.proofs.length,0);
 const second=await x.writer.attempt(request(),ID);
 assert.equal(second.attemptedNow,false);
 assert.equal(x.state.postCount,1);
});
test('WP3-TRBK05 404, transport failure and bad token cannot become proof',async()=>{
 for(const config of [
  {providerMap:new Map()},
  {networkError:true},
  {readScope:false},
 ]){
  const x=setup(config);await x.writer.attempt(request(),ID);
  await assert.rejects(x.verifier.reconcile(request(),ID));
  assert.equal(x.db.proofs.length,0);
  assert.equal(x.state.postCount,1);
  assert.equal((await x.writer.attempt(request(),ID)).attemptedNow,false);
 }
});
test('WP3-TRBK06 unrelated change, missing media or forged JSON are rejected',async()=>{
 const target=ROOT+'/git/trees/'+RESULT+'?recursive=1';
 for(const change of [
  t=>{t.tree.find(v=>v.path==='README.md').sha='6'.repeat(40);},
  t=>{t.tree=t.tree.filter(v=>v.path!=='pwa/'+MEDIA);},
  t=>{t.tree.find(v=>v.path==='pwa/'+INDEX).sha='f'.repeat(40);},
  t=>{t.tree.find(v=>v.path==='pwa/'+NOTE).mode='120000';},
 ]){
  const x=setup();await x.writer.attempt(request(),ID);
  const row=structuredClone(x.state.providerMap.get(target));
  change(row);x.state.providerMap.set(target,row);
  await assert.rejects(x.verifier.reconcile(request(),ID));
  assert.equal(x.db.proofs.length,0);
  assert.equal(x.state.postCount,1);
 }
});
test('WP3-TRBK07 truncated and colliding Git tree responses fail closed',async()=>{
 const target=ROOT+'/git/trees/'+RESULT+'?recursive=1';
 for(const change of [
  t=>{t.truncated=true;},
  t=>{t.tree.push({...t.tree.find(v=>v.path==='pwa/'+NOTE)});},
  t=>{t.tree.push({...t.tree.find(v=>v.path==='pwa/'+MEDIA),
   path:('pwa/'+MEDIA).replace('photo.png','PHOTO.PNG')});},
  t=>{t.tree[0].mode='100644';},
 ]){
  const x=setup();await x.writer.attempt(request(),ID);
  const row=structuredClone(x.state.providerMap.get(target));
  change(row);x.state.providerMap.set(target,row);
  await denied(x.verifier.reconcile(request(),ID),'TREE_UNVERIFIED');
  assert.equal(x.db.proofs.length,0);
 }
});
test('WP3-TRBK08 changed main ref or mismatched source base tree denied',async()=>{
 const pointer=ROOT+'/git/ref/heads/main',
  commit=ROOT+'/git/commits/'+MAIN;
 for(const [url,data,code] of [
  [pointer,{ref:REPO.ref,
   object:{type:'commit',sha:'f'.repeat(40)}},'SOURCE_MOVED'],
  [commit,{sha:MAIN,tree:{sha:'f'.repeat(40)}},
   'BASE_TREE_UNVERIFIED'],
 ]){
  const x=setup();await x.writer.attempt(request(),ID);
  x.state.providerMap.set(url,data);
  await denied(x.verifier.reconcile(request(),ID),code);
  assert.equal(x.db.proofs.length,0);
 }
});
test('WP3-TRBK09 lost D1 proof ack requires independent reread, not new POST',async()=>{
 const db=memoryD1({lostProofAck:true}),x=setup({db});
 await x.writer.attempt(request(),ID);
 await denied(x.verifier.reconcile(request(),ID),'STORE_UNAVAILABLE');
 assert.equal(x.db.proofs.length,1);
 assert.equal(x.state.postCount,1);
 const proof=await x.verifier.reconcile(request(),ID);
 assert.equal(proof.verifiedTree,true);
 assert.equal(x.db.proofs.length,1);assert.equal(x.state.postCount,1);
});
test('WP3-TRBK10 duplicate receipts match exact fingerprint; corrupt D1 rejects',async()=>{
 const x=setup();await x.writer.attempt(request(),ID);
 const first=await x.verifier.reconcile(request(),ID);
 const second=await x.verifier.reconcile(request(),ID);
 assert.deepEqual(second,first);
 assert.equal(x.db.proofs.length,1);assert.equal(x.state.postCount,1);
 x.db.proofs[0].request_sha256='f'.repeat(64);
 await denied(x.verifier.reconcile(request(),ID),'PROOF_MISMATCH');
});
test('WP3-TRBK11 forged fence/fresh plan drift fail before GitHub reads',async()=>{
 const x=setup();await x.writer.attempt(request(),ID);
 x.db.fences[0].request_sha256='f'.repeat(64);
 await denied(x.verifier.reconcile(request(),ID),'FENCE_UNVERIFIED');
 assert.equal(x.state.readRequests.length,0);
 const y=setup({sourceOnly:false});
 await denied(y.verifier.reconcile(request(),ID),'ATOMIC_PLAN_UNVERIFIED');
 assert.deepEqual(y.db.stats,{reads:0,writes:0});
});
test('WP3-TRBK12 existing media preimage is not silently overwritten',async()=>{
 const x=setup();await x.writer.attempt(request(),ID);
 x.state.providerMap.get(ROOT+'/git/trees/'+BASE+'?recursive=1')
  .tree.push(entry('pwa/'+MEDIA,OLD));
 await denied(x.verifier.reconcile(request(),ID),'EXISTING_MEDIA_COLLISION');
 assert.equal(x.db.proofs.length,0);
});

test('WP3-TRBK13 Markdown-only edit readback keeps canonical JSON and images untouched',async()=>{
 const base=oldTree(),target=newTree();
 // Existing record JSON and all existing media remain identical. Only
 // the Markdown body gets a new verified blob in the final Git tree.
 base.tree.push(entry('pwa/'+NOTE,OLD),entry('pwa/'+MEDIA,IMAGE_SHA));
 target.tree.find(v=>v.path==='pwa/'+INDEX).sha=OLD;
 const override={...plan(),
  mediaCount:0,textCount:1,fileCount:1,canonicalJsonUnchanged:true,
  verifiedText:[{path:NOTE,sha:NOTE_SHA,bytes:64}],
  entries:[entry(NOTE,NOTE_SHA)],
 };
 const x=setup({planOverride:override});
 x.state.providerMap.set(ROOT+'/git/trees/'+BASE+'?recursive=1',base);
 x.state.providerMap.set(ROOT+'/git/trees/'+RESULT+'?recursive=1',target);
 const sent=await x.writer.attempt(request(),ID);
 assert.equal(sent.state,'Unknown');
 assert.equal(x.state.postCount,1);
 const verified=await x.verifier.reconcile(request(),ID);
 assert.equal(verified.state,'VerifiedTree');
 assert.equal(verified.changedPaths,1);
 assert.equal(verified.isLive,false);
 assert.equal(x.db.proofs[0].changed_paths,1);
 assert.equal((await x.writer.attempt(request(),ID)).attemptedNow,false);
 assert.equal(x.state.postCount,1);
});

test('WP3-TRBK14 missing JSON without the unchanged-source declaration is denied',async()=>{
 const override={...plan(),
  mediaCount:0,textCount:1,fileCount:1,
  verifiedText:[{path:NOTE,sha:NOTE_SHA,bytes:64}],
  entries:[entry(NOTE,NOTE_SHA)],
 };
 const x=setup({planOverride:override});
 await assert.rejects(x.writer.attempt(request(),ID));
 assert.equal(x.db.stats.writes,0);
 assert.equal(x.state.postCount,0);
});
