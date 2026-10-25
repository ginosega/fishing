import test from 'node:test';
import assert from 'node:assert/strict';
import {createSign,generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createP3ReadOnlyOidcPreflight,P3OidcPreflightError}
 from '../src/p3-oidc-readonly-preflight.mjs';
import {runP3OidcReadOnlyProbe} from '../src/p3-oidc-readonly-cli.mjs';

const CLOCK=1800000000,REP='ginosega/fishing-p3-sandbox';
const OWNER='265665562',REPO='1430581407',SHA='a'.repeat(40);
const REF=REP+'/.github/workflows/fishing-p3-oidc-readonly.yml@refs/heads/main';
const AUD='fishing-p3:trusted-runner:owner-accept';
const JWKS='https://token.actions.githubusercontent.com/.well-known/jwks';
const TOKEN_URL='https://pipelines.actions.githubusercontent.com/fixture/request?api-version=2.0';
const context={
 actorId:OWNER,event:'workflow_dispatch',ref:'refs/heads/main',repo:REP,
 repoId:REPO,runAttempt:'1',runId:'441155',sha:SHA,
};
const env={
 GITHUB_ACTIONS:'true',P3_OIDC_PREFLIGHT_ENABLED:'true',
 GITHUB_REPOSITORY:REP,GITHUB_REPOSITORY_ID:REPO,GITHUB_ACTOR_ID:OWNER,
 GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',
 GITHUB_SHA:SHA,GITHUB_RUN_ID:'441155',GITHUB_RUN_ATTEMPT:'1',
 ACTIONS_ID_TOKEN_REQUEST_URL:TOKEN_URL,
 ACTIONS_ID_TOKEN_REQUEST_TOKEN:'temporary-test-not-actual-bearer-value',
};
const claims={
 iss:'https://token.actions.githubusercontent.com',aud:AUD,
 sub:'repo:ginosega@'+OWNER+'/fishing-p3-sandbox@'+REPO+':ref:refs/heads/main',
 repository:REP,repository_id:REPO,repository_owner:'ginosega',
 repository_owner_id:OWNER,repository_visibility:'private',
 actor_id:OWNER,ref:'refs/heads/main',ref_type:'branch',
 runner_environment:'github-hosted',event_name:'workflow_dispatch',
 workflow_ref:REF,workflow_sha:SHA,run_id:'441155',run_attempt:'1',
 iat:CLOCK-20,exp:CLOCK+100,
};
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'P3-READONLY-KEY-2026',alg:'RS256',use:'sig'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt(change={},extraHeader={},key=privateKey){
 const head=enc({typ:'JWT',alg:'RS256',kid:jwk.kid,...extraHeader});
 const payload=enc({...claims,...change});
 const body=head+'.'+payload;
 return body+'.'+createSign('RSA-SHA256').update(body).end().sign(key).toString('base64url');
}
function fixture({response,clock=CLOCK}={}){
 let keyCalls=0;
 const verifier=createP3ReadOnlyOidcPreflight({
  now:()=>clock,requestKeys:async url=>{
   keyCalls++;assert.equal(url,JWKS);
   return response??new Response(JSON.stringify({keys:[jwk]}),{
    headers:{'Content-Type':'application/json'},
   });
  },
 });
 return {verifier,get keyCalls(){return keyCalls}};
}

test('P3-OID01 GitHub-style RSA-signed immutable OIDC proof returns only safe fields',async()=>{
 const x=fixture();
 const out=await x.verifier.verify(jwt(),context);
 assert.deepEqual(out,{verified:true,repositoryId:1430581407,ownerGitHubId:265665562,
  runId:441155,runAttempt:1,workflowSha:SHA,subjectFormat:'immutable-id'});
 assert.equal(x.keyCalls,1);
 assert.doesNotMatch(JSON.stringify(out),/Bearer|value|kid|claims|sig|eyJ/);
});
test('P3-OID02 signed-claim mismatch categories fail closed before JWKS without values',async()=>{
 const attacks=[
  [{sub:'repo:ginosega/fishing-p3-sandbox:ref:refs/heads/main'},'OIDC_SUBJECT_DENIED'],
  [{aud:'attacker-audience'},'OIDC_ISSUER_AUDIENCE_DENIED'],
  [{iss:'https://attacker.invalid'},'OIDC_ISSUER_AUDIENCE_DENIED'],
  [{repository_id:'1'},'OIDC_REPOSITORY_DENIED'],
  [{repository_owner_id:'2'},'OIDC_REPOSITORY_DENIED'],
  [{actor_id:'99'},'OIDC_ACTOR_DENIED'],
  [{repository_visibility:'public'},'OIDC_REPOSITORY_DENIED'],
  [{workflow_sha:'b'.repeat(40)},'OIDC_WORKFLOW_DENIED'],
  [{workflow_ref:REF.replace('readonly','publish')},'OIDC_WORKFLOW_DENIED'],
  [{event_name:'pull_request'},'OIDC_EXECUTION_DENIED'],
  [{ref:'refs/heads/pr'},'OIDC_REF_DENIED'],
  [{runner_environment:'self-hosted'},'OIDC_EXECUTION_DENIED'],
  [{job_workflow_ref:'fake/reusable.yml'},'OIDC_REUSABLE_DENIED'],
  [{run_id:'999'},'OIDC_RUN_DENIED'],
  [{run_attempt:'2'},'OIDC_RUN_DENIED'],
  [{exp:CLOCK-1},'OIDC_TIME_DENIED'],
  [{iat:CLOCK-900},'OIDC_TIME_DENIED'],
 ];
 const x=fixture();
 for(const [change,code] of attacks)
  await assert.rejects(x.verifier.verify(jwt(change),context),
   e=>e.code===code&&e.message==='P3 read-only OIDC preflight denied'&&
    !JSON.stringify(e).includes('attacker-audience')&&
    !JSON.stringify(e).includes('refs/heads/pr'));
 assert.equal(x.keyCalls,0);
});
test('P3-OID03 untrusted runtime context fails before JWKS and any cryptography',async()=>{
 const x=fixture();
 for(const altered of [
  {actorId:'9'},{event:'pull_request'},{repoId:'1'},
  {ref:'refs/heads/feature'},{sha:'not-a-sha'}, {runAttempt:'0'},
 ]){
  await assert.rejects(x.verifier.verify(jwt(),{...context,...altered}),
   e=>e.code==='WRONG_RUN_CONTEXT');
 }
 assert.equal(x.keyCalls,0);
});
test('P3-OID04 algorithm confusion, header key URL injection, forged signature refused',async()=>{
 for(const opt of [
  [{},{alg:'none'},privateKey],
  [{},{jku:'https://evil.example/jwks'},privateKey],
  [{},{jwk:{kty:'RSA'}},privateKey],
  [{},{},generateKeyPairSync('rsa',{modulusLength:2048}).privateKey],
 ]){
  const x=fixture();
  await assert.rejects(x.verifier.verify(jwt(...opt),context),P3OidcPreflightError);
 }
});
test('P3-OID05 missing/duplicate/unavailable JWKS fail closed',async()=>{
 for(const response of [
  new Response(JSON.stringify({keys:[]}),{status:200}),
  new Response(JSON.stringify({keys:[jwk,jwk]}),{status:200}),
  new Response(JSON.stringify({keys:[{...jwk,kid:'not-a-match'}]})),
  new Response('secret-upstream-error',{status:503}),
 ]){
  const x=fixture({response});
  await assert.rejects(x.verifier.verify(jwt(),context),
   e=>e instanceof P3OidcPreflightError&&!e.message.includes('secret-upstream-error'));
 }
});
test('P3-OID06 complete bounded GET-only OIDC and JWKS probe never prints JWT',async()=>{
 const visited=[],output=[];
 const result=await runP3OidcReadOnlyProbe({
  env,now:()=>CLOCK,emit:s=>output.push(s),
  fetchImpl:async(url,opts)=>{
   visited.push([url,opts]);
   assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
   if(url.startsWith(TOKEN_URL)){
    assert.equal(opts.headers.Authorization,'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
    assert.equal(new URL(url).searchParams.get('audience'),AUD);
    return new Response(JSON.stringify({value:jwt()}),{
     headers:{'Content-Type':'application/json'}});
   }
   assert.equal(url,JWKS);
   assert.equal(opts.headers.Authorization,undefined);
   return new Response(JSON.stringify({keys:[jwk]}),{
    headers:{'Content-Type':'application/json'}});
  },
 });
 assert.equal(result.verified,true);
 assert.equal(visited.length,2);
 assert.equal(output.length,1);
 assert.match(output[0],/^PASS: GitHub RSA-signed OIDC/);
 assert.doesNotMatch(output[0],/eyJ|Bearer|PRIVATE KEY|oidcJwt|P3-READONLY-KEY/);
});
test('P3-OID07 no GitHub Actions environment permission means ZERO HTTP',async()=>{
 for(const override of [
  {GITHUB_ACTIONS:'false'}, {P3_OIDC_PREFLIGHT_ENABLED:'false'},
  {GITHUB_EVENT_NAME:'pull_request'},{GITHUB_REPOSITORY_ID:'1'},
  {GITHUB_ACTOR_ID:'1'},{GITHUB_REF:'refs/heads/feature'},
  {GITHUB_SHA:'other'}, {GITHUB_RUN_ATTEMPT:'0'},
 ]){
  let requested=0;
  await assert.rejects(runP3OidcReadOnlyProbe({
   env:{...env,...override},now:()=>CLOCK,emit:()=>{},
   fetchImpl:async()=>{requested++;throw Error('should never request')}}),
   e=>e.code==='WRONG_RUN_CONTEXT');
  assert.equal(requested,0);
 }
});
test('P3-OID08 only HTTPS GitHub-owned actions subdomains permitted for token request',async()=>{
 for(const input of [
  'http://pipelines.actions.githubusercontent.com/fixture',
  'https://pipelines.actions.githubusercontent.com.evil.test/fixture',
  'https://pipelines.attacker.example/fixture',
  'https://pipelines.attacker.actions.githubusercontent.com.evil.test/fixture',
  'https://actions.githubusercontent.com/fixture',
  'https://fakeactions.githubusercontent.com/fixture',
  'https://pipelines1.actions.githubusercontent.com.evil/fixture',
  'https://evil.example/fixture',
  'https://user:pass@pipelines.actions.githubusercontent.com/fixture',
 ]){
  let requested=0;
  await assert.rejects(runP3OidcReadOnlyProbe({
   env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:input},
   now:()=>CLOCK,fetchImpl:async()=>{requested++;throw Error('leak')},
  }),e=>/^OIDC_ENDPOINT_(HOST_DENIED|INSECURE|COMPONENT_DENIED|PATH_DENIED)$/.test(e.code));
  assert.equal(requested,0);
 }
});
test('P3-OID11 trusted regional GitHub actions subdomain works with signed RSA token',async()=>{
 const regional='https://pipelinesghubeus6.actions.githubusercontent.com/fixture/request?api-version=2.0';
 const calls=[],output=[];
 const result=await runP3OidcReadOnlyProbe({
  env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:regional},now:()=>CLOCK,
  emit:s=>output.push(s),
  fetchImpl:async(url,opts)=>{
   calls.push({url,method:opts.method,hasAuthorization:!!opts.headers.Authorization});
   if(url.startsWith(regional))
    return new Response(JSON.stringify({value:jwt()}),{
     headers:{'Content-Type':'application/json'}});
   assert.equal(url,JWKS);
   return new Response(JSON.stringify({keys:[jwk]}),{
    headers:{'Content-Type':'application/json'}});
  },
 });
 assert.equal(result.verified,true);
 assert.equal(calls.length,2);
 assert(calls.every(x=>x.method==='GET'));
 assert.equal(calls[0].hasAuthorization,true);
 assert.equal(calls[1].hasAuthorization,false);
 assert.equal(output.length,1);
 assert.match(output[0],/^PASS: GitHub RSA-signed OIDC/);
});
test('P3-OID12 GitHub-owned non-pipelines service hostname is permitted without weakening JWT checks',async()=>{
 const endpoint='https://vstoken.actions.githubusercontent.com/_apis/oidc/token?api-version=2.0';
 const calls=[];
 const result=await runP3OidcReadOnlyProbe({
  env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:endpoint},now:()=>CLOCK,
  fetchImpl:async(url,opts)=>{
   calls.push(url);
   if(url.startsWith(endpoint))return new Response(JSON.stringify({value:jwt()}),{
    headers:{'Content-Type':'application/json'}});
   assert.equal(url,JWKS);
   return new Response(JSON.stringify({keys:[jwk]}),{
    headers:{'Content-Type':'application/json'}});
  },
 });
 assert.equal(result.verified,true);assert.equal(calls.length,2);
});
test('P3-OID13 URL denial codes are fixed and reveal no endpoint or credentials',async()=>{
 for(const [url,expected] of [
  ['notaurl','OIDC_ENDPOINT_MALFORMED'],
  ['http://pipelines.actions.githubusercontent.com/token','OIDC_ENDPOINT_INSECURE'],
  ['https://evil.example/token','OIDC_ENDPOINT_HOST_DENIED'],
  ['https://user:password@pipelines.actions.githubusercontent.com/token','OIDC_ENDPOINT_COMPONENT_DENIED'],
  ['https://pipelines.actions.githubusercontent.com/#fragment','OIDC_ENDPOINT_COMPONENT_DENIED'],
  ['https://pipelines.actions.githubusercontent.com/','OIDC_ENDPOINT_PATH_DENIED'],
 ]){
  let fetchCalls=0;
  await assert.rejects(runP3OidcReadOnlyProbe({
   env:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:url},now:()=>CLOCK,
   fetchImpl:async()=>{fetchCalls++;throw Error('NO_NETWORK')},
  }),e=>e.code===expected&&!e.message.includes(url));
  assert.equal(fetchCalls,0);
 }
});
test('P3-OID09 token provider rejects redirection, non-200, overlong or invalid body',async()=>{
 for(const bad of [
  new Response('redir',{status:302}),
  new Response('sensitive upsteam',{status:401}),
  new Response('{"value":"hello"}',{status:200}),
  new Response(JSON.stringify({value:jwt(),danger:'extra'})),
  new Response('x'.repeat(12001)),
 ]){
  const notes=[];
  await assert.rejects(runP3OidcReadOnlyProbe({
   env,now:()=>CLOCK,emit:s=>notes.push(s),
   fetchImpl:async()=>bad,
  }),e=>e.code==='OIDC_REQUEST_UNAVAILABLE'&&!e.message.includes('sensitive'));
  assert.equal(notes.length,0);
 }
});
test('P3-OID10 workflow remains non-executable zero-pin proposal, no publishing path',()=>{
 const workflow=readFileSync(new URL(
  '../design/fishing-p3-oidc-readonly.workflow.PROPOSED.yml',import.meta.url),'utf8');
 const probe=readFileSync(new URL('../src/p3-oidc-readonly-cli.mjs',import.meta.url),'utf8');
 const disabled=readFileSync(new URL('../src/p3-disabled-ingress-worker.mjs',import.meta.url),'utf8');
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/id-token: write/);
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/persist-credentials: false/);
 assert.match(workflow,/0000000000000000000000000000000000000000/);
 assert.match(workflow,/github\.actor_id == 265665562/);
 assert.doesNotMatch(workflow,/pull_request:|schedule:|workflow_call:|secrets\./);
 assert.doesNotMatch(probe,/\/access_tokens|\/merges|api\.cloudflare\.com|\.cloudflareaccess\.com|D1Database/);
 assert.doesNotMatch(disabled,/p3-oidc-readonly-preflight|p3-oidc-readonly-cli/);
});
