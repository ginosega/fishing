/**
 * FISH118 D4: isolated ORIGINAL-BYTE media manifest verifier.
 *
 * SOURCE ONLY. Not an upload or storage endpoint. No GitHub/D1 write, token
 * minting, chunking or verified-publication claim. An independently guarded
 * transfer and durable staging protocol remains a separate D4 gate.
 */
import {safePath,pathKey,sha256} from '../../../../pwa/src/shared.mjs';
import {validatePackage,validInlineNoteImagePath} from '../../../../pwa/src/handoff.mjs';

const MAX_FILE=10*1024*1024,MAX_TOTAL=48*1024*1024,MAX_FILES=24;
const allowed=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
export class D4MediaError extends Error{
 constructor(code){super('D4 original media integrity denied');this.name='D4MediaError';this.code=code;}
}
const deny=code=>{throw new D4MediaError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const start=(bytes,...values)=>values.every((n,i)=>bytes[i]===n);
const at=(bytes,index,...values)=>values.every((n,i)=>bytes[index+i]===n);
export const d4ImageMime=bytes=>{
 if(start(bytes,255,216,255))return 'image/jpeg';
 if(start(bytes,137,80,78,71,13,10,26,10))return 'image/png';
 if(start(bytes,71,73,70,56)&&[55,57].includes(bytes[4])&&
  bytes[5]===97)return 'image/gif';
 if(start(bytes,82,73,70,70)&&bytes.length>=12&&
  at(bytes,8,87,69,66,80))return 'image/webp';
 return null;
};
export function d4MediaPath(raw){
 let path;try{path=safePath(raw);}catch{deny('UNSAFE_MEDIA_PATH');}
 const parts=path.split('/'),ext=parts.at(-1).split('.').at(-1)?.toLowerCase();
 need(allowed[ext]&&['Gear','KB','Catches'].includes(parts[0])&&
  parts.includes('assets')&&parts.length>=4&&
  (parts[0]!=='Catches'||(parts.length===5&&parts[1]==='assets'&&
   parts[3]==='notes')),'UNSAFE_MEDIA_PATH');
 return path;
}
const metadata=m=>m&&Number.isSafeInteger(m.bytes)&&m.bytes>0&&
 m.bytes<=MAX_FILE&&/^[a-f0-9]{64}$/.test(m.sha256);

export async function verifyD4MediaManifest({package:pkg,uploads=[]}={}){
 try{validatePackage(pkg);}catch{deny('INVALID_PACKAGE');}
 need(['gear','kb','catches'].includes(pkg.domain)&&Array.isArray(uploads)&&
  uploads.length<=MAX_FILES,'INVALID_MEDIA_REQUEST');
 const picture=pkg.picture??{action:'keep'};
 const sequence=pkg.pictureSequence??{action:'keep'};
 const expected=new Map(),hasSequence=sequence.action==='set';
 if(hasSequence){
  need(pkg.domain==='kb'&&Array.isArray(sequence.paths)&&
   sequence.paths.length>=2&&sequence.paths.length<=MAX_FILES&&
   Array.isArray(sequence.files)&&sequence.files.length===sequence.paths.length,
   'INVALID_SEQUENCE');
  need(picture.path===sequence.paths.at(-1)&&
   ['add','replace'].includes(picture.action),'INVALID_SEQUENCE');
  for(let i=0;i<sequence.paths.length;i++){
   const path=d4MediaPath(sequence.paths[i]);
   const meta=sequence.files.find(m=>m?.path===path);
   const parts=path.split('/'),filename=parts[4]?.toLowerCase()??'';
   const number=String(i+1).padStart(2,'0');
   need(parts.length===5&&parts[0]==='KB'&&parts[1]==='Knots'&&
    parts[2]==='assets'&&parts[3]===pkg.id&&
    filename.startsWith('step-'+number+'.')&&
    metadata(meta),'INVALID_SEQUENCE');
   expected.set(path,meta);
  }
 }else if(['add','replace'].includes(picture.action)){
  const path=d4MediaPath(picture.path);
  need(metadata(picture.file),'MISSING_MEDIA_METADATA');
  expected.set(path,picture.file);
 }
 for(const item of pkg.notes.images??[]){
  const path=d4MediaPath(item.path);
  need(validInlineNoteImagePath(pkg.domain,pkg.id,path)&&metadata(item)&&!expected.has(path),
   'INVALID_INLINE_NOTES_IMAGE');
  expected.set(path,item);
 }
 need(expected.size===uploads.length,'MEDIA_COUNT_MISMATCH');
 const seen=new Set(),files=[];let total=0;
 for(const item of uploads){
  need(item&&typeof item==='object'&&!Array.isArray(item)&&
   typeof item.path==='string'&&item.bytes instanceof Uint8Array,
   'INVALID_MEDIA_ITEM');
  const path=d4MediaPath(item.path),key=pathKey(path);
  need(!seen.has(key),'DUPLICATE_MEDIA_PATH');seen.add(key);
  need(expected.has(path),'UNEXPECTED_MEDIA_PATH');
  const bytes=item.bytes,meta=expected.get(path);
  need(bytes.length>0&&bytes.length<=MAX_FILE&&
   bytes.length===meta.bytes,'MEDIA_LENGTH_MISMATCH');
  total+=bytes.length;need(total<=MAX_TOTAL,'MEDIA_TOTAL_TOO_LARGE');
  const ext=path.split('.').at(-1).toLowerCase(),kind=d4ImageMime(bytes);
  need(kind!==null&&kind===allowed[ext],'MEDIA_SIGNATURE_MISMATCH');
  const digest=await sha256(bytes);
  need(digest===meta.sha256,'MEDIA_DIGEST_MISMATCH');
  files.push(Object.freeze({path,bytes:bytes.length,sha256:digest,mime:kind}));
 }
 for(const path of expected.keys())
  need(files.some(f=>f.path===path),'MISSING_MEDIA_BYTES');
 return Object.freeze({verified:true,fileCount:files.length,
  totalBytes:total,files:Object.freeze(files)});
}
