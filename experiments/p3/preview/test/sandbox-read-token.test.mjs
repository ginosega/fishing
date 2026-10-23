import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createSandboxReadTokenIssuer,ReadTokenError} from '../src/sandbox-read-token.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const privateKey=generateKeyPairSync('rsa',{modulusLength:2048})
 .privateKey.export({format:'pem',type:'pkcs1'}).toString();
const env={P3_GITHUB_APP_ID:'1001',P3_GITHUB_INSTALLATION_ID:'2002',
 P3_GITHUB_PRIVATE_KEY:privateKey,P3_WRITE_ENABLED:'false'};
const scope={repositoryId:ID,permissions:{contents:'read'}};
const denied=code=>e=>e instanceof ReadTokenError&&e.code===code;
function fixture({owner='ginosega',id=ID,permissions={contents:'read'},selected='selected',grantPermissions={contents:'read'}}={}){
 const calls=[];
 const json=(data,status=200)=>({ok:status>=200&&status<300,json:async()=>data});
 const inst={id:2002,app_id:1001,account:{login:owner},
  repository_selection:selected,suspended_at:null,permissions};
 const request=async(url,init)=>{
  calls.push({url,method:init.method,headers:init.headers,body:init.body});
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  assert.match(init.headers.Authorization,/^Bearer /);
  if(url.endsWith('/app/installations/2002'))return json(inst);
  if(url.endsWith('/repos/'+REPO+'/installation'))return json(inst);
  if(url.endsWith('/app/installations/2002/access_tokens')){
   assert.equal(init.method,'POST');
   assert.deepEqual(JSON.parse(init.body),{repository_ids:[ID],permissions:{contents:'read'}});
   return json({token:'sandbox_ephemeral_read_grant',
    permissions:grantPermissions,repositories:[{id,full_name:REPO}]},201);
  }
  throw Error('Unexpected GitHub endpoint '+url);
 };
 return {request,calls};
}
test('P3-R01 cannot request writes, wider permissions or production repository',async()=>{
 const f=fixture(),issuer=createSandboxReadTokenIssuer({env,request:f.request});
 for(const invalid of [
  {repositoryId:1350909744,permissions:{contents:'read'}},
  {repositoryId:ID,permissions:{contents:'write'}},
  {repositoryId:ID,permissions:{contents:'read',pull_requests:'read'}},
 ]){
  await assert.rejects(issuer.issueReadToken(invalid),denied('READ_SCOPE_DENIED'));
 }
 assert.equal(f.calls.length,0);
});
test('P3-R02 App JWT preflight and installation token restricted to private sandbox read',async()=>{
 const f=fixture({permissions:{contents:'write',pull_requests:'write'}});
 const issuer=createSandboxReadTokenIssuer({env,request:f.request});
 const grant=await issuer.issueReadToken(scope);
 assert.equal(grant.repositoryId,ID);
 assert.deepEqual(grant.permissions,{contents:'read'});
 assert.equal(grant.token,'sandbox_ephemeral_read_grant');
 assert.equal(f.calls.length,3);
 assert.equal(f.calls.filter(x=>x.method==='POST').length,1);
 assert(!JSON.stringify(f.calls.map(x=>x.url)).includes('ginosega/fishing/installation'));
});
test('P3-R03 wrong GitHub owner, repo grant, installation selection and privilege are denied',async()=>{
 for(const [params,code] of [
  [{owner:'not-owner'},'APP_INSTALLATION_DENIED'],
  [{selected:'all'},'APP_INSTALLATION_DENIED'],
  [{permissions:{contents:'none'}},'APP_INSTALLATION_DENIED'],
  [{id:9},'READ_GRANT_SCOPE_MISMATCH'],
  [{grantPermissions:{contents:'write'}},'READ_GRANT_SCOPE_MISMATCH'],
  [{grantPermissions:{contents:'read',pull_requests:'write'}},'READ_GRANT_SCOPE_MISMATCH'],
 ]){
  const f=fixture(params),issuer=createSandboxReadTokenIssuer({env,request:f.request});
  await assert.rejects(issuer.issueReadToken(scope),denied(code));
 }
});
test('P3-R04 no private key or incorrect installation configuration fail closed',async()=>{
 for(const bad of [{...env,P3_GITHUB_PRIVATE_KEY:''},{...env,P3_GITHUB_APP_ID:'invalid'}]){
  const f=fixture(),issuer=createSandboxReadTokenIssuer({env:bad,request:f.request});
  await assert.rejects(issuer.issueReadToken(scope),denied('APP_CONFIGURATION_MISSING'));
  assert.equal(f.calls.length,0);
 }
});
