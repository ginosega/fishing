import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionPublishEvidenceGate,D6PublishEvidenceError}
 from '../../experiments/p3/preview/src/d6-production-publish-evidence-gate.mjs';

const REPO=1350909744,OWNER=265665562;
const OP='00000000-0000-4000-8000-000000000001';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const DIGEST='d'.repeat(64),MANIFEST='e'.repeat(64);
const BRANCH='fish-v3/publish/'+OP;
const paths=['Gear/gear.json','Gear/Lures/content/Sample.md'];
const basicOp=()=>({
 operationId:OP,ownerGitHubId:OWNER,repositoryId:REPO,
 ref:'refs/heads/main',sourceRevision:BASE,candidateSha256:DIGEST,
 prNumber:501,state:'Accepted',domain:'gear',operation:'edit',
 recordId:'sample-item',
});
const basicPR=()=>({
 repositoryId:REPO,number:501,
 base:{repoId:REPO,ref:'main',sha:BASE},
 head:{repoId:REPO,ref:BRANCH,sha:HEAD},
 state:'open',merged:false,draft:false,isFork:false,
 changedPaths:paths.slice(),mergeCommitSha:undefined,
});
const validChecks=()=>['classify','validate-content','fishing-merge-ready']
 .map(name=>({name,headSha:HEAD,status:'completed',
  conclusion:'success'}));
const proof=()=>({
 repositoryId:REPO,sourceRevision:BASE,headSha:HEAD,
 candidateSha256:DIGEST,pathsVerified:paths.length,contentOnly:true,
});
const hosted=()=>({
 sourceRevision:MERGE,manifestSha256:MANIFEST,
 releaseId:'verified-v3-release',
 filesVerified:577,pagesAndGatewayBytesMatch:true,
 publicCutoverApproved:false,canPublish:false,
});
function setup(opts={}){
 const state={active:opts.active??true,steps:[],main:opts.main??BASE};
 const op={...basicOp(),...(opts.op??{})};
 const pr={...basicPR(),...(opts.pr??{})};
 const checks=opts.checks??validChecks();
 const cand={...proof(),...(opts.candidate??{})};
 const live={...hosted(),...(opts.hosted??{})};
 const providers={
  readOperation:async id=>{
   state.steps.push('operation');
   if(opts.throwAt==='operation')throw Error('private D1 detail');
   assert.equal(id,OP);return op;
  },
  readPullRequest:async number=>{
   state.steps.push('pr');
   if(opts.throwAt==='pr')throw Error('private App detail');
   assert.equal(number,501);return pr;
  },
  readChecks:async sha=>{
   state.steps.push('checks');assert.equal(sha,HEAD);
   return checks;
  },
  readMain:async()=>{
   state.steps.push('main');return {repositoryId:REPO,
    ref:'refs/heads/main',sha:state.main};
  },
  verifyCandidate:async args=>{
   state.steps.push('candidate');
   assert.deepEqual(args,{
    operationId:OP,prNumber:501,headSha:HEAD,
    originalSourceRevision:BASE,expectedCandidateSha256:DIGEST,
   });
   if(opts.disableDuringProof)state.active=false;
   return cand;
  },
  verifyHosted:async args=>{
   state.steps.push('hosted');
   assert.deepEqual(args,{expectedSourceRevision:MERGE});
   if(opts.throwAt==='hosted')throw Error('private hosted location');
   return live;
  },
 };
 const gate=createD6ProductionPublishEvidenceGate({
  ...providers,enabled:()=>state.active,
 });
 return {gate,state,op,pr,checks,cand,live};
}
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6PublishEvidenceError&&e.code===code);

test('D6-EVIDENCE01 defaults OFF with zero provider/network reads',async()=>{
 const s=setup({active:false});
 await denied(s.gate.reviewBeforeMerge(OP),'DISABLED');
 await denied(s.gate.reviewAfterMerge(OP),'DISABLED');
 assert.deepEqual(s.state.steps,[]);
 assert.deepEqual(Object.keys(s.gate),[
  'reviewBeforeMerge','reviewAfterMerge',
 ]);
});

test('D6-EVIDENCE02 premerge validates exact main/head/checks and is never permission',async()=>{
 const s=setup();
 const r=await s.gate.reviewBeforeMerge(OP);
 assert.equal(r.readyForFutureMergeReview,true);
 assert.equal(r.verifiedHeadSha,HEAD);
 assert.equal(r.checkedMainSha,BASE);
 assert.equal(r.canMerge,false);assert.equal(r.canPublish,false);
 assert.equal(r.isLive,false);assert.equal(r.sourceOnly,true);
 assert.deepEqual(s.state.steps,[
  'operation','pr','candidate','checks','main',
 ]);
});

test('D6-EVIDENCE03 Unknown outcome cannot become merge-ready',async()=>{
 const s=setup({op:{state:'Unknown'}});
 await denied(s.gate.reviewBeforeMerge(OP),'UNKNOWN_OUTCOME');
 assert.deepEqual(s.state.steps,['operation']);
});

test('D6-EVIDENCE04 forged owner/repo/operation rejected before provider PR',async()=>{
 for(const op of [
  {ownerGitHubId:0},{repositoryId:1430581407},
  {ref:'refs/heads/fake'}, {sourceRevision:'bad'},
  {candidateSha256:'invalid'}, {prNumber:0},
  {domain:'catches'}, {state:'Live'},
 ]){
  const s=setup({op});
  await denied(s.gate.reviewBeforeMerge(OP),'UNTRUSTED_OPERATION');
  assert.deepEqual(s.state.steps,['operation']);
 }
});

test('D6-EVIDENCE05 PR must be exact same repo, branch and current head',async()=>{
 for(const pr of [
  {repositoryId:1},{number:502},
  {head:{repoId:REPO,ref:'foreign-branch',sha:HEAD}},
  {head:{repoId:1430581407,ref:BRANCH,sha:HEAD}},
  {base:{repoId:REPO,ref:'release',sha:BASE}},
  {base:{repoId:REPO,ref:'main',sha:MERGE}},
  {isFork:true},{draft:true},{state:'closed'},
  {merged:true},{head:{repoId:REPO,ref:BRANCH,sha:BASE}},
 ]){
  const s=setup({pr});
  await denied(s.gate.reviewBeforeMerge(OP),'UNTRUSTED_PULL_REQUEST');
  assert.deepEqual(s.state.steps,['operation','pr']);
 }
});

test('D6-EVIDENCE06 only authorized content JSON/Markdown paths may change',async()=>{
 for(const changedPaths of [
  ['README.md'],['Catches/catches.json'],
  ['Gear/gear.json','pwa/src/ui.mjs'],
  ['Gear/gear.json','Gear/Lures/assets/secret.png'],
  ['Gear/gear.json','Gear/../KB/kb.json'],
  ['Gear/gear.json','Gear/gear.json'],
  ['Gear/gear.json','gear/gear.json'],
  ['Gear/Lures/content/Sample.md'],
  ['Gear/gear.json','Gear/Lures/content/Sample.md',
   'Gear/Lures/content/sample.md'],
 ]){
  const s=setup({pr:{changedPaths}});
  await denied(s.gate.reviewBeforeMerge(OP),'UNTRUSTED_DIFF');
  assert.deepEqual(s.state.steps,['operation','pr']);
 }
});

test('D6-EVIDENCE07 candidate independently reconstructed from PR tree bytes',async()=>{
 for(const candidate of [
  {candidateSha256:'f'.repeat(64)}, {sourceRevision:MERGE},
  {headSha:BASE},{repositoryId:1430581407},
  {pathsVerified:1},{contentOnly:false},
 ]){
  const s=setup({candidate});
  await denied(s.gate.reviewBeforeMerge(OP),'CANDIDATE_UNVERIFIED');
  assert.deepEqual(s.state.steps,['operation','pr','candidate']);
 }
});

test('D6-EVIDENCE08 all exact-HEAD required checks must pass, never skipped',async()=>{
 for(const checks of [
  validChecks().slice(1),
  validChecks().map(x=>x.name==='validate-content'?
   {...x,conclusion:'skipped'}:x),
  validChecks().map(x=>x.name==='fishing-merge-ready'?
   {...x,conclusion:'failure'}:x),
  validChecks().map(x=>({...x,headSha:BASE})),
  [...validChecks(),validChecks()[0]],
  validChecks().map(x=>({...x,status:'in_progress'})),
 ]){
  const s=setup({checks});
  await denied(s.gate.reviewBeforeMerge(OP),'CHECKS_UNVERIFIED');
  assert.equal(s.state.steps.includes('main'),false);
 }
});

test('D6-EVIDENCE09 main advancing after CI blocks merge review',async()=>{
 const s=setup({main:MERGE});
 await denied(s.gate.reviewBeforeMerge(OP),'MAIN_MOVED');
 assert.equal(s.state.steps.at(-1),'main');
});

test('D6-EVIDENCE10 merged PR and full hosted bytes are read-only proof',async()=>{
 const s=setup({main:MERGE,pr:{
  state:'closed',merged:true,mergeCommitSha:MERGE,
 }});
 const r=await s.gate.reviewAfterMerge(OP);
 assert.equal(r.mergedAndHostedEvidenceVerified,true);
 assert.equal(r.mergedSourceRevision,MERGE);
 assert.equal(r.verifiedReleaseId,'verified-v3-release');
 assert.equal(r.verifiedFileCount,577);
 assert.equal(r.canPublish,false);assert.equal(r.isLive,false);
 assert.deepEqual(s.state.steps,[
  'operation','pr','candidate','checks','main','hosted','main',
 ]);
});

test('D6-EVIDENCE11 merged proof still excludes foreign/moved PR',async()=>{
 for(const pr of [
  {state:'closed',merged:false,mergeCommitSha:MERGE},
  {state:'open',merged:true,mergeCommitSha:MERGE},
  {state:'closed',merged:true,mergeCommitSha:'invalid'},
  {state:'closed',merged:true,mergeCommitSha:MERGE,isFork:true},
 ]){
  const s=setup({main:MERGE,pr});
  await denied(s.gate.reviewAfterMerge(OP),'UNTRUSTED_PULL_REQUEST');
  assert.deepEqual(s.state.steps,['operation','pr']);
 }
});

test('D6-EVIDENCE12 hosted proof must pin merged SHA, bytes and V3 identity',async()=>{
 for(const patch of [
  {sourceRevision:HEAD},{manifestSha256:'bad'},
  {filesVerified:0},{pagesAndGatewayBytesMatch:false},
  {publicCutoverApproved:true},{canPublish:true},{releaseId:''},
 ]){
  const s=setup({main:MERGE,pr:{
   state:'closed',merged:true,mergeCommitSha:MERGE,
  },hosted:patch});
  await denied(s.gate.reviewAfterMerge(OP),'HOSTED_UNVERIFIED');
  assert.equal(s.state.steps.at(-1),'hosted');
 }
});

test('D6-EVIDENCE13 provider exceptions fail closed without secret leakage',async()=>{
 for(const stage of ['operation','pr']){
  const s=setup({throwAt:stage});
  await denied(s.gate.reviewBeforeMerge(OP),'EVIDENCE_UNAVAILABLE');
 }
 const s=setup({main:MERGE,
  pr:{state:'closed',merged:true,mergeCommitSha:MERGE},
  throwAt:'hosted'});
 await denied(s.gate.reviewAfterMerge(OP),'EVIDENCE_UNAVAILABLE');
});

test('D6-EVIDENCE14 disable/revocation mid-verification cannot authorize',async()=>{
 const s=setup({disableDuringProof:true});
 await denied(s.gate.reviewBeforeMerge(OP),'DISABLED');
 assert.equal(s.state.steps.at(-1),'main');
});

test('D6-EVIDENCE15 no arbitrary operation identifier or invalid adapter',async()=>{
 const s=setup();
 await denied(s.gate.reviewBeforeMerge('../fake'),'INVALID_OPERATION');
 assert.deepEqual(s.state.steps,[]);
 assert.throws(()=>createD6ProductionPublishEvidenceGate({
  readOperation:()=>{},readPullRequest:()=>{},readChecks:()=>{},
  readMain:()=>{},verifyCandidate:()=>{},verifyHosted:null,
 }),e=>e instanceof D6PublishEvidenceError&&e.code==='INVALID_CONFIG');
});
