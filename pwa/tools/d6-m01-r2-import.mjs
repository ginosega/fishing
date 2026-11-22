/**
 * FISH-TODO-118 M01: one-time copy of pinned original fishing photos to the
 * already approved private R2 bucket. Never writes D1, deploys, or deletes.
 *
 *   node tools/d6-m01-r2-import.mjs --check --report <inventory.json>
 *   node tools/d6-m01-r2-import.mjs --upload --report <inventory.json>
 *
 * --check does not connect to Cloudflare or load the S3 SDK.
 * --upload requires @aws-sdk/client-s3 and three FISH_R2_* environment
 * variables. No credentials are accepted on the command line.
 */
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {prepareM01OriginalMediaInventory} from './d6-historic-media-inventory.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bucket='fishing-v3-owner-media-test';
const mime=Object.freeze({
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif',
});
const hash=data=>createHash('sha256').update(data).digest('hex');
function verify(ok,description){
 if(!ok)throw Error('M01_IMPORT_STOP: '+description);
}
function args(){
 const a=process.argv.slice(2);
 verify(a.length===3&&(a[0]==='--check'||a[0]==='--upload')&&
  a[1]==='--report'&&a[2]&&a[2]!==root,'usage: --check|--upload --report <inventory.json>');
 return {mode:a[0],report:a[2]};
}
async function readVerifiedInventory(file){
 // Reproduce the existing pinned inventory from original checked-out bytes;
 // never trust a manually edited report or an unpinned photo source.
 const expected=await prepareM01OriginalMediaInventory();
 const supplied=JSON.parse(await readFile(path.resolve(file),'utf8'));
 verify(JSON.stringify(supplied)===JSON.stringify(expected),
  'local report differs from verified original source');
 verify(expected.counts.files===274&&expected.counts.bytes===166411118&&
  expected.counts.unreferencedFiles===9&&
  expected.counts.knotFrames===111&&
  expected.counts.crossDomainFiles===8,
  'original inventory counts changed');
 const unique=new Map();
 for(const row of expected.assets){
  verify(Object.hasOwn(mime,row.path.split('.').at(-1).toLowerCase())&&
   /^[a-f0-9]{64}$/.test(row.sha256),'invalid image identity');
  const saved=unique.get(row.sha256);
  if(saved)verify(saved.bytes===row.bytes&&
   mime[saved.path.split('.').at(-1).toLowerCase()]===
    mime[row.path.split('.').at(-1).toLowerCase()],
   'conflicting identical SHA identity');
  else unique.set(row.sha256,row);
 }
 return {expected,unique};
}
function s3Key(sha){return 'staged/v1/sha256/'+sha;}
async function upload(unique){
 const account=process.env.FISH_R2_ACCOUNT_ID;
 const accessKeyId=process.env.FISH_R2_ACCESS_KEY_ID;
 const secretAccessKey=process.env.FISH_R2_SECRET_ACCESS_KEY;
 verify(/^[a-f0-9]{32}$/i.test(account??'')&&
  Boolean(accessKeyId)&&Boolean(secretAccessKey),
  'missing account ID or local bucket-scoped S3 credentials');
 // This one-off SDK is installed locally only for execution; it is not
 // a runtime dependency of the Fishing application.
 let sdk;
 try{sdk=await import('@aws-sdk/client-s3');}
 catch{throw Error('M01_IMPORT_STOP: install @aws-sdk/client-s3 locally before --upload');}
 const {S3Client,PutObjectCommand,HeadObjectCommand,GetObjectCommand}=sdk;
 const client=new S3Client({
  region:'auto',
  endpoint:'https://'+account+'.r2.cloudflarestorage.com',
  forcePathStyle:true,
  credentials:{accessKeyId,secretAccessKey},
  requestChecksumCalculation:'WHEN_REQUIRED',
 });
 let copied=0,reused=0,number=0;
 try{
  for(const row of unique.values()){
   const bytes=await readFile(path.join(root,...row.path.split('/')));
   verify(bytes.length===row.bytes&&hash(bytes)===row.sha256,
    'source image changed: '+row.path);
   const key=s3Key(row.sha256);
   const contentType=mime[row.path.split('.').at(-1).toLowerCase()];
   let newObject=false;
   try{
    await client.send(new PutObjectCommand({
     Bucket:bucket,Key:key,Body:bytes,ContentType:contentType,
     Metadata:{sha256:row.sha256},IfNoneMatch:'*',
    }));
    newObject=true;
   }catch(e){
    // Existing objects are never overwritten. Only the standard 412 means
    // we can independently verify the previously uploaded object.
    if(e?.$metadata?.httpStatusCode!==412)throw e;
   }
   const head=await client.send(new HeadObjectCommand({
    Bucket:bucket,Key:key,
   }));
   verify(head.ContentLength===row.bytes&&
    head.ContentType===contentType&&head.Metadata?.sha256===row.sha256,
    'R2 metadata mismatch: '+key);
   const original=await client.send(new GetObjectCommand({
    Bucket:bucket,Key:key,
   }));
   const actual=await original.Body.transformToByteArray();
   verify(actual.byteLength===row.bytes&&hash(actual)===row.sha256,
    'R2 bytes mismatch: '+key);
   if(newObject)copied++;else reused++;
   number++;
   if(number%25===0||number===unique.size)
    console.log('Verified '+number+'/'+unique.size+' R2 originals');
  }
  console.log('M01 R2 COPY PASS: '+unique.size+
   ' unique originals verified; new '+copied+'; reused '+reused+
   '. No D1 records, Worker configuration or public routes changed.');
 }finally{client.destroy();}
}
async function main(){
 const {mode,report}=args();
 const {expected,unique}=await readVerifiedInventory(report);
 console.log('M01 VERIFIED: '+expected.counts.files+' historical paths; '+
  expected.counts.bytes+' bytes; '+unique.size+' unique content SHA keys; '+
  expected.counts.unreferencedFiles+' retained unreferenced originals.');
 if(mode==='--check'){
  console.log('READ-ONLY PASS: no Cloudflare calls or writes.');
  return;
 }
 await upload(unique);
}
main().catch(error=>{
 console.error(error?.message??String(error));
 process.exitCode=1;
});
