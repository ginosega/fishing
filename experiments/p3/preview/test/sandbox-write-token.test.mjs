import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createSandboxWriteTokenIssuer,WriteTokenError} from '../src/sandbox-write-token.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const key=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({format:'pem',type:'pkcs1'}).toString();
const baseEnv={P3_WRITE_ENABLED:'true',P3_GITHUB_APP_ID:'1001',
 P3_GITHUB_INSTALLATION_ID:'2002',P3_GITHUB_PRIVATE_KEY:key};
const SCOPE={repositoryId:ID,permissions:{contents:'write',pull_requests:'write'}};
const reject=code=>e=>(assert.equal(e instanceof WriteTokenError,true),assert.equal(e.code,code),true);
function stub({owner='ginosega',installedRepo=true,granted='write',
 extraRepo=false,invalidApp=false,selection='selected',httpError=0}={}){
 const calls=[];
 const inst={id:2002,app_id:invalidApp?3000:1001,account:{login:owner},
  repository_selection:selection,suspended_at:null,
  permissions:{contents:'write',pull_requests:'write'}};
 const request=async(url,init)=>{
  calls.push({url,method:init.method,body:init.body?JSON.parse(init.body):null,headers:init.headers});
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  assert.match(init.headers.Authorization,/^Bearer \S+/);
  const json=(value,status=200)=>({ok:status>=200&&status<300,status,json:async()=>value});
  if(url.endsWith('/app/installations/2002'))return json(inst,httpError||200);
  if(url.endsWith('/repos/'+REPO+'/installation'))
   return installedRepo?json(inst):json({},404);
  if(url.endsWith('/app/installations/2002/access_tokens')){
   assert.equal(init.method,'POST');
   assert.deepEqual(JSON.parse(init.body),{repository_ids:[ID],permissions:{contents:'write',pull_requests:'write'}});
   return json({token:'example_ephemeral_scoped_token',
    permissions:{contents:granted,pull_requests:'write'},
    repositories:[{id:ID,full_name:REPO},...(extraRepo?[{id:4,full_name:'other/repo'}]:[])]},201);
  }
  throw Error('Unexpected URL '+url);
 };
 return {request,calls};
}
test('P3-W01 deny-by-default never creates a token while publishing disabled',async()=>{
 for(const [env,on] of [[baseEnv,false],[{...baseEnv,P3_WRITE_ENABLED:'false'},true]]){
  const stubbed=stub();
  const issuer=createSandboxWriteTokenIssuer({env,request:stubbed.request,enabled:()=>on});
  await assert.rejects(issuer.issueToken(SCOPE),reject('WRITES_DISABLED'));
  assert.equal(stubbed.calls.length,0);
 }
});
test('P3-W02 exact sandbox ID and permission subset enforced before API calls',async()=>{
 for(const input of [
  {repositoryId:1350909744,permissions:SCOPE.permissions},
  {repositoryId:ID,permissions:{contents:'write',pull_requests:'read'}},
  {repositoryId:ID,permissions:{contents:'write',pull_requests:'write',administration:'read'}},
 ]){
  const mock=stub(),issuer=createSandboxWriteTokenIssuer({env:baseEnv,request:mock.request,enabled:()=>true});
  await assert.rejects(issuer.issueToken(input),reject('TOKEN_SCOPE_DENIED'));
  assert.equal(mock.calls.length,0);
 }
});
test('P3-W03 actual installation + sandbox preflight and narrow write token',async()=>{
 const mock=stub(),issuer=createSandboxWriteTokenIssuer({env:baseEnv,request:mock.request,enabled:()=>true});
 const data=await issuer.issueToken(SCOPE);
 assert.equal(data.repositoryId,ID);
 assert.deepEqual(data.permissions,{contents:'write',pull_requests:'write'});
 assert.equal(mock.calls.length,3);
 assert.equal(mock.calls.filter(x=>x.method==='POST').length,1);
 assert.equal(mock.calls[2].body.repository_ids[0],ID);
});
test('P3-W04 mismatched app/owner/selection or missing repo denied before token mint',async()=>{
 for(const [opts,code] of [
  [{owner:'other'},'INVALID_INSTALLATION'],
  [{invalidApp:true},'INVALID_INSTALLATION'],
  [{selection:'all'},'INVALID_INSTALLATION'],
  [{installedRepo:false},'GITHUB_HTTP_404'],
  [{httpError:403},'GITHUB_HTTP_403'],
 ]){
  const mock=stub(opts),issuer=createSandboxWriteTokenIssuer({env:baseEnv,request:mock.request,enabled:()=>true});
  await assert.rejects(issuer.issueToken(SCOPE),reject(code));
  assert.equal(mock.calls.some(x=>x.method==='POST'),false,code);
 }
});
test('P3-W05 mismatched minted token rights or additional repo rejected',async()=>{
 for(const opts of [{granted:'read'},{extraRepo:true}]){
  const mock=stub(opts),issuer=createSandboxWriteTokenIssuer({env:baseEnv,request:mock.request,enabled:()=>true});
  await assert.rejects(issuer.issueToken(SCOPE),reject('ISSUED_TOKEN_SCOPE_MISMATCH'));
 }
});
