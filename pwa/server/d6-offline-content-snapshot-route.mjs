/**
 * O02 — owner-only read endpoint for a coherent current-content manifest.
 * Source-only until a separately approved private Worker opt-in and deployment.
 * Reuses the existing owner cookie and D1 binding; no new provider, table,
 * R2 read, mutation, new authentication system, or public content access.
 */
import {createD6CurrentContentSnapshot}
 from './d6-current-content-snapshot.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

const PATH='/api/v3/content/offline-snapshot';
const MAX_RESPONSE_BYTES=8*1024*1024;
const fail=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
 status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'X-Content-Type-Options':'nosniff',
  'Vary':'Cookie',
 },
});
export function createD6OfflineContentSnapshotRoute({
 AUTH_DB,CONTENT_DB,csrfKey,origin,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
 snapshotFactory=createD6CurrentContentSnapshot,
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||typeof enabled!=='function'||
    typeof now!=='function'||typeof snapshotFactory!=='function')
  throw Error('O02_SNAPSHOT_CONFIG_INVALID');
 return Object.freeze({async handle(request){
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==origin||url.pathname!==PATH||url.search||url.hash||
     url.username||url.password||request.headers.has('Authorization'))
   return fail(404,'NOT_FOUND');
  if(!enabled()||typeof AUTH_DB?.prepare!=='function'||
     typeof CONTENT_DB?.prepare!=='function'||
     typeof CONTENT_DB?.batch!=='function'||
     typeof csrfKey!=='string'||csrfKey.length<32)
   return fail(503,'SNAPSHOT_NOT_ENABLED');
  if(request.method!=='GET')return fail(405,'METHOD_NOT_ALLOWED');
  try{
   const auth=createD2UnifiedOwnerSession({
    AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
   });
   await auth.authorizeStatus(request);
  }catch{return fail(403,'SNAPSHOT_NOT_AUTHORIZED');}
  try{
   const snapshot=await snapshotFactory({CONTENT_DB});
   if(snapshot?.format!=='fishing-content-snapshot-v1'||
      snapshot?.mediaVerification!=='registry-only')
    return fail(503,'SNAPSHOT_UNVERIFIED');
   const body=JSON.stringify({ok:true,version:1,snapshot});
   if(new TextEncoder().encode(body).byteLength>MAX_RESPONSE_BYTES)
    return fail(503,'SNAPSHOT_UNVERIFIED');
   return new Response(body,{status:200,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Content-Type-Options':'nosniff',
    'Vary':'Cookie',
   }});
  }catch{return fail(503,'SNAPSHOT_UNVERIFIED');}
 }});
}
