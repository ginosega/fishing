/**
 * D6 full hosted static-byte preflight, source-only and DEFAULT OFF.
 * Intended for a separately approved, bounded release verification run;
 * never run per browser request and never treat this as owner acceptance.
 *
 * Checks both the canonical Pages source and future same-origin Worker
 * proxy, byte-for-byte against the pinned V3 manifest. This module makes
 * NO credential request, GitHub write, deployment or Worker route change.
 */
import {validatePointer,validateManifest} from '../../../../pwa/src/release.mjs';
import {D6_TRUSTED_PAGES_BASE} from './d6-hosted-revision-reader.mjs';
import {D6_PUBLIC_ORIGIN} from '../../../../pwa/server/d6-pages-path-gateway.mjs';

export const D6_PROOF_ORIGINS=Object.freeze({
 pages:D6_TRUSTED_PAGES_BASE,
 gateway:D6_PUBLIC_ORIGIN+'/fishing/',
});
const SHA=/^[0-9a-f]{40}$/;
const HEX=/^[0-9a-f]{64}$/;
const MAX_POINTER=65536;
const MAX_MANIFEST=2*1024*1024;
const MAX_FILE=32*1024*1024;
const MAX_FILES=2000;
const MAX_TOTAL=512*1024*1024;
const enc=new TextEncoder();
const dec=new TextDecoder('utf-8',{fatal:true});

export class D6HostedBytesError extends Error{
 constructor(code){super('D6 full hosted release bytes unverified');
  this.name='D6HostedBytesError';this.code=code;}
}
const deny=code=>{throw new D6HostedBytesError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const sha=async bytes=>Array.from(new Uint8Array(
 await crypto.subtle.digest('SHA-256',bytes)),
 n=>n.toString(16).padStart(2,'0')).join('');

function location(base,relative){
 // All URL destinations are hardwired to known origins. Encode each file
 // segment literally (including %, ?, #) to block URL/path interpretation.
 need(typeof relative==='string'&&relative.length>0&&
  !relative.startsWith('/')&&!relative.includes('\\')&&
  !relative.includes('//')&&
  !relative.split('/').some(x=>!x||x==='.'||x==='..'),
  'INVALID_MANIFEST_PATH');
 const path=relative==='index.html'?'':relative.split('/')
  .map(encodeURIComponent).join('/');
 const result=new URL(path,base);
 need(result.origin===new URL(base).origin&&
  result.pathname.startsWith(new URL(base).pathname)&&
  !result.search&&!result.hash,'INVALID_MANIFEST_PATH');
 return result.href;
}

export function createD6HostedBytesPreflight({
 fetchPages,fetchGateway,enabled=()=>false,
}={}){
 need(typeof fetchPages==='function'&&typeof fetchGateway==='function'&&
  typeof enabled==='function','INVALID_CONFIG');

 async function read(fetcher,url,limit){
  let res;
  try{res=await fetcher(url,{method:'GET',redirect:'manual',
   cache:'no-store'});}
  catch{deny('HOSTED_UNAVAILABLE');}
  need(res instanceof Response&&res.status===200&&
   res.redirected===false&&(!res.url||res.url===url),
   'HOSTED_UNAVAILABLE');
  const length=res.headers.get('Content-Length');
  if(length!==null){
   const claimed=Number(length);
   need(Number.isSafeInteger(claimed)&&claimed>=0&&claimed<=limit,
    'HOSTED_BYTES_LIMIT');
  }
  let stream;
  try{stream=res.body?.getReader();}catch{deny('HOSTED_UNAVAILABLE');}
  need(stream,'HOSTED_UNAVAILABLE');
  const chunks=[];let size=0;
  try{
   while(true){
    const next=await stream.read();
    if(next.done)break;
    size+=next.value.byteLength;
    if(size>limit){await stream.cancel();deny('HOSTED_BYTES_LIMIT');}
    chunks.push(next.value);
   }
  }catch(e){if(e instanceof D6HostedBytesError)throw e;
   deny('HOSTED_UNAVAILABLE');}
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
 }

 async function readBoth(path,limit){
  const p=await read(fetchPages,location(D6_PROOF_ORIGINS.pages,path),limit);
  const g=await read(fetchGateway,location(D6_PROOF_ORIGINS.gateway,path),limit);
  need(p.byteLength===g.byteLength&&await sha(p)===await sha(g),
   'GATEWAY_BYTES_DIFFER');
  return p;
 }

 async function verify({expectedSourceRevision}={}){
  need(enabled()===true,'DISABLED');
  need(SHA.test(expectedSourceRevision??''),'INVALID_REQUEST');
  const pointerBytes=await readBoth('release.json',MAX_POINTER);
  let pointer;
  try{pointer=validatePointer(JSON.parse(dec.decode(pointerBytes)));}
  catch{deny('INVALID_RELEASE_POINTER');}
  need(pointer.sourceRevision===expectedSourceRevision&&
   pointer.pendingMedia===false&&pointer.d6ReaderCandidate===true,
   'NOT_APPROVED_V3_RELEASE');

  const manifestBytes=await readBoth(pointer.manifest,MAX_MANIFEST);
  need(await sha(manifestBytes)===pointer.manifestSha256,
   'MANIFEST_DIGEST_MISMATCH');
  let manifest,entries;
  try{
   manifest=JSON.parse(dec.decode(manifestBytes));
   entries=validateManifest(manifest,pointer,'/fishing/');
  }catch{deny('INVALID_MANIFEST');}
  need(manifest.d6ReaderCandidate===true&&
   manifest.pendingMedia===false&&
   manifest.sourceRevision===expectedSourceRevision,
   'NOT_APPROVED_V3_RELEASE');
  need(entries.size>0&&entries.size<=MAX_FILES&&
   manifest.totalBytes<=MAX_TOTAL,'RELEASE_TOO_LARGE');

  const folded=new Set();
  let verified=0;
  for(const entry of entries.values()){
   need(entry.bytes<=MAX_FILE&&HEX.test(entry.sha256),
    'RELEASE_TOO_LARGE');
   const key=entry.path.normalize('NFC').toLowerCase();
   need(!folded.has(key),'AMBIGUOUS_RELEASE_FILE');
   folded.add(key);
   const bytes=await readBoth(entry.path,entry.bytes);
   need(bytes.byteLength===entry.bytes,'ASSET_BYTES_MISMATCH');
   need(await sha(bytes)===entry.sha256,'ASSET_HASH_MISMATCH');
   verified++;
  }
  // A complete successful read is not sufficient if a new release pointer
  // has appeared while we were auditing large media. Re-check both origins
  // and the pinned manifest bytes after all advertised files.
  const afterPointer=await readBoth('release.json',MAX_POINTER);
  need(await sha(afterPointer)===await sha(pointerBytes),
   'RELEASE_CHANGED_DURING_PROOF');
  const afterManifest=await readBoth(pointer.manifest,MAX_MANIFEST);
  need(await sha(afterManifest)===await sha(manifestBytes),
   'RELEASE_CHANGED_DURING_PROOF');
  return Object.freeze({
   sourceRevision:expectedSourceRevision,
   releaseId:pointer.id,
   manifestSha256:pointer.manifestSha256,
   filesVerified:verified,totalBytes:manifest.totalBytes,
   pagesAndGatewayBytesMatch:true,
   publicCutoverApproved:false,
   canPublish:false,
  });
 }
 return Object.freeze({verify});
}
