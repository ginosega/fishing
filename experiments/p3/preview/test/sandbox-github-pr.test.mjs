import test from 'node:test';
import assert from 'node:assert/strict';
import {createSandboxPRAdapter,SandboxPRError} from '../src/sandbox-github-pr.mjs';
const SHA='a'.repeat(40),TREE='b'.repeat(40),BLOB='c'.repeat(40),COMMIT='d'.repeat(40);
const ID=1430581407,OP='p3_00000000-1111-4111-8111-123456789abc';
const BRANCH='p3-test-'+OP.slice(3),API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const rejected=code=>e=>(assert.equal(e instanceof SandboxPRError,true),assert.equal(e.code,code),true);
function mock({main=SHA,repoId=ID,privateRepo=true,valid=true,changePath='Gear/Gear.json',
 issueScope=true,branchExists=false,noPR=false,malformedPR=false,disabled=false,mainMovesOnSecond=false}={}){
 const trace=[];let mainReads=0;
 const state={branch:branchExists?COMMIT:null,pr:branchExists&&!noPR?prRecord():null,receipt:null};
 function prRecord(){return {number:15,head:{sha:COMMIT,ref:BRANCH,repo:{id:ID}},
   base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null};}
 const json=(value,status=200)=>({ok:status>=200&&status<300,status,json:async()=>value});
 const request=async(url,init)=>{
  trace.push({url,method:init.method,body:init.body?JSON.parse(init.body):null,headers:init.headers});
  assert(url===API||url.startsWith(API+'/'),'other repo URL forbidden');
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  if(init.method==='GET'&&url===API)return json({id:repoId,full_name:'ginosega/fishing-p3-sandbox',private:privateRepo});
  if(init.method==='GET'&&url.endsWith('/git/ref/heads/main')){
   mainReads++;return json({object:{sha:mainMovesOnSecond&&mainReads>1?'f'.repeat(40):main}});
  }
  if(init.method==='GET'&&url.endsWith('/git/ref/heads/'+BRANCH))
   return state.branch?json({object:{sha:state.branch}}):json({message:'not found'},404);
  if(init.method==='GET'&&url.endsWith('/git/commits/'+SHA))
   return json({sha:SHA,tree:{sha:TREE}});
  if(init.method==='GET'&&url.endsWith('/git/commits/'+COMMIT))
   return json({sha:COMMIT,tree:{sha:TREE},parents:[{sha:SHA}]});
  if(init.method==='GET'&&url.includes('/pulls?'))return json(state.pr?[state.pr]:[]);
  if(init.method==='POST'&&url.endsWith('/git/blobs')){
   assert.equal(init.body.includes('base64'),true);return json({sha:BLOB},201);
  }
  if(init.method==='POST'&&url.endsWith('/git/trees')){
   assert.equal(init.body.includes('Gear/Gear.json'),true);return json({sha:TREE},201);
  }
  if(init.method==='POST'&&url.endsWith('/git/commits')){
   assert.deepEqual(JSON.parse(init.body).parents,[SHA]);return json({sha:COMMIT},201);
  }
  if(init.method==='POST'&&url.endsWith('/git/refs')){
   assert.equal(JSON.parse(init.body).ref,'refs/heads/'+BRANCH);
   if(state.branch)return json({message:'ref exists'},422);
   state.branch=COMMIT;
   return json({ref:'refs/heads/'+BRANCH,object:{sha:COMMIT}},201);
  }
  if(init.method==='POST'&&url.endsWith('/pulls')){
   assert.equal(JSON.parse(init.body).draft,true);
   state.pr=malformedPR?{...prRecord(),head:{sha:'e'.repeat(40),ref:BRANCH,repo:{id:ID}}}:prRecord();
   return json(state.pr,201);
  }
  throw Error('unmocked call: '+init.method+' '+url);
 };
 const issueToken=async args=>{
  trace.push({tokenRequest:args});
  return {repositoryId:issueScope?ID:1350909744,
   permissions:args.permissions,token:'sandbox-installation-token-example'};
 };
 const trustedCandidate=async({baseSha,domain,operationId})=>{
  trace.push({candidate:{baseSha,domain,operationId}});
  return {validated:valid,sourceRevision:baseSha,
   changes:[{action:'write',path:changePath,body:'{"test":true}\n'}]};
 };
 const adapter=createSandboxPRAdapter({request,issueToken,trustedCandidate,publishingGate:()=>!disabled,
  knownReceipt:async()=>state.receipt});
 return {trace,state,adapter};
}
const submit=adapter=>adapter.createDraft({operationId:OP,domain:'gear',expectedMainSha:SHA});
test('P3-P01 sandbox content branch and draft PR only, exact fixed repo',async()=>{
 const s=mock();
 const out=await submit(s.adapter);
 assert.deepEqual(out,{number:15,branch:BRANCH,headSha:COMMIT,state:'open',merged:false,baseSha:SHA,reused:false});
 const posts=s.trace.filter(x=>x.method==='POST').map(x=>x.url.split(API)[1]);
 assert.deepEqual(posts,['/git/blobs','/git/trees','/git/commits','/git/refs','/pulls']);
 assert(s.trace.filter(x=>x.tokenRequest).every(x=>x.tokenRequest.repositoryId===ID));
 assert.equal(s.trace.some(x=>x.url?.includes('/merge')),false);
});
test('P3-P02 replay retrieves same PR without new GitHub writes',async()=>{
 const s=mock();const first=await submit(s.adapter);
 s.state.receipt={repositoryId:ID,baseSha:first.baseSha,headSha:first.headSha};
 const n=s.trace.length;
 const again=await submit(s.adapter);
 assert.equal(again.number,15);assert.equal(again.reused,true);
 assert.equal(s.trace.slice(n).filter(x=>x.method==='POST').length,0);
});
test('P3-P03 existing detached branch fails closed without rewriting or new PR',async()=>{
 const s=mock({branchExists:true,noPR:true});
 await assert.rejects(submit(s.adapter),rejected('BRANCH_RECONCILIATION_REQUIRED'));
 assert.equal(s.trace.filter(x=>x.method==='POST').length,0);
});
test('P3-P04 wrong repo ID, moved main, invalid token or disabled writes do not write',async()=>{
 for(const [opts,code] of [
  [{repoId:1350909744},'REPOSITORY_DENIED'],
  [{main:'f'.repeat(40)},'MAIN_MOVED'],
  [{issueScope:false},'TOKEN_SCOPE_DENIED'],
  [{disabled:true},'WRITES_DISABLED'],
 ]){
  const s=mock(opts);
  await assert.rejects(submit(s.adapter),rejected(code));
  assert.equal(s.trace.filter(x=>x.method==='POST').length,0,code);
 }
});
test('P3-P05 candidate must derive from trusted callback for the exact current main',async()=>{
 for(const [opts,code] of [
  [{valid:false},'CANDIDATE_NOT_VALIDATED'],
  [{changePath:'.github/workflows/test.yml'},'INVALID_PATH'],
  [{changePath:'Gear/../../README.md'},'INVALID_PATH'],
  [{changePath:'Gear/assets/test.png'},'TEXT_ONLY'],
  [{changePath:'KB/Knowledge.json'},'INVALID_PATH'],
 ]){
  const s=mock(opts);
  await assert.rejects(submit(s.adapter),rejected(code));
  assert.equal(s.trace.filter(x=>x.method==='POST').length,0);
 }
});
test('P3-P06 rejected PR head identity never reports success or merges',async()=>{
 const s=mock({malformedPR:true});
 await assert.rejects(submit(s.adapter),rejected('PR_IDENTITY_MISMATCH'));
 assert.equal(s.trace.some(x=>x.url?.includes('/merge')),false);
});
test('P3-P08 pre-existing PR without operation receipt is never trusted as success',async()=>{
 const s=mock({branchExists:true});
 await assert.rejects(submit(s.adapter),rejected('BRANCH_RECONCILIATION_REQUIRED'));
 assert.equal(s.trace.filter(x=>x.method==='POST').length,0);
 const t=mock({branchExists:true});
 t.state.receipt={repositoryId:ID,baseSha:SHA,headSha:'f'.repeat(40)};
 await assert.rejects(submit(t.adapter),rejected('BRANCH_RECONCILIATION_REQUIRED'));
 assert.equal(t.trace.filter(x=>x.method==='POST').length,0);
});
test('P3-P09 moving main before branch creation is a hard stop',async()=>{
 const s=mock({mainMovesOnSecond:true});
 await assert.rejects(submit(s.adapter),rejected('MAIN_MOVED_AFTER_VALIDATION'));
 assert.equal(s.trace.some(x=>x.method==='POST'&&x.url.endsWith('/git/refs')),false);
 assert.equal(s.trace.some(x=>x.method==='POST'&&x.url.endsWith('/pulls')),false);
});
test('P3-P07 alternate repository ID cannot be configured even with fake request',()=>{
 assert.throws(()=>createSandboxPRAdapter({
  request:async()=>{},issueToken:async()=>{},trustedCandidate:async()=>{},
  allowedRepoId:1350909744
 }),rejected('INVALID_CONFIGURATION'));
});
