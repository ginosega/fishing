/**
 * Read-only hosted D1 Gear reconciliation against the frozen-source report.
 * Run after an independently approved import + private Worker deployment.
 * No credentials, secrets, D1 updates or content writes.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const EXPECTED_ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const assert=(yes,why)=>{if(!yes)throw Error(why);};
const segments=path=>path.split('/').map(encodeURIComponent).join('/');
const markdown=new MarkdownIt({html:false,linkify:false});
function notesImagePaths(text,owner){
 if(!owner||!text)return [];
 const paths=new Set();
 const visit=tokens=>{
  for(const token of tokens){
   if(token.type==='image'){
    const ref=resolveMarkdownTarget(token.attrGet('src'),{
     owner,assetBase:'https://example.invalid/fishing/releases/test/',
    });
    assert(ref.kind==='local'&&/\.(?:jpe?g|png|webp|gif)$/i.test(ref.local),
     'Invalid Gear Notes image reference: '+owner);
    paths.add(ref.local);
   }
   if(token.children)visit(token.children);
  }
 };
 visit(markdown.parse(text,{}));
 return [...paths];
}

async function requestJSON(url,{fetchImpl=fetch}={}){
 const response=await fetchImpl(url,{
  method:'GET',headers:{Accept:'application/json'},
  redirect:'manual',cache:'no-store',
 });
 assert(response?.status===200&&!response.redirected,
  'Hosted GET failed: '+url+' (HTTP '+response?.status+')');
 assert(/\bapplication\/json\b/i.test(
  response.headers.get('Content-Type')||''),
  'Hosted response not JSON: '+url);
 return response.json();
}
export async function reconcileD6Gear({
 report,origin=EXPECTED_ORIGIN,fetchImpl=fetch,
}={}){
 assert(origin===EXPECTED_ORIGIN,'Only the approved private origin is in scope');
 assert(report?.format==='d6-direct-gear-import-v1'&&
  report?.source?.gearGitBlobSha1===
   '741ba8f19c06834eb6e92fea84404fdb2ac58f88',
  'Unrecognized Gear migration inventory');
 assert(report.records?.length===100&&report.assets?.length===112,
  'Source inventory incomplete');
 const root=origin+'/fishing/';
 const pointer=await requestJSON(root+'release.json',{fetchImpl});
 assert(/^[a-f0-9]{32}$/.test(pointer.id||'')&&
  pointer.manifest==='releases/'+pointer.id+'/manifest.json'&&
  pointer.d6DirectGearSave===true,
  'Hosted release is not the verified direct Gear build');
 const manifestURL=root+segments(pointer.manifest);
 const manifestResponse=await fetchImpl(manifestURL,{
  method:'GET',redirect:'manual',cache:'no-store',
 });
 assert(manifestResponse.status===200&&!manifestResponse.redirected,
  'Hosted manifest unavailable');
 const bytes=Buffer.from(await manifestResponse.arrayBuffer());
 assert(sha(bytes)===pointer.manifestSha256,
  'Hosted release manifest digest mismatch');
 const manifest=JSON.parse(bytes.toString('utf8'));
 assert(manifest.releaseId===pointer.id&&
  manifest.d6DirectGearSave===true&&
  manifest.base==='/fishing/',
  'Hosted manifest identity mismatch');
 const files=new Map(manifest.files.map(x=>[x.path,x]));
 const sourceAssets=new Map(report.assets.map(x=>[x.path,x]));
 assert(sourceAssets.size===112,'Duplicate source Gear image files');
 // The V3 release intentionally packages referenced files only. The frozen
 // Git inventory also includes orphaned images that V2 never published.
 // Verify every published Gear image byte-for-byte, then require that EVERY
 // record picture and every image linked by D1 Notes is actually published.
 const publishedImages=new Set(),requiredImages=new Set();
 for(const asset of report.assets){
  const hosted=files.get('releases/'+pointer.id+'/content/'+asset.path);
  if(!hosted)continue;
  assert(hosted.sha256===asset.sha256&&hosted.bytes===asset.bytes,
   'Gear media changed: '+asset.path);
  publishedImages.add(asset.path);
 }
 const catalog=await requestJSON(origin+'/api/v3/content/gear',{fetchImpl});
 assert(catalog.ok===true&&catalog.count===100&&
  Array.isArray(catalog.items)&&catalog.items.length===100,
  'D1 Gear collection is incomplete');
 const sourceRows=new Map(report.records.map(row=>[row.id,row]));
 assert(sourceRows.size===100,'Duplicate source IDs');
 const ids=catalog.items.map(row=>row?.id);
 assert(new Set(ids).size===100&&ids.every(id=>sourceRows.has(id)),
  'D1 Gear IDs differ from frozen source');
 let verified=0,notes=0,images=0,pilotRevision=null;
 // A few requests at a time avoid unnecessary server/connection pressure.
 for(let offset=0;offset<ids.length;offset+=4){
  const results=await Promise.all(ids.slice(offset,offset+4)
   .map(id=>requestJSON(origin+'/api/v3/content/gear/'+id,{fetchImpl})));
  for(let i=0;i<results.length;i++){
   const id=ids[offset+i],row=results[i],source=sourceRows.get(id);
   assert(row?.ok===true&&row.record?.id===id&&
    Number.isSafeInteger(row.revision)&&row.revision>=1&&
    typeof row.notes==='string','Invalid D1 Gear row: '+id);
   assert(row.record.picture?.src===source.picturePath,
    'Gear image reference differs: '+id);
   requiredImages.add(source.picturePath);
   images++;
   for(const imagePath of notesImagePaths(row.notes,source.notesPath))
    requiredImages.add(imagePath);
   if(source.notesPath){
    assert(row.record.notes===source.notesPath,'Notes path differs: '+id);
    notes++;
   }
   if(id===report.pilot.id){
    // A previously owner-edited row must never be replaced by the import.
    assert(row.revision>=3&&row.record.model==='Tatula XT',
     'Pilot revision or restored Model was overwritten');
    pilotRevision=row.revision;
   }else{
    assert(row.revision===1,'Imported Gear revision differs: '+id);
    assert(sha(Buffer.from(JSON.stringify(row.record)))===source.recordSha256,
     'Gear JSON differs from frozen source: '+id);
    assert(sha(Buffer.from(row.notes))===
      (source.notesSha256||sha(Buffer.alloc(0))),
     'Gear Notes differ from frozen source: '+id);
   }
   verified++;
  }
 }
 for(const imagePath of requiredImages){
  assert(sourceAssets.has(imagePath),
   'Referenced Gear image absent from frozen source: '+imagePath);
  assert(publishedImages.has(imagePath),
   'Referenced Gear image missing from hosted release: '+imagePath);
 }
 const unreferencedSourceImages=report.assets
  .filter(asset=>!publishedImages.has(asset.path)).map(asset=>asset.path);
 return {
  outcome:'PASS',records:verified,notes,pictures:images,
  sourceImageFiles:report.assets.length,
  publishedImageFiles:publishedImages.size,
  unreferencedSourceImages,
  notesImageFiles:requiredImages.size,
  pilotRevision,releaseId:pointer.id,gearGitBlobSha1:report.source.gearGitBlobSha1,
 };
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=='--report'||args[2]!=='--out')
  throw Error('Usage: node tools/d6-gear-reconcile.mjs --report <integrity.json> --out <result.json>');
 const report=JSON.parse(await readFile(args[1],'utf8'));
 const result=await reconcileD6Gear({report});
 await writeFile(args[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log('PRIVATE GEAR RECONCILIATION PASS',JSON.stringify(result));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error('RECONCILIATION FAIL: '+error.message);process.exitCode=1;});
