/** Read-only full KB source/D1/release reconciliation after owner-approved import.
 * No source, credential, Cloudflare, or GitHub writes.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';
const md=new MarkdownIt({html:false,linkify:false});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=(yes,message)=>{if(!yes)throw Error(message);};
const urlPath=name=>name.split('/').map(encodeURIComponent).join('/');
function localMarkdownImagePaths(body,owner){
 const images=new Set();
 const walk=tokens=>{for(const token of tokens){
  if(token.type==='image'){
   const ref=resolveMarkdownTarget(token.attrGet('src'),{
    owner,assetBase:'https://example.invalid/fishing/releases/test/',
   });
   if(ref.kind==='local')images.add(ref.local);
   else check(ref.kind==='external',
    'Invalid KB Markdown image reference: '+owner);
  }
  if(token.children)walk(token.children);
 }};
 walk(md.parse(body,{}));
 return [...images];
}
async function json(url,fetchImpl){
 const response=await fetchImpl(url,{
  method:'GET',redirect:'manual',cache:'no-store',
  headers:{Accept:'application/json'},
 });
 check(response?.status===200&&!response.redirected,
  'Hosted GET unavailable: '+url+' HTTP '+response?.status);
 check(/\bapplication\/json\b/i.test(response.headers.get('Content-Type')??''),
  'Expected JSON from hosted KB endpoint: '+url);
 return response.json();
}
export async function reconcileD6KB({report,origin=ORIGIN,fetchImpl=fetch}={}){
 check(origin===ORIGIN,'Only the approved private origin may be verified');
 check(report?.format==='d6-direct-kb-import-v1'&&
  report.source?.kbGitBlobSha1==='39217633803ad3969d710fa8d770197c0e83b2a3'&&
  report.records?.length===60&&report.assets?.length===154&&
  report.externalAssets?.length===8,'Frozen KB report unrecognized');
 const root=origin+'/fishing/',pointer=await json(root+'release.json',fetchImpl);
 check(/^[a-f0-9]{32}$/.test(pointer.id??'')&&
  pointer.manifest==='releases/'+pointer.id+'/manifest.json'&&
  pointer.d6DirectGearSave===true&&pointer.d6DirectKBSave===true,
  'Hosted KB direct Save release identity is not enabled');
 const manifestResponse=await fetchImpl(root+urlPath(pointer.manifest),{
  method:'GET',redirect:'manual',cache:'no-store',
 });
 check(manifestResponse.status===200&&!manifestResponse.redirected,
  'Hosted release manifest unavailable');
 const bytes=Buffer.from(await manifestResponse.arrayBuffer());
 check(digest(bytes)===pointer.manifestSha256,
  'Hosted manifest digest mismatch');
 const manifest=JSON.parse(bytes.toString('utf8'));
 check(manifest.releaseId===pointer.id&&manifest.d6DirectKBSave===true&&
  manifest.base==='/fishing/','Hosted KB manifest identity mismatch');
 const files=new Map(manifest.files.map(item=>[item.path,item]));
 const assets=new Map([...report.assets,...report.externalAssets]
  .map(item=>[item.path,item]));
 check(assets.size===162,'Duplicate frozen KB/Gear image paths');
 const hostedImages=new Set(),neededImages=new Set();
 for(const entry of assets.values()){
  const hosted=files.get('releases/'+pointer.id+'/content/'+entry.path);
  if(!hosted)continue;
  check(hosted.sha256===entry.sha256&&hosted.bytes===entry.bytes,
   'Published KB/Gear image differs: '+entry.path);
  hostedImages.add(entry.path);
 }
 const collection=await json(origin+'/api/v3/content/kb',fetchImpl);
 check(collection.ok===true&&collection.count===60&&
  collection.items?.length===60,'D1 KB collection incomplete');
 const source=new Map(report.records.map(row=>[row.id,row]));
 const ids=collection.items.map(item=>item?.id);
 check(source.size===60&&new Set(ids).size===60&&
  ids.every(id=>source.has(id)),'D1 KB IDs differ from frozen original');
 let records=0,markdown=0,pictures=0,knotFrames=0;
 for(let off=0;off<ids.length;off+=4){
  const batch=await Promise.all(ids.slice(off,off+4).map(id=>
   json(origin+'/api/v3/content/kb/'+id,fetchImpl)));
  for(let i=0;i<batch.length;i++){
   const id=ids[off+i],row=batch[i],original=source.get(id);
   check(row?.ok===true&&row.record?.id===id&&row.revision===1&&
    typeof row.markdown==='string','Unexpected D1 KB row: '+id);
   check(row.record.content===original.contentPath&&
    digest(Buffer.from(JSON.stringify(row.record)))===original.recordSha256,
    'KB record JSON changed or source path lost: '+id);
   check(digest(Buffer.from(row.markdown))===original.markdownSha256,
    'KB Markdown differs from original: '+id);
   markdown++;records++;
   if(original.picturePath){
    check(row.record.picture?.src===original.picturePath,
     'KB picture reference changed: '+id);
    neededImages.add(original.picturePath);pictures++;
   }else check(!row.record.picture,'Unexpected KB picture: '+id);
   check(JSON.stringify(row.record.pictureSequence??[])===
    JSON.stringify(original.sequencePaths),'Knot frame sequence changed: '+id);
   for(const frame of original.sequencePaths){
    neededImages.add(frame);knotFrames++;
   }
   for(const image of localMarkdownImagePaths(row.markdown,original.contentPath))
    neededImages.add(image);
  }
 }
 for(const image of neededImages){
  check(assets.has(image),'Linked KB image not inventoried: '+image);
  check(hostedImages.has(image),'Linked KB image not published: '+image);
 }
 const unused=[...assets.keys()].filter(name=>!hostedImages.has(name));
 return {outcome:'PASS',records,markdown,pictures,knotFrames,
  sourceKBImageFiles:report.assets.length,
  externalGearImageFiles:report.externalAssets.length,
  publishedImageFiles:hostedImages.size,unusedSourceImages:unused,
  releaseId:pointer.id,kbGitBlobSha1:report.source.kbGitBlobSha1};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--report'||args[2]!=='--out')
  throw Error('Usage: node tools/d6-kb-reconcile.mjs --report <integrity.json> --out <new-report.json>');
 const report=JSON.parse(await readFile(args[1],'utf8'));
 const result=await reconcileD6KB({report});
 await writeFile(args[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('PRIVATE KB RECONCILIATION PASS',JSON.stringify(result));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error('KB RECONCILIATION FAIL: '+e.message);process.exitCode=1;});
