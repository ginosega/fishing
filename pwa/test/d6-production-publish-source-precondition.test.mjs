import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishSourcePrecondition,
 D6PublishSourcePreconditionError}
 from '../../experiments/p3/preview/src/d6-production-publish-source-precondition.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),BASE='b'.repeat(40),BRANCH='c'.repeat(40);
const CHANGED='d'.repeat(40),DIGEST='9'.repeat(64);
const API='https://api.github.com/repos/'+REPO.name;
const MAIN_URL=API+'/git/ref/heads/main';
const REF='refs/heads/fish-v3/publish/'+ID;
const BRANCH_URL=API+'/git/ref/heads/fish-v3/publish/'+ID;
const COMMIT_URL=API+'/git/commits/'+MAIN;
const TOKEN='server-only-installation-token-12345';
const claim=extra=>({
 operationId:ID,ownerGitHubId:REPO.ownerGitHubId,
 repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:MAIN,snapshotSha256:DIGEST,...extra,
});
const json=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json'},
});
function harness({enabled=true,repo={},main=MAIN,tree=BASE,
 branch=BRANCH,requestError=false,tokenScope={contents:'read'},
 responseStatus=200,finalMain=null}={}){
 const history=[],readTokens=[];
 let mainReads=0;
 const request=async(url,options)=>{
  history.push({url,options});
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
  assert.equal(options.body,undefined);
  if(requestError)throw Error('provider unavailable');
  if(url===API)return json({
   id:REPO.id,full_name:REPO.name,default_branch:'main',...repo,
  },responseStatus);
  if(url===MAIN_URL){
   mainReads++;
   return json({ref:REPO.ref,object:{type:'commit',
    sha:mainReads>1&&finalMain?finalMain:main}});
  }
  if(url===COMMIT_URL)return json({sha:MAIN,tree:{sha:tree}});
  if(url===BRANCH_URL)return json({ref:REF,object:{
   type:'commit',sha:branch,
  }});
  throw Error('Unexpected GitHub URL '+url);
 };
 const provider=createD6ProductionPublishSourcePrecondition({
  enabled:()=>enabled,request,
  issueReadToken:async params=>{
   readTokens.push(params);
   return {repositoryId:REPO.id,permissions:tokenScope,token:TOKEN};
  },
 });
 return {provider,history,readTokens};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishSourcePreconditionError&&e.code===code);

test('WP3-PRE01: direct tree callback checks exact main commit and original tree; never Live',async()=>{
 const h=harness();
 const action=claim({stepKey:'tree',baseTreeSha:BASE,requestSha256:DIGEST});
 const result=await h.provider.verifyPrerequisite(action);
 assert.equal(result.verified,true);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.isLive,false);
 assert.equal(result.requestSha256,DIGEST);
 assert.deepEqual(h.history.map(x=>x.url),
  [API,MAIN_URL,COMMIT_URL,MAIN_URL]);
 assert.deepEqual(h.readTokens,[{repositoryId:REPO.id,
  permissions:{contents:'read'}}]);
});

test('WP3-PRE02: branch/commit/advance/PR callback shapes read ONLY operation-bound ref',async()=>{
 const stages=[
  {treeRequestSha256:DIGEST,branchRequestSha256:DIGEST,
   baseTreeSha:BASE},
  {treeRequestSha256:DIGEST,branchRequestSha256:DIGEST,
   commitRequestSha256:DIGEST,resultTreeSha:CHANGED},
  {treeRequestSha256:DIGEST,branchRequestSha256:DIGEST,
   commitRequestSha256:DIGEST,advanceRequestSha256:DIGEST,
   resultTreeSha:CHANGED,resultCommitSha:CHANGED},
  {treeRequestSha256:DIGEST,branchRequestSha256:DIGEST,
   commitRequestSha256:DIGEST,advanceRequestSha256:DIGEST,
   prRequestSha256:DIGEST},
 ];
 for(const stage of stages){
  const h=harness();
  const bound=claim({...stage,branchRef:REF,branchHeadSha:BRANCH});
  const result=await h.provider.verifyCurrentMain(bound);
  assert.equal(result.verified,true);
  assert.equal(result.branchHeadSha,BRANCH);
  assert.deepEqual(h.history.map(x=>x.url),
   [API,MAIN_URL,COMMIT_URL,BRANCH_URL,MAIN_URL]);
  assert(h.history.every(x=>x.options.method==='GET'));
 }
});

test('WP3-PRE03: reject non-owner/repository, arbitrary ref and digest before token',async()=>{
 for(const modified of [
  {repositoryId:0},{ownerGitHubId:0},
  {ref:'refs/heads/evil'},{sourceRevision:'g'.repeat(40)},
  {snapshotSha256:'x'}, {prRequestSha256:'x'},
  {branchRef:'refs/heads/unapproved',branchHeadSha:BRANCH},
  {branchRef:REF}, {branchHeadSha:BRANCH},
  {unexpected:'unsafe'}, {stepKey:'commit'},
 ]){
  const h=harness();
  await denied(h.provider.verify(claim(modified)),'INVALID_CLAIM');
  assert.equal(h.history.length,0);
  assert.equal(h.readTokens.length,0);
 }
});

test('WP3-PRE04: explicit disabled and least-privilege failures deny all GitHub GET',async()=>{
 const off=harness({enabled:false});
 await denied(off.provider.verify(claim()),'DISABLED');
 assert.equal(off.history.length,0);
 for(const scope of [
  {contents:'write'},{contents:'read',pull_requests:'write'},null,
 ]){
  const h=harness({tokenScope:scope});
  await denied(h.provider.verify(claim()),'READ_TOKEN_DENIED');
  assert.equal(h.history.length,0);
 }
});

test('WP3-PRE05: repository, main, base commit and branch drift fail closed',async()=>{
 const scenarios=[
  [{repo:{id:5}},'REPOSITORY_MISMATCH',{}],
  [{main:CHANGED},'MAIN_MOVED',{}],
  [{tree:CHANGED},'BASE_COMMIT_MISMATCH',{baseTreeSha:BASE}],
  [{branch:CHANGED},'BRANCH_MOVED',
   {branchRef:REF,branchHeadSha:BRANCH}],
  [{finalMain:CHANGED},'MAIN_MOVED',{}],
 ];
 for(const [settings,code,extra] of scenarios){
  const h=harness(settings);
  await denied(h.provider.verify(claim(extra)),code);
  assert(h.history.every(x=>x.options.method==='GET'));
 }
});

test('WP3-PRE06: missing/invalid provider proof and transport errors never verify',async()=>{
 for(const settings of [{requestError:true},{responseStatus:302}]){
  const h=harness(settings);
  await denied(h.provider.verify(claim()),'GITHUB_READ_UNKNOWN');
  assert.equal(h.history.length,1);
 }
});

test('WP3-PRE07: no write route, mutation, merge or public publication capability',()=>{
 const h=harness();
 assert.deepEqual(Object.keys(h.provider).sort(),
  ['verify','verifyCurrentMain','verifyPrerequisite'].sort());
 assert.equal('publish' in h.provider,false);
 assert.equal('attempt' in h.provider,false);
});
