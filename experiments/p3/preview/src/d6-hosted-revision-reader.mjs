/**
 * D6 hosted release-pointer provenance for the owner source read route.
 * DISABLED by default, SOURCE ONLY. Fetches fixed existing Pages origins,
 * validates SHA-256 manifest integrity and V3 candidate identity. This is
 * not full hosted-file byte acceptance or permission to enable publishing.
 */
import {validatePointer,validateManifest} from '../../../../pwa/src/release.mjs';

export const D6_TRUSTED_PAGES_BASE='https://ginosega.github.io/fishing/';
const SHA=/^[a-f0-9]{40}$/;
const LIMIT_POINTER=65536;
const LIMIT_MANIFEST=2*1024*1024;
const dec=new TextDecoder('utf-8',{fatal:true});
export class D6HostedProofError extends Error{
 constructor(code){super('D6 hosted release source not verified');
  this.name='D6HostedProofError';this.code=code;}
}
const deny=code=>{throw new D6HostedProofError(code);};
const need=(v,code)=>{if(!v)deny(code);};

export function createD6HostedRevisionReader({fetchAsset,enabled=()=>false}={}){
 need(typeof fetchAsset==='function'&&typeof enabled==='function',
  'INVALID_CONFIG');
 async function readBytes(url,limit){
  let res;
  try{res=await fetchAsset(url,{
   method:'GET',redirect:'manual',cache:'no-store',
   headers:{Accept:'application/json'},
  });}catch{deny('HOSTED_SOURCE_UNAVAILABLE');}
  need(res instanceof Response&&res.status===200&&res.redirected!==true&&
   (!res.url||res.url===url)&&
   /\bapplication\/json\b/i.test(res.headers.get('Content-Type')??''),
   'HOSTED_SOURCE_UNAVAILABLE');
  const advertised=Number(res.headers.get('Content-Length'));
  need(!Number.isFinite(advertised)||advertised<=limit,'HOSTED_TOO_LARGE');
  // Read incrementally, bounding hostile or accidentally oversized responses.
  const chunks=[];let size=0;
  try{
   const reader=res.body?.getReader();
   need(reader,'HOSTED_SOURCE_UNAVAILABLE');
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    size+=value.byteLength;
    if(size>limit){await reader.cancel();deny('HOSTED_TOO_LARGE');}
    chunks.push(value);
   }
  }catch(e){if(e instanceof D6HostedProofError)throw e;
   deny('HOSTED_SOURCE_UNAVAILABLE');}
  need(size>0,'HOSTED_SOURCE_UNAVAILABLE');
  const all=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}
  return all;
 }
 async function readHostedRevision(){
  need(enabled()===true,'DISABLED');
  let pointer;
  try{
   pointer=validatePointer(JSON.parse(dec.decode(
    await readBytes(D6_TRUSTED_PAGES_BASE+'release.json',LIMIT_POINTER))));
  }catch(e){if(e instanceof D6HostedProofError)throw e;
   deny('INVALID_POINTER');}
  need(SHA.test(pointer.sourceRevision)&&pointer.pendingMedia===false&&
   pointer.d6ReaderCandidate===true,'NOT_V3_RELEASE');
  const url=D6_TRUSTED_PAGES_BASE+pointer.manifest;
  const bytes=await readBytes(url,LIMIT_MANIFEST);
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
   .map(v=>v.toString(16).padStart(2,'0')).join('');
  need(digest===pointer.manifestSha256,'MANIFEST_HASH_MISMATCH');
  let manifest;
  try{
   manifest=JSON.parse(dec.decode(bytes));
   validateManifest(manifest,pointer,'/fishing/');
  }catch{deny('INVALID_MANIFEST');}
  need(manifest.pendingMedia===false&&
   manifest.d6ReaderCandidate===true&&
   manifest.sourceRevision===pointer.sourceRevision,'NOT_V3_RELEASE');
  return Object.freeze({
   sourceRevision:pointer.sourceRevision,
   releaseId:pointer.id,manifestSha256:pointer.manifestSha256,
  });
 }
 return Object.freeze({readHostedRevision});
}
