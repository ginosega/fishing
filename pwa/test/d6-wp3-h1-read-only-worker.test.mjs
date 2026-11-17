import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{createD6Wp3H1ReadOnlyWorker,
 D6_WP3_H1_WORKER_ORIGIN as ORIGIN}
 from '../server/d6-wp3-h1-read-only-worker.mjs';
import {D6_WP2_STAGING_ORIGIN as WP2}
 from '../src/d6-public-reader.mjs';
import {D6_WP3_ISOLATED_PAGES_BASE as PAGES}
 from '../server/d6-pages-path-gateway.mjs';

const make=(overrides={})=>({
 D6_WP3_H1_READ_ONLY_ENABLED:'true',
 D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
 D6_OWNER_GITHUB_ID:'265665562',
 D6_REPOSITORY_ID:'1350909744',
 D6_ORIGIN:ORIGIN,
 D6_WP3_ISOLATED_READ_ENABLED:'true',
 D6_WP3_ISOLATED_PAGES_ENABLED:'true',
 D6_WP3_READ_PROFILE_ENABLED:'true',
 D6_WP2_STAGING_ENABLED:'false',
 D6_ISOLATED_PAGES_ENABLED:'false',
 D6_STATIC_ENABLED:'true',
 D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:'false',
 D6_WP3_RUNTIME_ENABLED:'false',
 D6_WP3_WRITE_ENABLED:'false',
 D6_WP3_MOUNT_ENABLED:'false',
 ...overrides,
});
const req=(path='/fishing/release.json',host=ORIGIN,method='GET')=>
 new Request(host+path,{method});
function fixture(){
 const network=[],db=[];
 const h=createD6Wp3H1ReadOnlyWorker({
  network:async(url,options)=>{
   network.push({url,options});
   if(url===PAGES+'release.json')return new Response(
    '{"d6ReaderCandidate":true}',{
     status:200,headers:{'Content-Type':'application/json'},
    });
   throw Error('No provider grant');
  },
 });
 return {h,network,db};
}

test('WP3-H1W01 default OFF before D1, network or cookie use',async()=>{
 const {h,network}=fixture();
 for(const env of [{},make({D6_WP3_H1_READ_ONLY_ENABLED:undefined}),
  make({D6_PRODUCTION_ENABLED:undefined})]){
  for(const path of ['/fishing/release.json','/auth/start',
   '/session','/api/v3/operations','/api/v3/media']){
   const response=await h.fetch(req(path),env);
   assert.equal(response.status,503);
   assert.equal(response.headers.get('Cache-Control'),
    'private, no-store, max-age=0');
  }
 }
 assert.equal(network.length,0);
});

test('WP3-H1W02 exact isolated Pages read via original OAuth/read runtime only',async()=>{
 const {h,network}=fixture();
 const response=await h.fetch(req(),make());
 assert.equal(response.status,200);
 assert.equal(await response.text(),'{"d6ReaderCandidate":true}');
 assert.equal(network.length,1);
 assert.equal(network[0].url,PAGES+'release.json');
 assert.equal(network[0].options.method,'GET');
 assert.equal(network[0].options.redirect,'manual');
 assert.equal(network[0].options.credentials,'omit');
 assert.equal(network[0].options.cache,'no-store');
 assert.equal(network[0].options.headers?.Authorization,undefined);
});

test('WP3-H1W03 H1 never exposes operations or media even with read and owner flags',async()=>{
 const {h,network}=fixture(),env=make({
  D6_SESSION_ENABLED:'true',D6_OAUTH_ENABLED:'true',
  D6_SOURCE_ENABLED:'true',D6_READ_TOKEN_ENABLED:'true',
  D6_SIGNER_ENABLED:'true',
 });
 for(const path of ['/api/v3/operations',
  '/api/v3/operations/123e4567-e89b-42d3-a456-426614174000/begin',
  '/api/v3/media','/api/v3/media/reconcile']){
  for(const method of ['GET','POST','PATCH']){
   const response=await h.fetch(req(path,ORIGIN,method),env);
   assert.equal(response.status,404);
  }
 }
 assert.equal(network.length,0);
});

test('WP3-H1W04 any write-enable config kills whole host before providers',async()=>{
 for(const flag of ['D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
  'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
  'D6_WP3_MOUNT_ENABLED']){
  const {h,network}=fixture();
  const response=await h.fetch(req(),make({[flag]:'true'}));
  assert.equal(response.status,503,flag);
  assert.equal(network.length,0,flag);
 }
});

test('WP3-H1W05 mixed WP2, production, wrong owner/repo and invalid host fail closed',async()=>{
 const invalid=[
  {D6_ORIGIN:WP2},
  {D6_ORIGIN:'https://fishing.ginosega.workers.dev'},
  {D6_WP2_STAGING_ENABLED:'true'},
  {D6_ISOLATED_PAGES_ENABLED:'true'},
  {D6_WP3_ISOLATED_READ_ENABLED:'False'},
  {D6_WP3_ISOLATED_PAGES_ENABLED:undefined},
  {D6_WP3_READ_PROFILE_ENABLED:undefined},
  {D6_OWNER_GITHUB_ID:'1'},
  {D6_REPOSITORY_ID:'1'},
 ];
 for(const bad of invalid){
  const {h,network}=fixture();
  assert.equal((await h.fetch(req(),make(bad))).status,503);
  assert.equal(network.length,0);
 }
 const {h,network}=fixture(),env=make();
 for(const host of [WP2,'https://fishing.ginosega.workers.dev',
  'https://evil.invalid']){
  assert.equal((await h.fetch(req('/fishing/release.json',host),env)).status,404);
 }
 assert.equal(network.length,0);
});

test('WP3-H1W06 revocation and production-like default Worker interface remain fail closed',async()=>{
 const {h,network}=fixture(),env=make();
 assert.equal((await h.fetch(req(),env)).status,200);
 env.D6_WP3_H1_READ_ONLY_ENABLED='false';
 assert.equal((await h.fetch(req(),env)).status,503);
 assert.equal(network.length,1);
 assert.deepEqual(Object.keys(worker),['fetch']);
 assert.equal((await worker.fetch(req(),{})).status,503);
 assert(Object.isFrozen(worker));
 assert(Object.isFrozen(h));
 for(const key of ['publisher','write','authorizeStep','ownerApproval',
  'token','sign','merge','deploy','migrate'])
  assert.equal(key in worker,false);
 const source=readFileSync(new URL(
  '../server/d6-wp3-h1-read-only-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/from ['"].*wp3-trusted-host-candidate/);
 assert.doesNotMatch(source,/from ['"].*write-token/);
 assert.doesNotMatch(source,/from ['"].*publish-provider-transport/);
});
