/**
 * FISH118 P3-30 — source-only provenance for a future trusted sandbox runner.
 * GitHub OIDC must be cryptographically checked; Actions env vars and Access
 * common_name alone are NEVER a user/App provenance proof.
 * NO default fetch, token issuance, repository mutation, or deployed imports.
 */
import {appJwt} from './github-app-readonly.mjs';
import {readP3BoundedResponseText} from './p3-bounded-response.mjs';

export class P3ProvenanceError extends Error {
 constructor(code){super('P3 trusted runner provenance denied');this.name='P3ProvenanceError';this.code=code;}
}
const deny=c=>{throw new P3ProvenanceError(c);};
const must=(v,c)=>{if(!v)deny(c);};
const REPO='ginosega/fishing-p3-sandbox',OWNER='ginosega';
const REPO_ID=1430581407,OWNER_ID=265665562;
const ISSUER='https://token.actions.githubusercontent.com';
const KEYS=ISSUER+'/.well-known/jwks';
const API='https://api.github.com';
const HEADERS={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-p3-provenance-source'};
const validSha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const validId=s=>typeof s==='string'&&/^[1-9]\d{0,15}$/.test(s)&&Number.isSafeInteger(Number(s));
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
function parse64(s){
 must(typeof s==='string'&&s.length>0&&s.length<7000&&
  /^[A-Za-z0-9_-]+$/.test(s),'OIDC_INVALID');
 try{
  const bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+
   '='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
  must(btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')===s,
   'OIDC_INVALID');
  return bytes;
 }catch(e){if(e instanceof P3ProvenanceError)throw e;deny('OIDC_INVALID');}
}
function parseSegment(segment){
 try{return JSON.parse(decoder.decode(parse64(segment)));}
 catch{deny('OIDC_INVALID');}
}
async function githubGet(request,url,jwt){
 let r;
 try{r=await request(url,{method:'GET',redirect:'manual',headers:{...HEADERS,
  Authorization:'Bearer '+jwt}});}
 catch{deny('APP_LOOKUP_UNAVAILABLE');}
 must(r instanceof Response&&r.status===200&&!r.redirected&&
  (!r.url||r.url===url),'APP_LOOKUP_UNAVAILABLE');
 try{return JSON.parse(await readP3BoundedResponseText(r,16384));}
 catch{deny('APP_LOOKUP_UNAVAILABLE');}
}
export function createP3RunnerProvenance({
 env,requestOidcKeys,requestGitHub,now=()=>Math.floor(Date.now()/1000),
 expectedWorkflowRef,expectedWorkflowSha,expectedAudience,
 expectedAppPermissions,
}={}){
 must(env&&typeof env==='object'&&
  typeof requestOidcKeys==='function'&&typeof requestGitHub==='function'&&
  typeof now==='function'&&validSha(expectedWorkflowSha)&&
  typeof expectedAudience==='string'&&/^[A-Za-z0-9:._/-]{24,160}$/.test(expectedAudience)&&
  typeof expectedWorkflowRef==='string'&&
  /^ginosega\/fishing-p3-sandbox\/\.github\/workflows\/[A-Za-z0-9_-]+\.yml@refs\/heads\/main$/.test(expectedWorkflowRef)&&
  object(expectedAppPermissions)&&Object.keys(expectedAppPermissions).length>0&&
  Object.keys(expectedAppPermissions).length<=6&&
  Object.entries(expectedAppPermissions).every(([k,v])=>
   /^[a-z_]{2,30}$/.test(k)&&['read','write'].includes(v))&&
  validId(env.P3_GITHUB_APP_ID)&&validId(env.P3_GITHUB_INSTALLATION_ID)&&
  typeof env.P3_GITHUB_PRIVATE_KEY==='string'&&env.P3_GITHUB_PRIVATE_KEY.length>32,
  'INVALID_PROVENANCE_CONFIG');

 async function verify(oidcJwt){
  must(typeof oidcJwt==='string'&&oidcJwt.length>=120&&oidcJwt.length<=10000,
   'OIDC_INVALID');
  const seg=oidcJwt.split('.');
  must(seg.length===3&&seg.every(x=>x.length>0&&x.length<7000),'OIDC_INVALID');
  const header=parseSegment(seg[0]),claims=parseSegment(seg[1]),sig=parse64(seg[2]);
  must(object(header)&&header.alg==='RS256'&&
   typeof header.kid==='string'&&header.kid.length>=8&&header.kid.length<=256&&
   !('jku'in header)&&!('x5u'in header)&&!('jwk'in header)&&
   object(claims),'OIDC_INVALID');
  const clock=now();
  // Authenticate the issuer-pinned GitHub RSA signature BEFORE evaluating
  // claim scope or consulting the GitHub App. Unverified JWT claim bytes
  // must never become a diagnostic or App trust signal.
  let jwks;
  try{
   const response=await requestOidcKeys(KEYS);
   must(response instanceof Response&&response.status===200&&!response.redirected&&
    (!response.url||response.url===KEYS),'OIDC_KEYS_UNAVAILABLE');
   jwks=JSON.parse(await readP3BoundedResponseText(response,32768));
  }catch{deny('OIDC_KEYS_UNAVAILABLE');}
  must(object(jwks)&&Array.isArray(jwks.keys)&&jwks.keys.length>0&&jwks.keys.length<=20,
   'OIDC_KEYS_UNAVAILABLE');
  const match=jwks.keys.filter(j=>object(j)&&j.kid===header.kid&&j.kty==='RSA'&&
   (j.alg===undefined||j.alg==='RS256')&&(j.use===undefined||j.use==='sig')&&
   typeof j.n==='string'&&typeof j.e==='string');
  must(match.length===1,'OIDC_KEYS_UNAVAILABLE');
  let valid=false;
  try{
   const key=await crypto.subtle.importKey('jwk',match[0],
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,sig,
    text.encode(seg[0]+'.'+seg[1]));
  }catch{deny('OIDC_INVALID');}
  must(valid===true,'OIDC_INVALID');
  must(Number.isSafeInteger(clock)&&clock>0&&
   Number.isSafeInteger(claims.iat)&&Number.isSafeInteger(claims.exp)&&
   claims.iat<=clock+30&&claims.iat>=clock-600&&
   claims.exp>clock&&claims.exp-claims.iat<=600&&
   (claims.nbf===undefined||(Number.isSafeInteger(claims.nbf)&&claims.nbf<=clock+30))&&
   claims.iss===ISSUER&&claims.aud===expectedAudience&&
   claims.repository===REPO&&claims.repository_id===String(REPO_ID)&&
   claims.repository_owner===OWNER&&
   claims.repository_owner_id===String(OWNER_ID)&&
   claims.sub==='repo:ginosega@'+OWNER_ID+'/fishing-p3-sandbox@'+REPO_ID+':ref:refs/heads/main'&&
   claims.ref==='refs/heads/main'&&claims.ref_type==='branch'&&
   claims.repository_visibility==='private'&&
   claims.actor_id===String(OWNER_ID)&&
   claims.event_name==='workflow_dispatch'&&
   claims.runner_environment==='github-hosted'&&
   // The real sandbox OIDC proof may include signed job_workflow_* claims
   // even for our manual job. Bind any present values to the EXACT trusted
   // workflow and SHA; never allow a different reusable workflow identity.
   (claims.job_workflow_ref===undefined||
    claims.job_workflow_ref===expectedWorkflowRef)&&
   (claims.job_workflow_sha===undefined||
    claims.job_workflow_sha===expectedWorkflowSha)&&
   claims.workflow_ref===expectedWorkflowRef&&
   claims.workflow_sha===expectedWorkflowSha&&
   validId(claims.run_id)&&validId(claims.run_attempt)&&
   Number(claims.run_attempt)<=100,
   'OIDC_SCOPE_DENIED');

  // GitHub App JWT and authenticated GET metadata are independent evidence.
  // Merely copying Action event JSON or a claimed numeric owner ID is not proof.
  let appToken;
  try{appToken=await appJwt({appId:env.P3_GITHUB_APP_ID,
   privateKey:env.P3_GITHUB_PRIVATE_KEY,now:clock});}
  catch{deny('APP_SIGNING_DENIED');}
  const install=await githubGet(requestGitHub,
   API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID,appToken);
  must(install?.id===Number(env.P3_GITHUB_INSTALLATION_ID)&&
   install?.app_id===Number(env.P3_GITHUB_APP_ID)&&
   install?.account?.login===OWNER&&install?.account?.id===OWNER_ID&&
   install?.repository_selection==='selected'&&install?.suspended_at==null,
   'APP_INSTALLATION_DENIED');
  // Exact granted permissions are owner-reviewed configuration, not arbitrary
  // string in a workflow event. Refuse unreviewed expanded permissions.
  must(object(install.permissions)&&
   JSON.stringify(Object.entries(install.permissions).sort())===
   JSON.stringify(Object.entries(expectedAppPermissions).sort()),
   'APP_PERMISSIONS_DENIED');
  const installed=await githubGet(requestGitHub,
   API+'/repos/'+REPO+'/installation',appToken);
  must(installed?.id===install.id&&installed?.app_id===install.app_id&&
   installed?.account?.login===OWNER&&installed?.account?.id===OWNER_ID&&
   installed?.repository_selection==='selected'&&installed?.suspended_at==null,
   'APP_REPOSITORY_DENIED');
  // No access token, credential, JWT or implicit permission to write leaves here.
  return Object.freeze({verified:true,repositoryId:REPO_ID,ownerGitHubId:OWNER_ID,
   runId:Number(claims.run_id),runAttempt:Number(claims.run_attempt),
   workflowSha:expectedWorkflowSha,appId:install.app_id,installationId:install.id});
 }
 return Object.freeze({verify});
}
