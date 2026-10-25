/**
 * FISH118 P3-37 — OIDC-ONLY source/fixture preflight for a FUTURE approved
 * manual private-sandbox workflow. Not a deployed Worker, active workflow,
 * credential exchange, App auth, Cloudflare Access or owner approval.
 *
 * This verifier requires injected JWKS transport, exact immutable run context
 * and a separately obtained GitHub-issued JWT. No default network or logger.
 * Only fixed, nonsecret proof fields are returned; token/key material never is.
 */
import {readP3BoundedResponseText} from './p3-bounded-response.mjs';

export class P3OidcPreflightError extends Error{
 constructor(code){
  super('P3 read-only OIDC preflight denied');
  this.name='P3OidcPreflightError';
  this.code=code;
 }
}
const reject=code=>{throw new P3OidcPreflightError(code);};
const need=(ok,code)=>{if(!ok)reject(code);};
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const ISS='https://token.actions.githubusercontent.com';
const JWKS=ISS+'/.well-known/jwks';
const REPO='ginosega/fishing-p3-sandbox';
const ID=1430581407,OWNER=265665562;
const WF=REPO+'/.github/workflows/fishing-p3-oidc-readonly.yml@refs/heads/main';
const AUD='fishing-p3:trusted-runner:owner-accept';
const SHA=/^[a-f0-9]{40}$/;
const number=n=>typeof n==='string'&&/^[1-9][0-9]{0,15}$/.test(n)&&
 Number.isSafeInteger(Number(n));
const record=v=>v&&Object.getPrototypeOf(v)===Object.prototype;
function base64(value){
 need(typeof value==='string'&&value.length>0&&value.length<7000&&
  /^[A-Za-z0-9_-]+$/.test(value),'OIDC_INVALID');
 let bytes;
 try{
  bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+
   '='.repeat((4-value.length%4)%4)),v=>v.charCodeAt(0));
 }catch{reject('OIDC_INVALID');}
 need(btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-')
  .replace(/\//g,'_').replace(/=+$/,'')===value,'OIDC_INVALID');
 return bytes;
}
function segment(s){
 try{return JSON.parse(dec.decode(base64(s)));}
 catch{reject('OIDC_INVALID');}
}
function correctContext(context){
 need(record(context)&&Object.keys(context).sort().join(',')===
  'actorId,event,ref,repo,repoId,runAttempt,runId,sha'&&
  context.repo===REPO&&context.repoId===String(ID)&&
  context.actorId===String(OWNER)&&
  context.event==='workflow_dispatch'&&context.ref==='refs/heads/main'&&
  SHA.test(context.sha)&&number(context.runId)&&
  number(context.runAttempt)&&Number(context.runAttempt)<=100,
  'WRONG_RUN_CONTEXT');
}
export function createP3ReadOnlyOidcPreflight({
 requestKeys,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof requestKeys==='function'&&typeof now==='function',
  'INVALID_PREFLIGHT_CONFIG');
 async function verify(jwt,context){
  correctContext(context);
  need(typeof jwt==='string'&&jwt.length>=120&&jwt.length<=10000,
   'OIDC_INVALID');
  const parts=jwt.split('.');
  need(parts.length===3&&parts.every(x=>x&&x.length<7000),'OIDC_INVALID');
  const header=segment(parts[0]),claim=segment(parts[1]),signature=base64(parts[2]);
  need(record(header)&&record(claim)&&header.alg==='RS256'&&
   header.typ==='JWT'&&typeof header.kid==='string'&&
   header.kid.length>=8&&header.kid.length<=256&&
   !('jwk'in header)&&!('jku'in header)&&!('x5u'in header),
   'OIDC_INVALID');
  const clock=now();
  // Every category is a fixed, nonsecret denial code. Do not print any
  // unsigned JWT claim value, token, JWK, URL, header, or provider message.
  // These shape checks do NOT authenticate the payload: a PASS still requires
  // exact-kid RSA signature verification against GitHub's issuer JWKS below.
  need(Number.isSafeInteger(clock)&&clock>0&&
   Number.isSafeInteger(claim.iat)&&Number.isSafeInteger(claim.exp)&&
   claim.iat<=clock+30&&claim.iat>=clock-600&&
   claim.exp>clock&&claim.exp>claim.iat&&claim.exp-claim.iat<=600&&
   (claim.nbf===undefined||(Number.isSafeInteger(claim.nbf)&&
    claim.nbf<=clock+30)),'OIDC_TIME_DENIED');
  need(claim.iss===ISS&&claim.aud===AUD,
   'OIDC_ISSUER_AUDIENCE_DENIED');
  need(claim.sub==='repo:ginosega@'+OWNER+'/fishing-p3-sandbox@'+ID+
    ':ref:refs/heads/main','OIDC_SUBJECT_DENIED');
  need(claim.repository===REPO&&
   claim.repository_id===String(ID)&&
   claim.repository_owner==='ginosega'&&
   claim.repository_owner_id===String(OWNER)&&
   claim.repository_visibility==='private','OIDC_REPOSITORY_DENIED');
  need(claim.actor_id===String(OWNER)&&
   claim.actor_id===context.actorId,'OIDC_ACTOR_DENIED');
  need(claim.ref_type==='branch'&&claim.ref===context.ref,
   'OIDC_REF_DENIED');
  need(claim.event_name===context.event&&
   claim.runner_environment==='github-hosted','OIDC_EXECUTION_DENIED');
  need(claim.workflow_ref===WF&&claim.workflow_sha===context.sha,
   'OIDC_WORKFLOW_DENIED');
  need(claim.run_id===context.runId&&
   claim.run_attempt===context.runAttempt,'OIDC_RUN_DENIED');
  need(claim.job_workflow_ref===undefined&&
   claim.job_workflow_sha===undefined,'OIDC_REUSABLE_DENIED');
  let jwks;
  try{
   const r=await requestKeys(JWKS);
   need(r instanceof Response&&r.status===200&&!r.redirected&&
    (!r.url||r.url===JWKS),'JWKS_UNAVAILABLE');
   jwks=JSON.parse(await readP3BoundedResponseText(r,32768));
  }catch{reject('JWKS_UNAVAILABLE');}
  need(record(jwks)&&Array.isArray(jwks.keys)&&
   jwks.keys.length>0&&jwks.keys.length<=20,'JWKS_UNAVAILABLE');
  const selected=jwks.keys.filter(j=>record(j)&&j.kty==='RSA'&&
   j.kid===header.kid&&(j.alg===undefined||j.alg==='RS256')&&
   (j.use===undefined||j.use==='sig')&&
   typeof j.n==='string'&&typeof j.e==='string');
  need(selected.length===1,'JWKS_UNAVAILABLE');
  let valid=false;
  try{
   const key=await crypto.subtle.importKey('jwk',selected[0],
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,
    signature,enc.encode(parts[0]+'.'+parts[1]));
  }catch{reject('OIDC_INVALID');}
  need(valid===true,'OIDC_INVALID');
  // Fixed safe shape. No token, JWK, arbitrary claim, header or secret returned.
  return Object.freeze({
   verified:true,repositoryId:ID,ownerGitHubId:OWNER,
   runId:Number(context.runId),runAttempt:Number(context.runAttempt),
   workflowSha:context.sha,
   subjectFormat:'immutable-id',
  });
 }
 return Object.freeze({verify});
}
export const P3_OIDC_PREFLIGHT_AUDIENCE=AUD;
