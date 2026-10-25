import test from 'node:test';
import assert from 'node:assert/strict';
import {createD2SandboxNormalMerge,D2MergeError} from '../src/d2-sandbox-normal-merge.mjs';
const ID=1430581407,BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const PR=3,BRANCH='p3-test-01234567-1234-4234-8234-123456789abc';
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const receipt={repositoryId:ID,prNumber:PR,expectedHeadSha:HEAD,
 expectedBaseSha:BASE,expectedBranch:BRANCH};
const reason=code=>e=>e instanceof D2MergeError&&e.code===code;
const res=(obj,status=200)=>({ok:status<300,status,redirected:false,json:async()=>obj});
function fixture({enabled=false,badCheck=false,badRepo=false,shiftBase=false,
 wrongPR=false,scopeBad=false,mergeDenied=false,receiptBad=false,
 networkUnknown=false}={}){
 const trace=[];let ready=false,merged=false,recorded=false,main=BASE;
 const pr=()=>({
  number:PR,state:merged?'closed':'open',draft:!ready,
  head:{repo:{id:ID},sha:wrongPR?'f'.repeat(40):HEAD,ref:BRANCH},
  base:{repo:{id:ID},sha:BASE,ref:'main'},
  merged_at:merged?'2026-10-25T00:00:00Z':null,
  merge_commit_sha:merged?MERGE:null,
 });
 const request=async(url,options)=>{
  trace.push({url,method:options.method,body:options.body?JSON.parse(options.body):null});
  assert.equal(options.redirect,'manual');
  assert(url===API||url.startsWith(API+'/'));
  assert.match(options.headers.Authorization,/^Bearer /);
  if(url===API)return res({id:badRepo?123:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main'){
   return res({object:{sha:shiftBase?'e'.repeat(40):main}});
  }
  if(url===API+'/pulls/'+PR)return res(pr());
  if(url===API+'/pulls/'+PR+'/ready_for_review'){
   assert.equal(options.method,'POST');ready=true;return res(pr());
  }
  if(url===API+'/pulls/'+PR+'/merge'){
   assert.equal(options.method,'PUT');
   assert.deepEqual(options.body,{
    sha:HEAD,merge_method:'squash',
    commit_title:'FISH118 D2 isolated sandbox Gear verification',
    commit_message:'Single owned sandbox test operation; no public fishing content',
   });
   if(networkUnknown)throw Error('unknown result');
   if(mergeDenied)return res({},405);
   merged=true;main=MERGE;return res({merged:true,sha:MERGE});
  }
  throw Error('unexpected URL');
 };
 const instance=createD2SandboxNormalMerge({
  request,
  issueWriteToken:async args=>{
   trace.push({tokenRequest:args});
   return {repositoryId:ID,token:'sandbox-scoped-installed-example',
    permissions:{contents:scopeBad?'read':'write',pull_requests:'write'}};
  },
  observeCheck:async r=>{
   trace.push({observed:r});
   return {repositoryId:ID,prNumber:PR,
    headSha:badCheck?'f'.repeat(40):HEAD,baseSha:BASE,
    actionsAppId:15368,checkName:'validate-sandbox-head',
    checkRunId:5544,checkObserved:'success',readyForManualReview:true,
    canMerge:false,canDeploy:false};
  },
  recordMerge:async r=>{
   trace.push({record:r});
   recorded=true;
   return receiptBad?null:{
    repositoryId:ID,prNumber:PR,mergeSha:MERGE,
   };
  },
  enabled:()=>enabled,
 });
 return {instance,trace,get ready(){return ready;},get merged(){return merged;},get recorded(){return recorded;}};
}
test('D2-M01 gate off makes zero GitHub calls and no observer bypass',async()=>{
 const x=fixture();
 await assert.rejects(x.instance.merge(receipt),reason('MERGE_DISABLED'));
 assert.equal(x.trace.length,0);
});
test('D2-M02 verified Actions check, exact PR SHA, GitHub normal squash and durable receipt',async()=>{
 const x=fixture({enabled:true});
 const out=await x.instance.merge(receipt);
 assert.deepEqual(out,{
  repositoryId:ID,prNumber:PR,headSha:HEAD,baseSha:BASE,
  mergeSha:MERGE,checkRunId:5544,sandboxMerged:true,canonicalLive:false,
 });
 assert.equal(x.ready,true);assert.equal(x.merged,true);assert.equal(x.recorded,true);
 assert.deepEqual(x.trace.filter(e=>e.method!=='GET'&&e.method).map(e=>e.method),['POST','PUT']);
 assert.equal(x.trace.some(e=>/force|branch-protection|bypass/i.test(e.url??'')),false);
});
test('D2-M03 forged check/wrong scoped permission/other repository never reaches any write',async()=>{
 for(const cfg of [{badCheck:true,reason:'CHECK_DENIED'},
  {scopeBad:true,reason:'WRITE_SCOPE_DENIED'},
  {badRepo:true,reason:'REPOSITORY_DENIED'},
  {shiftBase:true,reason:'MAIN_MOVED'},
  {wrongPR:true,reason:'PR_CHANGED'}]){
  const x=fixture({enabled:true,...cfg});
  await assert.rejects(x.instance.merge(receipt),reason(cfg.reason));
  assert.equal(x.trace.filter(e=>e.method==='PUT'||e.method==='POST').length,0);
 }
});
test('D2-M04 failed GitHub merge or unknown network result cannot be called Live',async()=>{
 for(const cfg of [{mergeDenied:true},{networkUnknown:true}]){
  const x=fixture({enabled:true,...cfg});
  await assert.rejects(x.instance.merge(receipt),reason('WRITE_RESULT_UNKNOWN'));
  assert.equal(x.recorded,false);
 }
});
test('D2-M05 lack of durable merge receipt fails after merge; no implicit success',async()=>{
 const x=fixture({enabled:true,receiptBad:true});
 await assert.rejects(x.instance.merge(receipt),reason('MERGE_RECEIPT_NOT_DURABLE'));
 assert.equal(x.merged,true);
});
test('D2-M06 browser-selected repo ID, head and branch are not trusted',async()=>{
 for(const wrong of [
  {...receipt,repositoryId:1350909744},
  {...receipt,expectedHeadSha:'x'.repeat(40)},
  {...receipt,expectedBaseSha:HEAD},
  {...receipt,expectedBranch:'refs/heads/main'},
 ]){
  const x=fixture({enabled:true});
  await assert.rejects(x.instance.merge(wrong),reason('INVALID_RECEIPT'));
  assert.equal(x.trace.length,0);
 }
});
