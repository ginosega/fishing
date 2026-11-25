/**
 * WP3-2 canonical ORIGINAL media byte preflight — SOURCE ONLY.
 *
 * Independently checks the complete proposed media set against an already
 * source-aware package. It cannot stage blobs, modify the GitHub tree, create
 * a PR, accept an operation, return Live or bind a Worker route. The future
 * authenticated coordinator MUST independently validate canonical ownership,
 * Markdown references, and signed staging tickets before Git mutations.
 *
 * This is a selective D4 integrity-port; no sandbox repository or token.
 */
import {safePath,pathKey,sha256} from '../../../../pwa/src/shared.mjs';
import {validatePackage,validInlineNoteImagePath}
 from '../../../../pwa/src/handoff.mjs';

const MAX_FILE=10*1024*1024,MAX_TOTAL=48*1024*1024,MAX_FILES=24;
const types=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
export class D6MediaContractError extends Error{
 constructor(code){
  super('D6 canonical media preflight denied');
  this.name='D6MediaContractError';this.code=code;
 }
}
const deny=code=>{throw new D6MediaContractError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const meta=m=>m&&Number.isSafeInteger(m.bytes)&&m.bytes>0&&
 m.bytes<=MAX_FILE&&/^[a-f0-9]{64}$/.test(m.sha256);

function verifiedPath(path,domain){
 let p;
 try{p=safePath(path);}catch{deny('UNSAFE_MEDIA_PATH');}
 const parts=p.split('/'),ext=parts.at(-1).split('.').at(-1)?.toLowerCase();
 need(types[ext]&&parts[0]===(domain==='gear'?'Gear':
  domain==='kb'?'KB':'Catches')&&parts.includes('assets')&&
  parts.length>=4,'UNSAFE_MEDIA_PATH');
 return p;
}

export function expectedD6CanonicalMedia(pkg){
 try{validatePackage(pkg);}catch{deny('INVALID_PACKAGE');}
 const list=[],sequence=pkg.pictureSequence??{action:'keep'},
  picture=pkg.picture;
 if(sequence.action==='set'){
  need(pkg.domain==='kb'&&Array.isArray(sequence.paths)&&
   Array.isArray(sequence.files)&&
   sequence.paths.length>=2&&sequence.paths.length<=MAX_FILES&&
   sequence.paths.length===sequence.files.length&&
   ['add','replace'].includes(picture.action)&&
   picture.path===sequence.paths.at(-1),'INVALID_SEQUENCE');
  for(let i=0;i<sequence.paths.length;i++){
   const path=verifiedPath(sequence.paths[i],pkg.domain);
   const frame=sequence.files[i],parts=path.split('/');
   need(frame?.path===path&&meta(frame)&&parts.length===5&&
    parts[0]==='KB'&&parts[1]==='Knots'&&parts[2]==='assets'&&
    parts[3]===pkg.id&&
    /^step-[0-9]{2}\.(jpe?g|png|webp|gif)$/i.test(parts[4])&&
    parts[4].startsWith('step-'+String(i+1).padStart(2,'0')+'.'),
    'INVALID_SEQUENCE');
   list.push({path,bytes:frame.bytes,sha256:frame.sha256});
  }
 }else if(['add','replace'].includes(picture.action)){
  const path=verifiedPath(picture.path,pkg.domain);
  need(pkg.domain!=='catches'&&meta(picture.file)&&
   path.startsWith((pkg.domain==='gear'?'Gear/':'KB/') ),
   'INVALID_PICTURE');
  list.push({path,bytes:picture.file.bytes,sha256:picture.file.sha256});
 }
 const notes=pkg.notes?.images??[];
 need(notes.length<=MAX_FILES,'TOO_MANY_FILES');
 for(const item of notes){
  need(item&&validInlineNoteImagePath(pkg.domain,pkg.id,item.path)&&
   meta(item),'INVALID_INLINE_NOTE_IMAGE');
  const path=verifiedPath(item.path,pkg.domain);
  list.push({path,bytes:item.bytes,sha256:item.sha256});
 }
 need(list.length<=MAX_FILES,'TOO_MANY_FILES');
 const seen=new Set();let total=0;
 for(const file of list){
  const key=pathKey(file.path);need(!seen.has(key),'DUPLICATE_MEDIA_PATH');
  seen.add(key);total+=file.bytes;need(total<=MAX_TOTAL,'MEDIA_TOO_LARGE');
 }
 return Object.freeze(list.map(x=>Object.freeze(x)));
}

export const d6ImageMime=bytes=>{
 if(!(bytes instanceof Uint8Array))return null;
 const starts=(...v)=>v.every((x,i)=>bytes[i]===x);
 if(starts(255,216,255))return 'image/jpeg';
 if(starts(137,80,78,71,13,10,26,10))return 'image/png';
 if(starts(71,73,70,56)&&[55,57].includes(bytes[4])&&
  bytes[5]===97)return 'image/gif';
 if(starts(82,73,70,70)&&bytes.length>=12&&
  bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80)
  return 'image/webp';
 return null;
};

/** Server-side original-byte check. No bytes are returned or stored. */
export async function verifyD6CanonicalMedia({package:pkg,uploads=[]}={}){
 const expected=expectedD6CanonicalMedia(pkg);
 need(Array.isArray(uploads)&&uploads.length===expected.length&&
  uploads.length<=MAX_FILES,'MEDIA_COUNT_MISMATCH');
 const candidates=new Map(expected.map(x=>[x.path,x]));
 const seen=new Set(),files=[];let total=0;
 for(const item of uploads){
  need(item&&typeof item.path==='string'&&
   item.bytes instanceof Uint8Array,'INVALID_MEDIA_BYTES');
  const path=verifiedPath(item.path,pkg.domain),key=pathKey(path);
  need(!seen.has(key),'DUPLICATE_MEDIA_PATH');seen.add(key);
  const wanted=candidates.get(path);
  need(wanted,'UNEXPECTED_MEDIA_PATH');
  const bytes=item.bytes;
  need(bytes.length>0&&bytes.length<=MAX_FILE&&
   bytes.length===wanted.bytes,'MEDIA_LENGTH_MISMATCH');
  total+=bytes.length;need(total<=MAX_TOTAL,'MEDIA_TOO_LARGE');
  const ext=path.split('.').at(-1).toLowerCase();
  const mime=d6ImageMime(bytes);
  need(mime&&mime===types[ext],'MEDIA_SIGNATURE_MISMATCH');
  const digest=await sha256(bytes);
  need(digest===wanted.sha256,'MEDIA_DIGEST_MISMATCH');
  files.push(Object.freeze({path,bytes:bytes.length,sha256:digest,mime}));
 }
 return Object.freeze({
  verified:true,sourceOnly:true,canPublish:false,
  requiresSourceReview:true,requiresAtomicTree:true,
  fileCount:files.length,totalBytes:total,
  files:Object.freeze(files),
 });
}
