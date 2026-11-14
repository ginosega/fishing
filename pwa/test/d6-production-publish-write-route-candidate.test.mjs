import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionPublishWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-publish-write-route-candidate.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const MAIN='a'.repeat(40),API='/api/v3/operations';
const request=(path=API,body='{}',change={})=>{
 const {method='POST',headers={},...rest}=change;
 return new Request(ORIGIN+path,{
  method,headers:{
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   'X-Fish-V3-Intent':'publish',
   'Content-Type':'application/json',
   ...headers,
  },
  ...(method==='POST'?{body}:{}),
  ...rest,
 });
};
const lifecycle=(state='AwaitingAuthorizedWrite')=>({
 operationId:ID,domain:'gear',recordId:'jig',
 sourceRevision:MAIN,
 state,step:state==='VerifiedPr'?null:
  state==='AwaitingAuthorizedWrite'?'tree':'tree',
 verifiedSteps:state==='VerifiedPr'?
  ['tree','branch','commit','advance','pr']:[],
 sourceOnly:true,canPublish:false,isLive:false,
 safeToRetryWrite:false,requiresHostedReleaseProof:true,
 ...(state==='VerifiedPr'?{prNumber:9}:{}),
});
const parse=async response=>JSON.parse(await response.text());
function harness({enabled=true,writeEnabled=true,owner=true,
 mainVerified=true,badReceipt=false,badLifecycle=false,
 authThrows=false}={}){
 const calls={auth:0,main:0,accept:0,current:0,begin:0,reconcile:0};
 const state={enabled,writeEnabled,owner,mainVerified,
  badReceipt,badLifecycle,authThrows};
 const session={authorizeWrite:async req=>{
  calls.auth++;
  assert.equal(req.method,'POST');
  if(state.authThrows)throw Error('auth denied');
  return {authorized:state.owner,ownerGitHubId:REPO.ownerGitHubId};
 }};
 const receipts={accept:async(req,{trustedMainSha})=>{
  calls.accept++;
  assert.equal(req.method,'POST');
  assert.equal(await req.text(),'{}');
  assert.equal(trustedMainSha,MAIN);
  return {operationId:ID,status:'Accepted',sourceRevision:MAIN,
   sourceOnly:true,canPublish:false,
   isLive:state.badReceipt};
 }};
 const dispatcher={
  current:async(req,id)=>{
   calls.current++;assert.equal(id,ID);
   const v=lifecycle();
   return state.badLifecycle?{...v,state:'Live',isLive:true}:v;
  },
  beginOne:async(req,id)=>{
   calls.begin++;assert.equal(id,ID);
   const v=lifecycle('ReconciliationRequired');
   return state.badLifecycle?{...v,canPublish:true}:v;
  },
  reconcileOne:async(req,id)=>{
   calls.reconcile++;assert.equal(id,ID);
   return lifecycle();
  },
 };
 const getTrustedCurrentMain=async query=>{
  calls.main++;
  assert.deepEqual(query,{repositoryId:REPO.id,ref:REPO.ref});
  return {verified:state.mainVerified,
   repositoryId:REPO.id,ref:REPO.ref,sourceRevision:MAIN};
 };
 const route=createD6ProductionPublishWriteRouteCandidate({
  session,receipts,dispatcher,getTrustedCurrentMain,
  enabled:()=>state.enabled,writeEnabled:()=>state.writeEnabled,
 });
 return {route,state,calls};
}

test('WP3-ROUTE01 default-off means 404 with zero session/D1/provider access',async()=>{
 const x=harness({enabled:false});
 for(const path of [API,API+'/'+ID+'/begin',
  API+'/'+ID+'/status',API+'/'+ID+'/reconcile']){
  const response=await x.route.serve(request(path));
  assert.equal(response.status,404);
  assert.equal((await parse(response)).error,'NOT_FOUND');
 }
 assert.deepEqual(x.calls,{auth:0,main:0,accept:0,
  current:0,begin:0,reconcile:0});
});

test('WP3-ROUTE02 same-origin CSRF POST surface rejects foreign methods, path, query, bearer',async()=>{
 const x=harness();
 const bad=[
  new Request(ORIGIN+API,{method:'GET'}),
  request(API+'?admin=true'),
  request(API+'#fragment'),
  request('/api/v3/operations/'+ID+'/publish'),
  request('/api/v3/operations/'+ID+'/step'),
  request('/api/v3/operations/'+ID+'/begin', '{}',{
   headers:{Authorization:'Bearer abc'},
  }),
  request(API,'{}',{headers:{Origin:'https://evil.example'}}),
  request(API,'{}',{headers:{'Sec-Fetch-Site':'cross-site'}}),
  request(API,'{}',{headers:{'X-Fish-V3-Intent':'read'}}),
  request(API,'{}',{headers:{'Content-Type':'text/plain'}}),
  request(API,'{}',{method:'PUT'}),
 ];
 for(const r of bad){
  const response=await x.route.serve(r);
  assert.ok([403,404].includes(response.status));
 }
 assert.deepEqual(x.calls,{auth:0,main:0,accept:0,
  current:0,begin:0,reconcile:0});
});

test('WP3-ROUTE03 unverified D2 owner/CSRF must deny before source and operation',async()=>{
 for(const variant of [{owner:false},{authThrows:true}]){
  const x=harness(variant);
  for(const path of [API,API+'/'+ID+'/status',API+'/'+ID+'/begin']){
   const r=await x.route.serve(request(path));
   assert.equal(r.status,403);
  }
  assert.equal(x.calls.main,0);
  assert.equal(x.calls.accept,0);
  assert.equal(x.calls.current,0);
  assert.equal(x.calls.begin,0);
 }
});

test('WP3-ROUTE04 accept needs independent write flag and trusted canonical main',async()=>{
 const off=harness({writeEnabled:false});
 const r=await off.route.serve(request());
 assert.equal(r.status,503);
 assert.equal(off.calls.main,0);assert.equal(off.calls.accept,0);
 const unverified=harness({mainVerified:false});
 assert.equal((await unverified.route.serve(request())).status,503);
 assert.equal(unverified.calls.main,1);
 assert.equal(unverified.calls.accept,0);
 const accepted=harness();
 const response=await accepted.route.serve(request());
 assert.equal(response.status,202);
 const data=await parse(response);
 assert.deepEqual(data,{
  ok:true,operationId:ID,state:'Accepted',sourceRevision:MAIN,
  canPublish:false,isLive:false,
  requiresIndependentVerification:true,
 });
 assert.equal(accepted.calls.auth,1);
 assert.equal(accepted.calls.main,1);
 assert.equal(accepted.calls.accept,1);
 assert.equal(accepted.calls.begin,0);
 assert.equal(response.headers.get('Cache-Control'),
  'private, no-store, max-age=0');
});

test('WP3-ROUTE05 status, begin and reconcile are separate bounded POSTs',async()=>{
 const x=harness();
 const status=await x.route.serve(request(API+'/'+ID+'/status'));
 assert.equal(status.status,200);
 const s=await parse(status);
 assert.equal(s.state,'AwaitingAuthorizedWrite');
 assert.equal(s.step,'tree');assert.equal(s.isLive,false);
 assert.equal(s.safeToRetryWrite,false);
 assert.deepEqual(s.verifiedSteps,[]);
 const pending=await x.route.serve(request(API+'/'+ID+'/begin'));
 assert.equal(pending.status,202);
 assert.equal((await parse(pending)).state,'ReconciliationRequired');
 const verified=await x.route.serve(request(API+'/'+ID+'/reconcile'));
 assert.equal(verified.status,200);
 assert.equal((await parse(verified)).state,'AwaitingAuthorizedWrite');
 assert.deepEqual(x.calls,{auth:3,main:0,accept:0,
  current:1,begin:1,reconcile:1});
});

test('WP3-ROUTE06 no browser-selected step, identity or arbitrary controls',async()=>{
 const x=harness();
 for(const [path,body] of [
  [API+'/'+ID+'/status','{"step":"pr"}'],
  [API+'/'+ID+'/begin','{"step":"pr"}'],
  [API+'/'+ID+'/reconcile','{"operationId":"'+ID+'"}'],
  [API+'/'+ID+'/begin','[]'],
  [API+'/'+ID+'/begin',''],
 ]){
  const res=await x.route.serve(request(path,body));
  assert.equal(res.status,404);
 }
 assert.equal(x.calls.current,0);
 assert.equal(x.calls.begin,0);
 assert.equal(x.calls.reconcile,0);
});

test('WP3-ROUTE07 no false Live or token exposure on malformed trusted results',async()=>{
 const badReceipt=harness({badReceipt:true});
 assert.equal((await badReceipt.route.serve(request())).status,503);
 const badState=harness({badLifecycle:true});
 assert.equal((await badState.route.serve(
  request(API+'/'+ID+'/status'))).status,503);
 assert.equal((await badState.route.serve(
  request(API+'/'+ID+'/begin'))).status,503);
 const x=harness();
 const json=JSON.stringify(await parse(await x.route.serve(request())));
 for(const secret of ['Authorization','csrfToken','session',
  'githubToken','privateKey','cookie'])assert.equal(
   json.toLowerCase().includes(secret.toLowerCase()),false);
 assert.equal(json.includes('"isLive":true'),false);
});

test('WP3-ROUTE08 revoked write permission allows owner status but no mutation',async()=>{
 const x=harness();
 x.state.writeEnabled=false;
 assert.equal((await x.route.serve(request(API+'/'+ID+'/begin'))).status,503);
 assert.equal((await x.route.serve(request(API+'/'+ID+'/status'))).status,200);
 assert.equal(x.calls.begin,0);
 assert.equal(x.calls.current,1);
 assert.equal(x.calls.main,0);
});

test('WP3-ROUTE09 surface is not a public Worker fetch or runtime initializer',()=>{
 const x=harness();
 assert.deepEqual(Object.keys(x.route),['serve']);
 for(const key of ['fetch','publish','deploy','merge','enable',
  'issueWriteToken','authorizeWrite'])assert.equal(key in x.route,false);
});
