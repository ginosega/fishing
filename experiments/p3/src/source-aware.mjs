/**
 * P3-0 canonical source-aware candidate adapter.
 * This runs the *real* PWA change promoter and full source inventory on a
 * disposable copy of a server-owned checkout. No GitHub, D1 or HTTP access.
 * Snapshot.root MUST be a trusted exact-main checkout; never accept it from a
 * client. More controls are required before any privileged adapter is enabled.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DOMAIN,safePath,categoryFolder} from '../../../pwa/src/shared.mjs';
import {validatePackage,promoteChange,ChangeConflictError} from '../../../pwa/src/handoff.mjs';
import {loadSource,inventorySource,fileUnder} from '../../../pwa/tools/library.mjs';
import {BrokerError} from './broker.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=(message,kind='VALIDATION')=>{throw new BrokerError(kind,message);};
function pathInside(relative){
 safePath(relative);
 if(!/^(?:Gear|KB|Catches)\//.test(relative))fail('Noncanonical content path');
 return relative;
}
function checkMedia(pkg,media,existingPaths){
 const allowed=new Map();
 const want=(path,meta)=>{
  pathInside(path);
  if(!meta||!Number.isSafeInteger(meta.bytes)||meta.bytes<1||!/^[a-f0-9]{64}$/.test(meta.sha256))fail('Missing authoritative media metadata');
  const prior=allowed.get(path);
  if(prior&&(prior.bytes!==meta.bytes||prior.sha256!==meta.sha256))fail('Inconsistent media metadata');
  allowed.set(path,meta);
 };
 if(['add','replace'].includes(pkg.picture?.action)){
  want(pkg.picture.path,pkg.picture.file);
 }
 if(pkg.pictureSequence?.action==='set'){
  if(!Array.isArray(pkg.pictureSequence.files)||pkg.pictureSequence.files.length!==pkg.pictureSequence.paths?.length)fail('Missing sequence file metadata');
  for(const item of pkg.pictureSequence.files)want(item.path,item);
 }
 if(media.length!==allowed.size)fail('Media differs from declared file set');
 const bytes=new Map();
 for(const file of media){
  const spec=allowed.get(file.path);
  if(!spec||!(file.content instanceof Uint8Array))fail('Undeclared or missing media');
  const buf=Buffer.from(file.content);
  if(spec.bytes!==buf.length||spec.sha256!==digest(buf))fail('Media size or digest mismatch');
  if(bytes.has(file.path))fail('Duplicate submitted file');
  bytes.set(file.path,buf);
 }
 for(const file of allowed.keys())if(!bytes.has(file))fail('Declared media is missing');
 for(const [relative] of bytes){
  if(pkg.picture?.action==='add' && relative===pkg.picture.path && existingPaths.has(relative))fail('New picture would overwrite existing source');
 }
 return bytes;
}
async function treeFiles(root){
 const result=[];
 async function walk(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
   const rel=path.relative(root,path.join(dir,entry.name)).split(path.sep).join('/');
   if(entry.isDirectory())await walk(path.join(dir,entry.name));
   else if(entry.isFile())result.push(rel);
   else fail('Symlink or special file in source');
  }
 }
 for(const dir of ['Gear','KB','Catches'])await walk(path.join(root,dir));
 return result;
}
async function writeFile(root,relative,bytes){
 pathInside(relative);
 const name=path.resolve(root,relative);
 if(!name.startsWith(path.resolve(root)+path.sep))fail('Path escapes trusted checkout');
 await fs.mkdir(path.dirname(name),{recursive:true});
 await fs.writeFile(name,bytes);
}
export function createCanonicalSourceAware(){
 return Object.freeze({
  async promote({package:pkg,snapshot,media=[]}){
   try{
    validatePackage(pkg);
    if(!['gear','kb'].includes(pkg.domain))fail('P3 authoring domain is not yet supported');
    if(!/^[a-f0-9]{40}$/.test(snapshot?.mainSha)||!path.isAbsolute(snapshot?.root||''))fail('Snapshot must specify a trusted exact-main root');
    const base=await fs.realpath(snapshot.root);
    const stat=await fs.stat(base);
    if(!stat.isDirectory())fail('Invalid trusted source directory');
    const data=await loadSource(base);
    const d=DOMAIN[pkg.domain],arr=data[pkg.domain][d.array];
    if(!Array.isArray(arr))fail('Missing canonical records');
    const current=arr.find(r=>r.id===pkg.id);
    const narrative=current?.[pkg.domain==='gear'?'notes':'content'];
    const currentText=narrative?await fs.readFile(await fileUnder(base,pathInside(narrative)),'utf8'):'';
    const edit=await promoteChange({
     package:pkg,currentRecord:current,currentText,sourceRevision:snapshot.mainSha,
     conflictPolicy:'review'
    });
    const next=structuredClone(data);
    const list=next[pkg.domain][d.array];
    if(pkg.operation==='add')list.push(edit.record);
    else {
     const index=list.findIndex(r=>r.id===pkg.id);
     if(index<0)fail('Record disappeared from latest source','CONFLICT');
     list[index]=edit.record;
    }
    const existing=new Set(await treeFiles(base));
    const incoming=checkMedia(pkg,media,existing);
    const changes=[{action:'write',path:d.file,body:JSON.stringify(next[pkg.domain],null,2)+'\n'}];
    for(const write of edit.writes){
     const rel=pathInside(write.path);
     const currentExists=existing.has(rel);
     if(!write.remove && write.baseSha256===null && currentExists)fail('New narrative path already exists','CONFLICT');
     changes.push(write.remove?{action:'delete',path:rel}:{action:'write',path:rel,body:write.body});
    }
    for(const [rel,bytes] of incoming)changes.push({action:'write',path:rel,body:bytes});
    const unique=new Set();
    for(const entry of changes){
     if(unique.has(entry.path))fail('Duplicate canonical output');
     unique.add(entry.path);
     if(!entry.path.startsWith(pkg.domain==='gear'?'Gear/':'KB/'))fail('Unexpected domain output');
    }
    const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'fish-p3-source-'));
    try{
     const staged=path.join(tmp,'pwa');
     // Copy source only; no node_modules, dist, git internals or generated build.
     await fs.cp(base,staged,{recursive:true,filter:name=>!['node_modules','dist','.git','.cache'].includes(path.basename(name))});
     for(const entry of changes){
      if(entry.action==='delete'){
       await fs.rm(path.join(staged,entry.path));
      }else await writeFile(staged,entry.path,entry.body);
     }
     // This existing canonical check includes Ajv/semantic validation, path
     // references, full Markdown parsing, actual media decoding and hashes.
     await inventorySource(staged,{pendingMedia:false});
    }finally{await fs.rm(tmp,{recursive:true,force:true});}
    return {validated:true,changes,sourceRevision:snapshot.mainSha};
   }catch(error){
    if(error instanceof BrokerError)throw error;
    if(error instanceof ChangeConflictError)fail('Change requires review: '+error.conflicts.join(', '),'CONFLICT');
    fail('Canonical source validation failed: '+error.message);
   }
  }
 });
}
