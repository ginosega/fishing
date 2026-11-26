/**
 * M02 source-only media upload coordinator.
 * Not imported by any Worker or owner UI. Every operation defaults OFF.
 * An R2 stage receipt is not a live image or proof of a D1 Save.
 */
import {validateBrowserImage} from './image-validation.mjs';
import {validateD6MediaOwnerPath,publishedD6MediaRole,d6ValidKnotSequence}
 from './d6-content-media-contract.mjs';
import {encodedPath} from './shared.mjs';
import {isD6NotesImageLinked} from './d6-notes-image-link.mjs';
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const MIME={png:'image/png',gif:'image/gif',jpg:'image/jpeg',
 jpeg:'image/jpeg',webp:'image/webp'};
const DOMAIN={
 gear:{csrf:'owner-csrf',intent:'gear-csrf',save:'save-gear',field:'notes'},
 kb:{csrf:'kb-csrf',intent:'kb-csrf',save:'save-kb',field:'markdown'},
 catches:{csrf:'catches-csrf',intent:'catch-csrf',save:'save-catch',field:'notes'},
};
const fail=(code,message)=>Object.assign(new Error(message),{code});
const mime=path=>MIME[path.split('.').at(-1)?.toLowerCase()]??null;
export function createD6OwnerMediaUploadCoordinator({
 root,request,enabled=()=>false,readingMode=()=> 'Checking',
}={}){
 let app;try{app=new URL(root);}catch{throw fail('INVALID_ORIGIN','Invalid media root');}
 const local=app.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(app.hostname);
 if((app.protocol!=='https:'&&!local)||app.pathname!=='/fishing/'||
    app.username||app.password||app.search||app.hash||
    typeof request!=='function'||typeof enabled!=='function'||
    typeof readingMode!=='function')
  throw fail('INVALID_ORIGIN','Invalid media client configuration');
 const origin=app.origin,content=origin+'/api/v3/content/',
  media=origin+'/api/v3/media/',receipts=new Map(),
  stagePending=new Set(),stageAttempted=new Set(),
  publishAttempted=new Set();
 const ready=()=>enabled()===true&&readingMode()==='Automatic';
 function guard(){if(!ready())throw fail('DISABLED','Media upload is not enabled');}
 async function json(url,options){
  let reply;
  try{reply=await request(url,{...options,credentials:'same-origin',
   cache:'no-store',redirect:'manual'});}
  catch{throw fail('UNVERIFIED','Unknown outcome; preserve draft and receipts');}
  if(!(reply instanceof Response)||reply.redirected||
     (reply.url&&reply.url!==url)||
     !/^application\/json\b/i.test(reply.headers.get('Content-Type')??''))
   throw fail('UNVERIFIED','Unverified same-origin media response');
  if(reply.status===409)throw fail('CONFLICT','Record changed; preserve draft');
  if(reply.status===401||reply.status===403)
   throw fail('AUTH','Owner session unavailable; preserve draft');
  if(reply.status!==200)
   throw fail('UNVERIFIED','Media operation not confirmed; do not retry blindly');
  let data;try{data=await reply.json();}catch{
   throw fail('UNVERIFIED','Unverified media response body');
  }
  if(data?.ok!==true)throw fail('UNVERIFIED','Media request not confirmed');
  return data;
 }
 async function csrf(domain){
  const config=DOMAIN[domain];
  if(!config)throw fail('INVALID','Invalid content domain');
  const data=await json(content+config.csrf,{method:'GET',
   headers:{Accept:'application/json','X-Fish-V3-Intent':config.intent}});
  if(!CSRF.test(data.csrfToken??''))throw fail('AUTH','Invalid owner CSRF');
  return data.csrfToken;
 }
 async function stage({domain,record,logicalPath,role='notes',file}={}){
  guard();
  const owner=validateD6MediaOwnerPath({domain,record,logicalPath,role});
  const type=mime(owner.logicalPath);
  if(!type||!file||typeof file.arrayBuffer!=='function'||
     typeof file.name!=='string'||mime(file.name)!==type)
   throw fail('INVALID','Image file does not match its intended path');
  if(receipts.has(owner.logicalPath)||stagePending.has(owner.logicalPath)||
     stageAttempted.has(owner.logicalPath))
   throw fail('DUPLICATE','Image already staged or upload outcome unresolved');
  stagePending.add(owner.logicalPath);
  try{
  const image=await validateBrowserImage(file);
  const token=await csrf(domain);
  // A network failure after this point may conceal a successful R2 stage.
  // Never retry this logical path without an independent reconciliation.
  stageAttempted.add(owner.logicalPath);
  const data=await json(media+'stage',{method:'POST',body:file,
   headers:{Accept:'application/json','Content-Type':type,
    'X-Fish-V3-Intent':'stage-media','X-Fish-V3-CSRF':token,
    'X-Fish-V3-Media-Domain':domain,
    'X-Fish-V3-Media-Record':record.id,
    'X-Fish-V3-Media-Category':domain==='gear'?record.category:
      domain==='kb'?record.type:'',
    'X-Fish-V3-Media-Path':owner.logicalPath,
    'X-Fish-V3-Media-Role':role,'X-Fish-V3-SHA256':image.sha256}});
  if(data.staged!==true||data.published!==false||
     data.domain!==domain||data.recordId!==record.id||
     data.logicalPath!==owner.logicalPath||data.role!==role||
     data.sha256!==image.sha256||data.bytes!==image.bytes||
     data.contentType!==type||
     data.storageKey!=='staged/v1/sha256/'+image.sha256||
     data.width!==image.width||data.height!==image.height)
   throw fail('UNVERIFIED','R2 stage receipt did not match original');
  const receipt=Object.freeze({domain,recordId:record.id,
   logicalPath:owner.logicalPath,role,sha256:image.sha256,
   bytes:image.bytes,contentType:type});
  receipts.set(receipt.logicalPath,receipt);
  return receipt;
  }finally{stagePending.delete(owner.logicalPath);}
 }
 function manifest(domain,record,markdown,staged){
  if(!DOMAIN[domain]||typeof record?.id!=='string'||
     !Array.isArray(staged)||staged.length>32)
   throw fail('INVALID','Invalid image manifest');
  const paths=new Set();
  for(const x of staged){
   if(!x||x.domain!==domain||x.recordId!==record.id||
      receipts.get(x.logicalPath)!==x||paths.has(x.logicalPath)||
      publishedD6MediaRole({domain,record,logicalPath:x.logicalPath,
       notesLinked:x.role==='notes'&&
        isD6NotesImageLinked(markdown,x.logicalPath)})!==x.role)
    throw fail('INVALID','Image receipt is not owned by revised record');
   paths.add(x.logicalPath);
  }
  if(staged.some(x=>x.role==='knot-step')&&
     (!d6ValidKnotSequence(record)||
      staged.filter(x=>x.role==='knot-step').length!==
       record.pictureSequence.length||
      !record.pictureSequence.every(path=>paths.has(path))))
   throw fail('INVALID','Incomplete Knot image sequence');
  return staged.map(x=>({logicalPath:x.logicalPath,
   sha256:x.sha256,bytes:x.bytes,contentType:x.contentType}));
 }
 async function publish({domain,record,markdown,expectedRevision,staged}={}){
  guard();
  if(typeof markdown!=='string'||!Number.isSafeInteger(expectedRevision)||
     expectedRevision<0)throw fail('INVALID','Invalid revision or Markdown');
  const files=manifest(domain,record,markdown,staged),config=DOMAIN[domain];
  const token=await csrf(domain);
  // A lost D1 acknowledgement is ambiguous: do not submit a second Save
  // even while retaining the original receipts for explicit recovery.
  if(staged.some(x=>publishAttempted.has(x)))
   throw fail('UNVERIFIED','Earlier publish attempt requires reconciliation');
  for(const x of staged)publishAttempted.add(x);
  const data=await json(media+'publish',{method:'POST',
   headers:{Accept:'application/json','Content-Type':'application/json',
    'X-Fish-V3-CSRF':token,'X-Fish-V3-Media-Domain':domain,
    'X-Fish-V3-Intent':config.save},
   body:JSON.stringify({domain,record,markdown,
    expectedRevision,media:files})});
  if(data.published!==true||data.record?.id!==record.id||
     data.revision!==expectedRevision+1||data[config.field]!==markdown||
     !Array.isArray(data.media)||data.media.length!==staged.length||
     staged.some(x=>!data.media.some(y=>y.logicalPath===x.logicalPath&&
      y.role===x.role&&y.sha256===x.sha256&&y.bytes===x.bytes&&
      y.contentType===x.contentType)))
   throw fail('UNVERIFIED','Publish acknowledgement not verified');
  const version=data.revision;
  const recordRead=await json(content+domain+'/'+encodeURIComponent(record.id),
   {method:'GET',headers:{Accept:'application/json'}});
  if(recordRead.revision!==version||recordRead.record?.id!==record.id||
     recordRead[config.field]!==markdown)
   throw fail('UNVERIFIED','D1 record readback mismatch');
  for(const x of staged){
   const url=media+'live/'+encodedPath(x.logicalPath);
   let reply;try{reply=await request(url,{method:'HEAD',
    credentials:'same-origin',cache:'no-store',redirect:'manual'});}
   catch{throw fail('UNVERIFIED','R2 live-image readback unknown');}
   if(!(reply instanceof Response)||reply.status!==200||
      reply.redirected||(reply.url&&reply.url!==url)||
      reply.headers.get('ETag')!=='"'+x.sha256+'"'||
      reply.headers.get('Content-Type')!==x.contentType||
      reply.headers.get('Content-Length')!==String(x.bytes))
    throw fail('UNVERIFIED','R2 live-image readback mismatch');
  }
  for(const x of staged)receipts.delete(x.logicalPath);
  return Object.freeze({record:data.record,revision:version,verified:true});
 }
 return Object.freeze({ready,stage,publish});
}
