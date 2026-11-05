/**
 * D5 isolated OWNER candidate composition (source-only, default OFF).
 * This is not the accepted anonymous reader and is never wired into V2.
 * An approved same-origin host must explicitly serve the immutable bundle
 * and exact scope; the existing isolated Pages reader has NO owner API.
 */
import {bootstrap} from './app.mjs';
import {restoreD5OwnerAuthReturn} from './d5-auth-return.mjs';
import {createD3AuthoringClient}
 from '../../experiments/p3/preview/src/d3-authoring-client.mjs';
import {createD3PublicationLifecycle}
 from '../../experiments/p3/preview/src/d3-publication-lifecycle.mjs';
import {createD3OwnerTestShell}
 from '../../experiments/p3/preview/src/d3-owner-test-shell.mjs';

export const D5_OWNER_CANDIDATE_BASE='/fishing/__v3_owner_candidate__/';
export function selectD5OwnerCandidate({enabled=false,root,release,manifest}={}){
 if(enabled!==true)return false;
 let url;
 try{url=new URL(root);}catch{throw Error('D5 owner candidate root invalid');}
 if(url.protocol!=='https:'||url.pathname!==D5_OWNER_CANDIDATE_BASE||
  url.username||url.password||url.search||url.hash||
  manifest?.base!==D5_OWNER_CANDIDATE_BASE||
  manifest?.v3OwnerCandidate!==true||
  manifest?.v3ReaderCandidate===true||
  manifest?.releaseId!==release?.id||
  manifest?.sourceRevision!==release?.sourceRevision)
  throw Error('D5 owner candidate scope or release mismatch');
 return true;
}
/**
 * Resolve a previously installed owner candidate's V3 reading mode BEFORE
 * contacting /session or the private sandbox source. Missing exact-scope SW
 * means there is no persisted owner-candidate mode. Unknown mode fails closed.
 */
export async function readD5CandidateMode(root,{
 serviceWorker=globalThis.navigator?.serviceWorker,
 openChannel=()=>new MessageChannel(),timeoutMs=1500,
}={}){
 if(!serviceWorker?.getRegistration)return 'Unknown';
 let registration;
 try{registration=await serviceWorker.getRegistration(root);}
 catch{return 'Unknown';}
 if(!registration||registration.scope!==root)return 'Automatic';
 const worker=registration.active;
 if(!worker)return 'Unknown';
 return new Promise(resolve=>{
  let settled=false;
  const complete=value=>{
   if(settled)return;settled=true;clearTimeout(timer);
   try{channel?.port1?.close();}catch{}
   resolve(value);
  };
  let channel,timer;
  try{
   channel=openChannel();
   if(!channel?.port1||!channel?.port2)return resolve('Unknown');
   timer=setTimeout(()=>complete('Unknown'),timeoutMs);
   channel.port1.onmessage=event=>{
    const reply=event.data;
    complete(reply?.type==='FISHING_V3_MODE'&&reply.available===true&&
     ['Automatic','Work Offline'].includes(reply.mode)?
     reply.mode:'Unknown');
   };
   worker.postMessage({type:'V3_READ_MODE'},[channel.port2]);
  }catch{complete('Unknown');}
 });
}

export async function startD5OwnerCandidate(settings,{
 request=globalThis.fetch,bootstrapApp=bootstrap,
 makeKey=()=>crypto.randomUUID(),storage=null,
 readMode=readD5CandidateMode,
}={}){
 selectD5OwnerCandidate({enabled:true,...settings});
 if(typeof request!=='function'||typeof bootstrapApp!=='function')
  throw Error('D5 owner candidate services unavailable');
 const origin=new URL(settings.root).origin;
 const online=()=>navigator.onLine===true;
 const owner=createD3AuthoringClient({origin,request,
  enabled:()=>true,online});
 const lifecycle=createD3PublicationLifecycle({client:owner,
  enabled:()=>true,storage,makeKey});
 // Do not wake owner/auth services while an installed Work Offline mode is
 // still selected (even if Wi-Fi is physically connected). Unknown mode also
 // falls back to reading-only until an explicit online re-entry.
 const launchMode=await readMode(settings.root);
 let session;
 try{if(online()&&launchMode==='Automatic')session=await owner.session();}
 catch{
  // No privileged authoring if the server is unreachable or untrusted.
  // Public anonymous library reading remains available.
 }
 if(session?.authorized!==true){
  return bootstrapApp(settings,{v3:{
   enabled:true,readerOnly:true,auth:owner,lifecycle,
  }});
 }
 // A valid session is necessary but NOT sufficient for writes. The private
 // shell separately verifies the exact sandbox source, CSRF/readiness and
 // operation receipt, while the server checks every request independently.
 // The OAuth server returns only to the canonical candidate root.
 // Restore a validated read-only article route in this tab after the
 // server has confirmed owner authorization, before the app boots.
 let returnStorage=null;
 try{returnStorage=globalThis.sessionStorage;}catch{}
 restoreD5OwnerAuthReturn({
  pathname:globalThis.location?.pathname,
  hash:globalThis.location?.hash,
  storage:returnStorage,
  history:globalThis.history,
 });
 const shell=createD3OwnerTestShell({origin,request,enabled:()=>true,
  online,storage,makeKey,publishingEnabled:()=>true,
  draftRecovery:true,bootstrap:bootstrapApp});
 return shell.start(settings);
}
