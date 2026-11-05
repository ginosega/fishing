#!/usr/bin/env node
/**
 * D5 local-only additive sandbox preview. No network access, no commits,
 * no remote writes, no publishing. Expected clean source/sandbox Git SHAs
 * must be supplied to prevent accidental use of stale or changing inputs.
 *
 * Example:
 * node tools/plan-d5-sandbox-baseline.mjs \
 *   --canonical=C:/Users/me/fishing-d5-owner-test/pwa \
 *   --sandbox=C:/Users/me/fishing-p3-sandbox/pwa \
 *   --out=C:/Users/me/AppData/Local/Temp/d5-preview \
 *   --canonical-head=<40-hex> --sandbox-head=<40-hex>
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {generateStandaloneValidators} from './generate-validators.mjs';
import {mergeD5SandboxBaseline,D5_DOMAINS} from '../src/d5-sandbox-baseline.mjs';

const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const SHA=/^[a-f0-9]{40}$/;
const indexFiles=Object.entries(D5_DOMAINS).map(([domain])=>
 ({domain,path:(domain==='gear'?'Gear/gear.json':
  domain==='kb'?'KB/kb.json':'Catches/catches.json')}));
const root=key=>{const v=arg(key);if(!v)throw Error('Missing --'+key);return path.resolve(v);};
const canon=root('canonical'),sandbox=root('sandbox'),out=root('out');
const canonHead=arg('canonical-head'),sandboxHead=arg('sandbox-head');
if(!SHA.test(canonHead??'')||!SHA.test(sandboxHead??''))
 throw Error('Require both 40-character pinned Git source SHAs');
if([canon,sandbox].some(p=>out===p||
 out.startsWith(p+path.sep)||p.startsWith(out+path.sep))||
 canon===sandbox||canon.startsWith(sandbox+path.sep)||
 sandbox.startsWith(canon+path.sep))
 throw Error('Output and inputs must be separate directories');
if(await fs.stat(out).then(()=>true,e=>e.code==='ENOENT'?false:Promise.reject(e)))
 throw Error('Refuse to overwrite an existing local preview');
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',
 windowsHide:true,timeout:15000}).trim();
for(const [dir,expected] of [[canon,canonHead],[sandbox,sandboxHead]]){
 if(git(dir,'rev-parse','HEAD')!==expected||
  git(dir,'status','--porcelain','--untracked-files=no'))
  throw Error('Source checkout is not clean at expected commit: '+dir);
}
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fileInventory=async root=>{
 const files=new Map();
 async function visit(folder,rel=''){
  for(const entry of await fs.readdir(folder,{withFileTypes:true})){
   const item=rel?rel+'/'+entry.name:entry.name;
   if(entry.isDirectory())await visit(path.join(folder,entry.name),item);
   else if(entry.isFile())files.set(item,null);
   else throw Error('Unsafe file type: '+item);
  }
 }
 for(const domain of ['Gear','KB','Catches'])
  await visit(path.join(root,domain),domain);
 return files;
};
const publicFiles=await fileInventory(canon);
const sandboxFiles=await fileInventory(sandbox);
const known=new Map();
for(const key of publicFiles.keys())known.set(key.normalize('NFC').toLowerCase(),key);
const indexSet=new Set(indexFiles.map(v=>v.path));
for(const key of sandboxFiles.keys()){
 const folded=key.normalize('NFC').toLowerCase(),prev=known.get(folded);
 if(prev&&(!indexSet.has(key)||key!==prev))
  throw Error('Refuse to replace canonical or case-colliding content: '+key);
 known.set(folded,key);
}
const read=async(root,rel)=>JSON.parse(
 await fs.readFile(path.join(root,rel),'utf8'));
const canonical={},privateData={};
for(const {domain,path:p} of indexFiles){
 canonical[domain]=await read(canon,p);
 privateData[domain]=await read(sandbox,p);
}
const {data,summary}=mergeD5SandboxBaseline(canonical,privateData);
await generateStandaloneValidators();
const {inventorySource}=await import('./library.mjs');
const stage=out+'.pending-'+crypto.randomBytes(5).toString('hex');
let committed=false;
try{
 await fs.mkdir(stage,{recursive:false});
 for(const domain of ['Gear','KB','Catches']){
  await fs.cp(path.join(canon,domain),path.join(stage,domain),{
   recursive:true,errorOnExist:true,force:false,
  });
 }
 for(const rel of sandboxFiles.keys()){
  if(indexSet.has(rel))continue;
  const dest=path.join(stage,rel);
  await fs.mkdir(path.dirname(dest),{recursive:true});
  await fs.copyFile(path.join(sandbox,rel),dest,fs.constants.COPYFILE_EXCL);
 }
 for(const {domain,path:p} of indexFiles)
  await fs.writeFile(path.join(stage,p),
   JSON.stringify(data[domain],null,2)+'\n','utf8');

 // Validate the full merged real+synthetic source, media bytes and references.
 const inspected=await inventorySource(stage,{pendingMedia:false});
 // The current authenticated sandbox loader/client limit narratives to 120.
 // This real+synthetic preview may exceed it. Do NOT label a physical-file
 // validation PASS as readiness for owner-source migration.
 const narrativePaths=new Set(Object.entries(D5_DOMAINS).flatMap(
  ([domain,array])=>data[domain][array].flatMap(item=>
   [item.notes,item.content].filter(p=>typeof p==='string'&&p.endsWith('.md')))));
 const maxNarratives=120;
 const sourceGateReady=narrativePaths.size<=maxNarratives;
 const report={format:'d5-additive-sandbox-baseline-preparation-v1',
  canonicalHead:canonHead,sandboxHead,
  canonicalIndexHashes:Object.fromEntries(await Promise.all(indexFiles.map(
   async({domain,path:p})=>[domain,digest(await fs.readFile(path.join(canon,p)))]))),
  sandboxIndexHashes:Object.fromEntries(await Promise.all(indexFiles.map(
   async({domain,path:p})=>[domain,digest(await fs.readFile(path.join(sandbox,p)))]))),
  mergedCounts:Object.fromEntries(Object.entries(summary).map(([k,v])=>
   [k,{canonical:v.canonical,sandboxPreserved:v.sandboxPreserved,combined:v.combined}])),
  preservedSyntheticIds:Object.fromEntries(Object.entries(summary).map(([k,v])=>
   [k,v.sandboxIds])),
  sandboxFilesPreserved:sandboxFiles.size-indexFiles.length,
  verifiedReferencedFiles:inspected.files.length,
  ownerSourceGate:{
   referencedMarkdown:narrativePaths.size,maxMarkdown:maxNarratives,
   ready:sourceGateReady,
   blocker:sourceGateReady?null:'Authenticated source snapshot currently rejects >120 narratives; an independently approved capacity design is required.',
  },
  migrationApproved:false,
  providerWrites:false,githubWrites:false,publishing:false,
 };
 await fs.writeFile(path.join(stage,'D5_BASELINE_PREPARATION.json'),
  JSON.stringify(report,null,2)+'\n');
 await fs.rename(stage,out);
 committed=true;
 console.log(JSON.stringify({status:sourceGateReady?'PASS: D5 ADDITIVE SANDBOX PREVIEW ONLY':'BLOCKED: D5 OWNER SOURCE NARRATIVE LIMIT; LOCAL PREVIEW ONLY',
  ...report,output:out},null,2));
}finally{
 if(!committed)await fs.rm(stage,{recursive:true,force:true});
}
