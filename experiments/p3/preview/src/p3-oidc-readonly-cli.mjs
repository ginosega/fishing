/**
 * FISH118 P3-37 — FUTURE manual-only OIDC preflight runner.
 * NOT installed in the private sandbox. NO GitHub App key, Cloudflare secret,
 * installation token, D1, PR, merge, deployment or publication capability.
 * Safe outputs are invariant fixed labels and known numeric GitHub IDs only.
 *
 * Importing this module does nothing. Only explicit direct execution in an
 * owner-authorized private workflow can request a one-use GitHub OIDC JWT.
 */
import {pathToFileURL} from 'node:url';
import {createP3ReadOnlyOidcPreflight,P3_OIDC_PREFLIGHT_AUDIENCE}
 from './p3-oidc-readonly-preflight.mjs';
import {readP3BoundedResponseText} from './p3-bounded-response.mjs';

export class P3OidcRunnerError extends Error{
 constructor(code){super('P3 OIDC-only runner preflight refused');
  this.name='P3OidcRunnerError';this.code=code;}
}
const stop=code=>{throw new P3OidcRunnerError(code);};
const check=(ok,code)=>{if(!ok)stop(code);};
const sha=/^[0-9a-f]{40}$/;
const digits=x=>typeof x==='string'&&/^[1-9][0-9]{0,15}$/.test(x)&&
 Number.isSafeInteger(Number(x));
const AUD=P3_OIDC_PREFLIGHT_AUDIENCE;
const JWKS='https://token.actions.githubusercontent.com/.well-known/jwks';
// GitHub's runner may route its OIDC service through regional pipelines
// subdomains (for example pipelinesghubeus6.actions.githubusercontent.com).
// Trust only this exact DNS suffix and a constrained pipelines host prefix.
const trustedOidcHost=hostname=>typeof hostname==='string'&&
 /^pipelines[a-z0-9]{0,24}\.actions\.githubusercontent\.com$/.test(hostname);
const diagnosticCodes=new Set([
 'INVALID_PROBE_CONFIG','WRONG_RUN_CONTEXT','OIDC_ENDPOINT_UNAVAILABLE',
 'OIDC_ENDPOINT_DENIED','OIDC_REQUEST_UNAVAILABLE','JWKS_UNAVAILABLE',
 'INVALID_PREFLIGHT_CONFIG','OIDC_INVALID','OIDC_SCOPE_DENIED',
]);

export async function runP3OidcReadOnlyProbe({
 env,fetchImpl,now=()=>Math.floor(Date.now()/1000),emit=()=>{},
}={}){
 check(env&&typeof env==='object'&&typeof fetchImpl==='function'&&
  typeof now==='function'&&typeof emit==='function','INVALID_PROBE_CONFIG');
 check(env.GITHUB_ACTIONS==='true'&&env.P3_OIDC_PREFLIGHT_ENABLED==='true'&&
  env.GITHUB_REPOSITORY==='ginosega/fishing-p3-sandbox'&&
  env.GITHUB_REPOSITORY_ID==='1430581407'&&
  env.GITHUB_ACTOR_ID==='265665562'&&
  env.GITHUB_EVENT_NAME==='workflow_dispatch'&&
  env.GITHUB_REF==='refs/heads/main'&&sha.test(env.GITHUB_SHA??'')&&
  digits(env.GITHUB_RUN_ID)&&digits(env.GITHUB_RUN_ATTEMPT)&&
  Number(env.GITHUB_RUN_ATTEMPT)<=100,'WRONG_RUN_CONTEXT');
 check(typeof env.ACTIONS_ID_TOKEN_REQUEST_URL==='string'&&
  typeof env.ACTIONS_ID_TOKEN_REQUEST_TOKEN==='string'&&
  env.ACTIONS_ID_TOKEN_REQUEST_TOKEN.length>=20&&
  env.ACTIONS_ID_TOKEN_REQUEST_TOKEN.length<=8192,
  'OIDC_ENDPOINT_UNAVAILABLE');
 let request;
 try{
  request=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  check(request.protocol==='https:'&&
   trustedOidcHost(request.hostname)&&
   !request.username&&!request.password&&!request.hash&&
   request.pathname.length>1,'OIDC_ENDPOINT_DENIED');
  request.searchParams.set('audience',AUD);
 }catch{stop('OIDC_ENDPOINT_DENIED');}
 const requestUrl=request.href;
 const tokenFetch=async()=>{
  let r;
  try{
   r=await fetchImpl(requestUrl,{method:'GET',redirect:'error',
    cache:'no-store',signal:AbortSignal.timeout(5000),
    headers:{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
     Accept:'application/json'}});
  }catch{stop('OIDC_REQUEST_UNAVAILABLE');}
  check(r instanceof Response&&r.status===200&&!r.redirected&&
   (!r.url||r.url===requestUrl),'OIDC_REQUEST_UNAVAILABLE');
  let parsed;
  try{parsed=JSON.parse(await readP3BoundedResponseText(r,12000));}
  catch{stop('OIDC_REQUEST_UNAVAILABLE');}
  check(parsed&&Object.getPrototypeOf(parsed)===Object.prototype&&
   Object.keys(parsed).length===1&&typeof parsed.value==='string'&&
   parsed.value.length>=120&&parsed.value.length<=10000,
   'OIDC_REQUEST_UNAVAILABLE');
  return parsed.value;
 };
 const loadKeys=async url=>{
  check(url===JWKS,'JWKS_UNAVAILABLE');
  let r;
  try{
   r=await fetchImpl(JWKS,{method:'GET',redirect:'error',
    cache:'no-store',signal:AbortSignal.timeout(5000),
    headers:{Accept:'application/json'}});
  }catch{stop('JWKS_UNAVAILABLE');}
  check(r instanceof Response&&r.status===200&&!r.redirected&&
   (!r.url||r.url===JWKS),'JWKS_UNAVAILABLE');
  return r;
 };
 const ctx={
  actorId:env.GITHUB_ACTOR_ID,event:env.GITHUB_EVENT_NAME,
  ref:env.GITHUB_REF,repo:env.GITHUB_REPOSITORY,
  repoId:env.GITHUB_REPOSITORY_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,
  runId:env.GITHUB_RUN_ID,sha:env.GITHUB_SHA,
 };
 const verifier=createP3ReadOnlyOidcPreflight({requestKeys:loadKeys,now});
 const verified=await verifier.verify(await tokenFetch(),ctx);
 // Output is a fixed safe string: NO JWT, signing kid, claims, bearer token,
 // service-token secret, author signature or untrusted provider error.
 emit('PASS: GitHub RSA-signed OIDC; immutable sandbox repo/owner, main, '+
  'manual workflow, hosted runner, audience, workflow SHA and run identity.');
 return verified;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 runP3OidcReadOnlyProbe({env:process.env,fetchImpl:fetch,
  emit:message=>process.stdout.write(message+'\n')})
  .catch(e=>{
   // Only emit fixed, reviewed machine codes, NEVER provider response data,
   // JWT claims, bearer headers, URLs, tokens, stack traces or error messages.
   const type=e?.name;
   const safe=(type==='P3OidcRunnerError'||type==='P3OidcPreflightError')&&
    diagnosticCodes.has(e.code)?e.code:'UNCLASSIFIED_FAILURE';
   process.stderr.write('DENY: OIDC-only preflight '+safe+'.\n');
   process.exitCode=1;
  });
}
