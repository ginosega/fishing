/**
 * WP1: D6 production-root owner editor PREVIEW gate.
 *
 * No publishing client, token, GitHub write, media ticket, D1, or source
 * mutation is provided. All authoring routes must obtain fresh proof of
 * owner session and canonical main source before constructing any form.
 * A successful response authorizes local UI preview only.
 */
import {D6_READER_ORIGIN,D6_READER_BASE} from './d6-public-reader.mjs';
import {D6_CANONICAL_REPOSITORY} from './d6-canonical-authoring-source.mjs';
const SHA=/^[a-f0-9]{40}$/;
export class D6OwnerEditorPreviewError extends Error{
 constructor(code){super('Owner editor preview is unavailable; no publication is possible.');
  this.name='D6OwnerEditorPreviewError';this.code=code;}
}
const deny=code=>{throw new D6OwnerEditorPreviewError(code);};
const check=(v,code)=>{if(!v)deny(code);};

export function createD6OwnerEditorPreviewGate({
 root,releaseRevision,ownerReadiness,canonicalSource,
 enabled=()=>false,online=()=>false,readingMode=()=> 'Checking',
}={}){
 let u;try{u=new URL(root);}catch{deny('INVALID_CONFIG');}
 const loopback=u.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 check((u.origin===D6_READER_ORIGIN||loopback)&&
  u.pathname===D6_READER_BASE&&!u.search&&!u.hash&&
  !u.username&&!u.password&&SHA.test(releaseRevision??'')&&
  typeof ownerReadiness?.check==='function'&&
  typeof canonicalSource?.load==='function'&&
  [enabled,online,readingMode].every(f=>typeof f==='function'),
  'INVALID_CONFIG');
 const permitted=()=>enabled()===true&&online()===true&&
  readingMode()==='Automatic';
 async function open(){
  check(enabled()===true,'DISABLED');
  check(permitted(),'OFFLINE');
  let owner;
  try{owner=await ownerReadiness.check({readingMode:'Automatic'});}
  catch{deny('OWNER_UNVERIFIED');}
  check(permitted(),'OFFLINE');
  check(owner?.state==='Owner'&&owner?.canPublish===false,
   'OWNER_UNVERIFIED');
  let source;
  try{source=await canonicalSource.load({
   readingMode:'Automatic',ownerVerified:true,
  });}catch{deny('SOURCE_UNVERIFIED');}
  check(permitted(),'OFFLINE');
  check(source?.repositoryId===D6_CANONICAL_REPOSITORY.id&&
   source.repositoryFullName===D6_CANONICAL_REPOSITORY.fullName&&
   source.ref===D6_CANONICAL_REPOSITORY.ref&&
   source.sourceRevision===releaseRevision&&SHA.test(source.treeSha??'')&&
   source.sourceOnly===true&&source.canPublish===false&&
   source.files instanceof Set&&source.markdown instanceof Map&&
   source.data?.gear?.items&&source.data?.kb?.entities&&
   source.data?.catches?.catches,'SOURCE_UNVERIFIED');
  // An asynchronous source read could finish after an account sign-out.
  // Revalidate that the session is still authorized before showing forms.
  let latest;
  try{latest=await ownerReadiness.check({readingMode:'Automatic'});}
  catch{deny('OWNER_UNVERIFIED');}
  check(permitted(),'OFFLINE');
  check(latest?.state==='Owner'&&latest.canPublish===false,
   'OWNER_UNVERIFIED');
  return Object.freeze({source,editorPreviewOnly:true,
   publicationAvailable:false});
 }
 return Object.freeze({open});
}
