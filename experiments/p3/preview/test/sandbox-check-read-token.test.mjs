import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createSandboxCheckReadTokenIssuer,CheckReadTokenError}
 from '../src/sandbox-check-read-token.mjs';
import {createSandboxCheckObserver}
 from '../src/sandbox-check-observer.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const privateKey=generateKeyPairSync('rsa',{modulusLength:2048})
 .privateKey.export({format:'pem',type:'pkcs1'}).toString();
const env={
 P3_GITHUB_APP_ID:'1001',
 P3_GITHUB_INSTALLATION_ID:'2002',
 P3_GITHUB_PRIVATE_KEY:privateKey,
 P3_WRITE_ENABLED:'false',
};
const scope={contents:'read',pull_requests:'read',checks:'read'};
const args={repositoryId:ID,permissions:scope};
const denied=code=>error=>error instanceof CheckReadTokenError&&error.code===code;
const ok=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
const HEAD='a'.repeat(40),BASE='b'.repeat(40),BRANCH='experiment/p3-7-ci-smoke';
function fixture({checks='read',owner='ginosega',selected='selected',
 associationId=2002,grantId=ID,
 grantPermissions={...scope,metadata:'read'},extraRepos=false,
 deniedEndpoint=null,invalidJwtConfig=false,
}={}){
 const calls=[];
 const install={id:2002,app_id:1001,account:{login:owner},
  repository_selection:selected,suspended_at:null,
  permissions:{contents:'write',pull_requests:'write',...(checks===null?{}:{checks})},
 };
 const request=async(url,init)=>{
  const body=init.body?JSON.parse(init.body):null;
  calls.push({url,method:init.method,body,headers:init.headers});
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  assert.match(init.headers.Authorization,/^Bearer \S+/);
  if(deniedEndpoint&&url.includes(deniedEndpoint))return ok({message:'denied'},403);
  if(url.endsWith('/app/installations/2002'))return ok(install);
  if(url.endsWith('/repos/'+REPO+'/installation')){
   return ok({...install,id:associationId});
  }
  if(url.endsWith('/app/installations/2002/access_tokens')){
   assert.equal(init.method,'POST');
   assert.deepEqual(body,{repository_ids:[ID],permissions:scope});
   return ok({token:'test_sandbox_scope_only_check_read_token',
    permissions:grantPermissions,repositories:[
     {id:grantId,full_name:REPO},
     ...(extraRepos?[{id:1350909744,full_name:'ginosega/fishing'}]:[]),
    ]},201);
  }
  throw Error('Unmocked request '+init.method+' '+url);
 };
 const issuer=createSandboxCheckReadTokenIssuer({
  env:invalidJwtConfig?{...env,P3_GITHUB_PRIVATE_KEY:'bad-pem'}:env,
  request,enabled:()=>true,
 });
 return {calls,request,issuer};
}
test('P3-CT01 disabled check-token issuer performs zero calls, even with valid input',async()=>{
 const f=fixture();
 const issuer=createSandboxCheckReadTokenIssuer({env,request:f.request});
 await assert.rejects(issuer.issueCheckReadToken(args),denied('CHECK_READER_DISABLED'));
 assert.equal(f.calls.length,0);
});
test('P3-CT02 read-only issuer preflights exact installation and mints single-repo subset',async()=>{
 const f=fixture();
 const grant=await f.issuer.issueCheckReadToken(args);
 assert.deepEqual({repositoryId:grant.repositoryId,permissions:grant.permissions},
  {repositoryId:ID,permissions:scope});
 assert.equal(Object.isFrozen(grant),true);
 assert.equal(f.calls.length,3);
 assert.deepEqual(f.calls.map(c=>c.method),['GET','GET','POST']);
 assert.deepEqual(f.calls[2].body,{repository_ids:[ID],permissions:scope});
 assert.equal(grant.token,'test_sandbox_scope_only_check_read_token');
});
test('P3-CT03 cannot request production repository or even one read/write scope expansion',async()=>{
 const f=fixture();
 for(const invalid of [
  {repositoryId:1350909744,permissions:scope},
  {repositoryId:ID,permissions:{contents:'read',checks:'read'}},
  {repositoryId:ID,permissions:{...scope,checks:'write'}},
  {repositoryId:ID,permissions:{...scope,contents:'write'}},
  {repositoryId:ID,permissions:{...scope,pull_requests:'write'}},
  {repositoryId:ID,permissions:{...scope,administration:'read'}},
 ]){
  await assert.rejects(f.issuer.issueCheckReadToken(invalid),denied('READ_SCOPE_DENIED'));
 }
 assert.equal(f.calls.length,0);
});
test('P3-CT04 owner must approve Checks:read before ANY installation token is minted',async()=>{
 for(const params of [
  {checks:null},{checks:'write'},{checks:'none'},
  {owner:'attacker'},{selected:'all'},
 ]){
  const f=fixture(params);
  await assert.rejects(f.issuer.issueCheckReadToken(args),
   denied('CHECKS_INSTALLATION_NOT_APPROVED'));
  assert.equal(f.calls.some(c=>c.method==='POST'),false);
 }
});
test('P3-CT05 mismatched installation association stops before mint',async()=>{
 const f=fixture({associationId:999});
 await assert.rejects(f.issuer.issueCheckReadToken(args),denied('SANDBOX_INSTALLATION_DENIED'));
 assert.equal(f.calls.some(c=>c.method==='POST'),false);
});
test('P3-CT06 token must have exactly check, contents, PR reads and only private sandbox',async()=>{
 for(const params of [
  {grantId:42},{extraRepos:true},
  {grantPermissions:{contents:'read',pull_requests:'read'}},
  {grantPermissions:{contents:'read',pull_requests:'read',checks:'write'}},
  {grantPermissions:{...scope,metadata:'write'}},
  {grantPermissions:{...scope,administration:'read'}},
 ]){
  const f=fixture(params);
  await assert.rejects(f.issuer.issueCheckReadToken(args),denied('READ_GRANT_SCOPE_MISMATCH'));
 }
});
test('P3-CT07 bad JWT config and HTTP 403 fail closed without leaking grants',async()=>{
 const bad=fixture({invalidJwtConfig:true});
 await assert.rejects(bad.issuer.issueCheckReadToken(args),denied('APP_JWT_FAILED'));
 assert.equal(bad.calls.length,0);
 const deniedApp=fixture({deniedEndpoint:'/app/installations/2002'});
 await assert.rejects(deniedApp.issuer.issueCheckReadToken(args),
  denied('GITHUB_RESPONSE_DENIED'));
});
test('P3-CT08 read-token issuer composes with disabled/read-only exact-head observer',async()=>{
 const f=fixture();
 let mainReads=0,prReads=0;
 const request=async(url,init)=>{
  if(url.startsWith('https://api.github.com/app/')){
   return f.request(url,init);
  }
  if(url==='https://api.github.com/repos/'+REPO+'/installation'){
   return f.request(url,init);
  }
  const api='https://api.github.com/repos/'+REPO;
  assert.equal(init.method,'GET');
  assert.equal(init.headers.Authorization,'Bearer test_sandbox_scope_only_check_read_token');
  if(url===api)return ok({id:ID,full_name:REPO,private:true});
  if(url===api+'/git/ref/heads/main'){
   mainReads++;
   return ok({object:{sha:BASE}});
  }
  if(url===api+'/pulls/1'){
   prReads++;
   return ok({
    number:1,state:'open',draft:true,merged_at:null,merged:false,
    head:{sha:HEAD,ref:BRANCH,repo:{id:ID}},
    base:{sha:BASE,ref:'main',repo:{id:ID}},
   });
  }
  if(url===api+'/commits/'+HEAD+'/check-runs?per_page=100&filter=latest'){
   return ok({total_count:1,check_runs:[{
    id:120492395098,head_sha:HEAD,name:'validate-sandbox-head',
    app:{id:15368},status:'completed',conclusion:'success',
   }]});
  }
  throw Error('Unhandled '+url);
 };
 const issuer=createSandboxCheckReadTokenIssuer({env,request,enabled:()=>true});
 const observer=createSandboxCheckObserver({
  request,issueCheckReadToken:issuer.issueCheckReadToken,enabled:()=>true,
 });
 const result=await observer.observe({
  repositoryId:ID,prNumber:1,expectedHeadSha:HEAD,
  expectedBaseSha:BASE,expectedBranch:BRANCH,
 });
 assert.deepEqual({ready:result.readyForManualReview,merge:result.canMerge,
  deploy:result.canDeploy}, {ready:true,merge:false,deploy:false});
 assert.equal(mainReads,2);
 assert.equal(prReads,2);
 assert.equal(f.calls.length,3);
});
