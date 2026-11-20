/**
 * Read-only private Catch D1 and hosted source reconciliation after
 * independently approved migration + Worker deployment.
 * The original 12 row revisions must remain 1 until owner Save testing.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';
const parser=new MarkdownIt({html:false,linkify:false});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const encoded=name=>name.split('/').map(encodeURIComponent).join('/');
function imagesInNotes(text,owner){
 const refs=new Set();
 const visit=tokens=>{for(const token of tokens){
  if(token.type==='image'){
   const ref=resolveMarkdownTarget(token.attrGet('src'),{
    owner,assetBase:'https://example.invalid/fishing/releases/test/',
   });
   check(ref.kind==='local','Invalid Catch Notes picture: '+owner);
   refs.add(ref.local);
  }
  if(token.children)visit(token.children);
 }};
 visit(parser.parse(text,{}));
 return [...refs];
}
async function json(url,fetchImpl){
 const res=await fetchImpl(url,{method:'GET',redirect:'manual',
  cache:'no-store',headers:{Accept:'application/json'}});
 check(res?.status===200&&!res.redirected&&
  /\bapplication\/json\b/i.test(res.headers.get('Content-Type')??''),
  'Private Catch GET unavailable: '+url);
 return res.json();
}
export async function reconcileD6Catches({
 report,origin=ORIGIN,fetchImpl=fetch,
}={}){
 check(origin===ORIGIN,'Only private Catch origin accepted');
 check(report?.format==='d6-direct-catch-import-v1'&&
  report.source?.catchGitBlobSha1==='1522cf990f3ac6422ef17970793ec86604007a5a'&&
  report.records?.length===12&&report.assets?.length===8,
  'Original Catch inventory unrecognized');
 const base=origin+'/fishing/';
 const release=await json(base+'release.json',fetchImpl);
 check(/^[a-f0-9]{32}$/.test(release.id??'')&&
  release.manifest==='releases/'+release.id+'/manifest.json'&&
  release.d6DirectGearSave===true&&
  release.d6DirectKBSave===true&&
  release.d6DirectCatchSave===true,
  'Expected private Gear/KB/Catch release flags absent');
 const response=await fetchImpl(base+encoded(release.manifest),{
  method:'GET',redirect:'manual',cache:'no-store',
 });
 check(response.status===200&&!response.redirected,
  'Hosted Catch release manifest unavailable');
 const bytes=Buffer.from(await response.arrayBuffer());
 check(digest(bytes)===release.manifestSha256,
  'Hosted Catch manifest digest differs');
 const manifest=JSON.parse(bytes.toString('utf8'));
 check(manifest.releaseId===release.id&&
  manifest.base==='/fishing/'&&manifest.d6DirectCatchSave===true,
  'Hosted Catch manifest identity differs');
 const files=new Map(manifest.files.map(x=>[x.path,x]));
 const assets=new Map(report.assets.map(x=>[x.path,x]));
 check(assets.size===8,'Duplicate Catch original photographs');
 const hosted=new Set();
 for(const asset of assets.values()){
  const file=files.get('releases/'+release.id+'/content/'+asset.path);
  if(!file)continue;
  check(file.bytes===asset.bytes&&file.sha256===asset.sha256,
   'Hosted Catch photo differs: '+asset.path);
  hosted.add(asset.path);
 }
 const collection=await json(origin+'/api/v3/content/catches',fetchImpl);
 check(collection.ok===true&&collection.count===12&&
  collection.items?.length===12,'Original Catch migration incomplete');
 const original=new Map(report.records.map(r=>[r.id,r]));
 const ids=collection.items.map(x=>x?.id);
 check(original.size===12&&new Set(ids).size===12&&
  ids.every(id=>original.has(id)),
  'Original Catch IDs differ from frozen catalog');
 const used=new Set();
 let records=0,notes=0,inlineImages=0;
 for(let start=0;start<ids.length;start+=4){
  const batch=await Promise.all(ids.slice(start,start+4).map(id=>
   json(origin+'/api/v3/content/catches/'+id,fetchImpl)));
  for(let i=0;i<batch.length;i++){
   const id=ids[start+i],row=batch[i],source=original.get(id);
   check(row?.ok===true&&row.revision===1&&
    row.record?.id===id&&typeof row.notes==='string',
    'Original Catch row/revision differs: '+id);
   check(row.record.notes===source.notesPath&&
    digest(Buffer.from(JSON.stringify(row.record)))===source.recordSha256,
    'Original Catch JSON/source path differs: '+id);
   check(digest(Buffer.from(row.notes))===source.notesSha256,
    'Original Catch Notes differ: '+id);
   const pics=imagesInNotes(row.notes,source.notesPath);
   check(JSON.stringify(pics)===JSON.stringify(source.inlineImagePaths),
    'Original Catch picture references differ: '+id);
   for(const pic of pics)used.add(pic);
   inlineImages+=pics.length;records++;notes++;
  }
 }
 for(const pic of used){
  check(assets.has(pic)&&hosted.has(pic),
   'Original referenced Catch photo not hosted: '+pic);
 }
 check(used.size===8,'Original Catch photographs not complete');
 return {outcome:'PASS',records,notes,inlineImages,
  sourceImageFiles:assets.size,publishedImageFiles:hosted.size,
  releaseId:release.id,
  catchGitBlobSha1:report.source.catchGitBlobSha1};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--report'||args[2]!=='--out')
  throw Error('Usage: node tools/d6-catch-reconcile.mjs --report <integrity.json> --out <new-result.json>');
 const report=JSON.parse(await readFile(args[1],'utf8'));
 const result=await reconcileD6Catches({report});
 await writeFile(args[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('PRIVATE CATCH RECONCILIATION PASS',JSON.stringify(result));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error('CATCH RECONCILIATION FAIL: '+e.message);process.exitCode=1;});
