/**
 * D5 isolated OWNER candidate composition (source-only, default OFF).
 * This is not the accepted anonymous reader and is never wired into V2.
 * An approved same-origin host must explicitly serve the immutable bundle
 * and exact scope; the existing isolated Pages reader has NO owner API.
 */
import {bootstrap} from './app.mjs';
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
export async function startD5OwnerCandidate(settings,{
 request=globalThis.fetch,bootstrapApp=bootstrap,
 makeKey=()=>crypto.randomUUID(),storage=null,
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
 let session;
 try{if(online())session=await owner.session();}
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
 const shell=createD3OwnerTestShell({origin,request,enabled:()=>true,
  online,storage,makeKey,publishingEnabled:()=>true,
  draftRecovery:true,bootstrap:bootstrapApp});
 return shell.start(settings);
}
