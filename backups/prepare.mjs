import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const tables=['d6_gear_records','d6_kb_records','d6_catch_records','d6_media_objects','d6_media_refs'];
const extras=['d6_media_refs_owner_idx','d6_media_refs_path_idx','d6_media_same_path_sha'].sort();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const mimeTypes=['image/jpeg','image/png','image/webp','image/gif'];

export function inspectContent(input){
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('PRAGMA foreign_keys=OFF;');
  db.exec(new TextDecoder('utf-8',{fatal:true}).decode(input));
  const schema=db.prepare("SELECT type,name,tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
  check(same(schema.filter(r=>r.type==='table').map(r=>r.name),[...tables].sort()),'Unexpected content tables; do not publish this export');
  check(same(schema.filter(r=>r.type!=='table').map(r=>r.name),extras),'Unexpected schema indexes or triggers');
  check(db.prepare('PRAGMA integrity_check').all().every(r=>Object.values(r)[0]==='ok'),'SQLite integrity check failed');
  check(db.prepare('PRAGMA foreign_key_check').all().length===0,'Foreign key check failed');
  const counts=Object.fromEntries(tables.map(t=>[t,db.prepare('SELECT COUNT(*) AS n FROM '+t).get().n]));
  const rows=db.prepare('SELECT sha256,storage_key,mime,bytes FROM d6_media_objects ORDER BY sha256').all();
  check(rows.every(r=>/^[a-f0-9]{64}$/.test(r.sha256)&&typeof r.storage_key==='string'&&r.storage_key.length>0&&mimeTypes.includes(r.mime)&&Number.isSafeInteger(r.bytes)&&r.bytes>0),'Invalid registry entry');
  check(new Set(rows.map(r=>r.storage_key)).size===rows.length,'Duplicate storage key');
  return {counts,rows};
 }finally{db.close();}
}

export async function prepareBackup({input,stage,fetchOriginal,sourceRevision,createdAt=new Date().toISOString(),progress=()=>{}}){
 const {counts,rows}=inspectContent(input);
 check(/^[a-f0-9]{40}$/.test(sourceRevision),'Invalid source revision');
 await fs.mkdir(stage);
 await fs.mkdir(path.join(stage,'images'));
 await fs.writeFile(path.join(stage,'content.sql'),input,{flag:'wx'});
 const images=[];
 let total=0;
 for(const row of rows){
  const bytes=Buffer.from(await fetchOriginal(row));
  check(bytes.length===row.bytes&&hash(bytes)===row.sha256,'Original integrity mismatch: '+row.sha256);
  const file='images/'+row.sha256;
  await fs.writeFile(path.join(stage,file),bytes,{flag:'wx'});
  images.push({file,storageKey:row.storage_key,sha256:row.sha256,mime:row.mime,bytes:row.bytes});
  total+=bytes.length;
  if(images.length%25===0||images.length===rows.length)progress(images.length,rows.length);
 }
 const manifest={formatVersion:1,createdAt,sourceRevisionAtBackup:sourceRevision,
  database:{file:'content.sql',sha256:hash(input),gear:counts.d6_gear_records,kb:counts.d6_kb_records,catches:counts.d6_catch_records,mediaRefs:counts.d6_media_refs},
  imageCount:images.length,imageBytes:total,images};
 await fs.writeFile(path.join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(stage,'README.txt'),[
  'Fishing Companion V3 - content recovery backup','',
  'content.sql: exact five active content/media tables and schema.',
  'manifest.json: original-image storage keys, MIME types, sizes and SHA-256 digests.',
  'images/: original image bytes named by digest. No thumbnails or software build.',
  '', 'Recovery: verify ZIP checksum, manifest and each file. Restore SQL only to an approved empty recovery database; restore originals at exact storage keys with recorded MIME and SHA-256 metadata. Verify the restored content and media before activation.',
  'Authentication database, sessions, credentials and legacy publishing tables are excluded.',
  'Software and authentication are recovered separately from the repository and locally provisioned credentials.',''
 ].join('\n'),{flag:'wx'});
 return manifest;
}

async function main(){
 const [sql,stage,sdkRoot,sourceRevision]=process.argv.slice(2);
 check(sql&&stage&&sdkRoot&&sourceRevision,'Usage: node prepare.mjs <sql> <stage> <sdk-root> <source-revision>');
 const input=await fs.readFile(sql);
 const {counts,rows}=inspectContent(input);
 console.log('PASS: restored SQL schema, integrity and foreign keys; '+JSON.stringify(counts));
 check(/^[a-f0-9]{32}$/i.test(process.env.FISH_R2_ACCOUNT_ID??''),'Missing Cloudflare account ID');
 check(process.env.FISH_R2_ACCESS_KEY_ID&&process.env.FISH_R2_SECRET_ACCESS_KEY,'Missing local read-only R2 credentials');
 const require=createRequire(path.join(sdkRoot,'package.json'));
 const {S3Client,GetObjectCommand}=require('@aws-sdk/client-s3');
 const client=new S3Client({region:'auto',endpoint:'https://'+process.env.FISH_R2_ACCOUNT_ID+'.r2.cloudflarestorage.com',forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',
  credentials:{accessKeyId:process.env.FISH_R2_ACCESS_KEY_ID,secretAccessKey:process.env.FISH_R2_SECRET_ACCESS_KEY}});
 try{
  const manifest=await prepareBackup({input,stage,sourceRevision,fetchOriginal:async row=>{
   const response=await client.send(new GetObjectCommand({Bucket:'fishing-v3-owner-media-test',Key:row.storage_key}));
   return response.Body.transformToByteArray();
  },progress:(n,total)=>console.log('Verified '+n+'/'+total+' originals')});
  check(manifest.imageCount===rows.length,'Incomplete image inventory');
  console.log('PASS: '+manifest.imageCount+' originals, '+manifest.imageBytes+' bytes; SQL SHA256 '+manifest.database.sha256);
 }finally{client.destroy();}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)
 main().catch(e=>{console.error('Backup preparation failed: '+e.message);process.exitCode=1;});
