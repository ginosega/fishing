/**
 * FISH118 D3 same-origin, test-only OWNER sandbox pilot bootstrap.
 * Source only. This is NOT public pwa/src/entry.mjs and NEVER modifies
 * the verified V2 static release or its loader/service-worker logic.
 *
 * The hosting Worker MUST independently require a fresh owner session,
 * hard-off pilot flag and no-store for the dedicated test-only page and
 * bundle. Browser visibility and feature flags grant no server authority.
 *
 * Reuses the currently deployed canonical V2 release solely for public
 * shell CSS, artwork and existing assets. Owner Gear/KB records and Markdown
 * always come from a separate authenticated immutable sandbox snapshot.
 */
import {createD3OwnerTestShell} from './d3-owner-test-shell.mjs';
import {bootstrap} from '../../../../pwa/src/app.mjs';

const RELEASE=/^[a-f0-9]{32}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const te=new TextEncoder();
export class D3PilotEntryError extends Error{
 constructor(code){
  super('D3 isolated owner pilot could not load');
  this.name='D3PilotEntryError';this.code=code;
 }
}
const deny=code=>{throw new D3PilotEntryError(code);};
const need=(v,c)=>{if(!v)deny(c);};
const hex=a=>[...new Uint8Array(a)].map(b=>b.toString(16).padStart(2,'0')).join('');
const validResponse=r=>r instanceof Response&&r.status===200&&!r.redirected;
const validOrigin=origin=>{
 try{const u=new URL(origin);
  return u.protocol==='https:'&&u.origin===origin&&u.pathname==='/'&&
   !u.username&&!u.password&&!u.search&&!u.hash;
 }catch{return false;}
};
export function createD3OwnerPilotEntry({
 origin,request,documentObject,windowObject,bootstrapApp=bootstrap,
 shellFactory=createD3OwnerTestShell,enabled=()=>false,
 online=()=>true,storage=null,makeKey=()=>crypto.randomUUID(),
}={}){
 need(validOrigin(origin)&&typeof request==='function'&&
  typeof documentObject?.createElement==='function'&&
  typeof documentObject?.head?.append==='function'&&
  windowObject&&typeof windowObject==='object'&&
  typeof bootstrapApp==='function'&&typeof shellFactory==='function'&&
  [enabled,online,makeKey].every(x=>typeof x==='function'),
  'INVALID_CONFIGURATION');
 const root=origin+'/fishing/';
 let started=false;
 async function read(url,maxBytes){
  let response;
  try{response=await request(url,{
   method:'GET',credentials:'same-origin',cache:'no-store',
   redirect:'manual',headers:{Accept:'application/json'},
  });}catch{deny('PUBLIC_RELEASE_UNAVAILABLE');}
  need(validResponse(response)&&
   (response.headers.get('Content-Type')??'').includes('application/json'),
   'PUBLIC_RELEASE_UNAVAILABLE');
  let bytes;
  try{bytes=new Uint8Array(await response.arrayBuffer());}
  catch{deny('PUBLIC_RELEASE_UNAVAILABLE');}
  need(bytes.length>0&&bytes.length<=maxBytes,'PUBLIC_RELEASE_TOO_LARGE');
  return bytes;
 }
 async function start(){
  need(enabled()===true,'NOT_ENABLED');
  need(!started,'ALREADY_STARTED');
  need(online()===true,'OFFLINE_DENIED');
  const app=documentObject.getElementById?.('app');
  need(app&&documentObject.getElementById?.('connection-status')&&
   documentObject.getElementById?.('connection-dialog'),
   'PILOT_HTML_MISSING');
  started=true;
  const pointer=await read(root+'release.json',65536);
  let release;
  try{release=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(pointer));}
  catch{deny('INVALID_RELEASE_POINTER');}
  need(RELEASE.test(release?.id??'')&&
   release.manifest==='releases/'+release.id+'/manifest.json'&&
   DIGEST.test(release.manifestSha256??'')&&
   typeof release.sourceRevision==='string'&&
   release.sourceRevision.length>=7&&release.sourceRevision.length<=100,
   'INVALID_RELEASE_POINTER');
  const bytes=await read(root+release.manifest,1048576);
  const sha=hex(await crypto.subtle.digest('SHA-256',bytes));
  need(sha===release.manifestSha256,'MANIFEST_DIGEST_MISMATCH');
  let manifest;
  try{manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{deny('INVALID_MANIFEST');}
  need(manifest?.releaseId===release.id&&
   manifest.sourceRevision===release.sourceRevision&&
   manifest.base==='/fishing/'&&
   Array.isArray(manifest.files)&&manifest.files.length<=2000&&
   ['gear','kb','catches'].every(d=>manifest.schemaVersions?.[d]===2)&&
   manifest.files.some(f=>f.path==='releases/'+release.id+'/styles.css'),
   'INCOMPATIBLE_PUBLIC_RELEASE');
  windowObject.__FISHING_BOOT__={root,release,manifest};
  const style=documentObject.createElement('link');
  style.rel='stylesheet';
  style.href=root+'releases/'+release.id+'/styles.css';
  documentObject.head.append(style);
  const shell=shellFactory({
   origin,request,enabled,online,storage,makeKey,
   bootstrap:bootstrapApp,
  });
  need(typeof shell?.start==='function','INVALID_SHELL');
  await shell.start({root,release,manifest});
  return Object.freeze({
   sandboxOnly:true,canonicalLive:false,
   publicReleaseId:release.id,
  });
 }
 return Object.freeze({start});
}
