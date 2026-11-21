/**
 * FISH-TODO-118 M01: READ-ONLY historical image inventory.
 *
 * Reads original canonical Gear/KB/Catches from the checked-out Git source;
 * verifies all image paths, sizes and Git blob object IDs against an
 * independent ledger frozen at the owner-accepted private release source;
 * computes SHA-256 over actual bytes via the existing validated migration
 * readers; resolves cover, Knot sequence and Markdown image ownership.
 *
 * Does NOT access Cloudflare, D1, R2, network credentials or mutate source.
 * --out writes a fresh local report only, never a migration or upload.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import MarkdownIt from 'markdown-it';
import {resolveMarkdownTarget} from '../src/markdown.mjs';
import {safePath} from '../src/shared.mjs';
import {prepareD6GearMigration} from './d6-gear-migration.mjs';
import {prepareD6KBMigration} from './d6-kb-migration.mjs';
import {prepareD6CatchMigration} from './d6-catch-migration.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PINNED='57f35b701b10cda1eb7d567b6f2a250c7b27ef38';
const PHOTO=/\.(?:jpe?g|png|webp|gif|svg)$/i;
const DIGEST=/^[a-f0-9]{64}$/;
const BLOB=/^[a-f0-9]{40}$/;
const md=new MarkdownIt({html:false,linkify:false});

function requireOK(condition,message){
 if(!condition)throw Error('M01_INVENTORY_UNVERIFIED: '+message);
}
function gitImageTree(root){
 const output=execFileSync('git',['ls-tree','-r','-l','-z','HEAD','--',
  'pwa/Gear','pwa/KB','pwa/Catches'],{
  cwd:path.resolve(root,'..'),windowsHide:true,maxBuffer:8*1024*1024,
 });
 const result=new Map();
 for(const line of output.toString('utf8').split('\0').filter(Boolean)){
  const match=/^100644 blob ([a-f0-9]{40})\s+(\d+)\tpwa\/((?:Gear|KB|Catches)\/.+)$/.exec(line);
  requireOK(match,'noncanonical Git source entry');
  const [,gitBlobSha1,rawBytes,name]=match;
  if(!PHOTO.test(name))continue;
  safePath(name);
  requireOK(!result.has(name),'duplicate tracked photo '+name);
  result.set(name,{path:name,bytes:Number(rawBytes),gitBlobSha1});
 }
 return result;
}
async function verifiedProof(root){
 const text=await readFile(path.join(root,'migration',
  'd6-historic-media-source-blobs.json'),'utf8');
 const proof=JSON.parse(text);
 requireOK(proof.format==='fish118-m01-immutable-source-blob-ledger-v1'&&
  proof.sourceRevision===PINNED&&proof.expectedFiles===274&&
  proof.expectedBytes===166411118&&Array.isArray(proof.assets),
  'wrong independent accepted-release photo ledger');
 const original=new Map();
 for(const item of proof.assets){
  requireOK(item&&typeof item.path==='string'&&
   safePath(item.path)===item.path&&PHOTO.test(item.path)&&
   Number.isSafeInteger(item.bytes)&&item.bytes>0&&BLOB.test(item.gitBlobSha1)&&
   !original.has(item.path),'invalid pinned photo ledger row');
  original.set(item.path,item);
 }
 requireOK(original.size===proof.expectedFiles&&
  [...original.values()].reduce((n,x)=>n+x.bytes,0)===proof.expectedBytes,
  'pinned image ledger total changed');
 const live=gitImageTree(root);
 requireOK(live.size===original.size,
  'current Git image inventory differs from accepted original');
 for(const [name,row] of original){
  const current=live.get(name);
  requireOK(current?.gitBlobSha1===row.gitBlobSha1&&
   current.bytes===row.bytes,'image bytes/path differ from pinned source: '+name);
 }
 return proof;
}
function markdownImages(markdown,owner){
 const found=[];
 function visit(tokens){
  for(const token of tokens){
   if(token.children)visit(token.children);
   if(token.type!=='image')continue;
   const src=token.attrGet('src');
   let resolved;
   try{resolved=resolveMarkdownTarget(src,{
    owner,assetBase:'https://inventory.invalid/fishing/releases/pinned/',
   });}catch{
    throw Error('M01_INVENTORY_UNVERIFIED: unsafe Markdown image '+
     owner+' '+src);
   }
   requireOK(resolved.kind==='local'&&PHOTO.test(resolved.local)&&
    !/[?#]/.test(src),
    'nonlocal or query-modified Markdown content picture '+owner+' '+src);
   found.push(resolved.local);
  }
 }
 visit(md.parse(markdown,{}));
 return [...new Set(found)];
}
const assetSort=(a,b)=>a.path.localeCompare(b.path,'en');
const refSort=(a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en');
export async function prepareM01OriginalMediaInventory({root=ROOT}={}){
 root=path.resolve(root);
 const proof=await verifiedProof(root);
 // Proven one-time import readers perform independent Ajv/catalog,
 // Markdown, committed-Git-byte and actual SHA-256 verification.
 // They return local reports only and do not execute proposed SQL.
 const [{report:gear},{report:kb},{report:catches}]=await Promise.all([
  prepareD6GearMigration({root}),
  prepareD6KBMigration({root}),
  prepareD6CatchMigration({root}),
 ]);
 const sources={gear,kb,catches};
 requireOK(gear.counts.records===100&&kb.counts.records===60&&
  catches.counts.records===12,
  'original three-domain catalog counts changed');
 const provenance=[
  ['gear',gear.source.gearGitBlobSha1,'741ba8f19c06834eb6e92fea84404fdb2ac58f88'],
  ['kb',kb.source.kbGitBlobSha1,'39217633803ad3969d710fa8d770197c0e83b2a3'],
  ['catches',catches.source.catchGitBlobSha1,'1522cf990f3ac6422ef17970793ec86604007a5a'],
 ];
 for(const [domain,actual,expected] of provenance)
  requireOK(actual===expected,'catalog source pin changed: '+domain);
 const all=[...gear.assets,...kb.assets,...catches.assets];
 const ledger=new Map(proof.assets.map(item=>[item.path,item]));
 requireOK(all.length===ledger.size,'migration readers missed an original image');
 const seen=new Set(),refs=new Map();
 for(const item of all){
  requireOK(!seen.has(item.path),'duplicate media path '+item.path);
  seen.add(item.path);
  const pin=ledger.get(item.path);
  requireOK(pin?.bytes===item.bytes&&DIGEST.test(item.sha256),
   'hashed media object missing/size mismatch: '+item.path);
  refs.set(item.path,[]);
 }
 requireOK([...ledger.keys()].every(x=>seen.has(x)),
  'source image omitted from SHA-256 inventory');
 function add(pathValue,domain,id,kind,document){
  if(!pathValue)return;
  const logical=safePath(pathValue);
  requireOK(PHOTO.test(logical),'non-image reference '+domain+'/'+id);
  const uses=refs.get(logical);
  requireOK(Boolean(uses),'missing referenced image '+domain+'/'+id+' '+logical);
  const ref={domain,id,kind,...(document?{document}: {})};
  if(!uses.some(r=>JSON.stringify(r)===JSON.stringify(ref)))uses.push(ref);
 }
 for(const row of gear.records){
  add(row.picturePath,'gear',row.id,'cover');
  if(row.notesPath){
   const owner=safePath(row.notesPath);
   const markdown=await readFile(path.join(root,...owner.split('/')),'utf8');
   for(const asset of markdownImages(markdown,owner))
    add(asset,'gear',row.id,'notes',owner);
  }
 }
 for(const row of kb.records){
  add(row.picturePath,'kb',row.id,'cover');
  for(const image of row.sequencePaths)
   add(image,'kb',row.id,'knot-step');
  for(const image of row.inlineImagePaths)
   add(image,'kb',row.id,'article',row.contentPath);
 }
 for(const row of catches.records)
  for(const image of row.inlineImagePaths)
   add(image,'catches',row.id,'notes',row.notesPath);
 const assets=all.map(x=>({
  path:x.path,bytes:x.bytes,sha256:x.sha256,
  gitBlobSha1:ledger.get(x.path).gitBlobSha1,
  references:refs.get(x.path).sort(refSort),
 })).sort(assetSort);
 const missingReferences=[];
 const orphans=assets.filter(x=>x.references.length===0).map(x=>x.path);
 const crossDomain=assets.filter(x=>x.references.some(r=>
  r.domain!==x.path.split('/')[0].toLowerCase()));
 const counts={
  files:assets.length,bytes:assets.reduce((a,x)=>a+x.bytes,0),
  domains:Object.fromEntries(['Gear','KB','Catches'].map(prefix=>[
   prefix.toLowerCase(),{
    files:assets.filter(x=>x.path.startsWith(prefix+'/')).length,
    bytes:assets.filter(x=>x.path.startsWith(prefix+'/'))
     .reduce((a,x)=>a+x.bytes,0),
   }])),
  referenceUses:assets.reduce((a,x)=>a+x.references.length,0),
  referencedFiles:assets.length-orphans.length,
  unreferencedFiles:orphans.length,
  crossDomainFiles:crossDomain.length,
  knotFrames:assets.reduce((a,x)=>a+
   x.references.filter(r=>r.kind==='knot-step').length,0),
  missingReferences:missingReferences.length,
 };
 requireOK(counts.files===274&&counts.bytes===166411118&&
  counts.domains.gear.files===112&&
  counts.domains.kb.files===154&&
  counts.domains.catches.files===8,
  'immutable accepted photo inventory not reproduced');
 const report={
  format:'fish118-m01-content-photo-inventory-v1',
  sourceRevision:PINNED,
  sourceProofFile:'migration/d6-historic-media-source-blobs.json',
  scope:'Read-only original canonical images; NOT a live D1/R2 export',
  catalogs:Object.fromEntries(provenance.map(([domain,hash])=>[domain,hash])),
  counts,unreferencedPaths:orphans,crossDomainPaths:crossDomain.map(x=>x.path),
  assets,
 };
 // Semantic decision review must happen before an actual copy. We report
 // orphan images, NOT delete or exclude them from the proposed inventory.
 return report;
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--out')
  throw Error('Usage: node tools/d6-historic-media-inventory.mjs --out <new-local-report.json>');
 const report=await prepareM01OriginalMediaInventory();
 const destination=path.resolve(args[1]);
 await writeFile(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('M01 SOURCE ONLY; no provider calls or writes.');
 console.log('Original source: '+report.sourceRevision);
 console.log('Files: '+report.counts.files+'; bytes: '+report.counts.bytes+
  '; owner references: '+report.counts.referenceUses+
  '; unreferenced: '+report.counts.unreferencedFiles+
  '; KB cross-domain images: '+report.counts.crossDomainFiles+
  '; Knot steps: '+report.counts.knotFrames);
 console.log('Wrote new local inventory '+destination+
  '. No R2 objects or D1 records were touched.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e);process.exitCode=1;});
