import test from 'node:test';
import assert from 'node:assert/strict';
import {createSign,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createP3AppOidcReadOnlyPreflight,P3AppOidcReadOnlyError,
 P3_APP_OIDC_READONLY_AUDIENCE,P3_APP_OIDC_READONLY_WORKFLOW_REF}
 from '../src/p3-app-oidc-readonly.mjs';

const NOW=1800000000,SHA='a'.repeat(40),REPO='ginosega/fishing-p3-sandbox';
const AUD=P3_APP_OIDC_READONLY_AUDIENCE,WF=P3_APP_OIDC_READONLY_WORKFLOW_REF;
const OWNER=265665562,ID=1430581407;
const {privateKey:oidcPrivate,publicKey:oidcPublic}
 =generateKeyPairSync('rsa',{modulusLength:2048});
const {privateKey:appPrivate}=generateKeyPairSync('rsa',{modulusLength:2048});
const appPem=appPrivate.export({format:'pem',type:'pkcs8'}).toString();
const jwk={...oidcPublic.export({format:'jwk'}),kid:'P3-COMBINED-TEST-KEY',alg:'RS256',use:'sig'};
const enc=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const claims={
 iss:'https://token.actions.githubusercontent.com',aud:AUD,
 sub:'repo:ginosega@'+OWNER+'/fishing-p3-sandbox@'+ID+':ref:refs/heads/main',
 repository:REPO,repository_id:String(ID),
 repository_owner:'ginosega',repository_owner_id:String(OWNER),
 repository_visibility:'private',actor_id:String(OWNER),
 ref:'refs/heads/main',ref_type:'branch',
 event_name:'workflow_dispatch',runner_environment:'github-hosted',
 workflow_ref:WF,workflow_sha:SHA,run_id:'441155',run_attempt:'1',
 job_workflow_ref:WF,job_workflow_sha:SHA,iat:NOW-20,exp:NOW+100,
};
const permissions={contents:'write',pull_requests:'write',checks:'read',metadata:'read'};
const installation={id:99,app_id:42,account:{login:'ginosega',id:OWNER},
 repository_selection:'selected',suspended_at:null,permissions};
const repoInstall={id:99,app_id:42,account:{login:'ginosega',id:OWNER},
 repository_selection:'selected',suspended_at:null};

function oidc({change={},key=oidcPrivate}={}){
 const head=enc({alg:'RS256',typ:'JWT',kid:jwk.kid}),payload=enc({...claims,...change});
 const body=head+'.'+payload;
 return body+'.'+createSign('RSA-SHA256').update(body).end().sign(key).toString('base64url');
}
function make({patch={},jwt=oidc(),install=installation,repo=repoInstall,
 keys=[jwk],apiStatus=200,tokenFails=false,requireAbsent=undefined}={}){
 const counts={oidc:0,jwks:0,api:0};
 const requests=[];
 const env={P3_WRITE_ENABLED:'false',
  P3_GITHUB_APP_ID:'42',P3_GITHUB_INSTALLATION_ID:'99',
  P3_GITHUB_PRIVATE_KEY:appPem,...patch,
 };
 const instance=createP3AppOidcReadOnlyPreflight({
  env,expectedWorkflowSha:SHA,now:()=>NOW,
  requestOidcToken:async audience=>{
   counts.oidc++;assert.equal(audience,AUD);
   if(tokenFails)throw Error('SENSITIVE_TOKEN_PROVIDER_ERROR');
   return jwt;
  },
  requestOidcKeys:async url=>{
   counts.jwks++;assert.equal(url,
    'https://token.actions.githubusercontent.com/.well-known/jwks');
   return new Response(JSON.stringify({keys}));
  },
  requestGitHub:async(url,options)=>{
   counts.api++;
   assert.equal(options.method,'GET');
   assert.equal(options.redirect,'manual');
   assert.match(options.headers.Authorization,/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
   requests.push({url,method:options.method});
   assert(url==='https://api.github.com/app/installations/99'||
    url==='https://api.github.com/repos/ginosega/fishing-p3-sandbox/installation');
   const obj=url.endsWith('/installation')?repo:install;
   return new Response(JSON.stringify(obj),{status:apiStatus});
  },
 });
 return {instance,counts,requests};
}
test('P3-C01 no API/JWKS/provider access until explicit verify; exact two GETs',async()=>{
 const f=make();assert.deepEqual(f.counts,{oidc:0,jwks:0,api:0});
 const result=await f.instance.verify();
 assert.deepEqual(result,{
  verified:true,readOnlyProof:true,repositoryId:ID,ownerGitHubId:OWNER,
  workflowSha:SHA,runId:441155,runAttempt:1,appId:42,installationId:99,
  installationTokenRequested:false,repositoryMutationAttempted:false,
 });
 assert.deepEqual(f.counts,{oidc:1,jwks:1,api:2});
 assert.deepEqual(f.requests.map(x=>x.url),[
  'https://api.github.com/app/installations/99',
  'https://api.github.com/repos/ginosega/fishing-p3-sandbox/installation',
 ]);
 assert.doesNotMatch(JSON.stringify(result),/Bearer|BEGIN PRIVATE KEY|PRIVATE KEY|eyJ/i);
});
test('P3-C02 write-enabled flag/absent PEM/unknown workflow SHA deny before any requests',()=>{
 for(const patch of [
  {P3_WRITE_ENABLED:'true'},{P3_WRITE_ENABLED:undefined},
  {P3_GITHUB_PRIVATE_KEY:''},{P3_GITHUB_APP_ID:'garbage'},
  {P3_GITHUB_INSTALLATION_ID:'0'},
 ]){
  assert.throws(()=>make({patch}),
   e=>e instanceof P3AppOidcReadOnlyError&&e.code==='PREFLIGHT_DISABLED_OR_INVALID');
 }
 const env={P3_WRITE_ENABLED:'false',P3_GITHUB_APP_ID:'42',
  P3_GITHUB_INSTALLATION_ID:'99',P3_GITHUB_PRIVATE_KEY:appPem};
 assert.throws(()=>createP3AppOidcReadOnlyPreflight({
  env,expectedWorkflowSha:'a',requestOidcToken:async()=>{},
  requestOidcKeys:async()=>{},requestGitHub:async()=>{},
 }),P3AppOidcReadOnlyError);
});
test('P3-C03 signed but wrong private repo, actor, branch, workflow or reusable SHA has no App calls',async()=>{
 for(const change of [
  {sub:'repo:ginosega/fishing-p3-sandbox:ref:refs/heads/main'},
  {repository_id:'1'},{actor_id:'1'},
  {ref:'refs/heads/feature'},{repository_visibility:'public'},
  {workflow_ref:REPO+'/.github/workflows/evil.yml@refs/heads/main'},
  {workflow_sha:'b'.repeat(40)},
  {job_workflow_ref:REPO+'/.github/workflows/p3-trusted-command.yml@refs/heads/main'},
  {job_workflow_sha:'b'.repeat(40)},
 ]){
  const f=make({jwt:oidc({change})});
  await assert.rejects(f.instance.verify(),e=>e.code==='OIDC_SCOPE_DENIED');
  assert.equal(f.counts.api,0);
 }
});
test('P3-C04 forged RSA signature or bad issuer JWKS deny before App metadata',async()=>{
 const bad=make({jwt:oidc({key:generateKeyPairSync('rsa',{modulusLength:2048}).privateKey})});
 await assert.rejects(bad.instance.verify(),e=>e.code==='OIDC_INVALID');
 assert.equal(bad.counts.api,0);
 const keys=make({keys:[]});
 await assert.rejects(keys.instance.verify(),e=>e.code==='OIDC_KEYS_UNAVAILABLE');
 assert.equal(keys.counts.api,0);
});
test('P3-C05 expanded or missing App grant denies after one metadata GET',async()=>{
 for(const grant of [
  {...permissions,contents:'read'},
  {...permissions,administration:'read'},
  {...permissions,checks:'write'},
  {...permissions,pull_requests:'read'},
 ]){
  const f=make({install:{...installation,permissions:grant}});
  await assert.rejects(f.instance.verify(),e=>e.code==='APP_PERMISSIONS_DENIED');
  assert.equal(f.counts.api,1);
 }
});
test('P3-C06 App wrong owner/repository, disabled or nonselected installation denied',async()=>{
 for(const grant of [
  {...installation,app_id:6},
  {...installation,account:{login:'other',id:OWNER}},
  {...installation,suspended_at:'2026-10-25T01:00:00Z'},
  {...installation,repository_selection:'all'},
 ]){
  const f=make({install:grant});
  await assert.rejects(f.instance.verify(),e=>e.code==='APP_INSTALLATION_DENIED');
  assert.equal(f.counts.api,1);
 }
 const f=make({repo:{...repoInstall,id:123}});
 await assert.rejects(f.instance.verify(),e=>e.code==='APP_REPOSITORY_DENIED');
 assert.equal(f.counts.api,2);
});
test('P3-C07 failures return only safe fixed codes; no provider text or credential leakage',async()=>{
 const f=make({tokenFails:true});
 await assert.rejects(f.instance.verify(),e=>e instanceof P3AppOidcReadOnlyError&&
  e.code==='OIDC_SUPPLY_UNAVAILABLE'&&!e.message.includes('SENSITIVE'));
 assert.deepEqual(f.counts,{oidc:1,jwks:0,api:0});
 const down=make({apiStatus:503});
 await assert.rejects(down.instance.verify(),e=>e.code==='APP_LOOKUP_UNAVAILABLE'&&
  e.message==='P3 combined read-only provenance denied');
 assert.equal(down.counts.api,1);
});
test('P3-C08 code offers no default fetch, installation-token minting or write transport',()=>{
 // Static guard applies to the composed module. The historical imported
 // github-app-readonly.mjs has a DIFFERENT, forbidden helper that POSTs;
 // future runner must import ONLY this combined module.
 const src=readFile();
 assert.doesNotMatch(src,/fetch\s*\(|requestGitHub\([^)]*method:\s*'POST'/);
 assert.doesNotMatch(src,/\/access_tokens|\/merges|\/git\/refs|\/pulls/);
 assert.match(src,/options\?\.method==='GET'/);
 assert.match(src,/P3_WRITE_ENABLED==='false'/);
});
function readFile(){
 return readFileSync(new URL('../src/p3-app-oidc-readonly.mjs',import.meta.url),'utf8');
}
