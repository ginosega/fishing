/**
 * FISH-TODO-118 WP3 H2 — exact Worker-bound GitHub App grant inspector.
 *
 * SOURCE ONLY / UNMOUNTED / DEFAULT DENY.
 * This obtains evidence using the SAME Worker-bound App ID and private key as
 * the real signed-read implementation, not the ChatGPT GitHub connector or
 * an owner screenshot. It never returns or logs JWTs, installation tokens,
 * PEM contents, unrestricted permissions or an authorization to publish.
 *
 * A metadata:read-only installation token is created solely to inspect the
 * unfiltered repository selection (exactly one installed repository).
 * Token issuance is not Git content/branch/PR mutation, but does require
 * a separately authorized provider preflight and is NEVER executed by
 * importing this module or by a disabled Worker.
 */
import {createD6ProductionAppSigner}
 from '../../experiments/p3/preview/src/d6-production-app-signer.mjs';

const API='https://api.github.com';
const REPO='ginosega/fishing',REPO_ID=1350909744;
const OWNER='ginosega',OWNER_ID=265665562;
const VERSION='2026-03-10';
const NUM=/^[1-9][0-9]{0,15}$/;
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const JSON_MAX=32768;

export class D6Wp3H2AppGrantError extends Error{
 constructor(code){
  super('H2 Worker-bound App grant not independently verified');
  this.name='D6Wp3H2AppGrantError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3H2AppGrantError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const plain=x=>x!==null&&typeof x==='object'&&
 !Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function permissions(obj,requested){
 need(plain(obj)&&Object.keys(obj).sort().join(',')===
  Object.keys(requested).sort().join(',')&&
  Object.entries(requested).every(([k,v])=>obj[k]===v),
  'PERMISSION_SCOPE_UNVERIFIED');
}
function identity(installation,id,appId){
 need(plain(installation)&&installation.id===id&&
  installation.app_id===appId&&
  installation.repository_selection==='selected'&&
  installation.suspended_at===null&&
  installation.target_type==='User'&&
  installation.target_id===OWNER_ID&&
  installation.account?.id===OWNER_ID&&
  installation.account?.login===OWNER,
  'INSTALLATION_IDENTITY_UNVERIFIED');
 permissions(installation.permissions,{
  contents:'write',metadata:'read',pull_requests:'write',
 });
}

/**
 * Disabled unless the caller has checked source/Worker isolation and
 * explicitly enabled a narrow read-only metadata preflight.
 * `signAppJwt` injection is for deterministic test transport only; in the
 * trusted Worker use the existing canonical signer (default).
 */
export function createD6Wp3H2AppInstallationPreflight({
 env={},network=globalThis.fetch,
 cryptoApi=globalThis.crypto,now=()=>Math.floor(Date.now()/1000),
 enabled=()=>false,signAppJwt=null,
}={}){
 need(typeof network==='function'&&typeof now==='function'&&
  typeof enabled==='function'&&
  (signAppJwt===null||typeof signAppJwt==='function'),
  'INVALID_CONFIG');
 const signer=signAppJwt??createD6ProductionAppSigner({
  enabled,cryptoApi,
 }).signAppJwt;

 function active(){
  need(enabled()===true,'DISABLED');
  need(env.D6_OWNER_GITHUB_ID===String(OWNER_ID)&&
   env.D6_REPOSITORY_ID===String(REPO_ID)&&
   NUM.test(env.D6_GITHUB_APP_ID??'')&&
   NUM.test(env.D6_GITHUB_INSTALLATION_ID??'')&&
   Number.isSafeInteger(Number(env.D6_GITHUB_APP_ID))&&
   Number.isSafeInteger(Number(env.D6_GITHUB_INSTALLATION_ID))&&
   typeof env.D6_GITHUB_APP_PRIVATE_KEY==='string'&&
   env.D6_GITHUB_APP_PRIVATE_KEY.length>500,
   'BINDING_UNVERIFIED');
 }
 async function call(path,{method='GET',authorization,body,
  expectedStatus=200}={}){
  active();
  need(typeof authorization==='string'&&
   authorization.length>=20,'TOKEN_UNAVAILABLE');
  const url=API+path;
  need((path==='/app'||path==='/app/installations/'+
   env.D6_GITHUB_INSTALLATION_ID||
   path==='/repos/'+REPO+'/installation'||
   path==='/app/installations/'+
    env.D6_GITHUB_INSTALLATION_ID+'/access_tokens'||
   path==='/installation/repositories?per_page=100')&&
   (method==='GET'||method==='POST'&&
    path.endsWith('/access_tokens')),'API_SCOPE_DENIED');
  let result;
  try{
   result=await network(url,{
    method,redirect:'manual',credentials:'omit',cache:'no-store',
    headers:{
     Accept:'application/vnd.github+json',
     Authorization:'Bearer '+authorization,
     'X-GitHub-Api-Version':VERSION,
     'User-Agent':'fishing-v3-h2-app-grant-readiness',
     ...(method==='POST'?{'Content-Type':'application/json'}:{}),
    },
    ...(method==='POST'?{body}:{}),
   });
  }catch{deny('PROVIDER_UNAVAILABLE');}
  active();
  need(result?.status===expectedStatus&&
   result.redirected!==true&&
   typeof result.text==='function'&&
   result.headers?.get?.('content-type')?.includes('application/json'),
   'PROVIDER_UNVERIFIED');
  const length=Number(result.headers.get('content-length'));
  need(!Number.isFinite(length)||length===0||
   length<=JSON_MAX,'PROVIDER_UNVERIFIED');
  let raw,value;
  try{
   raw=await result.text();
   need(raw.length>0&&raw.length<=JSON_MAX,'PROVIDER_UNVERIFIED');
   value=JSON.parse(raw);
  }catch{deny('PROVIDER_UNVERIFIED');}
  need(plain(value),'PROVIDER_UNVERIFIED');
  active();
  return value;
 }
 async function inspect(){
  active();
  const appId=Number(env.D6_GITHUB_APP_ID);
  const id=Number(env.D6_GITHUB_INSTALLATION_ID);
  let jwt;
  try{jwt=await signer({
   appId:env.D6_GITHUB_APP_ID,
   privateKey:env.D6_GITHUB_APP_PRIVATE_KEY,
   now:now(),
  });}catch{deny('SIGNER_UNAVAILABLE');}
  need(JWT.test(jwt??''),'SIGNER_UNAVAILABLE');
  // Only the App JWT from the pinned Worker-bound signer is used.
  const app=await call('/app',{authorization:jwt});
  need(app.id===appId&&typeof app.slug==='string'&&
   app.slug.length>0,'APP_IDENTITY_UNVERIFIED');
  const inst=await call('/app/installations/'+id,{
   authorization:jwt,
  });
  identity(inst,id,appId);
  const repoInstallation=await call('/repos/'+REPO+'/installation',{
   authorization:jwt,
  });
  identity(repoInstallation,id,appId);

  // Issue strictly metadata-read token, with NO repository restriction in
  // request so GET /installation/repositories reveals the *entire*
  // installation repository set. Never return or persist the token.
  const minted=await call('/app/installations/'+id+'/access_tokens',{
   method:'POST',authorization:jwt,
   body:JSON.stringify({permissions:{metadata:'read'}}),
   expectedStatus:201,
  });
  permissions(minted.permissions,{metadata:'read'});
  need(typeof minted.token==='string'&&minted.token.length>=20&&
   minted.token.length<=4096,'TOKEN_UNAVAILABLE');
  const list=await call('/installation/repositories?per_page=100',{
   authorization:minted.token,
  });
  need(list.total_count===1&&Array.isArray(list.repositories)&&
   list.repositories.length===1&&
   list.repositories[0]?.id===REPO_ID&&
   list.repositories[0]?.full_name===REPO&&
   list.repositories[0]?.owner?.id===OWNER_ID&&
   list.repositories[0]?.owner?.login===OWNER,
   'REPOSITORY_SCOPE_UNVERIFIED');
  active();
  return Object.freeze({
   verified:true,workerAppApiGrantVerified:true,
   appId,installationId:id,ownerGithubId:OWNER_ID,
   repositoryId:REPO_ID,repositoryFullName:REPO,
   repositorySelection:'selected',
   installedRepositoryCount:1,
   exactPermissionsVerified:true,
   sourceOnly:true,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({inspect});
}
