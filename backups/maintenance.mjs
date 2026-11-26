// Maintenance-only tooling. Never imported by the application or used to delete data.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {inspectContent,prepareBackup} from './prepare.mjs';
// Select the same normalized taxonomy as the production Worker before loading its graph validator.
// This maintenance process is isolated from the app and archived source fixtures.
globalThis.__FISHING_D6_STANDALONE_V3__=true;
const {createD6CurrentContentSnapshot,D6_CONTENT_READER_VERSION}=
 await import('../pwa/server/d6-current-content-snapshot.mjs');
if(D6_CONTENT_READER_VERSION!==2)throw Error('Normalized production graph validator required');

const check=(ok,why)=>{if(!ok)throw Error(why);};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const bucket='fishing-v3-owner-media-test';
const refKey=(domain,id,logicalPath)=>JSON.stringify([domain,id,logicalPath]);

// Reuse the production validator against the restored native export. The adapter
// supplies only its read statements; no live D1 reads or new SQL reconstruction.
export async function inspectGraph(input){
 const {counts,rows}=inspectContent(input);
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(new TextDecoder('utf-8',{fatal:true}).decode(input));
  db.exec('PRAGMA query_only=ON;');
  const graph=await createD6CurrentContentSnapshot({CONTENT_DB:{
   prepare:sql=>sql,
   batch:async sqls=>sqls.map(sql=>({success:true,results:db.prepare(sql).all()}))
  }});
  const refs=db.prepare('SELECT domain,record_id,logical_path,sha256,historical FROM d6_media_refs').all();
  return {counts,rows,refs,graph};
 }finally{db.close();}
}

export function reconcileInventory({rows,refs,graph},physical){
 const byKey=new Map(),registered=new Map(),linked=new Set(),usedRefs=new Set();
 for(const row of rows){
  check(!registered.has(row.storage_key),'Duplicate registered key');
  registered.set(row.storage_key,row);
 }
 for(const item of physical){
  check(typeof item.key==='string'&&item.key.length>0&&Number.isSafeInteger(item.bytes)&&item.bytes>=0&&!byKey.has(item.key),'Invalid or duplicate R2 inventory');
  byKey.set(item.key,item);
 }
 for(const image of graph.images){
  linked.add(image.sha256);
  for(const owner of image.owners)usedRefs.add(refKey(owner.domain,owner.recordId,image.logicalPath));
 }
 const registeredUnlinked=rows.filter(row=>!linked.has(row.sha256));
 const unregistered=physical.filter(item=>!registered.has(item.key));
 const unlinkedRefs=refs.filter(r=>!usedRefs.has(refKey(r.domain,r.record_id,r.logical_path)));
 const missing=rows.filter(row=>!byKey.has(row.storage_key));
 const wrongSize=rows.filter(row=>byKey.has(row.storage_key)&&byKey.get(row.storage_key).bytes!==row.bytes);
 // An R2-only object may be staged or uncertain. A candidate is never a deletion authorization.
 return {registeredUnlinked,unregistered,unlinkedRefs,missing,wrongSize,
  summary:{
   registeredOriginals:rows.length,physicalObjects:physical.length,
   linkedOriginals:linked.size,linkedPaths:graph.images.length,
   registeredUnlinked:registeredUnlinked.length,unregistered:unregistered.length,
   unlinkedAssociations:unlinkedRefs.length,
   candidateBytes:[...registeredUnlinked,...unregistered].reduce((n,r)=>n+r.bytes,0),
   missing:missing.length,wrongSize:wrongSize.length
  }};
}

export async function auditAndPrepare({input,physical,fetchOriginal,stage,sourceRevision,mode,report}){
 check(['audit','complete'].includes(mode),'Invalid maintenance mode');
 const graphData=await inspectGraph(input);
 const audit=reconcileInventory(graphData,physical);
 const summary={...audit.summary,gear:graphData.counts.d6_gear_records,kb:graphData.counts.d6_kb_records,
  catches:graphData.counts.d6_catch_records,verifiedOriginals:0,corruptOrUnreadable:0,
  audit:'INCOMPLETE',backup:mode==='audit'?'NOT REQUESTED':'NOT VERIFIED'};
 await report(summary);
 // Verify registered bytes even when publication is withheld or audit-only.
 const publicationAllowed=audit.registeredUnlinked.length===0;
 const verify=async row=>{
  try{
   const bytes=Buffer.from(await fetchOriginal(row));
   check(bytes.length===row.bytes&&hash(bytes)===row.sha256,'Original mismatch');
   summary.verifiedOriginals++;
   return bytes;
  }catch{
   summary.corruptOrUnreadable++;
   summary.audit='INTEGRITY FAILURE';
   await report(summary);
   throw Error('Registered original verification failed');
  }
 };
 if(audit.missing.length||audit.wrongSize.length){
  summary.audit='INTEGRITY FAILURE';
  await report(summary);
  throw Error('R2 inventory disagrees with registered originals');
 }
 if(mode==='complete'&&publicationAllowed){
  await prepareBackup({input,stage,fetchOriginal:verify,sourceRevision});
 }else{
  for(const row of graphData.rows)await verify(row);
 }
 summary.audit=summary.registeredUnlinked||summary.unregistered||summary.unlinkedAssociations?'REVIEW NEEDED':'PASS';
 if(mode==='complete')summary.backup=publicationAllowed?'PREPARED':'WITHHELD — non-public registered media';
 await report(summary);
 if(mode==='complete'&&!publicationAllowed)throw Error('Full public backup withheld; owner review required');
 return summary;
}

async function main(){
 const [sql,stage,sdkRoot,sourceRevision,mode,reportPath]=process.argv.slice(2);
 check(sql&&stage&&sdkRoot&&sourceRevision&&reportPath,'Invalid maintenance arguments');
 check(/^[a-f0-9]{32}$/i.test(process.env.FISH_R2_ACCOUNT_ID??''),'Missing account ID');
 check(process.env.FISH_R2_ACCESS_KEY_ID&&process.env.FISH_R2_SECRET_ACCESS_KEY,'Missing read-only R2 credentials');
 const require=createRequire(path.join(sdkRoot,'package.json'));
 const {S3Client,GetObjectCommand,ListObjectsV2Command}=require('@aws-sdk/client-s3');
 const client=new S3Client({region:'auto',endpoint:'https://'+process.env.FISH_R2_ACCOUNT_ID+'.r2.cloudflarestorage.com',forcePathStyle:true,
  requestChecksumCalculation:'WHEN_REQUIRED',credentials:{accessKeyId:process.env.FISH_R2_ACCESS_KEY_ID,secretAccessKey:process.env.FISH_R2_SECRET_ACCESS_KEY}});
 const report=summary=>fs.writeFile(reportPath,JSON.stringify(summary,null,2)+'\n');
 try{
  const physical=[];let token;const seen=new Set();
  do{
   const result=await client.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));
   for(const object of result.Contents??[])physical.push({key:object.Key,bytes:object.Size});
   token=result.IsTruncated?result.NextContinuationToken:undefined;
   check(!result.IsTruncated||(token&&!seen.has(token)),'Incomplete R2 listing');
   if(token)seen.add(token);
  }while(token);
  await auditAndPrepare({input:await fs.readFile(sql),physical,stage,sourceRevision,mode,report,
   fetchOriginal:async row=>{
    const response=await client.send(new GetObjectCommand({Bucket:bucket,Key:row.storage_key}));
    return response.Body.transformToByteArray();
   }});
 }finally{client.destroy();}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)
 main().catch(()=>{console.error('Maintenance audit/preparation failed; inspect safe report and reconcile manually. No raw content or credentials logged.');process.exitCode=1;});
