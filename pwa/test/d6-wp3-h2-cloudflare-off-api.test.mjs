import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6Wp3H2CloudflareOffApi,D6Wp3H2CloudflareOffError}
 from '../tools/d6-wp3-h2-cloudflare-off-api.mjs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const ACTIVE='11a3a0c1-1518-45d6-8541-70012b0dac4f';
const A='a'.repeat(32),TOKEN='token_'+'x'.repeat(38);
const DEPLOY='a302ed4b-7f52-48bc-a7e1-3d47ba39b193';
const OLD='1342ed4b-7f52-48bc-a7e1-3d47ba39b193';
const ROOT='https://api.cloudflare.com/client/v4/accounts/'+A+
 '/workers/scripts/fishing-v3-wp3-test/deployments';
const latest=()=>({
 id:DEPLOY,created_on:'2026-11-18T22:02:00.000Z',
 strategy:'percentage',versions:[{version_id:OFF,percentage:100}],
});
const previous=()=>({
 id:OLD,created_on:'2026-11-18T21:00:00.000Z',
 strategy:'percentage',versions:[{version_id:ACTIVE,percentage:100}],
});
const json=(v,status=200)=>new Response(JSON.stringify(v),{
 status,headers:{'content-type':'application/json'},
});
const err=(p,code)=>assert.rejects(p,e=>
 e instanceof D6Wp3H2CloudflareOffError&&e.code===code);

function fixture({
 enabled=()=>true,token=TOKEN,accountId=A,mutate,failAt=null,
 listData,detailData,ackData,
}={}){
 const calls=[];
 const network=async(url,options)=>{
  calls.push({url,options});
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
  if(failAt===calls.length)throw Error('network unavailable');
  let response;
  if(options.method==='POST'){
   assert.equal(url,ROOT);
   assert.deepEqual(JSON.parse(options.body),{
    strategy:'percentage',versions:[{version_id:OFF,percentage:100}],
   });
   response=json({success:true,result:ackData??latest()});
  }else if(url===ROOT)
   response=json({success:true,result:{deployments:listData??[
    latest(),previous(),
   ]}});
  else if(url===ROOT+'/'+DEPLOY)
   response=json({success:true,result:detailData??latest()});
  else throw Error('Unexpected endpoint');
  return mutate?.({url,options,response})??response;
 };
 return {
  api:createD6Wp3H2CloudflareOffApi({
   accountId,apiToken:token,network,enabled,
  }),
  calls,
 };
}

test('WP3-OFF01 verify traffic strictly requires latest OFF 100 and detail GET',async()=>{
 const f=fixture(),v=await f.api.verifyTraffic();
 assert.equal(v.verifiedTraffic,true);
 assert.equal(v.workerName,'fishing-v3-wp3-test');
 assert.equal(v.version,OFF);
 assert.equal(v.traffic,100);
 assert.equal(v.writeRoutesDenied,false);
 assert.equal(v.offVersionFlagsVerified,false);
 assert.equal(v.requiresIndependentRouteDenial,true);
 assert.equal(v.isLive,false);
 assert.deepEqual(f.calls.map(x=>x.options.method),['GET','GET']);
 assert(Object.isFrozen(v));
 assert(!JSON.stringify(v).includes(TOKEN));
});

test('WP3-OFF02 one restore POST can deploy ONLY the pinned OFF version',async()=>{
 const f=fixture(),result=await f.api.restoreOff();
 assert.equal(result.verifiedTraffic,true);
 assert.deepEqual(f.calls.map(x=>x.options.method),['POST','GET','GET']);
 assert(f.calls.every(c=>c.url.startsWith(ROOT)));
 assert.equal(f.calls[0].url,ROOT);
});

test('WP3-OFF03 disabled/unknown Cloudflare account or missing credentials deny',async()=>{
 for(const opts of [
  {enabled:()=>false},
  {accountId:'not-account'},
  {token:'too-short'},
 ]) {
  const f=fixture(opts);
  await assert.rejects(f.api.verifyTraffic(),D6Wp3H2CloudflareOffError);
  assert.equal(f.calls.length,0);
  await assert.rejects(f.api.restoreOff(),D6Wp3H2CloudflareOffError);
  assert.equal(f.calls.length,0);
 }
});

test('WP3-OFF04 old OFF entry in history cannot masquerade as active OFF',async()=>{
 const f=fixture({listData:[previous(),latest()]});
 await err(f.api.verifyTraffic(),'OFF_NOT_100_PERCENT');
 assert.equal(f.calls.length,1);
});

test('WP3-OFF05 split/foreign/current version, incorrect percent or order deny',async()=>{
 const bad=[
  {...latest(),versions:[{version_id:OFF,percentage:50},
   {version_id:ACTIVE,percentage:50}]},
  {...latest(),versions:[{version_id:ACTIVE,percentage:100}]},
  {...latest(),versions:[{version_id:OFF,percentage:99}]},
  {...latest(),strategy:'random'},
 ];
 for(const l of bad){
  const f=fixture({listData:[l,previous()]});
  await err(f.api.verifyTraffic(),'OFF_NOT_100_PERCENT');
  assert.equal(f.calls.length,1);
 }
 const unordered=fixture({listData:[previous(),latest()]});
 await err(unordered.api.verifyTraffic(),'OFF_NOT_100_PERCENT');
 const dup=fixture({listData:[latest(),{...previous(),
  created_on:latest().created_on}]});
 await err(dup.api.verifyTraffic(),'DEPLOYMENT_ORDER_UNVERIFIED');
});

test('WP3-OFF06 metadata detail readback mismatch denies OFF assertion',async()=>{
 for(const v of [
  {...latest(),id:OLD},
  {...latest(),versions:[{version_id:ACTIVE,percentage:100}]},
  {...latest(),created_on:previous().created_on},
 ]){
  const f=fixture({detailData:v});
  await err(f.api.verifyTraffic(),'DEPLOYMENT_READBACK_UNVERIFIED');
  assert.deepEqual(f.calls.map(x=>x.options.method),['GET','GET']);
 }
});

test('WP3-OFF07 wrong acknowledgment never becomes a verified restoration',async()=>{
 const f=fixture({ackData:{...latest(),
  versions:[{version_id:ACTIVE,percentage:100}]}});
 await err(f.api.restoreOff(),'RESTORE_NOT_ACKNOWLEDGED');
 assert.equal(f.calls.length,1);
});

test('WP3-OFF08 API error, redirect and transport exception fail closed',async()=>{
 const cases=[
  ({url,response})=>url===ROOT?json({success:false,result:{deployments:[]}}):response,
  ({url,response})=>url===ROOT?new Response('Redirect',{
   status:302,headers:{location:'https://foreign.example'},
  }):response,
  ({url,response})=>url===ROOT?json({success:true,result:[latest()]}):response,
 ];
 for(const mutate of cases){
  const f=fixture({mutate});
  await assert.rejects(f.api.verifyTraffic(),D6Wp3H2CloudflareOffError);
  assert.equal(f.calls.length,1);
 }
 const f=fixture({failAt:1});
 await err(f.api.restoreOff(),'PROVIDER_UNAVAILABLE');
});

test('WP3-OFF09 strict deployment ID from POST must remain latest after GET',async()=>{
 const f=fixture({ackData:{...latest(),id:OLD}});
 await err(f.api.restoreOff(),'OFF_NOT_100_PERCENT');
 assert.deepEqual(f.calls.map(x=>x.options.method),['POST','GET']);
});

test('WP3-OFF10 source never deploys ON, changes secrets or reports full OFF',()=>{
 const s=readFileSync(new URL(
  '../tools/d6-wp3-h2-cloudflare-off-api.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(s,/deploy-content|wrangler|secrets\/|\/routes|process\.env/);
 assert.doesNotMatch(s,/writeRoutesDenied:true|offVersionFlagsVerified:true/);
 assert.doesNotMatch(s,/version_id:ACTIVE|method:'PATCH'|method:'PUT'/);
});
