/**
 * Source-only restricted GitHub App installation token provider for P3.
 * NOT imported by Cloudflare Worker and cannot be invoked over HTTP.
 * Requires independent trusted, explicit write enablement at deployment time.
 * Returns ephemeral token to SERVER code only; never return it to a browser.
 */
import {appJwt} from './github-app-readonly.mjs';
export class WriteTokenError extends Error{
 constructor(code){super('Sandbox installation token refused');this.name='WriteTokenError';this.code=code;}
}
const fail=c=>{throw new WriteTokenError(c);};
const ok=(v,c)=>{if(!v)fail(c);};
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const ROOT='https://api.github.com';
const validId=s=>typeof s==='string'&&/^[1-9]\d{0,15}$/.test(s);
const statusCode=s=>[401,403,404,422].includes(s)?s:0;
export function createSandboxWriteTokenIssuer({env,request=fetch,enabled=()=>false}={}){
 ok(typeof request==='function'&&typeof enabled==='function','INVALID_CONFIG');
 async function api(url,token,method='GET',body){
  const init={method,headers:{
   'Authorization':'Bearer '+token,
   'Accept':'application/vnd.github+json',
   'X-GitHub-Api-Version':'2026-03-10',
   'User-Agent':'fishing-p3-sandbox-publisher',
   ...(body?{'Content-Type':'application/json'}:{}),
  }};
  if(body)init.body=JSON.stringify(body);
  let res;
  try{res=await request(url,init);}catch{fail('GITHUB_NETWORK_ERROR');}
  if(!res.ok)fail('GITHUB_HTTP_'+statusCode(res.status));
  try{return await res.json();}catch{fail('BAD_GITHUB_RESPONSE');}
 }
 async function issueToken({repositoryId,permissions}={}){
  ok(enabled()===true&&env?.P3_WRITE_ENABLED==='true','WRITES_DISABLED');
  ok(repositoryId===ID&&permissions?.contents==='write'&&
   permissions?.pull_requests==='write'&&Object.keys(permissions).length===2,
   'TOKEN_SCOPE_DENIED');
  ok(validId(env?.P3_GITHUB_APP_ID)&&validId(env?.P3_GITHUB_INSTALLATION_ID)&&
   typeof env.P3_GITHUB_PRIVATE_KEY==='string','INVALID_APP_CONFIG');
  let jwt;
  try{jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY});}
  catch{fail('JWT_SIGNING_FAILED');}
  const installation=await api(ROOT+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID,jwt);
  ok(installation?.id===Number(env.P3_GITHUB_INSTALLATION_ID)&&
   installation?.app_id===Number(env.P3_GITHUB_APP_ID)&&
   installation?.account?.login==='ginosega'&&
   installation?.repository_selection==='selected'&&
   installation?.suspended_at==null&&
   installation?.permissions?.contents==='write'&&
   installation?.permissions?.pull_requests==='write','INVALID_INSTALLATION');
  const repoInstallation=await api(ROOT+'/repos/'+REPO+'/installation',jwt);
  ok(repoInstallation?.id===installation.id&&repoInstallation?.app_id===installation.app_id,
   'REPOSITORY_NOT_INSTALLED');
  const subset={repository_ids:[ID],permissions:{contents:'write',pull_requests:'write'}};
  const issued=await api(ROOT+'/app/installations/'+installation.id+'/access_tokens',jwt,'POST',subset);
  ok(typeof issued?.token==='string'&&issued.token.length>=12&&
   issued.permissions?.contents==='write'&&issued.permissions?.pull_requests==='write'&&
   issued.repositories?.length===1&&issued.repositories[0]?.id===ID&&
   issued.repositories[0]?.full_name===REPO,
   'ISSUED_TOKEN_SCOPE_MISMATCH');
  return {token:issued.token,repositoryId:ID,
   permissions:{contents:'write',pull_requests:'write'}};
 }
 return Object.freeze({issueToken});
}
