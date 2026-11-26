/** O02 — read-only coherent current-content snapshot for all readers.
 * No authentication data, drafts, unreferenced media or writes are exposed.
 */
import {createD6CurrentContentSnapshot}
 from './d6-current-content-snapshot.mjs';

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
  if(['cross-site','same-site'].includes(request.headers.get('Sec-Fetch-Site'))||
     (request.headers.has('Origin')&&request.headers.get('Origin')!==origin))
   return fail(403,'SNAPSHOT_NOT_AUTHORIZED');
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
