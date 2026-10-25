import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign} from 'node:crypto';
import {createP3RunnerProvenance,P3ProvenanceError} from '../src/p3-runner-provenance.mjs';

const ISS='https://token.actions.githubusercontent.com';
const KEYS=ISS+'/.well-known/jwks';
const REPO='ginosega/fishing-p3-sandbox';
const OWNER_ID=265665562,REPO_ID=1430581407;
const SHA='a'.repeat(40),AUD='fishing-p3:trusted-runner:owner-accept';
const WF=REPO+'/.github/workflows/p3-trusted-command.yml@refs/heads/main';
const now=1800000000;
const {privateKey:oidcPrivate,publicKey:oidcPublic}=generateKeyPairSync('rsa',{modulusLength:2048});
const {privateKey:appPrivate}=generateKeyPairSync('rsa',{modulusLength:2048});
const appPem=appPrivate.export({format:'pem',type:'pkcs8'}).toString();
const jwk={...oidcPublic.export({format:'jwk'}),kid:'P3-OIDC-REVIEW-KID',alg:'RS256',use:'sig'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const claimsBase={iss:ISS,aud:AUD,sub:'repo:ginosega@'+OWNER_ID+'/fishing-p3-sandbox@'+
 REPO_ID+':ref:refs/heads/main',repository:REPO,repository_id:String(REPO_ID),
 repository_owner:'ginosega',repository_owner_id:String(OWNER_ID),
 repository_visibility:'private',actor_id:String(OWNER_ID),ref_type:'branch',
 workflow_ref:WF,workflow_sha:SHA,ref:'refs/heads/main',
 event_name:'workflow_dispatch',runner_environment:'github-hosted',
 run_id:'441155',run_attempt:'1',iat:now-20,exp:now+100};
const granted={contents:'read',pull_requests:'read',checks:'read',metadata:'read'};
const install={id:99,app_id:42,account:{login:'ginosega',id:OWNER_ID},
 repository_selection:'selected',suspended_at:null,permissions:granted};
const repoInstall={id:99,app_id:42,account:{login:'ginosega',id:OWNER_ID},
 repository_selection:'selected',suspended_at:null};
function oidc({claims={},header={},key=oidcPrivate}={}){
 const h=enc({alg:'RS256',typ:'JWT',kid:jwk.kid,...header});
 const p=enc({...claimsBase,...claims});
 const msg=h+'.'+p;
 return msg+'.'+createSign('RSA-SHA256').update(msg).end().sign(key).toString('base64url');
}
function fixture({claims={},header={},key=oidcPrivate,installPatch={},repoPatch={},
 keys=[jwk],appPerms=granted,githubFailure=false,oidcFailure=false}={}){
 let github=0,jwks=0;const urls=[];
 const instance=createP3RunnerProvenance({
  env:{P3_GITHUB_APP_ID:'42',P3_GITHUB_INSTALLATION_ID:'99',P3_GITHUB_PRIVATE_KEY:appPem},
  now:()=>now,expectedAudience:AUD,expectedWorkflowRef:WF,
  expectedWorkflowSha:SHA,expectedAppPermissions:appPerms,
  requestOidcKeys:async url=>{jwks++;assert.equal(url,KEYS);
   if(oidcFailure)return new Response('failed',{status:503});
   return new Response(JSON.stringify({keys}),{headers:{'Content-Type':'application/json'}});
  },
  requestGitHub:async(url,options)=>{
   github++;urls.push(url);
   assert.equal(options.method,'GET');
   assert.equal(options.redirect,'manual');
   assert.match(options.headers.Authorization,/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
   if(githubFailure)return new Response('sensitive-secret',{status:503});
   const body=url.endsWith('/installation')?{...repoInstall,...repoPatch}:
    {...install,...installPatch};
   return new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
  },
 });
 return {instance,token:oidc({claims,header,key}),
  get github(){return github},get jwks(){return jwks},urls};
}
test('P3-R01 real RS256 GitHub OIDC and authenticated App GET metadata agree',async()=>{
 const x=fixture();
 assert.deepEqual(await x.instance.verify(x.token),{
  verified:true,repositoryId:REPO_ID,ownerGitHubId:OWNER_ID,runId:441155,
  runAttempt:1,workflowSha:SHA,appId:42,installationId:99});
 assert.equal(x.jwks,1);assert.equal(x.github,2);
 assert.deepEqual(x.urls,['https://api.github.com/app/installations/99',
  'https://api.github.com/repos/'+REPO+'/installation']);
});
test('P3-R02 wrong signed owner/repo ID, event, branch or workflow denied before App GET',async()=>{
 const changes=[
  {repository:'ginosega/fishing'},
  {repository_id:'1'}, {repository_owner_id:'1'},
  {actor_id:'123'},{repository_visibility:'public'},{ref_type:'tag'},
  {job_workflow_ref:'ginosega/evil/.github/workflows/malicious.yml@refs/heads/main'},
  {repository_owner:'other-owner'}, {ref:'refs/heads/feature-untrusted'},
  {event_name:'pull_request'}, {runner_environment:'self-hosted'},
  {workflow_ref:REPO+'/.github/workflows/evil.yml@refs/heads/main'},
  {workflow_sha:'b'.repeat(40)},{run_attempt:'0'},
  {sub:'repo:ginosega/fishing-p3-sandbox:ref:refs/heads/main'},
  {aud:'wrong-audience'}, {exp:now-1},{iat:now-900},
 ];
 for(const claims of changes){
  const x=fixture({claims});
  await assert.rejects(x.instance.verify(x.token),
   e=>e instanceof P3ProvenanceError&&e.code==='OIDC_SCOPE_DENIED');
  assert.equal(x.github,0);
 }
});
test('P3-R08 optional real signed GitHub job-workflow ref/SHA must match pinned command workflow',async()=>{
 for(const claims of [
  {job_workflow_ref:WF},
  {job_workflow_sha:SHA},
  {job_workflow_ref:WF,job_workflow_sha:SHA},
 ]){
  const x=fixture({claims});
  const result=await x.instance.verify(x.token);
  assert.equal(result.verified,true);
  assert.equal(result.workflowSha,SHA);
  assert.equal(x.jwks,1);
  assert.equal(x.github,2);
 }
});
test('P3-R09 nonmatching signed job-workflow identity cannot authorize command or App metadata',async()=>{
 for(const claims of [
  {job_workflow_ref:REPO+'/.github/workflows/evil.yml@refs/heads/main'},
  {job_workflow_sha:'b'.repeat(40)},
  {job_workflow_ref:WF,job_workflow_sha:'c'.repeat(40)},
  {job_workflow_ref:WF.replace('refs/heads/main','refs/heads/feature')},
 ]){
  const x=fixture({claims});
  await assert.rejects(x.instance.verify(x.token),
   e=>e instanceof P3ProvenanceError&&e.code==='OIDC_SCOPE_DENIED');
  assert.equal(x.github,0);
 }
});
test('P3-R10 untrusted wrong-scope JWT fails RSA before scope and App GET',async()=>{
 const attacker=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
 const invalid=fixture({claims:{repository_id:'1'},key:attacker});
 await assert.rejects(invalid.instance.verify(invalid.token),
  e=>e instanceof P3ProvenanceError&&e.code==='OIDC_INVALID');
 assert.equal(invalid.jwks,1);
 assert.equal(invalid.github,0);
 const valid=fixture({claims:{repository_id:'1'}});
 await assert.rejects(valid.instance.verify(valid.token),
  e=>e.code==='OIDC_SCOPE_DENIED');
 assert.equal(valid.jwks,1);
 assert.equal(valid.github,0);
});
test('P3-R03 alg none, injected JWKS URL header, tampering and bad RSA are denied',async()=>{
 const alternate=generateKeyPairSync('rsa',{modulusLength:2048});
 for(const opts of [
  {header:{alg:'none'}},{header:{jku:'https://attacker.invalid/jwks'}},
  {header:{jwk:{kid:jwk.kid}}},{key:alternate.privateKey},
 ]){
  const x=fixture(opts);
  await assert.rejects(x.instance.verify(x.token),P3ProvenanceError);
  assert.equal(x.github,0);
 }
 const x=fixture();
 await assert.rejects(x.instance.verify(x.token.replace(/.$/,'X')),P3ProvenanceError);
});
test('P3-R04 untrusted JWKS, unknown kid or network outage fail closed',async()=>{
 for(const options of [
  {keys:[{...jwk,kid:'wrong'}]},{keys:[]},{oidcFailure:true},
 ]){
  const x=fixture(options);
  await assert.rejects(x.instance.verify(x.token),P3ProvenanceError);
  assert.equal(x.github,0);
 }
});
test('P3-R05 App identity, owner, repository selection and suspended installs fail closed',async()=>{
 for(const installPatch of [
  {id:98},{app_id:7},{account:{login:'ginosega',id:1}},
  {account:{login:'malicious',id:OWNER_ID}},
  {suspended_at:'2026-10-01T00:00:00Z'},
  {repository_selection:'all'},
  {permissions:{...granted,contents:'write'}},
  {permissions:{...granted,administration:'read'}},
 ]){
  const x=fixture({installPatch});
  await assert.rejects(x.instance.verify(x.token),P3ProvenanceError);
  assert.equal(x.github,1);
 }
 for(const repoPatch of [
  {id:22},{account:{login:'ginosega',id:1}}, {repository_selection:'all'},
 ]){
  const x=fixture({repoPatch});
  await assert.rejects(x.instance.verify(x.token),
   e=>e.code==='APP_REPOSITORY_DENIED');
  assert.equal(x.github,2);
 }
});
test('P3-R06 provider error redacted, no token POST or write in provenance proof',async()=>{
 const x=fixture({githubFailure:true});
 await assert.rejects(x.instance.verify(x.token),
  e=>e.code==='APP_LOOKUP_UNAVAILABLE'&&!e.message.includes('sensitive-secret'));
 assert.equal(x.github,1);
});
test('P3-R07 constructor rejects missing trust anchors and variable workflow identity',()=>{
 const x=fixture();
 assert.ok(x.instance.verify);
 assert.throws(()=>createP3RunnerProvenance({requestOidcKeys:()=>{},requestGitHub:()=>{}}),
  P3ProvenanceError);
});
