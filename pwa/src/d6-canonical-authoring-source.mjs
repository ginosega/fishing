/**
 * D6 canonical GitHub source contract (READ-ONLY, source-only prototype).
 * Browser checks cannot prove the server fetched the named Git tree: the
 * trusted gateway must independently pin/verify each requested main commit.
 * Never treat this display snapshot as publication authorization.
 */
import {validateRecords,collectPaths,checkPathCollisions,validateLibraryPaths,
 validateMarkdown}
 from './validation.mjs';
import {D6_READER_BASE,D6_READER_ORIGIN} from './d6-public-reader.mjs';

export const D6_CANONICAL_REPOSITORY=Object.freeze({
 id:1350909744,fullName:'ginosega/fishing',ref:'refs/heads/main',
});
const SHA=/^[a-f0-9]{40}$/;
const MAX_BYTES=2*1024*1024;
const MAX_FILES=1800;
const MAX_MARKDOWN=240;
const enc=new TextEncoder();
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const goodPath=v=>typeof v==='string'&&v.length>0&&v.length<=512&&
 !v.startsWith('/')&&!v.includes('\\')&&!v.includes('//')&&
 !v.includes('\0')&&!/%(?:2e|2f|5c|00)/i.test(v)&&
 !v.split('/').some(x=>x==='.'||x==='..')&&
 /^(?:Gear|KB|Catches)\//.test(v);
export class D6SourceError extends Error{
 constructor(code){super('Canonical GitHub authoring source not verified');
  this.name='D6SourceError';this.code=code;}
}
const deny=code=>{throw new D6SourceError(code);};
const need=(value,code)=>{if(!value)deny(code);};

export function createD6CanonicalSourceClient({
 root,request,expectedReleaseRevision,enabled=()=>false,online=()=>false,
}={}){
 let u;
 try{u=new URL(root);}catch{deny('INVALID_CONFIG');}
 const loopback=u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 need((u.origin===D6_READER_ORIGIN||loopback)&&
  u.pathname===D6_READER_BASE&&!u.search&&!u.hash&&
  !u.username&&!u.password&&SHA.test(expectedReleaseRevision??'')&&
  typeof request==='function'&&typeof enabled==='function'&&
  typeof online==='function','INVALID_CONFIG');
 const endpoint=u.origin+'/api/v3/authoring-source';
 async function load({readingMode='Checking',ownerVerified=false}={}){
  need(enabled()===true,'DISABLED');
  need(online()===true&&readingMode==='Automatic','OFFLINE');
  need(ownerVerified===true,'OWNER_SESSION_REQUIRED');
  let res;
  try{res=await request(endpoint,{
   method:'GET',credentials:'same-origin',cache:'no-store',
   redirect:'manual',headers:{Accept:'application/json'},
  });}catch{deny('SOURCE_UNAVAILABLE');}
  if(res?.status===401||res?.status===403)deny('OWNER_SESSION_REQUIRED');
  need(res instanceof Response&&res.status===200&&
   res.redirected!==true&&(!res.url||res.url===endpoint)&&
   /\bapplication\/json\b/i.test(res.headers.get('Content-Type')??''),
   'SOURCE_UNAVAILABLE');
  let body,raw;
  try{raw=await res.text();need(enc.encode(raw).byteLength<=MAX_BYTES,'SOURCE_TOO_LARGE');
   body=JSON.parse(raw);}
  catch(e){if(e instanceof D6SourceError)throw e;deny('INVALID_RESPONSE');}
  need(obj(body)&&body.ok===true&&
   body.repositoryId===D6_CANONICAL_REPOSITORY.id&&
   body.repositoryFullName===D6_CANONICAL_REPOSITORY.fullName&&
   body.ref===D6_CANONICAL_REPOSITORY.ref&&
   body.sandboxOnly===false&&
   SHA.test(body.sourceRevision??'')&&SHA.test(body.treeSha??'')&&
   obj(body.data)&&Array.isArray(body.files)&&Array.isArray(body.markdown),
   'UNTRUSTED_SOURCE');
  // A newly committed main can be ahead of its hosted release. Never pair
  // that source with an older client release for an eventual edit.
  need(body.sourceRevision===expectedReleaseRevision,'SOURCE_REVISION_MISMATCH');
  need(body.files.length<=MAX_FILES&&body.markdown.length<=MAX_MARKDOWN,
   'SOURCE_TOO_LARGE');
  let referenced,maps,routes;
  try{
   maps=validateRecords(body.data);
   routes=validateLibraryPaths(body.data);
   referenced=collectPaths(body.data);
   checkPathCollisions(referenced);
  }catch{deny('INVALID_RECORDS');}
  const files=new Set(),normalized=new Set();
  for(const item of body.files){
   need(goodPath(item)&&!files.has(item),'UNTRUSTED_SOURCE');
   const id=item.normalize('NFC').toLowerCase();
   need(!normalized.has(id),'UNTRUSTED_SOURCE');
   files.add(item);normalized.add(id);
  }
  const markdown=new Map();
  for(const item of body.markdown){
   need(obj(item)&&goodPath(item.path)&&item.path.endsWith('.md')&&
    files.has(item.path)&&!markdown.has(item.path)&&
    typeof item.body==='string'&&
    enc.encode(item.body).byteLength<=131072,'UNTRUSTED_SOURCE');
   markdown.set(item.path,item.body);
  }
  for(const path of referenced){
   need(files.has(path),'MISSING_CANONICAL_FILE');
   if(path.endsWith('.md'))need(markdown.has(path),'MISSING_CANONICAL_MARKDOWN');
  }
  // Markdown can reference inline images and links beyond record-level fields.
  // Verify those against the same exact source tree inventory, not a public
  // Pages release from an unrelated revision.
  try{
   for(const [path,bodyText] of markdown)
    validateMarkdown(bodyText,{owner:path,maps,exists:files,pathRoutes:routes});
  }catch{deny('INVALID_MARKDOWN_REFERENCES');}
  // This authoring snapshot is only a display/source input, NOT a durable
  // GitHub commit receipt. It is never automatically treated as Live.
  return Object.freeze({
   repositoryId:D6_CANONICAL_REPOSITORY.id,
   repositoryFullName:D6_CANONICAL_REPOSITORY.fullName,
   ref:D6_CANONICAL_REPOSITORY.ref,
   sourceRevision:body.sourceRevision,treeSha:body.treeSha,
   data:body.data,files,markdown,canPublish:false,sourceOnly:true,
  });
 }
 return Object.freeze({load});
}
