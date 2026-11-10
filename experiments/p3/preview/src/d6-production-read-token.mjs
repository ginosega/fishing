/**
 * D6 trusted production GitHub App contents:read token issuer — SOURCE ONLY.
 *
 * ALL authority defaults OFF. The trusted host supplies the App JWT signer,
 * encrypted server-only PEM and HTTPS GitHub transport after separate owner
 * approval. This module has no Worker entrypoint, browser route, OAuth flow,
 * token storage, D1 access or repository write/publish capability.
 *
 * Only ginosega/fishing (numeric ID pinned in canonical snapshot loader) can
 * receive a token, and only contents:read may be requested. Even a broader
 * GitHub App installation grant never broadens the minted token.
 */
import {D6_SOURCE_REPOSITORY} from './d6-canonical-snapshot-loader.mjs';

const API='https://api.github.com';
const REPO=D6_SOURCE_REPOSITORY;
const SCOPE=Object.freeze({contents:'read'});
const MAX_JSON=131072;
const DECODER=new TextDecoder('utf-8',{fatal:true});
const numId=v=>typeof v==='string'&&/^[1-9]\d{0,15}$/.test(v)&&
 Number.isSafeInteger(Number(v));
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const sameScope=v=>object(v)&&Object.keys(v).length===1&&
 v.contents==='read';
const grantedReadOnly=v=>object(v)&&
 Object.keys(v).every(k=>k==='contents'||k==='metadata')&&
 v.contents==='read'&&
 (!Object.hasOwn(v,'metadata')||v.metadata==='read');

export class D6ProductionReadTokenError extends Error{
 constructor(code){
  super('D6 production read grant unavailable');
  this.name='D6ProductionReadTokenError';this.code=code;
 }
}
const deny=code=>{throw new D6ProductionReadTokenError(code);};
const need=(v,code)=>{if(!v)deny(code);};

async function readBoundedJson(response,limit=MAX_JSON){
 const len=response.headers.get('Content-Length');
 if(len!==null&&/^\d+$/.test(len)&&Number(len)>limit)
  deny('GITHUB_RESPONSE_TOO_LARGE');
 const chunks=[];let size=0;
 try{
  const reader=response.body?.getReader();
  need(reader,'INVALID_GITHUB_RESPONSE');
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>limit){await reader.cancel();deny('GITHUB_RESPONSE_TOO_LARGE');}
   chunks.push(value);
  }
 }catch(error){
  if(error instanceof D6ProductionReadTokenError)throw error;
  deny('INVALID_GITHUB_RESPONSE');
 }
 need(size>0,'INVALID_GITHUB_RESPONSE');
 const bytes=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{
  const result=JSON.parse(DECODER.decode(bytes));
  need(object(result),'INVALID_GITHUB_RESPONSE');
  return result;
 }catch(error){
  if(error instanceof D6ProductionReadTokenError)throw error;
  deny('INVALID_GITHUB_RESPONSE');
 }
}

export function createD6ProductionReadTokenIssuer({
 env,request,signAppJwt,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof request==='function'&&typeof signAppJwt==='function'&&
  typeof enabled==='function'&&typeof now==='function','INVALID_CONFIG');

 async function issueReadToken({repositoryId,permissions}={}){
  need(enabled()===true,'DISABLED');
  need(repositoryId===REPO.id&&sameScope(permissions),'READ_SCOPE_DENIED');
  const appId=env?.D6_GITHUB_APP_ID;
  const installationId=env?.D6_GITHUB_INSTALLATION_ID;
  const privateKey=env?.D6_GITHUB_APP_PRIVATE_KEY;
  need(numId(appId)&&numId(installationId)&&
   typeof privateKey==='string'&&privateKey.length>=32,
   'MISSING_SERVER_CREDENTIALS');
  const at=now();
  need(Number.isSafeInteger(at)&&at>0,'INVALID_CLOCK');

  // A signer is provided by the approved trusted runtime. Do not copy D2
  // sandbox token providers or expose the PEM/JWT in errors or responses.
  let jwt;
  try{
   jwt=await signAppJwt({appId,privateKey,now:at});
  }catch{deny('APP_SIGNING_DENIED');}
  need(typeof jwt==='string'&&
   /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt),
   'APP_SIGNING_DENIED');

  const installationUrl=API+'/app/installations/'+installationId;
  const targetUrl=API+'/repos/'+REPO.fullName+'/installation';
  const mintUrl=installationUrl+'/access_tokens';
  async function github(url,method='GET',body){
   need((method==='GET'&&(url===installationUrl||url===targetUrl))||
    (method==='POST'&&url===mintUrl&&object(body)),
    'URL_OR_METHOD_DENIED');
   const headers={
    Authorization:'Bearer '+jwt,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d6-production-read',
    ...(method==='POST'?{'Content-Type':'application/json'}:{}),
   };
   let result;
   try{
    result=await request(url,{
     method,headers,redirect:'manual',cache:'no-store',credentials:'omit',
     ...(method==='POST'?{body:JSON.stringify(body)}:{}),
    });
   }catch{deny('GITHUB_UNAVAILABLE');}
   need(result instanceof Response&&
    result.status===(method==='POST'?201:200)&&
    result.redirected!==true&&(!result.url||result.url===url)&&
    /\bapplication\/json\b/i.test(result.headers.get('Content-Type')??''),
    'GITHUB_UNAVAILABLE');
   return readBoundedJson(result);
  }

  const inst=await github(installationUrl);
  need(inst.id===Number(installationId)&&
   inst.app_id===Number(appId)&&
   inst.account?.login==='ginosega'&&
   inst.repository_selection==='selected'&&
   inst.suspended_at==null&&
   ['read','write'].includes(inst.permissions?.contents),
   'INSTALLATION_DENIED');
  // Read-only tokens cannot be issued to the sandbox App installation:
  // the production repository lookup MUST resolve to the same installation.
  const target=await github(targetUrl);
  need(target.id===inst.id&&target.app_id===inst.app_id&&
   target.account?.login==='ginosega'&&
   target.suspended_at==null,'TARGET_DENIED');
  const issued=await github(mintUrl,'POST',{
   repository_ids:[REPO.id],permissions:SCOPE,
  });
  const expires=typeof issued.expires_at==='string'?
   Date.parse(issued.expires_at)/1000:NaN;
  need(typeof issued.token==='string'&&
   /^[^\s]{20,}$/.test(issued.token)&&
   grantedReadOnly(issued.permissions)&&
   Array.isArray(issued.repositories)&&issued.repositories.length===1&&
   issued.repositories[0]?.id===REPO.id&&
   issued.repositories[0]?.full_name===REPO.fullName&&
   Number.isFinite(expires)&&expires>at+60&&expires<=at+3900,
   'TOKEN_SCOPE_DENIED');
  // Trusted-server return only; it must never be serialized in any route.
  return Object.freeze({
   repositoryId:REPO.id,permissions:SCOPE,token:issued.token,
  });
 }
 return Object.freeze({issueReadToken});
}
