import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../src/handoff.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionVerifiedMediaOperationBinding}
 from '../../experiments/p3/preview/src/d6-production-verified-media-operation-binding.mjs';
import {createD6ProductionRequestBoundPublisher}
 from '../../experiments/p3/preview/src/d6-production-request-bound-publisher.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),TREE='b'.repeat(40),NEW_TREE='c'.repeat(40);
const DIGEST='d'.repeat(64),AT=1800000030;
const req=(method='POST')=>new Request(
 ORIGIN+'/api/v3/operations/'+ID+'/status',{
 method,headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
  'X-Fish-V3-CSRF':'test-only',
 },...(method==='POST'?{body:'{}'}:{}),
});
async function fixture({original=false}={}){
 const path='Gear/Lures/assets/example-jig.png';
 const pkg=await prepareChange({
  domain:'gear',operation:'add',id:'example-jig',
  record:{id:'example-jig',category:'lures',type:'Jigs',
   name:'Example Jig'},sourceRevision:MAIN,
  ...(original?{
   pictureAction:'add',picturePath:path,
   pictureFile:{path,bytes:70,sha256:'f'.repeat(64)},
  }:{}),
 });
 const pendingOriginals=expectedD6CanonicalMedia(pkg);
 const operation={
  operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
  repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,snapshotSha256:'e'.repeat(64),
  domain:'gear',recordId:'example-jig',
  operation:'add',state:'Accepted',
 };
 return {operation,package:pkg,pendingOriginals,
  mediaTickets:[],requiresSignedStaging:original,
  requiresIndependentBlobReadback:original,
  sourceOnly:true,canPublish:false,isLive:false};
}
async function harness({enabled=true,writeEnabled=true,
 owner=true,approve=false,original=false,
 revokeAtAttempt=false,invalidSteps=false}={}){
 const stored=await fixture({original});
 const stats={auth:0,createSteps:0,attempts:[],
  reconciles:[],d1Read:0,d1Writes:0,issued:0,blobReads:0};
 const flags={enabled,writeEnabled,owner,approve};
 const rows={fences:new Map(),proofs:new Map()};
 const session={authorizeWrite:async request=>{
  stats.auth++;
  assert.equal(request.headers.get('X-Fish-V3-Intent'),'publish');
  if(!flags.owner)throw Error('owner denied');
  return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const binding=createD6ProductionVerifiedMediaOperationBinding({
  session,enabled:()=>flags.enabled,
  loadAcceptedOperation:async({operationId,ownerGitHubId})=>{
   assert.equal(operationId,ID);
   assert.equal(ownerGitHubId,REPO.ownerGitHubId);
   return stored;
  },
  issuer:{issue:async()=>{
   stats.issued++;
   throw Error('No verified original Git blob available');
  }},
  verifyTicket:async()=>{throw Error('ticket must not be used');},
  readGitBlob:async()=>{stats.blobReads++;throw Error('no Git writes');},
 });
 const DB={prepare(sql){return{bind(...args){return{
  async first(){
   stats.d1Read++;
   if(sql.includes('FROM d6_provider_step_fences'))
    return rows.fences.get(args[1])??null;
   for(const k of ['tree','branch','commit','advance','pr']){
    const table=k==='tree'?'atomic_tree_verified':'publish_'+k+'_verified';
    if(sql.includes('FROM d6_'+table))
     return rows.proofs.get(k)??null;
   }
   throw Error('unexpected D1 table');
  },
  async run(){stats.d1Writes++;throw Error('unapproved D1 write');},
 };}};}};
 const keys=['tree','branch','commit','advance','pr'];
 const createStepSet=async({loadAcceptedOperation,operationId,authRequest})=>{
  stats.createSteps++;
  assert.equal(operationId,ID);
  assert.equal(authRequest.method,'POST');
  assert.equal(typeof loadAcceptedOperation,'function');
  if(invalidSteps)return {};
  return {
   coordinators:Object.fromEntries(keys.map(step=>[
    step,{attempt:async()=>{
     stats.attempts.push(step);
     if(revokeAtAttempt)flags.owner=false;
     if(step==='tree'){
      rows.fences.set('tree',{
       operation_id:ID,step_key:'tree',
       owner_github_id:REPO.ownerGitHubId,
       repository_id:REPO.id,request_sha256:DIGEST,
       state:'Unknown',created_at:1800000001,
      });
     }
     return {operationId:ID,state:'Unknown',stepKey:step,
      sourceOnly:true,canPublish:false,isLive:false};
    }},
   ])),
   reconcilers:Object.fromEntries(keys.map(step=>[
    step,{reconcile:async()=>{
     stats.reconciles.push(step);
     if(step==='tree')rows.proofs.set('tree',{
      operation_id:ID,owner_github_id:REPO.ownerGitHubId,
      repository_id:REPO.id,request_sha256:DIGEST,
      state:'VerifiedTree',verified_at:1800000002,
      source_revision:MAIN,base_tree_sha:TREE,
      result_tree_sha:NEW_TREE,changed_paths:1,
     });
     return {operationId:ID,state:'VerifiedTree',
      sourceOnly:true,isLive:false};
    }},
   ])),
  };
 };
 const publisher=createD6ProductionRequestBoundPublisher({
  DB,session,verifiedMediaBinding:binding,
  createStepSet,
  enabled:()=>flags.enabled,
  writeEnabled:()=>flags.writeEnabled,
  authorizeStep:async claim=>{
   assert.equal(claim.operationId,ID);
   return flags.approve;
  },
  now:()=>AT,
 });
 return {publisher,stats,flags,rows};
}
const denies=async promise=>assert.rejects(promise);

test('WP3-BOUND01 disabled publisher touches no auth, D1 or coordinator',async()=>{
 const x=await harness({enabled:false});
 await denies(x.publisher.current(req(),ID));
 assert.equal(x.stats.auth,0);
 assert.equal(x.stats.createSteps,0);
 assert.equal(x.stats.d1Read,0);
});

test('WP3-BOUND02 actual verified-media binding for zero-original Gear gives one D1 status',async()=>{
 const x=await harness();
 const s=await x.publisher.current(req(),ID);
 assert.equal(s.operationId,ID);
 assert.equal(s.state,'AwaitingAuthorizedWrite');
 assert.equal(s.step,'tree');
 assert.equal(s.isLive,false);
 assert.deepEqual(s.verifiedSteps,[]);
 assert.equal(x.stats.issued,0);
 assert.equal(x.stats.blobReads,0);
 assert.equal(x.stats.attempts.length,0);
 assert.equal(x.stats.d1Writes,0);
});

test('WP3-BOUND03 owner denied before request media binding or D1',async()=>{
 const x=await harness({owner:false});
 await denies(x.publisher.current(req(),ID));
 assert.equal(x.stats.createSteps,0);
 assert.equal(x.stats.d1Read,0);
 assert.equal(x.stats.issued,0);
});

test('WP3-BOUND04 absent verified originals prevent ANY publishing operation',async()=>{
 const x=await harness({original:true,approve:true});
 await denies(x.publisher.current(req(),ID));
 await denies(x.publisher.beginOne(req(),ID));
 assert.ok(x.stats.issued>0);
 assert.equal(x.stats.attempts.length,0);
 assert.equal(x.stats.blobReads,0);
 assert.equal(x.stats.d1Writes,0);
});

test('WP3-BOUND05 separate write flag blocks attempt AND reconciliation before D1',async()=>{
 const x=await harness({writeEnabled:false,approve:true});
 await denies(x.publisher.beginOne(req(),ID));
 await denies(x.publisher.reconcileOne(req(),ID));
 assert.equal(x.stats.createSteps,0);
 assert.equal(x.stats.d1Read,0);
 assert.equal((await x.publisher.current(req(),ID)).state,
  'AwaitingAuthorizedWrite');
});

test('WP3-BOUND06 exact one-step approval then Unknown, no auto-repeat',async()=>{
 const x=await harness({approve:true});
 const attempted=await x.publisher.beginOne(req(),ID);
 assert.equal(attempted.state,'ReconciliationRequired');
 assert.equal(attempted.step,'tree');
 assert.deepEqual(x.stats.attempts,['tree']);
 assert.equal(x.stats.d1Writes,0);
 await denies(x.publisher.beginOne(req(),ID));
 assert.deepEqual(x.stats.attempts,['tree']);
});

test('WP3-BOUND07 independent reconciliation confirms tree, never starts branch',async()=>{
 const x=await harness({approve:true});
 await x.publisher.beginOne(req(),ID);
 const reconciled=await x.publisher.reconcileOne(req(),ID);
 assert.equal(reconciled.state,'AwaitingAuthorizedWrite');
 assert.equal(reconciled.step,'branch');
 assert.deepEqual(reconciled.verifiedSteps,['tree']);
 assert.deepEqual(x.stats.attempts,['tree']);
 assert.deepEqual(x.stats.reconciles,['tree']);
 assert.equal(x.stats.d1Writes,0);
});

test('WP3-BOUND08 refused step approval and bad factory never write',async()=>{
 const no=await harness({approve:false});
 await denies(no.publisher.beginOne(req(),ID));
 assert.deepEqual(no.stats.attempts,[]);
 const bad=await harness({invalidSteps:true,approve:true});
 await denies(bad.publisher.beginOne(req(),ID));
 assert.equal(bad.stats.d1Read,0);
 assert.deepEqual(bad.stats.attempts,[]);
});

test('WP3-BOUND09 revocation, invalid request, and public surface fail closed',async()=>{
 const x=await harness({approve:true,revokeAtAttempt:true});
 await denies(x.publisher.beginOne(req(),ID));
 assert.deepEqual(x.stats.attempts,['tree']);
 assert.equal(x.stats.d1Writes,0);
 const y=await harness();
 await denies(y.publisher.current(req('GET'),ID));
 await denies(y.publisher.current(req(),'not-an-id'));
 assert.equal(y.stats.d1Read,0);
 assert.deepEqual(Object.keys(y.publisher),
  ['current','beginOne','reconcileOne']);
 for(const k of ['fetch','deploy','merge','token','sign','ticket',
  'issueWriteToken','loadAcceptedOperation','replay'])
  assert.equal(k in y.publisher,false);
});
