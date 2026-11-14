import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionCommitCandidateCustody,
 D6CommitCandidateCustodyError,D6_PUBLISH_COMMIT_CANDIDATE_SQL}
 from '../../experiments/p3/preview/src/d6-production-commit-candidate-custody.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),COMMIT='b'.repeat(40),DIGEST='c'.repeat(64);
const AT=1800000004;
const args=extra=>({operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:MAIN,requestSha256:DIGEST,...extra});
const denied=(promise,code)=>assert.rejects(promise,error=>
 error instanceof D6CommitCandidateCustodyError&&error.code===code);

function db({fence=true,lostAck=false,unavailable=false}={}){
 const fences=fence?[{
  operation_id:ID,step_key:'commit',owner_github_id:REPO.ownerGitHubId,
  repository_id:REPO.id,request_sha256:DIGEST,state:'Unknown',
  created_at:AT,
 }]:[];
 const candidates=[];
 const stats={reads:0,writes:0};
 const DB={prepare(sql){
  if(unavailable)throw Error('DB unavailable');
  return {bind(...bound){return {
   async first(){
    stats.reads++;
    if(sql.includes('FROM d6_provider_step_fences'))
     return fences.find(row=>row.operation_id===bound[0]&&
      row.step_key===bound[1])??null;
    assert(sql.includes('FROM d6_publish_commit_candidates'));
    return candidates.find(row=>row.operation_id===bound[0])??null;
   },
   async run(){
    stats.writes++;
    assert(sql.includes('INSERT OR IGNORE INTO d6_publish_commit_candidates'));
    const [id,owner,repositoryId,ref,sourceRevision,
     requestSha256,resultCommitSha,at]=bound;
    const prior=candidates.find(row=>row.operation_id===id);
    if(!prior)candidates.push({
     operation_id:id,owner_github_id:owner,repository_id:repositoryId,
     ref_name:ref,source_revision:sourceRevision,
     request_sha256:requestSha256,result_commit_sha:resultCommitSha,
     provenance:'server-provider-result',recorded_at:at,
    });
    if(lostAck){lostAck=false;throw Error('D1 ack lost');}
    return {meta:{changes:prior?0:1}};
   },
  };}};},
 };
 return {DB,candidates,fences,stats};
}
const build=(store=db(),enabled=true)=>{
 const custody=createD6ProductionCommitCandidateCustody({
  DB:store.DB,enabled:()=>enabled,now:()=>AT,
 });
 return {store,custody};
};

test('WP3-CUST01 immutable fenced result is only a Candidate, not VerifiedCommit',async()=>{
 const {store,custody}=build();
 const saved=await custody.storeCandidateCommitHint(args({resultCommitSha:COMMIT}));
 assert.equal(saved.resultCommitSha,COMMIT);
 assert.equal(saved.provenance,'server-provider-result');
 assert.equal(saved.verifiedCommit,false);
 assert.equal(saved.canPublish,false);assert.equal(saved.isLive,false);
 assert.equal(store.stats.writes,1);
 assert.equal(store.candidates.length,1);
 const found=await custody.loadCandidateCommitHint(args());
 assert.deepEqual(found,saved);
 assert.match(D6_PUBLISH_COMMIT_CANDIDATE_SQL,/PRIMARY KEY NOT NULL/);
});

test('WP3-CUST02 disabled and malformed metadata reject without DB write',async()=>{
 const h=build(db(),false);
 await denied(h.custody.storeCandidateCommitHint(args({
  resultCommitSha:COMMIT})),'DISABLED');
 assert.equal(h.store.stats.reads,0);
 for(const altered of [
  {repositoryId:0},{ref:'refs/heads/other'},
  {sourceRevision:'bad'},{requestSha256:'bad'},
  {operationId:'bad'},{resultCommitSha:MAIN},
  {resultCommitSha:'z'.repeat(40)},
 ]){
  const x=build();
  await denied(x.custody.storeCandidateCommitHint(
   args({resultCommitSha:COMMIT,...altered})),'UNTRUSTED_CANDIDATE');
  assert.equal(x.store.stats.writes,0);
 }
});

test('WP3-CUST03 no matching Unknown fence forbids candidate custody',async()=>{
 for(const alter of [
  h=>h.fences.length=0,
  h=>h.fences[0].state='VerifiedCommit',
  h=>h.fences[0].request_sha256='f'.repeat(64),
  h=>h.fences[0].owner_github_id=0,
 ]){
  const h=db();alter(h);const x=build(h);
  await denied(x.custody.storeCandidateCommitHint(
   args({resultCommitSha:COMMIT})),'COMMIT_FENCE_UNVERIFIED');
  assert.equal(h.stats.writes,0);
 }
});

test('WP3-CUST04 lost D1 insert acknowledgement is reconciled by reading stored SHA',async()=>{
 const h=db({lostAck:true}),x=build(h);
 await denied(x.custody.storeCandidateCommitHint(
  args({resultCommitSha:COMMIT})),'STORE_UNAVAILABLE');
 assert.equal(h.candidates.length,1);
 const r=await x.custody.loadCandidateCommitHint(args());
 assert.equal(r.resultCommitSha,COMMIT);
 assert.equal((await x.custody.storeCandidateCommitHint(
  args({resultCommitSha:COMMIT}))).resultCommitSha,COMMIT);
 assert.equal(h.candidates.length,1);
});

test('WP3-CUST05 conflicting candidate or corrupt durable row is never substituted',async()=>{
 const x=build();
 await x.custody.storeCandidateCommitHint(args({resultCommitSha:COMMIT}));
 await denied(x.custody.storeCandidateCommitHint(args({
  resultCommitSha:'d'.repeat(40)})),'CANDIDATE_CONFLICT');
 assert.equal(x.store.candidates.length,1);
 x.store.candidates[0].provenance='browser-supplied';
 await denied(x.custody.loadCandidateCommitHint(args()),'CANDIDATE_CONFLICT');
});

test('WP3-CUST06 absent candidate stays null, D1 outage stays Unknown',async()=>{
 const empty=build();
 assert.equal(await empty.custody.loadCandidateCommitHint(args()),null);
 const offline=build(db({unavailable:true}));
 await denied(offline.custody.loadCandidateCommitHint(args()),
  'STORE_UNAVAILABLE');
 await denied(offline.custody.storeCandidateCommitHint(
  args({resultCommitSha:COMMIT})),'STORE_UNAVAILABLE');
});

test('WP3-CUST07 no GitHub mutation or Live authority is exported',()=>{
 const {custody}=build();
 assert.deepEqual(Object.keys(custody).sort(),
  ['storeCandidateCommitHint','loadCandidateCommitHint'].sort());
 assert.equal('attempt' in custody,false);
 assert.equal('publish' in custody,false);
});
