import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishIntakeMain,
 D6PublishIntakeMainError}
 from '../../experiments/p3/preview/src/d6-production-publish-intake-main.mjs';
import {createD6ProductionPublishWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-publish-write-route-candidate.mjs';

const API='https://api.github.com/repos/'+REPO.name;
const MAIN='a'.repeat(40),TREE='b'.repeat(40);
const ID='123e4567-e89b-42d3-a456-426614174000';
const repo=()=>({id:REPO.id,full_name:REPO.name,
 owner:{id:REPO.ownerGitHubId},default_branch:'main'});
const pointer=()=>({ref:REPO.ref,object:{type:'commit',sha:MAIN}});
const commit=()=>({sha:MAIN,tree:{sha:TREE}});
const req=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  'Origin':ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
  'X-Fish-V3-CSRF':'synthetic-test-verified-by-existing-D2-verifier',
 },body:'{}',
});
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6PublishIntakeMainError&&e.code===code);

function harness({enabled=true,scope='ok',failAt=null,drift=false,
 badRepository=null,badCommit=null,redirect=false,badType=false,
 networkError=false,overlarge=false}={}){
 const state={enabled,scope,failAt,drift,badRepository,badCommit,
  redirect,badType,networkError,overlarge};
 const calls={tokens:0,requests:[],reads:0};
 const path={
  [API]:()=>state.badRepository??repo(),
  [API+'/git/ref/heads/main']:()=>(
   state.drift&&calls.reads===4?
    {...pointer(),object:{type:'commit',sha:'c'.repeat(40)}}:
    pointer()),
  [API+'/git/commits/'+MAIN]:()=>state.badCommit??commit(),
 };
 const issueReadToken=async args=>{
  calls.tokens++;
  assert.deepEqual(args,{
   repositoryId:REPO.id,permissions:{contents:'read'},
  });
  if(state.scope==='throw')throw Error('no token');
  return {repositoryId:REPO.id,
   permissions:{contents:state.scope==='ok'?'read':'write'},
   token:'server-read-only-test-token-abcdef0123456789'};
 };
 const request=async(url,options)=>{
  calls.requests.push({url,options});
  calls.reads++;
  if(state.networkError)throw Error('fetch denied');
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.cache,'no-store');
  assert.equal(options.credentials,'omit');
  const factory=path[url];
  assert.ok(factory,'out-of-scope GitHub URL');
  if(state.failAt===calls.reads)
   return new Response('failed',{status:500,
    headers:{'Content-Type':'text/plain'}});
  if(state.redirect){
   return new Response('redirect',{status:302,headers:{
    Location:'https://evil.example/',
   }});
  }
  if(state.overlarge){
   return new Response('x'.repeat(70000),{status:200,
    headers:{'Content-Type':'application/json'}});
  }
  return new Response(JSON.stringify(factory()),{
   status:200,headers:{
    'Content-Type':state.badType?'text/plain':
     'application/json; charset=utf-8',
   },
  });
 };
 const adapter=createD6ProductionPublishIntakeMain({
  request,issueReadToken,enabled:()=>state.enabled,
 });
 return {adapter,calls,state};
}
const lookup=(x)=>x.adapter.getTrustedCurrentMain({
 repositoryId:REPO.id,ref:REPO.ref,
});

test('WP3-MAIN01 read-only pinned main and immutable commit tree with second ref GET',async()=>{
 const x=harness();
 const result=await lookup(x);
 assert.deepEqual(result,{
  verified:true,repositoryId:REPO.id,ref:REPO.ref,
  sourceRevision:MAIN,treeSha:TREE,
  sourceOnly:true,canPublish:false,isLive:false,
 });
 assert.deepEqual(x.calls.requests.map(x=>x.url),[
  API,API+'/git/ref/heads/main',
  API+'/git/commits/'+MAIN,API+'/git/ref/heads/main',
 ]);
 assert.equal(x.calls.tokens,1);
 for(const call of x.calls.requests){
  assert.ok(call.options.headers.Authorization.startsWith('Bearer '));
  assert.equal(call.options.method,'GET');
 }
});

test('WP3-MAIN02 default-off and forged repository query cannot reach provider',async()=>{
 const x=harness({enabled:false});
 await denied(lookup(x),'DISABLED');
 assert.equal(x.calls.tokens,0);assert.equal(x.calls.reads,0);
 const h=harness();
 for(const altered of [
  {repositoryId:0,ref:REPO.ref},
  {repositoryId:REPO.id,ref:'refs/heads/other'},
  {repositoryId:REPO.id,ref:REPO.ref,extra:true},
  null,
 ]){
  await denied(h.adapter.getTrustedCurrentMain(altered),
   'UNTRUSTED_REPOSITORY');
 }
 assert.equal(h.calls.tokens,0);
});

test('WP3-MAIN03 scoped read credential unavailable or mismatched denies source',async()=>{
 for(const scope of ['throw','write']){
  const x=harness({scope});
  await denied(lookup(x),'TOKEN_DENIED');
  assert.equal(x.calls.reads,0);
 }
});

test('WP3-MAIN04 GitHub repository identity and default branch must match pinned owner',async()=>{
 for(const bad of [
  {...repo(),id:0},
  {...repo(),full_name:'other/fishing'},
  {...repo(),owner:{id:0}},
  {...repo(),default_branch:'dev'},
  {},
 ]){
  const x=harness({badRepository:bad});
  await denied(lookup(x),'REPOSITORY_MISMATCH');
  assert.equal(x.calls.reads,1);
 }
});

test('WP3-MAIN05 source commit and tree integrity are checked before acceptance',async()=>{
 for(const bad of [
  {...commit(),sha:'c'.repeat(40)},
  {...commit(),tree:{sha:'bad'}},
  {...commit(),tree:null},
 ]){
  const x=harness({badCommit:bad});
  await denied(lookup(x),'COMMIT_MISMATCH');
  assert.equal(x.calls.reads,3);
 }
});

test('WP3-MAIN06 changed main ref between reads fails closed',async()=>{
 const x=harness({drift:true});
 await denied(lookup(x),'MAIN_MOVED');
 assert.equal(x.calls.reads,4);
});

test('WP3-MAIN07 unknown, malformed and redirected provider replies never become verified',async()=>{
 for(const variant of [
  {networkError:true},{redirect:true},{badType:true},
  {overlarge:true},{failAt:2},
 ]){
  const x=harness(variant);
  await denied(lookup(x),'SOURCE_UNAVAILABLE');
 }
});

test('WP3-MAIN08 real disabled write route binds initial resolver; never publishes',async()=>{
 const x=harness();
 let auths=0,accepts=0;
 const route=createD6ProductionPublishWriteRouteCandidate({
  enabled:()=>true,writeEnabled:()=>true,
  getTrustedCurrentMain:x.adapter.getTrustedCurrentMain,
  session:{authorizeWrite:async request=>{
   auths++;assert.equal(request.method,'POST');
   return {authorized:true,ownerGitHubId:REPO.ownerGitHubId};
  }},
  receipts:{accept:async(request,{trustedMainSha})=>{
   accepts++;
   assert.equal(trustedMainSha,MAIN);
   assert.equal(await request.text(),'{}');
   return {operationId:ID,status:'Accepted',
    sourceRevision:MAIN,sourceOnly:true,
    canPublish:false,isLive:false};
  }},
  dispatcher:{
   current:async()=>{throw Error('not mounted');},
   beginOne:async()=>{throw Error('not mounted');},
   reconcileOne:async()=>{throw Error('not mounted');},
  },
 });
 const response=await route.serve(req());
 assert.equal(response.status,202);
 const payload=await response.json();
 assert.equal(payload.state,'Accepted');
 assert.equal(payload.isLive,false);
 assert.equal(payload.canPublish,false);
 assert.equal(auths,1);assert.equal(accepts,1);
 assert.equal(x.calls.reads,4);
 assert.equal(x.calls.requests.every(x=>x.options.method==='GET'),true);
 const changed=harness({drift:true});
 const blocked=createD6ProductionPublishWriteRouteCandidate({
  enabled:()=>true,writeEnabled:()=>true,
  getTrustedCurrentMain:changed.adapter.getTrustedCurrentMain,
  session:{authorizeWrite:async()=>({
   authorized:true,ownerGitHubId:REPO.ownerGitHubId,
  })},
  receipts:{accept:async()=>{throw Error('unexpected accept');}},
  dispatcher:{
   current:async()=>{throw Error('unused');},
   beginOne:async()=>{throw Error('unused');},
   reconcileOne:async()=>{throw Error('unused');},
  },
 });
 assert.equal((await blocked.serve(req())).status,503);
 assert.equal(changed.calls.reads,4);
});

test('WP3-MAIN09 no signer, writer, route, merge or deployment capability exported',()=>{
 const x=harness();
 assert.deepEqual(Object.keys(x.adapter),['getTrustedCurrentMain']);
 for(const action of ['post','publish','serve','fetch','write','sign',
  'issueReadToken','merge','deploy'])
  assert.equal(action in x.adapter,false);
});
