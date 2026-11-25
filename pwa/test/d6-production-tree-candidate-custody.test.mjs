import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {
 D6_PUBLISH_TREE_CANDIDATE_SQL,
 createD6ProductionTreeCandidateCustody,
 D6TreeCandidateCustodyError,
} from '../../experiments/p3/preview/src/d6-production-tree-candidate-custody.mjs';
const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),TREE='b'.repeat(40),HASH='c'.repeat(64);
const NOW=1800000002;
const args=(change={})=>({
 operationId:ID,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:MAIN,requestSha256:HASH,...change,
});
function fixture({enabled=true,hasFence=true,lostAck=false}={}){
 const state={enabled,reads:0,writes:0,lostAck};
 const fence=hasFence?{
  operation_id:ID,step_key:'tree',
  owner_github_id:REPO.ownerGitHubId,repository_id:REPO.id,
  request_sha256:HASH,state:'Unknown',created_at:NOW-1,
 }:null;
 let saved=null;
 const DB={prepare(sql){return {bind(...params){return {
  async first(){
   state.reads++;
   if(sql.includes('FROM d6_provider_step_fences'))return fence;
   if(sql.includes('FROM d6_publish_tree_candidates'))return saved;
   throw Error('unapproved D1 read');
  },
  async run(){
   state.writes++;
   assert(sql.startsWith('INSERT OR IGNORE INTO d6_publish_tree_candidates'));
   const [id,owner,repo,ref,revision,digest,sha,at]=params;
   const previous=saved;
   if(!saved)saved={
    operation_id:id,owner_github_id:owner,repository_id:repo,
    ref_name:ref,source_revision:revision,
    request_sha256:digest,result_tree_sha:sha,
    provenance:'server-provider-result',recorded_at:at,
   };
   if(state.lostAck){state.lostAck=false;throw Error('lost D1 ack');}
   return {meta:{changes:previous?0:1}};
  },
 };}};}};
 const c=createD6ProductionTreeCandidateCustody({
  DB,enabled:()=>state.enabled,now:()=>NOW,
 });
 return {c,state,read:()=>saved};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6TreeCandidateCustodyError&&e.code===code);
test('WP3-TC01 source schema and source-only default-off denies before D1',async()=>{
 assert.match(D6_PUBLISH_TREE_CANDIDATE_SQL,/PRIMARY KEY/);
 assert.match(D6_PUBLISH_TREE_CANDIDATE_SQL,/server-provider-result/);
 const x=fixture({enabled:false});
 await denied(x.c.storeCandidateTreeHint(args({resultTreeSha:TREE})),'DISABLED');
 assert.equal(x.state.reads,0);assert.equal(x.state.writes,0);
 assert.deepEqual(Object.keys(x.c),[
  'storeCandidateTreeHint','loadCandidateTreeHint',
 ]);
});
test('WP3-TC02 acknowledged Unknown fence retains only server result SHA',async()=>{
 const x=fixture(),r=await x.c.storeCandidateTreeHint(
  args({resultTreeSha:TREE}));
 assert.equal(r.resultTreeSha,TREE);assert.equal(r.verifiedTree,false);
 assert.equal(r.isLive,false);assert.equal(r.provenance,'server-provider-result');
 assert.equal(x.state.writes,1);
 const loaded=await x.c.loadCandidateTreeHint(args());
 assert.deepEqual(loaded,r);
 assert.equal(x.read().result_tree_sha,TREE);
});
test('WP3-TC03 idempotent same candidate, conflicting SHA rejects without overwrite',async()=>{
 const x=fixture();
 await x.c.storeCandidateTreeHint(args({resultTreeSha:TREE}));
 await x.c.storeCandidateTreeHint(args({resultTreeSha:TREE}));
 await denied(x.c.storeCandidateTreeHint(args({
  resultTreeSha:'e'.repeat(40)})),'CANDIDATE_CONFLICT');
 assert.equal(x.read().result_tree_sha,TREE);
});
test('WP3-TC04 lost D1 custody acknowledgement never counts as stored success',async()=>{
 const x=fixture({lostAck:true});
 await denied(x.c.storeCandidateTreeHint(args({
  resultTreeSha:TREE})),'STORE_UNAVAILABLE');
 assert.equal(x.read().result_tree_sha,TREE);
 assert.equal((await x.c.loadCandidateTreeHint(args())).resultTreeSha,TREE);
});
test('WP3-TC05 missing fence and foreign identity deny without D1 mutation',async()=>{
 const no=fixture({hasFence:false});
 await denied(no.c.storeCandidateTreeHint(args({resultTreeSha:TREE})),
  'TREE_FENCE_UNVERIFIED');
 assert.equal(no.state.writes,0);
 const x=fixture();
 for(const invalid of [
  {repositoryId:3},{ref:'refs/heads/other'},
  {operationId:'not-a-uuid'},{sourceRevision:'x'},
  {requestSha256:'malformed'},{resultTreeSha:MAIN},
 ]){
  await denied(x.c.storeCandidateTreeHint(args({
   resultTreeSha:TREE,...invalid})),'UNTRUSTED_CANDIDATE');
 }
 assert.equal(x.state.writes,0);
});
test('WP3-TC06 no claim, no hints, no replay authority',async()=>{
 const x=fixture();
 assert.equal(await x.c.loadCandidateTreeHint(args()),null);
 for(const key of ['attempt','publish','retry','fetch','deploy',
  'issueWriteToken','migrate','merge','reconcile'])
  assert.equal(key in x.c,false);
});
