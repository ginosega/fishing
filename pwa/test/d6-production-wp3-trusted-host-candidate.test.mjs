import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionWp3TrustedHostCandidate}
 from '../../experiments/p3/preview/src/d6-production-wp3-trusted-host-candidate.mjs';
import {D6_WP3_D1_SCHEMA_PLAN}
 from '../../experiments/p3/preview/src/d6-production-wp3-d1-readiness.mjs';
import {D6_WP2_STAGING_ORIGIN}
 from '../src/d6-public-reader.mjs';

const ID='123e4567-e89b-42d3-a456-426614174000';
const NOW=2000000000;
const COOKIE='K'.repeat(43),KEY='wp3-test-csrf-secret-000000000000000000000000000000';
const hash=createHash('sha256').update(COOKIE).digest('base64url');
const csrf=(origin=ORIGIN)=>createHmac('sha256',KEY)
 .update('fishing-v3-csrf-v1\n'+origin+'\n'+COOKIE).digest('base64url');
const pin={
 D6_PRODUCTION_ENABLED:'true',
 D6_GATEWAY_ENABLED:'true',
 D6_ORIGIN:ORIGIN,
 D6_OWNER_GITHUB_ID:String(REPO.ownerGitHubId),
 D6_REPOSITORY_ID:String(REPO.id),
 D6_STATIC_ENABLED:'true',
 D6_SESSION_ENABLED:'true',
 D6_CSRF_KEY:KEY,
};
const operations='/api/v3/operations',MEDIA='/api/v3/media';
const json=async r=>JSON.parse(await r.text());
const req=(path,{origin=ORIGIN,csrfToken=csrf(origin),
 cookie=COOKIE,method='POST',intent='publish',body='{}',
 contentType='application/json',site='same-origin'}={})=>
 new Request(origin+path,{
  method,headers:{
   Origin:origin,'Sec-Fetch-Site':site,
   'X-Fish-V3-Intent':intent,
   'X-Fish-V3-CSRF':csrfToken,
   'Content-Type':contentType,
   Cookie:'__Host-fish_p0_session='+cookie,
  },
  ...(method==='POST'?{body}:{}),
 });
function setup({extra={},approved=false,session=true,
 database='missing',readOnly=false}={}){
 const state={approved,session,providerCalls:[],authReads:0,
  wp3Reads:[],wp3Writes:0};
 const AUTH_DB={prepare(sql){
  return {bind(...args){return {async first(){
   state.authReads++;
   assert.equal(sql,
    'SELECT github_id,expires_at FROM sessions WHERE token_hash=? AND expires_at>?');
   assert.equal(args[0],hash);
   return state.session?{github_id:REPO.ownerGitHubId,
    expires_at:NOW+1800}:null;
  }};}};
 }};
 const WP3_DB={prepare(sql){
  state.wp3Reads.push(sql);
  if(database==='missing')throw Error('WP3 schema not provisioned');
  return {async all(){
   const table=sql.match(/^PRAGMA table_info\("([^"]+)"\)$/)?.[1];
   if(table){
    const plan=D6_WP3_D1_SCHEMA_PLAN.find(x=>x.table===table);
    assert(plan);
    return {success:true,results:plan.columns.map((x,i)=>({
     cid:i,name:x.name,type:x.type,
    }))};
   }
   if(sql==='PRAGMA index_list("d6_operation_receipts")')
    return {success:true,results:[
     {unique:1,partial:0,
      name:'sqlite_autoindex_d6_operation_receipts_1'},
     {unique:1,partial:1,name:'d6_operation_active_record'},
    ]};
   if(sql==='PRAGMA index_info("sqlite_autoindex_d6_operation_receipts_1")')
    return {success:true,results:[
     {name:'owner_github_id'},{name:'idempotency_key'}]};
   if(sql==='PRAGMA index_info("d6_operation_active_record")')
    return {success:true,results:[{name:'owner_github_id'},
     {name:'domain'},{name:'record_id'}]};
   throw Error('No other read allowed');
  },async first(){throw Error('Unexpected runtime D1 select')},
  async run(){state.wp3Writes++;throw Error('No D1 mutation allowed')},
  };
 }};
 const env={...pin,
  AUTH_DB,WP3_DB,
  D6_WP3_RUNTIME_ENABLED:readOnly?'false':'true',
  D6_WP3_WRITE_ENABLED:readOnly?'false':'true',
  D6_WP3_MOUNT_ENABLED:readOnly?'false':'true',
  ...extra,
 };
 const host=createD6ProductionWp3TrustedHostCandidate({
  env,now:()=>NOW,ownerApproval:()=>state.approved,
  network:async(url,opts)=>{
   state.providerCalls.push({url,method:opts.method});
   if(url.startsWith('https://ginosega.github.io/fishing/')||
      url.startsWith('https://fishing-v3-d6-static-test.pages.dev/fishing/'))
    return new Response('WP2 static release bytes',{
     status:200,headers:{'Content-Type':'text/plain'}});
   throw Error('No GitHub provider call authorized');
  },
 });
 return {host,env,state};
}
test('WP3-HOST01 source-only public object only fetch, no credentials or deploy',()=>{
 const x=setup();
 assert.deepEqual(Object.keys(x.host),['fetch']);
 assert(Object.isFrozen(x.host));
 for(const k of ['authorizeWrite','readToken','sign','migrate',
  'deploy','merge','issueWriteToken','publisher','app',
  'write','grant','request','reconcile','serve'])
  assert.equal(k in x.host,false);
 assert.equal(x.state.providerCalls.length,0);
});
test('WP3-HOST02 default-off WP3 capabilities preserve actual WP2 static gateway',async()=>{
 const x=setup({readOnly:true});
 const r=await x.host.fetch(new Request(ORIGIN+'/fishing/index.html'));
 assert.equal(r.status,200);
 assert.equal(await r.text(),'WP2 static release bytes');
 assert.deepEqual(x.state.providerCalls.map(x=>x.method),['GET']);
 for(const path of [operations,operations+'/'+ID+'/status',
  MEDIA,MEDIA+'/reconcile']){
  const s=await x.host.fetch(req(path));
  assert.equal(s.status,404);
 }
 assert.equal(x.state.authReads,0);
 assert.deepEqual(x.state.wp3Reads,[]);
 assert.equal(x.state.wp3Writes,0);
});
test('WP3-HOST03 server approval denied; switches alone cannot enable owner writes',async()=>{
 const x=setup({approved:false,database:'ready'});
 assert.equal((await x.host.fetch(req(operations))).status,404);
 assert.equal((await x.host.fetch(req(MEDIA))).status,404);
 assert.equal(x.state.authReads,0);
 assert.equal(x.state.wp3Reads.length,0);
 assert.equal(x.state.providerCalls.length,0);
});
test('WP3-HOST04 wrong owner CSRF fails before WP3 D1 or provider',async()=>{
 const x=setup({approved:true,database:'ready'});
 for(const options of [
  {csrfToken:'x'.repeat(43)},
  {site:'cross-site'},
  {cookie:'A'.repeat(43)},
 ]){
  const r=await x.host.fetch(req(operations,options));
  assert.equal(r.status,403);
  assert.equal((await json(r)).error,'OWNER_DENIED');
 }
 assert.equal(x.state.wp3Reads.length,0);
 assert.equal(x.state.providerCalls.length,0);
});
test('WP3-HOST05 owner valid but missing WP3 schema fails closed before token',async()=>{
 const x=setup({approved:true,database:'missing'});
 const response=await x.host.fetch(req(operations));
 assert.equal(response.status,503);
 assert.equal((await json(response)).error,'TEMPORARILY_UNAVAILABLE');
 assert.equal(x.state.authReads,1);
 assert.deepEqual(x.state.wp3Reads,
  ['PRAGMA table_info("d6_operation_receipts")']);
 assert.equal(x.state.providerCalls.length,0);
 assert.equal(x.state.wp3Writes,0);
});
test('WP3-HOST06 exact owner CSRF and ten-table readiness still no secret/provider activation',async()=>{
 const x=setup({approved:true,database:'ready'});
 const response=await x.host.fetch(req(operations));
 assert.equal(response.status,503); // missing media-ticket server secret
 assert.equal(x.state.authReads,1);
 assert.equal(x.state.wp3Reads.length,13);
 assert.equal(x.state.wp3Writes,0);
 assert.equal(x.state.providerCalls.length,0);
});
test('WP3-HOST07 wrong hostname never routes or authorizes writes',async()=>{
 const x=setup({approved:true,database:'ready'});
 const r=await x.host.fetch(req(operations,{origin:'https://evil.invalid'}));
 assert.equal(r.status,404);
 assert.equal(x.state.authReads,0);
 assert.equal(x.state.wp3Reads.length,0);
 assert.equal(x.state.providerCalls.length,0);
});
test('WP3-HOST08 isolated WP2 host profile remains read-only even when WP3 switches set',async()=>{
 const x=setup({approved:true,database:'ready',extra:{
  D6_WP2_STAGING_ENABLED:'true',
  D6_ISOLATED_PAGES_ENABLED:'true',
  D6_ORIGIN:D6_WP2_STAGING_ORIGIN,
 }});
 const staticRead=await x.host.fetch(
  new Request(D6_WP2_STAGING_ORIGIN+'/fishing/index.html'));
 assert.equal(staticRead.status,200);
 const write=await x.host.fetch(req(operations,{origin:D6_WP2_STAGING_ORIGIN,
  csrfToken:csrf(D6_WP2_STAGING_ORIGIN)}));
 assert.equal(write.status,404);
 assert.equal(x.state.authReads,0);
 assert.equal(x.state.wp3Reads.length,0);
 assert.equal(x.state.providerCalls.length,1);
});
test('WP3-HOST09 server revocation and invalid GET/unknown paths fail closed',async()=>{
 const x=setup({approved:true,database:'ready'});
 x.state.approved=false;
 assert.equal((await x.host.fetch(req(operations))).status,404);
 x.state.approved=true;
 assert.equal((await x.host.fetch(req(operations,{
  method:'GET'}))).status,404);
 assert.equal((await x.host.fetch(req(operations+'?force=true'))).status,404);
 assert.equal((await x.host.fetch(req(MEDIA+'/ticket'))).status,404);
 assert.equal(x.state.authReads,0);
 assert.equal(x.state.wp3Reads.length,0);
});
test('WP3-HOST10 incomplete host pins deny all write capability without provider access',async()=>{
 for(const bad of [
  {D6_OWNER_GITHUB_ID:'265665563'},
  {D6_REPOSITORY_ID:'3'},
  {D6_GATEWAY_ENABLED:'false'},
  {D6_WP3_WRITE_ENABLED:'False'},
  {D6_WP3_MOUNT_ENABLED:undefined},
  {D6_WP3_RUNTIME_ENABLED:undefined},
 ]){
  const x=setup({approved:true,database:'ready',extra:bad});
  assert.equal((await x.host.fetch(req(operations))).status,404);
  assert.equal(x.state.wp3Reads.length,0);
  assert.equal(x.state.authReads,0);
  assert.equal(x.state.providerCalls.length,0);
 }
});
