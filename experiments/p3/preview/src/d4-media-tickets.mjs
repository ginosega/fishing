/** FISH118 D4: exact metadata and signed media-ticket/package matching.
 * No original media bytes are trusted from the browser's JSON operation.
 * The media stage verifies bytes first; the PR builder verifies Git blob
 * content again before including it in a new immutable Git tree.
 */
import {d4MediaPath} from './d4-media-integrity.mjs';
import {pathKey} from '../../../../pwa/src/shared.mjs';
import {validatePackage} from '../../../../pwa/src/handoff.mjs';
const SHA=/^[a-f0-9]{64}$/,MAX_FILE=10*1024*1024;
const MAX_TOTAL=48*1024*1024,MAX_FILES=24;
export class D4TicketError extends Error{
 constructor(code){super('D4 staged media request refused');this.name='D4TicketError';this.code=code;}
}
const fail=code=>{throw new D4TicketError(code);};
const need=(v,code)=>{if(!v)fail(code);};
const fileMeta=m=>m&&Number.isSafeInteger(m.bytes)&&m.bytes>0&&
 m.bytes<=MAX_FILE&&SHA.test(m.sha256);

export function expectedD4Media(pkg){
 try{validatePackage(pkg);}catch{fail('INVALID_PACKAGE');}
 if(pkg.domain==='catches'){
  need(pkg.picture.action==='keep'&&
   (pkg.pictureSequence?.action??'keep')==='keep','CATCH_MEDIA_DENIED');
  return Object.freeze([]);
 }
 const picture=pkg.picture,sequence=pkg.pictureSequence??{action:'keep'};
 const expected=[];
 if(sequence.action==='set'){
  need(pkg.domain==='kb'&&Array.isArray(sequence.paths)&&
   Array.isArray(sequence.files)&&sequence.paths.length>=2&&
   sequence.paths.length<=MAX_FILES&&sequence.files.length===sequence.paths.length,
   'INVALID_SEQUENCE');
  need(picture.path===sequence.paths.at(-1)&&
   ['add','replace'].includes(picture.action),'INVALID_SEQUENCE');
  for(let i=0;i<sequence.paths.length;i++){
   const path=sequence.paths[i],m=sequence.files[i];
   need(m?.path===path&&fileMeta(m),'INVALID_SEQUENCE');
   expected.push(Object.freeze({path:d4MediaPath(path),
    bytes:m.bytes,sha256:m.sha256}));
  }
 }else if(['add','replace'].includes(picture.action)){
  need(fileMeta(picture.file),'INVALID_PICTURE_METADATA');
  expected.push(Object.freeze({path:d4MediaPath(picture.path),
   bytes:picture.file.bytes,sha256:picture.file.sha256}));
 }
 need(expected.length<=MAX_FILES,'TOO_MANY_FILES');
 const keys=new Set();let total=0;
 for(const file of expected){
  const k=pathKey(file.path);
  need(!keys.has(k),'DUPLICATE_MEDIA_PATH');keys.add(k);
  total+=file.bytes;
  need(total<=MAX_TOTAL,'MEDIA_TOO_LARGE');
 }
 return Object.freeze(expected);
}

export async function validateD4MediaTickets({
 package:pkg,media=[],verifyTicket,
 allowExpired=false,
}={}){
 need(Array.isArray(media)&&media.length<=MAX_FILES&&
  typeof verifyTicket==='function','INVALID_REQUEST');
 const expected=expectedD4Media(pkg);
 need(media.length===expected.length,'MEDIA_COUNT_MISMATCH');
 const found=new Map();
 for(const item of media){
  const proof=await verifyTicket(item,{allowExpired});
  need(proof&&typeof proof.path==='string'&&
   /^[0-9a-f]{40}$/.test(proof.blobSha??'')&&
   fileMeta(proof),'INVALID_TICKET');
  const key=pathKey(proof.path);
  need(!found.has(key),'DUPLICATE_MEDIA_PATH');
  found.set(key,proof);
 }
 const result=[];
 for(const file of expected){
  const proof=found.get(pathKey(file.path));
  need(proof&&proof.path===file.path&&
   proof.bytes===file.bytes&&proof.sha256===file.sha256,
   'MEDIA_METADATA_MISMATCH');
  result.push(Object.freeze({path:file.path,
   bytes:proof.bytes,sha256:proof.sha256,
   blobSha:proof.blobSha,mime:proof.mime}));
 }
 return Object.freeze(result);
}
