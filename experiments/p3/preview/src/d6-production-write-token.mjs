/**
 * D6 production GitHub App WRITE token issuer — SOURCE ONLY / DEFAULT OFF.
 *
 * NO Worker route, GitHub file writer, pull request, D1 migration, secret
 * provisioning, authorization to enable write permissions, or cutover.
 *
 * The only permitted token is for numeric repo 1350909744. Each existing
 * publication step requests only contents:write or pull_requests:write;
 * a legacy combined grant remains accepted but is never substituted for a
 * narrower request. Implicit metadata:read is the only extra permission.
 * App JWT, installation token, PEM and transport remain trusted-server only.
 * A future coordinator must first durably fence the operation and revalidate
 * the owner session, canonical main, idempotency and exact PR-head evidence.
 */
import {D6_PUBLISH_REPOSITORY}
 from './d6-production-publish-intake.mjs';

const ROOT='https://api.github.com';
const REPO=D6_PUBLISH_REPOSITORY;
const SCOPE=Object.freeze({contents:'write',pull_requests:'write'});
const CONTENTS_SCOPE=Object.freeze({contents:'write'});
const PR_SCOPE=Object.freeze({pull_requests:'write'});
const MAX_RESPONSE=131072;
const decoder=new TextDecoder('utf-8',{fatal:true});
const isNum=v=>typeof v==='string'&&/^[1-9][0-9]{0,15}$/.test(v)&&
 Number.isSafeInteger(Number(v));
const object=v=>v!==null&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const exact=(p,wanted)=>object(p)&&
 Object.keys(p).length===Object.keys(wanted).length&&
 Object.keys(wanted).every(k=>p[k]===wanted[k]);
function scope(p){
 if(exact(p,CONTENTS_SCOPE))return CONTENTS_SCOPE;
 if(exact(p,PR_SCOPE))return PR_SCOPE;
 if(exact(p,SCOPE))return SCOPE;
 return null;
}
const granted=(p,wanted)=>object(p)&&
 Object.keys(p).every(k=>Object.hasOwn(wanted,k)||k==='metadata')&&
 Object.keys(wanted).every(k=>p[k]===wanted[k])&&
 (!Object.hasOwn(p,'metadata')||p.metadata==='read');

export class D6ProductionWriteTokenError extends Error {
 constructor(code){super('D6 production write grant unavailable');
  this.name='D6ProductionWriteTokenError';this.code=code;}
}
const deny=code=>{throw new D6ProductionWriteTokenError(code);};
const need=(v,code)=>{if(!v)deny(code);};

async function boundedJson(response){
 const len=response.headers.get('Content-Length');
 if(len!==null)need(/^\d+$/.test(len)&&
  Number(len)<=MAX_RESPONSE,'GITHUB_RESPONSE_TOO_LARGE');
 let reader;
 try{reader=response.body?.getReader();}
 catch{deny('GITHUB_RESPONSE_INVALID');}
 need(reader,'GITHUB_RESPONSE_INVALID');
 const chunks=[];let n=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   n+=value.byteLength;
   if(n>MAX_RESPONSE){
    await reader.cancel();deny('GITHUB_RESPONSE_TOO_LARGE');
   }
   chunks.push(value);
  }
 }catch(e){
  if(e instanceof D6ProductionWriteTokenError)throw e;
  deny('GITHUB_RESPONSE_INVALID');
 }
 need(n>0,'GITHUB_RESPONSE_INVALID');
 const bytes=new Uint8Array(n);let i=0;
 for(const chunk of chunks){bytes.set(chunk,i);i+=chunk.length;}
 try{
  const v=JSON.parse(decoder.decode(bytes));
  need(object(v),'GITHUB_RESPONSE_INVALID');
  return v;
 }catch(e){
  if(e instanceof D6ProductionWriteTokenError)throw e;
  deny('GITHUB_RESPONSE_INVALID');
 }
}

export function createD6ProductionWriteTokenIssuer({
 env,request,signAppJwt,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof request==='function'&&typeof signAppJwt==='function'&&
  typeof enabled==='function'&&typeof now==='function','INVALID_CONFIG');

 async function issueWriteToken({repositoryId,permissions}={}){
  need(enabled()===true,'DISABLED');
  const requested=scope(permissions);
  need(repositoryId===REPO.id&&requested,
   'WRITE_SCOPE_DENIED');
  const appId=env?.D6_GITHUB_APP_ID,
   installationId=env?.D6_GITHUB_INSTALLATION_ID;
  const privateKey=env?.D6_GITHUB_APP_PRIVATE_KEY;
  need(isNum(appId)&&isNum(installationId)&&
   typeof privateKey==='string'&&privateKey.length>=32,
   'MISSING_SERVER_CREDENTIALS');
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');
  let jwt;
  try{jwt=await signAppJwt({appId,privateKey,now:at});}
  catch{deny('APP_SIGNING_DENIED');}
  need(typeof jwt==='string'&&
   /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt),
   'APP_SIGNING_DENIED');

  const installation=ROOT+'/app/installations/'+installationId;
  const repoInstallation=ROOT+'/repos/'+REPO.name+'/installation';
  const tokenUrl=installation+'/access_tokens';
  async function get(url,method='GET',body){
   need(method==='GET'&&(url===installation||url===repoInstallation)||
    method==='POST'&&url===tokenUrl&&object(body),
    'GITHUB_REQUEST_DENIED');
   const options={
    method,redirect:'manual',cache:'no-store',credentials:'omit',
    headers:{Authorization:'Bearer '+jwt,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-d6-production-write-source',
     ...(method==='POST'?{'Content-Type':'application/json'}:{})},
    ...(method==='POST'?{body:JSON.stringify(body)}:{}),
   };
   let response;
   try{response=await request(url,options);}
   catch{deny('GITHUB_UNAVAILABLE');}
   need(response instanceof Response&&
    response.status===(method==='POST'?201:200)&&
    response.redirected===false&&
    (!response.url||response.url===url)&&
    /\bapplication\/json\b/i.test(
     response.headers.get('Content-Type')??''),
    'GITHUB_UNAVAILABLE');
   return boundedJson(response);
  }
  const inst=await get(installation);
  need(inst.id===Number(installationId)&&
   inst.app_id===Number(appId)&&
   inst.account?.id===REPO.ownerGitHubId&&
   inst.account?.login==='ginosega'&&
   inst.repository_selection==='selected'&&
   inst.suspended_at==null&&
   // The App must be owner-approved for the complete publishing
   // capability, but the minted step token must remain narrower.
   inst.permissions?.contents==='write'&&
   inst.permissions?.pull_requests==='write',
   'INSTALLATION_DENIED');
  const target=await get(repoInstallation);
  need(target.id===inst.id&&target.app_id===inst.app_id&&
   target.account?.id===REPO.ownerGitHubId&&
   target.account?.login==='ginosega'&&
   target.suspended_at==null,'REPOSITORY_DENIED');
  const result=await get(tokenUrl,'POST',{
   repository_ids:[REPO.id],permissions:requested,
  });
  const expires=typeof result.expires_at==='string'?
   Date.parse(result.expires_at)/1000:NaN;
  need(typeof result.token==='string'&&
   /^[^\s]{20,}$/.test(result.token)&&
   granted(result.permissions,requested)&&
   Array.isArray(result.repositories)&&result.repositories.length===1&&
   result.repositories[0]?.id===REPO.id&&
   result.repositories[0]?.full_name===REPO.name&&
   Number.isFinite(expires)&&expires>at+60&&expires<=at+3900,
   'TOKEN_SCOPE_DENIED');
  // NEVER export this method in a Worker/browser route. Only the
  // separately approved server-side GitHub writer may consume this token.
  need(enabled()===true,'DISABLED');
  return Object.freeze({
   repositoryId:REPO.id,permissions:requested,
   token:result.token,expiresAt:expires,
  });
 }
 return Object.freeze({issueWriteToken});
}
