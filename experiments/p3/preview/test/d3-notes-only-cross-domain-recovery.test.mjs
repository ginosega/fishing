import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {expectedD3HostedPaths} from '../src/d3-sandbox-host-paths.mjs';
import {createD3SandboxScheduledCoordinator} from '../src/d3-sandbox-scheduled-coordinator.mjs';
import {D3MergeVerificationError} from '../src/d3-merged-receipt-verifier.mjs';

const ID=1430581407,OWNER=265665562;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const OP='p3_11111111-1111-4111-8111-111111111111';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGED='c'.repeat(40);
const TREE='d'.repeat(40),PR=46,RUN=41395435871;
const pth={
 gear:'Gear/Rods-Reels/content/P3 Test Rod D3 Verification.md',
 catches:'Catches/content/p3-test-catch-2026-10-29-synthetic-test-lake-synthetic-bass.md',
};
const records={
 gear:{id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
  name:'P3 Test Rod D3 Verification',manufacturer:'Fixture Only',notes:pth.gear},
 catches:{id:'p3-test-catch-2026-10-29-synthetic-test-lake-synthetic-bass',
  date:'2026-10-30',locationName:'Synthetic test lake',
  lureOrBaitName:'Other',speciesName:'Synthetic shark',
  size:'12 in.',notes:pth.catches},
};
const jsonPath={
 gear:'pwa/Gear/gear.json',
 catches:'pwa/Catches/catches.json',
};
const reply=value=>({ok:true,status:200,redirected:false,
 json:async()=>structuredClone(value)});
async function notesEdit(domain){
 const record=structuredClone(records[domain]);
 const pkg=await prepareChange({
  domain,operation:'edit',id:record.id,record,baseRecord:record,
  sourceRevision:BASE,notesPath:pth[domain],
  baseText:'# Previous fixture notes\\n',text:'# Updated fixture notes\\n',
 });
 assert.equal(pkg.operation,'edit');
 assert.equal(pkg.notes.action,'replace');
 assert.deepEqual(pkg.changes,{set:{},unset:[],baseFields:{}});
 assert.equal(pkg.picture.action,'keep');
 assert.equal(pkg.pictureSequence.action,'keep');
 return pkg;
}
function recover(domain,pkg,{files,wrongMerge=false}={}){
 const expected=expectedD3HostedPaths(pkg,[]);
 const expectedFiles=files??[{filename:'pwa/'+pth[domain],status:'modified'}];
 const trace=[];
 let cas=0;
 const pr={number:PR,state:'closed',merged:true,
  merge_commit_sha:wrongMerge?'f'.repeat(40):MERGED,
  head:{repo:{id:ID},ref:'p3-test-'+OP.slice(3),sha:HEAD},
  base:{repo:{id:ID},ref:'main',sha:BASE}};
 const responses={
  [API]:{id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true},
  [API+'/pulls/'+PR]:pr,
  [API+'/git/ref/heads/main']:{object:{sha:MERGED}},
  [API+'/git/commits/'+HEAD]:{sha:HEAD,tree:{sha:TREE},
   parents:[{sha:BASE}]},
  [API+'/commits/'+MERGED+'?per_page=100']:{
   sha:MERGED,parents:[{sha:BASE}],
   files:expectedFiles,commit:{tree:{sha:TREE},
    message:'FISH118 D3 isolated sandbox Gear/KB publication'},
  },
 };
 let row={operationId:OP,state:'Merging',reasonCode:'merge_attempted',
  mergeSha:null,prNumber:PR,prHeadSha:HEAD,
  mainBaseSha:BASE,workflowRunId:RUN};
 const store={
  nextRecoverableMerge:async()=>OP,
  nextRecoverableMergeFor:async id=>id===OP?OP:null,
  get:async()=>structuredClone(row),
  readSnapshot:async()=>({package:pkg,media:[]}),
  reconcileVerifiedMerge:async evidence=>{
   cas++;trace.push('D1_CAS');
   assert.equal(evidence.operationId,OP);
   assert.equal(evidence.repositoryId,ID);
   assert.equal(evidence.prNumber,PR);
   assert.equal(evidence.prHeadSha,HEAD);
   assert.equal(evidence.mainBaseSha,BASE);
   assert.equal(evidence.mergeSha,MERGED);
   assert.equal(evidence.workflowRunId,RUN);
   row={...row,state:'Deploying',reasonCode:null,mergeSha:MERGED};
   return structuredClone(row);
  },
  nextEligible:async()=>{throw Error('Never start another publication');},
  claim:async()=>{throw Error('Never claim or repeat merge');},
  advance:async()=>{throw Error('Never advance without proof');},
  branchReceipt:async()=>null,saveBranchReceipt:async()=>null,
  markMergeAttempt:async()=>{throw Error('No second merge');},
  saveMergeReceipt:async()=>{throw Error('No new merge receipt');},
 };
 const env={
  D3_RUNNER_ENABLED:'true',D3_WRITE_ENABLED:'true',
  D3_READ_TOKENS_ENABLED:'true',D3_TEST_HOST_ENABLED:'true',
  D3_SANDBOX_REPO_ID:String(ID),OWNER_GITHUB_ID:String(OWNER),
 };
 const coordinator=createD3SandboxScheduledCoordinator({
  env,store,
  issueReadToken:async req=>({
   repositoryId:ID,permissions:req.permissions,token:'exact-read-token-only',
  }),
  issueWriteToken:async()=>{throw Error('No GitHub write token');},
  requestGitHub:async(url,options)=>{
   trace.push(options.method+' '+url);
   assert.equal(options.method,'GET','Recovery can only read GitHub');
   if(url===API+'/pulls/'+PR+'/merge')
    return {ok:true,status:204,redirected:false};
   assert.ok(url in responses,'unexpected GitHub GET: '+url);
   return reply(responses[url]);
  },
  verifyHosted:async()=>{throw Error('Not an active publishing step');},
 });
 return {coordinator,trace,expected,get cas(){return cas},get row(){return row}};
}

for(const domain of ['gear','catches']){
 test('NOTES-ONLY-'+domain.toUpperCase()+'-01 existing Notes edit safely recovers with unchanged catalog',async()=>{
  const pkg=await notesEdit(domain);
  const x=recover(domain,pkg);
  assert.deepEqual(x.expected,[jsonPath[domain],'pwa/'+pth[domain]]);
  const result=await x.coordinator.tick({targetOperationId:OP});
  assert.equal(result.reconciled,true);
  assert.equal(result.state,'Deploying');
  assert.equal(x.row.mergeSha,MERGED);
  assert.equal(x.cas,1);
  assert.equal(x.trace.filter(s=>s.startsWith('GET ')).length,9);
  assert(!x.trace.some(s=>/PUT|POST/.test(s)));
 });
 test('NOTES-ONLY-'+domain.toUpperCase()+'-02 require changed Markdown and reject extra/foreign files',async()=>{
  const pkg=await notesEdit(domain);
  for(const files of [
   [{filename:jsonPath[domain],status:'modified'}],
   [{filename:'pwa/Gear/Other/content/Foreign.md',status:'modified'}],
   [{filename:'src/server.mjs',status:'modified'}],
   [{filename:'pwa/'+pth[domain],status:'modified'},
    {filename:'pwa/KB/kb.json',status:'modified'}],
   [{filename:'pwa/'+pth[domain],status:'removed'}],
   [],
  ]){
   const x=recover(domain,pkg,{files});
   await assert.rejects(x.coordinator.tick({targetOperationId:OP}),
    e=>e instanceof D3MergeVerificationError);
   assert.equal(x.cas,0);
   assert.equal(x.row.state,'Merging');
   assert(x.trace.every(s=>!s.startsWith('PUT ')&&!s.startsWith('POST ')));
  }
 });
 test('NOTES-ONLY-'+domain.toUpperCase()+'-03 no waiver for Add, new Notes, or unchanged Notes',async()=>{
  const pkg=await notesEdit(domain);
  for(const change of [
   {...pkg,operation:'add'},
   {...pkg,notes:{...pkg.notes,action:'create'}},
   {...pkg,notes:{action:'keep'}},
  ]){
   const x=recover(domain,change);
   await assert.rejects(x.coordinator.tick({targetOperationId:OP}));
   assert.equal(x.cas,0);
  }
 });
 test('NOTES-ONLY-'+domain.toUpperCase()+'-04 changed catalog and Notes still verify exactly',async()=>{
  const pkg=await notesEdit(domain);
  const x=recover(domain,pkg,{files:[
   {filename:jsonPath[domain],status:'modified'},
   {filename:'pwa/'+pth[domain],status:'modified'},
  ]});
  assert.equal((await x.coordinator.tick()).state,'Deploying');
  assert.equal(x.cas,1);
 });
 test('NOTES-ONLY-'+domain.toUpperCase()+'-05 wrong already-merged SHA never reconciles',async()=>{
  const pkg=await notesEdit(domain);
  const x=recover(domain,pkg,{wrongMerge:true});
  await assert.rejects(x.coordinator.tick({targetOperationId:OP}));
  assert.equal(x.cas,0);
  assert.equal(x.row.state,'Merging');
 });
}
