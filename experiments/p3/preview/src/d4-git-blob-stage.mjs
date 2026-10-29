/**
 * FISH118 D4 isolated private original-byte staging via GitHub Git blobs.
 * No R2/KV/new D1 schema and no public release. A staged blob is NOT a
 * referenced tree entry or a publication. Receipts are signed and expire.
 * This module NEVER commits a tree, PR, merge or public release.
 */
import {sha256} from '../../../../pwa/src/shared.mjs';
import {d4MediaPath,d4ImageMime} from './d4-media-integrity.mjs';

const ID=1430581407,OWNER=265665562,MAX=10*1024*1024;
const TTL=4*60*60,API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/,SIG=/^[A-Za-z0-9_-]{43}$/;
const enc=new TextEncoder();
const allowed=Object.freeze({jpg:'image/jpeg',jpeg:'image/jpeg',
 png:'image/png',webp:'image/webp',gif:'image/gif'});
const b64=bytes=>{
 let result='';for(const b of bytes)result+=String.fromCharCode(b);
 return btoa(result);
};
const web64=bytes=>b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const matches=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
 let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);
 return out===0;
};
const blobHash=async bytes=>{
 const prefix=enc.encode('blob '+bytes.length+'\0');
 const data=new Uint8Array(prefix.length+bytes.length);
 data.set(prefix);data.set(bytes,prefix.length);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-1',data))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');
};
const ticketText=(origin,p)=>[
 'fishing-v3-d4-gitblob-ticket-v1',origin,String(ID),String(OWNER),
 p.path,p.sha256,p.blobSha,String(p.bytes),p.mime,String(p.expiresAt),
].join('\n');

export class D4StageError extends Error{
 constructor(code){super('D4 sandbox media staging unavailable');this.name='D4StageError';this.code=code;}
}
const deny=code=>{throw new D4StageError(code);};
const need=(yes,code)=>{if(!yes)deny(code);};
const response=(status,body)=>new Response(JSON.stringify(body),{
 status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','Vary':'Cookie',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 },
});
const exactFields=t=>t&&typeof t==='object'&&!Array.isArray(t)&&
 Object.keys(t).sort().join(',')===
 'blobSha,bytes,expiresAt,mime,path,sha256,signature';

export function createD4GitBlobStage({
 origin,session,issueWriteToken,requestGitHub,secret,
 enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof origin==='string'&&origin.startsWith('https://')&&
  new URL(origin).origin===origin&&
  typeof session?.authorizeMedia==='function'&&
  typeof issueWriteToken==='function'&&typeof requestGitHub==='function'&&
  typeof secret==='string'&&enc.encode(secret).length>=32&&
  typeof enabled==='function'&&typeof now==='function',
  'INVALID_CONFIG');
 const keyPromise=crypto.subtle.importKey('raw',enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sign=async ticket=>web64(new Uint8Array(
  await crypto.subtle.sign('HMAC',await keyPromise,enc.encode(ticketText(origin,ticket)))));
 async function verifyTicket(ticket,{allowExpired=false}={}){
  need(exactFields(ticket),'INVALID_TICKET');
  let path;try{path=d4MediaPath(ticket.path);}catch{deny('INVALID_TICKET');}
  const ext=path.split('.').at(-1).toLowerCase();
  need(DIGEST.test(ticket.sha256)&&SHA.test(ticket.blobSha)&&
   Number.isSafeInteger(ticket.bytes)&&ticket.bytes>0&&ticket.bytes<=MAX&&
   Number.isSafeInteger(ticket.expiresAt)&&
   ticket.expiresAt>0&&ticket.expiresAt<4102444800&&
   ticket.mime===allowed[ext]&&SIG.test(ticket.signature),
   'INVALID_TICKET');
  need(matches(ticket.signature,await sign(ticket)),'INVALID_TICKET_SIGNATURE');
  if(!allowExpired)need(ticket.expiresAt>now(),'EXPIRED_TICKET');
  return Object.freeze({path,sha256:ticket.sha256,blobSha:ticket.blobSha,
   bytes:ticket.bytes,mime:ticket.mime,expiresAt:ticket.expiresAt});
 }
 async function stage(request){
  need(enabled()===true,'DISABLED');
  const url=new URL(request.url);
  need(url.origin===origin&&url.pathname==='/api/v3/media'&&
   !url.search&&!url.hash,'INVALID_REQUEST');
  const actor=await session.authorizeMedia(request);
  need(actor?.authorized===true&&actor.ownerGitHubId===OWNER,
   'OWNER_DENIED');
  const raw=request.headers.get('X-Fish-D4-Path');
  need(typeof raw==='string'&&raw.length>0&&raw.length<1000,'INVALID_PATH');
  let path;
  try{
   path=decodeURIComponent(raw);
   need(encodeURIComponent(path)===raw,'INVALID_PATH');
   path=d4MediaPath(path);
  }catch{deny('INVALID_PATH');}
  const len=request.headers.get('Content-Length');
  need(len===null||(/^\d+$/.test(len)&&Number(len)>0&&Number(len)<=MAX),
   'MEDIA_TOO_LARGE');
  const declared=request.headers.get('Content-Type');
  const bytes=new Uint8Array(await request.arrayBuffer());
  need(bytes.length>0&&bytes.length<=MAX,'MEDIA_TOO_LARGE');
  const ext=path.split('.').at(-1).toLowerCase();
  const kind=d4ImageMime(bytes);
  need(kind!==null&&kind===allowed[ext]&&kind===declared,
   'IMAGE_SIGNATURE_DENIED');
  const digest=await sha256(bytes),blobSha=await blobHash(bytes);
  const grant=await issueWriteToken({repositoryId:ID,
   permissions:{contents:'write',pull_requests:'write'}});
  need(grant?.repositoryId===ID&&
   grant.permissions?.contents==='write'&&
   grant.permissions?.pull_requests==='write'&&
   typeof grant.token==='string'&&grant.token.length>=12,
   'WRITE_SCOPE_DENIED');
  const gh=await requestGitHub(API+'/git/blobs',{
   method:'POST',redirect:'manual',headers:{
    Authorization:'Bearer '+grant.token,
    Accept:'application/vnd.github+json',
    'Content-Type':'application/json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d4-private-blob-stage',
   },
   body:JSON.stringify({encoding:'base64',content:b64(bytes)}),
  });
  need(gh?.ok===true&&gh.status===201&&!gh.redirected,
   'STAGING_OUTCOME_UNKNOWN');
  let result;try{result=await gh.json();}
  catch{deny('STAGING_OUTCOME_UNKNOWN');}
  need(result?.sha===blobSha,'BLOB_DIGEST_MISMATCH');
  const ticket={path,sha256:digest,blobSha,bytes:bytes.length,
   mime:kind,expiresAt:now()+TTL};
  need(ticket.expiresAt<4102444800,'INVALID_CLOCK');
  return Object.freeze({...ticket,signature:await sign(ticket)});
 }
 async function handle(request){
  try{
   const ticket=await stage(request);
   return response(201,{ok:true,staged:true,ticket});
  }catch(e){
   const code=e instanceof D4StageError?e.code:'TEMPORARILY_UNAVAILABLE';
   const status={
    DISABLED:404,INVALID_REQUEST:404,INVALID_PATH:400,
    MEDIA_TOO_LARGE:413,IMAGE_SIGNATURE_DENIED:415,
    OWNER_DENIED:403,INVALID_CONFIG:503,WRITE_SCOPE_DENIED:503,
    STAGING_OUTCOME_UNKNOWN:503,BLOB_DIGEST_MISMATCH:503,
   }[code]??(e?.name==='D2SessionError'?403:503);
   return response(status,{ok:false,error:status===503?
    'TEMPORARILY_UNAVAILABLE':code});
  }
 }
 return Object.freeze({handle,verifyTicket});
}
