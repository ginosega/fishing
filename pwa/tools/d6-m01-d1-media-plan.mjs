/**
 * FISH-TODO-118 M01: SOURCE ONLY proposed D1 metadata migration plan.
 *
 * node tools/d6-m01-d1-media-plan.mjs --check --report <inventory.json>
 * node tools/d6-m01-d1-media-plan.mjs --out <NEW-file.json> --report <inventory.json>
 *
 * Never connects to Cloudflare or modifies any table. The plan provides
 * inline --command SQL for a separately approved, owner-executed D1 write.
 * It does NOT replace current Gear/KB/Catch JSON, Notes or revisions.
 */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareM01OriginalMediaInventory} from './d6-historic-media-inventory.mjs';
import {D6_MEDIA_SCHEMA_SQL} from './d6-media-schema.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DB='fishing-v3-wp3-operations-test';
const MIME={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif'};
const EDITED={gear:{id:'daiwa-tatula-xt-rod',revision:5},
 kb:{id:'technique-chatterbait-bladed-jig',revision:4},
 catches:{id:'catch-2026-09-24-banks-lake-largemouth-01',revision:3}};
const SPECS={gear:{table:'d6_gear_records',markdown:'notes_text'},
 kb:{table:'d6_kb_records',markdown:'content_text'},
 catches:{table:'d6_catch_records',markdown:'notes_text'}};
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const requireOK=(v,message)=>{if(!v)throw Error('M01_D1_PLAN_STOP: '+message);};
const typeOf=p=>MIME[p.split('.').at(-1).toLowerCase()];
const group=(a,n)=>Array.from({length:Math.ceil(a.length/n)},
 (_,i)=>a.slice(i*n,(i+1)*n));
async function verifiedReport(reportFile){
 const original=await prepareM01OriginalMediaInventory();
 const requested=JSON.parse(await readFile(path.resolve(reportFile),'utf8'));
 requireOK(JSON.stringify(requested)===JSON.stringify(original),
  'local inventory differs from original pinned photo source');
 return original;
}
function matchingSQL(row){
 const spec=SPECS[row.domain],checks=new Set();
 for(const role of row.roles){
  if(role==='cover')checks.add(
   "json_extract(record_json,'$.picture.src')="+quote(row.logicalPath));
  else if(role==='knot-step')checks.add(
   "EXISTS(SELECT 1 FROM json_each(record_json,'$.pictureSequence')"+
   ' WHERE value='+quote(row.logicalPath)+')');
  else if(['notes','article'].includes(role)){
   // The fixed original revision-1 source is independently byte-pinned.
   // The only edited Notes owner was manually inspected by the owner;
   // additionally pin that file's Markdown link at current revision 3.
   const edited=EDITED[row.domain];
   const markdownCheck=edited&&edited.id===row.recordId?
    ' AND instr('+spec.markdown+','+
      quote(row.logicalPath.split('/').at(-1))+')>0':'';
   checks.add("json_extract(record_json,'$."+
    (row.domain==='kb'?'content':'notes')+"')="+
    quote(row.document??'')+markdownCheck);
  }
 }
 requireOK(checks.size,'image has no supported original record role');
 const expected=EDITED[row.domain];
 const revision=expected?.id===row.recordId?expected.revision:1;
 return 'INSERT INTO d6_media_refs(logical_path,domain,record_id,sha256,created_at,historical) '+
  'SELECT '+[
   quote(row.logicalPath),quote(row.domain),quote(row.recordId),
   quote(row.sha256),"CAST(strftime('%s','now') AS INTEGER)",'1',
  ].join(',')+' FROM '+spec.table+' WHERE id='+quote(row.recordId)+
  ' AND revision='+revision+' AND ('+[...checks].join(' OR ')+');';
}
export async function prepareM01D1MediaPlan({reportFile}={}){
 requireOK(typeof reportFile==='string','missing verified local inventory');
 const inventory=await verifiedReport(reportFile);
 const objects=new Map(),refs=new Map();
 for(const file of inventory.assets){
  const mime=typeOf(file.path);
  requireOK(Boolean(mime),'unsupported original photo mime');
  const known=objects.get(file.sha256);
  if(known)requireOK(known.bytes===file.bytes&&known.mime===mime,
   'two different media payloads share an object SHA');
  else objects.set(file.sha256,{sha256:file.sha256,
   bytes:file.bytes,mime,storageKey:'staged/v1/sha256/'+file.sha256});
  for(const source of file.references){
   requireOK(Boolean(SPECS[source.domain])&&source.id,
    'unexpected historical media owner');
   const key=JSON.stringify([file.path,source.domain,source.id]);
   if(!refs.has(key))refs.set(key,{
    logicalPath:file.path,domain:source.domain,recordId:source.id,
    sha256:file.sha256,roles:[],document:source.document??null,
   });
   const found=refs.get(key);
   requireOK(found.sha256===file.sha256,'media reference SHA conflict');
   if(!found.roles.includes(source.kind))found.roles.push(source.kind);
   if(source.document){
    requireOK(!found.document||found.document===source.document,
     'one owner image has conflicting Markdown owner paths');
    found.document=source.document;
   }
  }
 }
 requireOK(objects.size===272&&inventory.assets.length===274&&
  inventory.counts.referencedFiles===265&&
  inventory.counts.unreferencedFiles===9,'media inventory changed');
 const uniqueRefs=[...refs.values()].sort((a,b)=>
  JSON.stringify([a.logicalPath,a.domain,a.recordId]).localeCompare(
   JSON.stringify([b.logicalPath,b.domain,b.recordId]),'en'));
 requireOK(uniqueRefs.length>=265&&uniqueRefs.length<=284,
  'unexpected duplicate owner/role identities');
 const shared=[...new Set(uniqueRefs.map(x=>x.logicalPath))]
  .filter(p=>uniqueRefs.filter(x=>x.logicalPath===p).length>1);
 const obj=[...objects.values()].sort((a,b)=>a.sha256.localeCompare(b.sha256,'en'));
 const objectsSQL=group(obj,20).map(batch=>
  'INSERT INTO d6_media_objects(sha256,storage_key,mime,bytes,created_at) VALUES '+
  batch.map(x=>'('+[quote(x.sha256),quote(x.storageKey),
   quote(x.mime),x.bytes,"CAST(strftime('%s','now') AS INTEGER)"].join(',')+
   ')').join(',')+';');
 const refsSQL=group(uniqueRefs.map(matchingSQL),12).map(
  statements=>statements.join('\n'));
 const expected={
  originalPaths:274,referencedPaths:265,unreferencedPaths:9,
  storedObjects:272,ownerAssociations:uniqueRefs.length,
  sharedLogicalPaths:shared.length,
 };
 const preflight="SELECT "+[
  "((SELECT COUNT(*) FROM d6_gear_records)=100)",
  "((SELECT COUNT(*) FROM d6_kb_records)=60)",
  "((SELECT COUNT(*) FROM d6_catch_records)=12)",
  "(SELECT COUNT(*) FROM d6_gear_records WHERE revision>1)=1",
  "(SELECT COUNT(*) FROM d6_kb_records WHERE revision>1)=1",
  "(SELECT COUNT(*) FROM d6_catch_records WHERE revision>1)=1",
  ...Object.entries(EDITED).map(([domain,x])=>
   "(SELECT COUNT(*) FROM "+SPECS[domain].table+
    " WHERE id="+quote(x.id)+" AND revision="+x.revision+")=1"),
  "(SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN"+
   " ('d6_media_objects','d6_media_refs'))=0",
 ].join(' AND ')+" AS accepted;";
 const postflight="SELECT "+
  "(SELECT COUNT(*) FROM d6_media_objects) AS objects, "+
  "(SELECT COUNT(*) FROM d6_media_refs) AS associations, "+
  "(SELECT COUNT(DISTINCT logical_path) FROM d6_media_refs) AS paths;";
 return Object.freeze({
  format:'fish118-m01-d1-media-metadata-source-plan-v1',
  database:DB,sourceRevision:inventory.sourceRevision,expected,
  approvalRequired:true,
  preflightSQL:preflight,
  schemaSQL:D6_MEDIA_SCHEMA_SQL,
  objectBatches:objectsSQL,referenceBatches:refsSQL,
  postflightSQL:postflight,
  sharedPaths:shared,
  note:'Proposal ONLY. Review live D1 and backup before authorized writes.'});
}
async function main(){
 const args=process.argv.slice(2),mode=args[0];
 requireOK((mode==='--check'&&args.length===3&&args[1]==='--report'&&args[2])||
  (mode==='--out'&&args.length===4&&args[2]==='--report'&&args[1]&&args[3]),
  'usage: --check --report <inventory.json> OR --out <NEW-plan.json> --report <inventory.json>');
 const plan=await prepareM01D1MediaPlan({reportFile:mode==='--check'?args[2]:args[3]});
 console.log('M01 D1 SOURCE PLAN VERIFIED: '+JSON.stringify(plan.expected));
 console.log('Batches: '+plan.objectBatches.length+' object; '+
  plan.referenceBatches.length+' record-reference. No provider calls.');
 if(mode==='--out'){
  await writeFile(path.resolve(args[1]),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
  console.log('Wrote local D1 metadata plan only: '+args[1]);
 }else console.log('READ-ONLY PASS: no D1 schema, metadata or record writes.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e.message);process.exitCode=1;});
