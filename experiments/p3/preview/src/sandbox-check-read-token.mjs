/**
 * FISH118 P3-10: disabled-by-default Node-only sandbox App installation token
 * provider for strictly read-only GitHub check evidence.
 *
 * Not routed/deployed; no UI exposure, GitHub writes, or merge capability.
 * The app registration AND installation must independently acquire Checks:read.
 * Never log or return issued tokens to a client, Worker response, or audit.
 */
import {appJwt} from './github-app-readonly.mjs';

const ID=1430581407;
const REPO='ginosega/fishing-p3-sandbox';
const ROOT='https://api.github.com';
const REQUIRED=Object.freeze({contents:'read',pull_requests:'read',checks:'read'});
const INSTALLATION_PERMISSIONS=Object.freeze(['contents','pull_requests','checks']);
const VALID_ID=s=>typeof s==='string'&&/^[1-9]\d{0,15}$/.test(s);
const sameScope=permissions=>permissions&&typeof permissions==='object'&&
 Object.keys(permissions).length===INSTALLATION_PERMISSIONS.length&&
 INSTALLATION_PERMISSIONS.every(k=>permissions[k]===REQUIRED[k]);

export class CheckReadTokenError extends Error{
 constructor(code){
  super('P3 read-only check token issuance refused');
  this.name='CheckReadTokenError';
  this.code=code;
 }
}
const fail=code=>{throw new CheckReadTokenError(code);};
const ensure=(condition,code)=>{if(!condition)fail(code);};

export function createSandboxCheckReadTokenIssuer({
 env,request=fetch,enabled=()=>false,
}={}){
 ensure(typeof request==='function'&&typeof enabled==='function','INVALID_CONFIGURATION');

 async function api(url,token,method='GET',body){
  ensure(url===ROOT+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID||
   url===ROOT+'/repos/'+REPO+'/installation'||
   url===ROOT+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID+'/access_tokens',
   'ENDPOINT_DENIED');
  const init={method,headers:{
   Authorization:'Bearer '+token,
   Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2026-03-10',
   'User-Agent':'fishing-p3-sandbox-publisher',
  }};
  if(body!==undefined){
   init.headers['Content-Type']='application/json';
   init.body=JSON.stringify(body);
  }
  let response;
  try{response=await request(url,init);}catch{fail('GITHUB_NETWORK_ERROR');}
  ensure(response?.ok===true,'GITHUB_RESPONSE_DENIED');
  try{return await response.json();}catch{fail('GITHUB_INVALID_RESPONSE');}
 }

 async function issueCheckReadToken({repositoryId,permissions}={}){
  ensure(enabled()===true,'CHECK_READER_DISABLED');
  ensure(repositoryId===ID&&sameScope(permissions),'READ_SCOPE_DENIED');
  ensure(VALID_ID(env?.P3_GITHUB_APP_ID)&&
   VALID_ID(env?.P3_GITHUB_INSTALLATION_ID)&&
   typeof env?.P3_GITHUB_PRIVATE_KEY==='string'&&
   env.P3_GITHUB_PRIVATE_KEY.length>0,
   'APP_CONFIGURATION_MISSING');
  let jwt;
  try{
   jwt=await appJwt({
    appId:env.P3_GITHUB_APP_ID,
    privateKey:env.P3_GITHUB_PRIVATE_KEY,
   });
  }catch{fail('APP_JWT_FAILED');}
  const installation=await api(ROOT+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID,jwt);
  ensure(installation?.id===Number(env.P3_GITHUB_INSTALLATION_ID)&&
   installation?.app_id===Number(env.P3_GITHUB_APP_ID)&&
   installation?.account?.login==='ginosega'&&
   installation?.repository_selection==='selected'&&
   installation?.suspended_at==null&&
   ['read','write'].includes(installation?.permissions?.contents)&&
   ['read','write'].includes(installation?.permissions?.pull_requests)&&
   installation?.permissions?.checks==='read',
   'CHECKS_INSTALLATION_NOT_APPROVED');
  const association=await api(ROOT+'/repos/'+REPO+'/installation',jwt);
  ensure(association?.id===installation.id&&
   association?.app_id===installation.app_id&&
   association?.account?.login==='ginosega',
   'SANDBOX_INSTALLATION_DENIED');
  const grant=await api(ROOT+'/app/installations/'+installation.id+'/access_tokens',
   jwt,'POST',{repository_ids:[ID],permissions:{...REQUIRED}});
  ensure(typeof grant?.token==='string'&&grant.token.length>=12&&
   Array.isArray(grant.repositories)&&
   grant.repositories.length===1&&
   grant.repositories[0]?.id===ID&&
   grant.repositories[0]?.full_name===REPO&&
   sameScope(Object.fromEntries(Object.entries(grant.permissions??{})
    .filter(([k])=>k!=='metadata')))&&
   Object.entries(grant.permissions??{}).every(([k,v])=>
    (k==='metadata'&&v==='read')||(k in REQUIRED&&v==='read')),
   'READ_GRANT_SCOPE_MISMATCH');
  return Object.freeze({
   token:grant.token,repositoryId:ID,permissions:Object.freeze({...REQUIRED}),
  });
 }
 return Object.freeze({issueCheckReadToken});
}
