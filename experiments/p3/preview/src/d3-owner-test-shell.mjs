/**
 * FISH118 D3: explicitly armed OWNER-ONLY sandbox UI composition.
 * Not referenced by pwa/src/entry.mjs or public V2 build.
 * A future operator-approved test-only bundle calls start() with real
 * same-origin services; query strings, hash routes, localStorage and public
 * JS cannot toggle the corresponding Worker writer authorization.
 *
 * Never copy a public V2 source SHA into sandbox Save and Publish.
 */
import {createD3AuthoringClient} from './d3-authoring-client.mjs';
import {createD3PublicationLifecycle} from './d3-publication-lifecycle.mjs';
import {createD3SandboxSourceClient} from './d3-sandbox-source-client.mjs';

export class D3OwnerShellError extends Error{
 constructor(code){
  super('D3 owner-only sandbox pilot not ready');
  this.name='D3OwnerShellError';this.code=code;
 }
}
const deny=code=>{throw new D3OwnerShellError(code);};
const need=(v,code)=>{if(!v)deny(code);};
export function createD3OwnerTestShell({
 origin,request,bootstrap,enabled=()=>false,online=()=>true,
 storage=null,makeKey=()=>crypto.randomUUID(),
 publishingEnabled=()=>false,
}={}){
 need(typeof request==='function'&&typeof bootstrap==='function'&&
  [enabled,online,makeKey,publishingEnabled].every(x=>typeof x==='function'),
  'INVALID_CONFIGURATION');
 const owner=createD3AuthoringClient({
  origin,request,enabled,online,
 });
 const lifecycle=createD3PublicationLifecycle({
  client:owner,storage,makeKey,enabled,
 });
 const sourceClient=createD3SandboxSourceClient({
  origin,request,enabled,online,
 });
 let started=false;
 async function start(settings){
  need(enabled()===true,'NOT_ENABLED');
  need(!started,'ALREADY_STARTED');
  need(settings&&typeof settings.root==='string'&&
   settings.release&&typeof settings.release.id==='string',
   'INVALID_BOOTSTRAP');
  let root;
  try{root=new URL(settings.root);}catch{deny('INVALID_BOOTSTRAP');}
  need(root.origin===origin&&root.protocol==='https:'&&
   root.pathname.startsWith('/fishing/')&&
   !root.search&&!root.hash,
   'ORIGIN_DENIED');
  started=true;
  let snapshot=null;
  // Anonymous is the default. Owner-session failure never loads private
  // source and never exposes a publishing callback.
  if(online()===true){
   try{
    const session=await owner.session();
    if(session.authorized===true)
     snapshot=await sourceClient.load();
   }catch{
    snapshot=null;
   }
  }
  const v3={
   enabled:true,authorized:false,
   auth:owner,lifecycle,
   // Only a verified owner-loaded sandbox base permits presenting Save.
   ...(snapshot&&publishingEnabled()===true?{publish:async pkg=>{
    const receipt=await lifecycle.submit(pkg);
    need(receipt.phase==='Accepted'&&
     /^p3_[a-f0-9-]{36}$/.test(receipt.operationId??''),
     'ACCEPTANCE_UNVERIFIED');
    return {accepted:true,operationId:receipt.operationId,
     canonicalLive:false};
   }}:{}),
  };
  return bootstrap(settings,{v3,sandboxSource:snapshot});
 }
 return Object.freeze({start});
}
