import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6H2CloudflareDeploymentReadback,
 verifyD6H2DeploymentList,D6H2DeploymentReadError}
 from '../tools/d6-wp3-h2-cloudflare-deployment-readback.mjs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const OTHER='11a3a0c1-1518-45d6-8541-70012b0dac4f';
const DEP='123e4567-e89b-42d3-a456-426614174000';
const ACCOUNT='c'.repeat(32),TOKEN='masked-token-12345678';
const envelope=(version=OFF)=>({
 success:true,result:{deployments:[{
  id:DEP,strategy:'percentage',
  versions:[{version_id:version,percentage:100}],
 }]},
});
const denied=(f,code)=>assert.throws(f,e=>
 e instanceof D6H2DeploymentReadError&&e.code===code);
const deniedAsync=async(f,code)=>await assert.rejects(f,e=>
 e instanceof D6H2DeploymentReadError&&e.code===code);

test('WP3-H2CF01 exact sole latest 100-percent Worker version is observed read-only',async()=>{
 const calls=[];
 const r=createD6H2CloudflareDeploymentReadback({
  accountId:ACCOUNT,getAccessToken:async()=>TOKEN,
  network:async(url,options)=>{
   calls.push({url,options});
   return new Response(JSON.stringify(envelope()),{
    headers:{'Content-Type':'application/json'},status:200});
  },
 });
 const got=await r.read({expectedVersion:OFF});
 assert.equal(got.verified,true);
 assert.equal(got.version,OFF);
 assert.equal(got.traffic,100);
 assert.equal(got.workerName,'fishing-v3-wp3-test');
 assert.equal(got.isLive,false);
 assert.equal(got.canPublish,false);
 assert.equal(calls.length,1);
 assert.equal(calls[0].options.method,'GET');
 assert.equal(calls[0].options.redirect,'error');
 assert.equal(calls[0].options.credentials,'omit');
 assert.equal(calls[0].options.cache,'no-store');
 assert.equal(calls[0].options.headers.Authorization,'Bearer '+TOKEN);
 assert.equal(calls[0].url,
  'https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+
   '/workers/scripts/fishing-v3-wp3-test/deployments?per_page=1');
 assert(!JSON.stringify(got).includes(TOKEN));
});

test('WP3-H2CF02 latest list first only; no historic OFF may be mistaken for active',()=>{
 const raw=envelope(OTHER);
 raw.result.deployments.push(envelope(OFF).result.deployments[0]);
 denied(()=>verifyD6H2DeploymentList(raw,{expectedVersion:OFF}),
  'VERSION_MISMATCH');
});

test('WP3-H2CF03 split traffic, extra version, zero, wrong name/shape deny',()=>{
 for(const bad of [
  {versions:[{version_id:OFF,percentage:99}]},
  {versions:[{version_id:OFF,percentage:100},
   {version_id:OTHER,percentage:0}]},
  {versions:[]},
  {versions:[{version_id:OFF,percentage:'100'}]},
  {versions:[{version_id:'garbage',percentage:100}]},
  {id:'wrong'}, {strategy:'other'},
 ]){
  const raw=envelope();
  raw.result.deployments[0]={...raw.result.deployments[0],...bad};
  assert.throws(()=>verifyD6H2DeploymentList(raw,{expectedVersion:OFF}),
   D6H2DeploymentReadError);
 }
 for(const raw of [
  null,{}, {success:false}, {success:true,result:{deployments:[]}},
  {success:true,result:{deployments:{}}},envelope('bad'),
 ])assert.throws(()=>verifyD6H2DeploymentList(raw,{expectedVersion:OFF}),
  D6H2DeploymentReadError);
});

test('WP3-H2CF04 invalid account and unpinned version never open network',async()=>{
 assert.throws(()=>createD6H2CloudflareDeploymentReadback({
  accountId:'other-account',getAccessToken:()=>TOKEN,
 }),D6H2DeploymentReadError);
 let called=0;
 const r=createD6H2CloudflareDeploymentReadback({
  accountId:ACCOUNT,getAccessToken:()=>TOKEN,
  network:()=>{called++;throw Error('should not call');},
 });
 await deniedAsync(()=>r.read({expectedVersion:'foo'}),'INVALID_VERSION_PIN');
 assert.equal(called,0);
});

test('WP3-H2CF05 token, failed provider and HTML never become a proof',async()=>{
 for(const opts of [
  {token:'bad'},
  {body:envelope(),status:503},
  {body:'<!doctype html>',type:'text/html'},
  {body:{success:false,result:{deployments:[]}}},
  {body:{success:true,result:{deployments:[]}}},
 ]){
  const x=createD6H2CloudflareDeploymentReadback({
   accountId:ACCOUNT,getAccessToken:async()=>opts.token??TOKEN,
   network:async()=>new Response(
    typeof opts.body==='string'?opts.body:
     JSON.stringify(opts.body??envelope()),{
     status:opts.status??200,
     headers:{'Content-Type':opts.type??'application/json'},
    }),
  });
  await assert.rejects(x.read({expectedVersion:OFF}),
   D6H2DeploymentReadError);
 }
});

test('WP3-H2CF06 truncated and oversized response bodies fail closed',async()=>{
 for(const obj of [
  {text:'x'.repeat(70000),headers:{'Content-Type':'application/json'}},
  {text:JSON.stringify(envelope()),headers:{
   'Content-Type':'application/json','Content-Length':'65537'}},
  {text:'{invalid',headers:{'Content-Type':'application/json'}},
 ]){
  const x=createD6H2CloudflareDeploymentReadback({
   accountId:ACCOUNT,getAccessToken:async()=>TOKEN,
   network:async()=>new Response(obj.text,{status:200,headers:obj.headers}),
  });
  await deniedAsync(()=>x.read({expectedVersion:OFF}),'BODY_UNVERIFIED');
 }
});
