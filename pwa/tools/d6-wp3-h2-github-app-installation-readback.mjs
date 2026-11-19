/**
 * FISH-TODO-118 WP3 H2 — Worker-bound GitHub App installation preflight.
 *
 * SOURCE ONLY. Two GitHub REST GETs; NEVER creates an installation token,
 * changes App permissions, installs an App, opens a PR or writes to GitHub.
 *
 * Requires TWO separately authenticated, already-issued Worker-bound
 * credentials supplied by trusted server-side callbacks:
 * - App JWT for GET /app/installations/:id,
 * - FULL, UNRESTRICTED installation token for GET /installation/repositories.
 *
 * A token restricted when minted to a smaller repository subset can
 * conceal a broader installation. Do NOT claim 'only one installed repo'
 * unless the trusted Worker-bound issuer independently confirms the
 * installation token is unrestricted. A user OAuth/GitHub ChatGPT
 * connector token is not interchangeable with the Worker's App.
 */
const HOST='https://api.github.com';
const OWNER=265665562,REPO_ID=1350909744;
const NAME='ginosega/fishing';
const ALLOWED=Object.freeze({
 contents:'write',pull_requests:'write',metadata:'read',
});
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_BYTES=131072;

export class D6H2AppReadError extends Error{
 constructor(code){
  super('H2 Worker-bound GitHub App installation proof unavailable');
  this.name='D6H2AppReadError';this.code=code;
 }
}
const deny=code=>{throw new D6H2AppReadError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const positive=n=>Number.isSafeInteger(n)&&n>0;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;

export function verifyD6H2AppInstallationEvidence({
 installation,repositories,appId,installationId,
}={}){
 need(positive(appId)&&positive(installationId),
  'INVALID_APP_PIN');
 need(plain(installation)&&
  installation.id===installationId&&
  installation.app_id===appId&&
  installation.repository_selection==='selected'&&
  installation.target_type==='User'&&
  installation.target_id===OWNER&&
  installation.account?.id===OWNER&&
  installation.account?.login==='ginosega'&&
  installation.suspended_at===null,
  'INSTALLATION_SCOPE_MISMATCH');
 const perms=installation.permissions;
 need(plain(perms)&&Object.keys(perms).length===3&&
  Object.keys(ALLOWED).every(k=>perms[k]===ALLOWED[k]),
  'APP_PERMISSIONS_MISMATCH');
 need(plain(repositories)&&repositories.total_count===1&&
  Array.isArray(repositories.repositories)&&
  repositories.repositories.length===1,
  'REPOSITORY_SCOPE_MISMATCH');
 const repo=repositories.repositories[0];
 need(plain(repo)&&repo.id===REPO_ID&&repo.full_name===NAME&&
  repo.name==='fishing'&&repo.owner?.id===OWNER&&
  repo.owner?.login==='ginosega'&&
  repo.private===true&&repo.default_branch==='main'&&
  repo.archived===false&&repo.disabled===false,
  'REPOSITORY_IDENTITY_MISMATCH');
 return Object.freeze({
  verified:true,appId,installationId,
  ownerGitHubId:OWNER,repositoryId:REPO_ID,
  repositoryFullName:NAME,repositorySelection:'selected',
  permissions:Object.freeze({...ALLOWED}),
  installedRepositoryCount:1,
  scopeRequiresUnrestrictedInstallationToken:true,
  sourceOnly:true,canPublish:false,isLive:false,
 });
}

async function boundedJSON(response) {
 need(response?.status===200&&response.ok===true&&
  /^application\/json(?:;|$)/i.test(
   response.headers?.get?.('Content-Type')??''),
  'HTTP_UNVERIFIED');
 const len=response.headers?.get?.('Content-Length');
 need(len===null||/^\d+$/.test(len)&&Number(len)<=MAX_BYTES,
  'BODY_UNVERIFIED');
 try{
  const reader=response.body?.getReader();
  need(reader,'BODY_UNVERIFIED');
  const chunks=[];let size=0,done=false;
  try{
   for(let i=0;i<128;i++){
    const r=await reader.read();
    if(r.done){done=true;break;}
    need(r.value instanceof Uint8Array,'BODY_UNVERIFIED');
    size+=r.value.byteLength;
    need(size<=MAX_BYTES,'BODY_UNVERIFIED');
    chunks.push(r.value);
   }
  }finally{if(!done)await reader.cancel().catch(()=>{});}
  need(done&&size>0,'BODY_UNVERIFIED');
  const bytes=new Uint8Array(size);let at=0;
  for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  need(plain(parsed),'BODY_UNVERIFIED');
  return parsed;
 }catch(e){
  if(e instanceof D6H2AppReadError)throw e;
  deny('BODY_UNVERIFIED');
 }
}

export function createD6H2AppInstallationReadback({
 appId,installationId,getAppJwt,getInstallationToken,
 assertUnrestrictedInstallationToken,
 network=globalThis.fetch,
}={}){
 need(positive(appId)&&positive(installationId)&&
  typeof getAppJwt==='function'&&
  typeof getInstallationToken==='function'&&
  typeof assertUnrestrictedInstallationToken==='function'&&
  typeof network==='function','INVALID_CONFIG');
 async function get(path,token){
  let response;
  try{
   response=await network(HOST+path,{
    method:'GET',redirect:'error',
    credentials:'omit',cache:'no-store',
    headers:{
     Accept:'application/vnd.github+json',
     Authorization:'Bearer '+token,
     'X-GitHub-Api-Version':'2022-11-28',
    },
   });
  }catch{deny('NETWORK_UNAVAILABLE');}
  return boundedJSON(response);
 }
 async function read(){
  // Only server-side token factories are allowed. Never accept an
  // Authorization header, JWT, GitHub URL or repository from a browser.
  let jwt;
  try{jwt=await getAppJwt();}
  catch{deny('APP_AUTH_UNAVAILABLE');}
  need(typeof jwt==='string'&&JWT.test(jwt)&&jwt.length<8192,
   'APP_AUTH_UNAVAILABLE');
  const installation=await get(
   '/app/installations/'+installationId,jwt);
  // Do not mint a token here. Require proof from the trusted issuer that
  // the pre-existing credential has NOT been narrowed to a repo subset.
  let token,scope;
  try{
   token=await getInstallationToken();
   scope=await assertUnrestrictedInstallationToken({
    appId,installationId,
   });
  }catch{deny('INSTALLATION_AUTH_UNAVAILABLE');}
  need(scope?.verified===true&&
   scope.appId===appId&&scope.installationId===installationId&&
   scope.repositoriesRestricted===false&&
   typeof token==='string'&&token.length>=12&&token.length<4096&&
   !/\s/.test(token),'INSTALLATION_AUTH_UNAVAILABLE');
  const repositories=await get('/installation/repositories?per_page=100',token);
  return verifyD6H2AppInstallationEvidence({
   installation,repositories,appId,installationId,
  });
 }
 return Object.freeze({read});
}
