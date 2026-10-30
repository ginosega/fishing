import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createD3SandboxTokenIssuers}
 from '../src/d3-sandbox-token-issuers.mjs';
const ID=1430581407;
const APP='5436811',INST='174361658',REPO='ginosega/fishing-p3-sandbox';
const PEM=generateKeyPairSync('rsa',{modulusLength:2048,
 privateKeyEncoding:{type:'pkcs8',format:'pem'},
 publicKeyEncoding:{type:'spki',format:'pem'}}).privateKey;
const cfg=()=>({
 D2_GITHUB_APP_ID:APP,D2_GITHUB_INSTALLATION_ID:INST,
 D2_GITHUB_APP_PRIVATE_KEY:PEM,
 D3_GITHUB_APP_ID:APP,D3_GITHUB_INSTALLATION_ID:INST,
 D3_SANDBOX_REPO_ID:String(ID),
 D3_READ_TOKENS_ENABLED:'true',D3_WRITE_ENABLED:'true',
});
const json=data=>new Response(JSON.stringify(data),
 {status:200,headers:{'Content-Type':'application/json'}});
function fixture({overrides={},enabled=true}={}){
 const calls=[],env={...cfg(),...overrides};
 const request=async(url,init)=>{
  calls.push({url,method:init.method,body:init.body});
  assert.match(init.headers.Authorization,/^Bearer [A-Za-z0-9._-]+$/);
  const root='https://api.github.com';
  const sandbox=root+'/repos/'+REPO;
  if(url===root+'/app/installations/'+INST)return json({
   id:Number(INST),app_id:Number(APP),
   account:{login:'ginosega'},repository_selection:'selected',
   suspended_at:null,
   permissions:{checks:'read',contents:'write',
    metadata:'read',pull_requests:'write'},
  });
  if(url===sandbox+'/installation')return json({
   id:Number(INST),app_id:Number(APP),account:{login:'ginosega'},
  });
  if(url===root+'/app/installations/'+INST+'/access_tokens'){
   const submitted=JSON.parse(init.body);
   assert.deepEqual(submitted.repository_ids,[ID]);
   const permissions=submitted.permissions;
   return json({
    token:'temporary-test-token-only-in-memory',
    permissions:{...permissions,metadata:'read'},
    repositories:[{id:ID,full_name:REPO}],
   });
  }
  assert.fail('Unexpected GitHub URL: '+url);
 };
 const issued=createD3SandboxTokenIssuers({
  env,request,enabled:()=>enabled,
 });
 return {issued,calls,env};
}
test('D3-T01 reused encrypted D2 PEM mints only one repo scoped READ',async()=>{
 const f=fixture();
 assert(!Object.hasOwn(f.env,'D3_GITHUB_APP_PRIVATE_KEY'));
 const res=await f.issued.issueReadToken({
  repositoryId:ID,permissions:{contents:'read'},
 });
 assert.equal(res.repositoryId,ID);
 assert.deepEqual(res.permissions,{contents:'read'});
 assert.equal(f.calls.length,3);
 assert.equal(f.calls[2].method,'POST');
 assert.deepEqual(JSON.parse(f.calls[2].body).permissions,{contents:'read'});
});
test('D3-T02 same protected D2 key mints only private-sandbox WRITER scope',async()=>{
 const f=fixture();
 const res=await f.issued.issueWriteToken({
  repositoryId:ID,
  permissions:{contents:'write',pull_requests:'write'},
 });
 assert.equal(res.repositoryId,ID);
 assert.deepEqual(res.permissions,{contents:'write',pull_requests:'write'});
 assert.equal(f.calls.length,3);
 assert.equal(f.calls[2].method,'POST');
 assert.deepEqual(JSON.parse(f.calls[2].body).permissions,
  {contents:'write',pull_requests:'write'});
});
test('D3-T03 changed App/installation ID rejects BEFORE signing or network',async()=>{
 for(const overrides of [
  {D3_GITHUB_APP_ID:'1'},
  {D2_GITHUB_APP_ID:'1'},
  {D3_GITHUB_INSTALLATION_ID:'55'},
  {D2_GITHUB_INSTALLATION_ID:'55'},
  {D2_GITHUB_APP_PRIVATE_KEY:undefined},
 ]){
  const f=fixture({overrides});
  await assert.rejects(f.issued.issueReadToken({
   repositoryId:ID,permissions:{contents:'read'},
  }),e=>e.code==='READ_TOKENS_DISABLED');
  await assert.rejects(f.issued.issueWriteToken({
   repositoryId:ID,
   permissions:{contents:'write',pull_requests:'write'},
  }),e=>e.code==='WRITES_DISABLED');
  assert.equal(f.calls.length,0);
 }
});
test('D3-T04 wrong repo, inactive flags or missing explicit writer permission fail closed',async()=>{
 for(const overrides of [
  {D3_SANDBOX_REPO_ID:'1350909744'},
  {D3_READ_TOKENS_ENABLED:'false',D3_WRITE_ENABLED:'false'},
 ]){
  const f=fixture({overrides});
  await assert.rejects(f.issued.issueReadToken({
   repositoryId:ID,permissions:{contents:'read'},
  }));
  await assert.rejects(f.issued.issueWriteToken({
   repositoryId:ID,
   permissions:{contents:'write',pull_requests:'write'},
  }));
  assert.equal(f.calls.length,0);
 }
 const f=fixture();
 await assert.rejects(f.issued.issueWriteToken({
  repositoryId:ID,permissions:{contents:'write'},
 }),e=>e.code==='TOKEN_SCOPE_DENIED');
 assert.equal(f.calls.length,0);
});
