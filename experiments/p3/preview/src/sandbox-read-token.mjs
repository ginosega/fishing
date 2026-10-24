/**
 * FISH118 P3-6: Node-runner read-only App grant for sandbox checkout.
 * SOURCE ONLY. Token never enters Worker responses, source, Git remotes or logs.
 * This issuer does not authorize a GitHub content/PR write.
 */
import {appJwt} from './github-app-readonly.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com';
const HEADERS={
 'Accept':'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-p3-sandbox-publisher',
};
const validId=value=>typeof value==='string'&&/^[1-9]\d{0,15}$/.test(value);
export class ReadTokenError extends Error{
 constructor(code){super('Sandbox read-only installation grant refused');this.name='ReadTokenError';this.code=code;}
}
const fail=code=>{throw new ReadTokenError(code);};
const ok=(yes,code)=>{if(!yes)fail(code);};
export function createSandboxReadTokenIssuer({env,request=fetch}={}){
 ok(typeof request==='function','INVALID_CONFIGURATION');
 async function api(url,bearer,method='GET',body){
  ok(url.startsWith(API+'/'),'API_ORIGIN_DENIED');
  let response;
  try{
   response=await request(url,{method,headers:{
    ...HEADERS,Authorization:'Bearer '+bearer,
    ...(body?{'Content-Type':'application/json'}:{}),
   },...(body?{body:JSON.stringify(body)}:{})});
  }catch{fail('GITHUB_NETWORK_ERROR');}
  ok(response?.ok===true,'GITHUB_RESPONSE_DENIED');
  try{return await response.json();}catch{fail('GITHUB_INVALID_RESPONSE');}
 }
 async function issueReadToken({repositoryId,permissions}={}){
  ok(repositoryId===ID&&permissions?.contents==='read'&&
   Object.keys(permissions).length===1,'READ_SCOPE_DENIED');
  ok(validId(env?.P3_GITHUB_APP_ID)&&validId(env?.P3_GITHUB_INSTALLATION_ID)&&
   typeof env?.P3_GITHUB_PRIVATE_KEY==='string'&&env.P3_GITHUB_PRIVATE_KEY.length>0,
   'APP_CONFIGURATION_MISSING');
  let jwt;
  try{jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY});}
  catch{fail('APP_JWT_FAILED');}
  const installation=await api(API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID,jwt);
  ok(installation?.id===Number(env.P3_GITHUB_INSTALLATION_ID)&&
   installation?.app_id===Number(env.P3_GITHUB_APP_ID)&&
   installation?.account?.login==='ginosega'&&
   installation?.repository_selection==='selected'&&
   installation?.suspended_at==null&&
   ['read','write'].includes(installation?.permissions?.contents),
   'APP_INSTALLATION_DENIED');
  const repositoryInstall=await api(API+'/repos/'+REPO+'/installation',jwt);
  ok(repositoryInstall?.id===installation.id&&
   repositoryInstall?.app_id===installation.app_id&&
   repositoryInstall?.account?.login==='ginosega','SANDBOX_INSTALLATION_DENIED');
  const grant=await api(API+'/app/installations/'+installation.id+'/access_tokens',
   jwt,'POST',{repository_ids:[ID],permissions:{contents:'read'}});
  ok(typeof grant?.token==='string'&&grant.token.length>=12&&
   grant?.permissions?.contents==='read'&&
   Object.entries(grant.permissions).every(([k,v])=>
    (k==='contents'&&v==='read')||(k==='metadata'&&v==='read'))&&
   Array.isArray(grant.repositories)&&grant.repositories.length===1&&
   grant.repositories[0]?.id===ID&&grant.repositories[0]?.full_name===REPO,
   'READ_GRANT_SCOPE_MISMATCH');
  return Object.freeze({token:grant.token,repositoryId:ID,permissions:{contents:'read'}});
 }
 return Object.freeze({issueReadToken});
}
