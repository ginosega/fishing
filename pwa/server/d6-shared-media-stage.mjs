/**
 * FISH-TODO-118 — SOURCE-ONLY shared image staging for Gear, KB and Catches.
 *
 * NOT routed by the private Worker; default enabled() is false.
 * An R2 stage receipt is not a live content reference. D1 metadata, atomic
 * revision-checked publishing and reader resolution must be completed before
 * this service can be enabled or deployed. Never fall back to GitHub writes.
 */
import {safePath,ID_PATTERN} from '../src/shared.mjs';
import {noteImagePath} from '../src/notes-markdown-editor.mjs';
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

export const D6_MEDIA_LIMIT_BYTES=10*1024*1024;
const shaRE=/^[a-f0-9]{64}$/;
const mediaType=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
const domainSet=new Set(['gear','kb','catches']);
const HEADERS=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'Vary':'Cookie',
});
const response=(status,body)=>new Response(JSON.stringify(body),
 {status,headers:HEADERS});
const fail=(status,code)=>response(status,{ok:false,error:code});
function failCheck(condition,message){
 if(!condition)throw Error('MEDIA_INVALID: '+message);
}
function extension(path){
 const value=path.split('/').at(-1);
 const match=/\.([a-z0-9]+)$/i.exec(value);
 return match?.[1].toLowerCase()??'';
}
function signature(bytes,mime){
 const b=bytes,at=(i,s)=>[...s].every((x,j)=>b[i+j]===x);
 if(mime==='image/jpeg')
  return b.length>=4&&at(0,[0xff,0xd8,0xff])&&at(b.length-2,[0xff,0xd9]);
 if(mime==='image/png')
  return b.length>=24&&at(0,[137,80,78,71,13,10,26,10])&&
   at(12,[73,72,68,82]);
 if(mime==='image/gif')
  return b.length>=14&&at(0,[71,73,70,56])&&
   (b[4]===55||b[4]===57)&&b[5]===97&&b.at(-1)===59;
 if(mime==='image/webp')
  return b.length>=30&&at(0,[82,73,70,70])&&at(8,[87,69,66,80])&&
   (at(12,[86,80,56,88])||at(12,[86,80,56,32])||
    at(12,[86,80,56,76]));
 return false;
}
function dimensions(bytes,mime){
 const b=bytes;
 if(mime==='image/png'){
  const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
  return [view.getUint32(16),view.getUint32(20)];
 }
 if(mime==='image/gif'){
  return [b[6]+b[7]*256,b[8]+b[9]*256];
 }
 if(mime==='image/webp'){
  const code=String.fromCharCode(...b.slice(12,16));
  if(code==='VP8X')
   return [1+b[24]+(b[25]<<8)+(b[26]<<16),
    1+b[27]+(b[28]<<8)+(b[29]<<16)];
  if(code==='VP8L'){
   if(b[20]!==0x2f)return [0,0];
   return [1+(((b[22]&63)<<8)|b[21]),
    1+((b[24]&15)<<10)+(b[23]<<2)+((b[22]&192)>>6)];
  }
  // VP8 lossy frame header marker 0x9d 0x01 0x2a
  if(b.length<30||b[23]!==0x9d||b[24]!==0x01||b[25]!==0x2a)
   return [0,0];
  return [((b[27]<<8)|b[26])&0x3fff,
   ((b[29]<<8)|b[28])&0x3fff];
 }
 // JPEG SOF scan; reject unrecognized/malformed segment structure.
 let p=2;
 while(p+3<b.length){
  if(b[p++]!==0xff)return [0,0];
  while(b[p]===0xff)p++;
  const marker=b[p++];
  if(marker===0xd9||marker===0xda)break;
  if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
  if(p+1>=b.length)return [0,0];
  const size=(b[p]<<8)|b[p+1];
  if(size<2||p+size>b.length)return [0,0];
  if((marker>=0xc0&&marker<=0xc3||
     marker>=0xc5&&marker<=0xc7||
     marker>=0xc9&&marker<=0xcb||
     marker>=0xcd&&marker<=0xcf)&&size>=7)
   return [(b[p+5]<<8)|b[p+6],(b[p+3]<<8)|b[p+4]];
  p+=size;
 }
 return [0,0];
}
export function validateD6MediaPath({domain,record,logicalPath}={}){
 failCheck(domainSet.has(domain),'domain');
 failCheck(typeof record==='object'&&record!==null&&
  typeof record.id==='string'&&ID_PATTERN.test(record.id)&&
  record.id.length<=160,'record');
 const path=safePath(logicalPath);
 const name=path.split('/').at(-1);
 failCheck(typeof name==='string'&&name.length>0&&
  !name.startsWith('.')&&mediaType[extension(name)],'filename');
 failCheck(path===noteImagePath(domain,record,name),'owner Notes path');
 return {logicalPath:path,mime:mediaType[extension(name)]};
}
async function digest(bytes){
 const result=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(result)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function validateD6MediaBytes({bytes,contentType,expectedSha256}={}){
 failCheck(bytes instanceof Uint8Array&&bytes.byteLength>0&&
  bytes.byteLength<=D6_MEDIA_LIMIT_BYTES,'size');
 failCheck(Object.values(mediaType).includes(contentType),'MIME');
 failCheck(shaRE.test(expectedSha256??''),'SHA-256 declaration');
 failCheck(signature(bytes,contentType),'magic bytes');
 const [width,height]=dimensions(bytes,contentType);
 failCheck(Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&
  width>0&&height>0&&width<=6000&&height<=6000&&
  width*height<=36000000,'image dimensions');
 const sha256=await digest(bytes);
 failCheck(sha256===expectedSha256,'SHA-256 mismatch');
 return {sha256,size:bytes.byteLength,contentType,width,height};
}
async function boundedBytes(request){
 const declared=request.headers.get('Content-Length');
 if(declared!==null){
  const len=Number(declared);
  failCheck(Number.isSafeInteger(len)&&len>0&&
   len<=D6_MEDIA_LIMIT_BYTES,'Content-Length');
 }
 failCheck(request.body&&typeof request.body.getReader==='function',
  'request body');
 const reader=request.body.getReader(),parts=[];
 let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   failCheck(value instanceof Uint8Array,'stream type');
   total+=value.byteLength;
   failCheck(total<=D6_MEDIA_LIMIT_BYTES,'stream size');
   parts.push(value);
  }
 }catch(error){
  await reader.cancel().catch(()=>{});
  throw error;
 }finally{reader.releaseLock();}
 failCheck(total>0&&
  (declared===null||total===Number(declared)),'complete body');
 const data=new Uint8Array(total);let at=0;
 for(const part of parts){data.set(part,at);at+=part.length;}
 return data;
}
export function createD6SharedMediaStage({
 AUTH_DB,R2,csrfKey,origin,enabled=()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    new URL(origin).origin!==origin||
    typeof enabled!=='function'||typeof now!=='function')
  throw Error('Invalid media stage configuration');
 const ready=()=>enabled()===true&&
  typeof AUTH_DB?.prepare==='function'&&
  typeof R2?.put==='function'&&typeof R2?.head==='function'&&
  typeof csrfKey==='string'&&new TextEncoder().encode(csrfKey).length>=32;
 async function handle(request){
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;try{url=new URL(request.url);}catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==origin||url.pathname!=='/api/v3/media/stage'||
     url.search||url.hash||request.headers.has('Authorization'))
   return fail(404,'NOT_FOUND');
  if(!ready())return fail(503,'MEDIA_NOT_ENABLED');
  if(request.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
  const session=createD2UnifiedOwnerSession({
   AUTH_DB,ownerGitHubId:265665562,origin,csrfKey,now,
  });
  try{await session.authorizeMedia(request);}
  catch{return fail(403,'MEDIA_NOT_AUTHORIZED');}
  let info;
  try{
   const domain=request.headers.get('X-Fish-V3-Media-Domain');
   const recordId=request.headers.get('X-Fish-V3-Media-Record');
   const category=request.headers.get('X-Fish-V3-Media-Category');
   const name=request.headers.get('X-Fish-V3-Media-Path');
   const record={id:recordId,
    ...(domain==='gear'?{category}:
        domain==='kb'?{type:category}:{})};
   const path=validateD6MediaPath({domain,record,logicalPath:name});
   const bytes=await boundedBytes(request);
   const validated=await validateD6MediaBytes({bytes,
    contentType:request.headers.get('Content-Type'),
    expectedSha256:request.headers.get('X-Fish-V3-SHA256'),
   });
   failCheck(validated.contentType===path.mime,'path/MIME mismatch');
   info={...path,...validated,domain,recordId,bytes};
  }catch{return fail(400,'INVALID_MEDIA');}
  // Private immutable staging; never bind/serve this object as live content
  // before separately authenticated, revision-checked D1 promotion.
  const key='staged/v1/sha256/'+info.sha256;
  try{
   const item=await R2.put(key,info.bytes,{
    onlyIf:{etagDoesNotMatch:'*'},
    sha256:info.sha256,
    httpMetadata:{contentType:info.contentType},
    customMetadata:{sha256:info.sha256},
    storageClass:'Standard',
   });
   const stored=item??await R2.head(key);
   if(!stored||stored.key!==key||
      stored.size!==info.size||
      stored.customMetadata?.sha256!==info.sha256||
      stored.httpMetadata?.contentType!==info.contentType)
    return fail(503,'MEDIA_STAGE_UNVERIFIED');
   return response(200,{ok:true,staged:true,
    recordId:info.recordId,domain:info.domain,
    logicalPath:info.logicalPath,sha256:info.sha256,
    storageKey:key,bytes:info.size,contentType:info.contentType,
    width:info.width,height:info.height,
    published:false});
  }catch{return fail(503,'MEDIA_STAGE_UNVERIFIED');}
 }
 return Object.freeze({handle});
}
