/**
 * FISH118 D2 operator-only, read-only GitHub App installation inventory.
 * No repository write API calls. Uses the locally retained PEM file, which is
 * never printed or transmitted to ChatGPT. Token is memory-only and
 * requested with READ-ONLY permissions across the installation so the
 * repository inventory can be independently checked, rather than trusting
 * selected-repository mode or a single restricted-token response.
 *
 * Usage from experiments/p3/preview:
 *   node tools/verify-d2-app-installation.mjs APP_ID INSTALL_ID PATH_TO_PEM
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {appJwt} from '../src/github-app-readonly.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com';
const expectedGrant={contents:'write',pull_requests:'write',checks:'read',metadata:'read'};
const restricted={contents:'read',pull_requests:'read',checks:'read'};
const numeric=s=>typeof s==='string'&&/^[1-9][0-9]{0,15}$/.test(s)&&Number.isSafeInteger(Number(s));
const same=(a,b)=>a&&typeof a==='object'&&
 Object.keys(a).length===Object.keys(b).length&&
 Object.entries(b).every(([k,v])=>a[k]===v);
const readTokenScopes=p=>p&&typeof p==='object'&&
 Object.entries(p).every(([k,v])=>(k==='metadata'&&v==='read')||restricted[k]===v)&&
 Object.entries(restricted).every(([k,v])=>p[k]===v);

export class D2ActivationProofError extends Error{
 constructor(code){super('D2 GitHub installation preflight refused');this.name='D2ActivationProofError';this.code=code;}
}
const fail=code=>{throw new D2ActivationProofError(code);};
const check=(v,c)=>{if(!v)fail(c);};
export async function verifyD2AppInstallation({
 appId,installationId,privateKey,request=fetch,signJwt=appJwt,
}={}){
 check(numeric(appId)&&numeric(installationId)&&
  typeof privateKey==='string'&&privateKey.length>100&&
  typeof request==='function'&&typeof signJwt==='function','BAD_LOCAL_CONFIG');
 let jwt;
 try{jwt=await signJwt({appId,privateKey});}catch{fail('PEM_SIGNING_FAILED');}
 check(typeof jwt==='string'&&jwt.length>0,'PEM_SIGNING_FAILED');
 // JWT is used only for installation inventory and an intentionally
 // downgraded read-only token. Neither grants repository write authority.
 async function gh(url,auth,{method='GET',body}={}){
  check([
   API+'/app/installations/'+installationId,
   API+'/repos/'+REPO+'/installation',
   API+'/app/installations/'+installationId+'/access_tokens',
   API+'/installation/repositories?per_page=100&page=1',
  ].includes(url),'URL_NOT_ALLOWLISTED');
  check(method==='GET'||(url.endsWith('/access_tokens')&&method==='POST'),
   'METHOD_DENIED');
  let response;
  try{
   response=await request(url,{
    method,redirect:'manual',
    headers:{Authorization:'Bearer '+auth,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d2-installation-preflight',
     ...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),
   });
  }catch{fail('GITHUB_UNAVAILABLE');}
  check(response?.ok===true&&response?.status===200+
   (method==='POST'?1:0)&&response.redirected!==true,
   'GITHUB_REJECTED');
  try{return await response.json();}catch{fail('GITHUB_BAD_JSON');}
 }
 const installation=await gh(API+'/app/installations/'+installationId,jwt);
 check(installation.id===Number(installationId)&&
  installation.app_id===Number(appId)&&
  installation.account?.login==='ginosega'&&
  installation.repository_selection==='selected'&&
  installation.suspended_at==null,'WRONG_INSTALLATION');
 check(same(installation.permissions,expectedGrant),'INSTALLATION_PERMISSIONS_NOT_READY');
 const association=await gh(API+'/repos/'+REPO+'/installation',jwt);
 check(association.id===Number(installationId)&&
  association.app_id===Number(appId)&&
  association.account?.login==='ginosega','SANDBOX_NOT_INSTALLED');
 // Enumerate the ENTIRE installation with a downgraded read-only token;
 // explicit repository_ids=[ID] would conceal extra grants.
 const minted=await gh(API+'/app/installations/'+installationId+'/access_tokens',
  jwt,{method:'POST',body:{permissions:restricted}});
 check(typeof minted.token==='string'&&minted.token.length>=12&&
  readTokenScopes(minted.permissions),'READ_TOKEN_NOT_RESTRICTED');
 const inventory=await gh(API+'/installation/repositories?per_page=100&page=1',
  minted.token);
 check(inventory.total_count===1&&
  Array.isArray(inventory.repositories)&&inventory.repositories.length===1&&
  inventory.repositories[0].id===ID&&
  inventory.repositories[0].full_name===REPO&&
  inventory.repositories[0].private===true,'INSTALLATION_REPOSITORY_SCOPE_DENIED');
 // No token, key, JWT, client ID, repo list or raw API response is emitted.
 return Object.freeze({
  verified:true,installationSelectedOnly:true,
  selectedRepositoryCount:1,repository:REPO,repositoryId:ID,
  permissions:{...expectedGrant},
  inspectionToken:'read-only',publishingEnabled:false,
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [appId,installationId,pemPath,...extra]=process.argv.slice(2);
  if(extra.length||!pemPath)fail('BAD_LOCAL_CONFIG');
  let privateKey;
  try{privateKey=await readFile(resolve(pemPath),'utf8');}
  catch{fail('PEM_FILE_UNAVAILABLE');}
  console.log(JSON.stringify(await verifyD2AppInstallation({
   appId,installationId,privateKey,
  })));
 }catch(error){
  console.error('D2_APP_PREFLIGHT_REFUSED '+(
   error instanceof D2ActivationProofError?error.code:'UNEXPECTED_REFUSAL'));
  process.exitCode=1;
 }
}
