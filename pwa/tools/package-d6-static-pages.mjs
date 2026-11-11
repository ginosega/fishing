#!/usr/bin/env node
/**
 * D6 verified read-only physical Pages artifact preparation. LOCAL/SOURCE ONLY.
 * Supports the original Stage A build and a separately marked integrated
 * owner Connection Status build with real canonical content; NEVER deploys.
 * This never creates a Pages project, Worker, route, credential or deployment.
 * The generated upload directory has exactly one top-level fishing/ subtree.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verify} from './verify.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const productionDist=path.resolve(here,'../dist');
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[a-f0-9]{32}$/;
const inside=(parent,child)=>{
 const rel=path.relative(parent,child);
 return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
};
const deny=reason=>{throw Error('D6 Stage A Pages packaging denied: '+reason);};
// Resolve existing symlinked ancestors even when the requested output itself
// does not exist. Lexical checks alone cannot protect pwa/dist aliases.
async function physicalPath(target){
 let cursor=target;
 const tail=[];
 for(;;){
  try{return path.resolve(await fs.realpath(cursor),...tail.reverse());}
  catch(error){
   if(error?.code!=='ENOENT')throw error;
   const parent=path.dirname(cursor);
   if(parent===cursor)throw error;
   tail.push(path.basename(cursor));
   cursor=parent;
  }
 }
}
const protectedOrOverlapping=(input,output,protectedPath)=>
 inside(input,output)||inside(output,input)||
 inside(protectedPath,input)||inside(protectedPath,output)||
 inside(input,protectedPath)||inside(output,protectedPath);

export async function packageD6StaticPages({source,destination,verifyRelease=verify,
 mode='static'}={}){
 if(!['static','owner-read-only'].includes(mode))deny('unknown package mode');
 const owner=mode==='owner-read-only';
 if(typeof source!=='string'||!source||typeof destination!=='string'||!destination)
  deny('explicit source and destination are required');
 if(typeof verifyRelease!=='function')deny('release verifier unavailable');
 const input=path.resolve(source),output=path.resolve(destination);
 if(protectedOrOverlapping(input,output,productionDist))
  deny('overlapping or production release paths');
 // Check effective filesystem targets as well as spelling: a parent symlink
 // must not let a staging upload write into production or into its own input.
 const [realInput,realOutput,realProductionDist]=await Promise.all([
  physicalPath(input),physicalPath(output),physicalPath(productionDist),
 ]);
 if(protectedOrOverlapping(realInput,realOutput,realProductionDist))
  deny('overlapping or production release paths via symlinked parent');
 const inputStats=await fs.lstat(input).catch(()=>null);
 if(!inputStats?.isDirectory()||inputStats.isSymbolicLink())
  deny('source must be an existing release directory');
 const pointer=JSON.parse(await fs.readFile(path.join(input,'release.json'),'utf8'));
 if(!ID.test(pointer.id??'')||!SHA.test(pointer.sourceRevision??'')||
    pointer.d6ReaderCandidate!==true||
    (owner?pointer.d6StaticStaging===true:pointer.d6StaticStaging!==true)||
    (pointer.d6OwnerConnectionCandidate===true)!==owner||
    pointer.pendingMedia!==false||
    pointer.manifest!=='releases/'+pointer.id+'/manifest.json')
  deny('unapproved staging release pointer');
 const manifest=JSON.parse(await fs.readFile(path.join(input,pointer.manifest),'utf8'));
 if(manifest.releaseId!==pointer.id||
    manifest.sourceRevision!==pointer.sourceRevision||
    manifest.d6ReaderCandidate!==true||
    (owner?manifest.d6StaticStaging===true:manifest.d6StaticStaging!==true)||
    (manifest.d6OwnerConnectionCandidate===true)!==owner||
    manifest.pendingMedia!==false||manifest.base!=='/fishing/')
  deny('unapproved staging manifest or /fishing/ base');
 // Full canonical content/manifest and every file hash are checked here.
 const before=await verifyRelease(input);
 if(before?.releaseId!==pointer.id||
    before?.sourceRevision!==pointer.sourceRevision||
    before?.verified!==true)deny('source release verification failed');
 if(await fs.lstat(output).then(()=>true,()=>false))
  deny('destination already exists; never overwrite an artifact');
 await fs.mkdir(path.dirname(output),{recursive:true});
 const temp=await fs.mkdtemp(path.join(path.dirname(output),'.d6-pages-stage-'));
 try{
  // A Pages upload must physically contain fishing/index.html and all
  // immutable files; specifying build base alone does not create that tree.
  const physical=path.join(temp,'fishing');
  await fs.cp(input,physical,{recursive:true,force:false,errorOnExist:true});
  const top=await fs.readdir(temp);
  if(top.length!==1||top[0]!=='fishing')deny('unexpected upload root');
  const after=await verifyRelease(physical);
  if(after?.verified!==true||
     after.releaseId!==before.releaseId||
     after.sourceRevision!==before.sourceRevision||
     after.files!==before.files||
     after.bytes!==before.bytes)
   deny('copied release differs from input');
  if(await fs.lstat(output).then(()=>true,()=>false))
   deny('destination became occupied');
  await fs.rename(temp,output);
  return Object.freeze({releaseId:pointer.id,
   sourceRevision:pointer.sourceRevision,
   uploadRoot:output,physicalBase:'fishing/',files:after.files,bytes:after.bytes,
   verified:true,deployed:false,mode});
 }catch(error){
  await fs.rm(temp,{recursive:true,force:true});
  throw error;
 }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const input=args.find(x=>x.startsWith('--in='))?.slice(5);
 const output=args.find(x=>x.startsWith('--out='))?.slice(6);
 const mode=args.find(x=>x.startsWith('--mode='))?.slice(7)||'static';
 if(args.length!==(mode==='static'?2:3)||!input||!output||
    !['static','owner-read-only'].includes(mode)||args.some(x=>
    !x.startsWith('--in=')&&!x.startsWith('--out=')&&
    !x.startsWith('--mode='))){
  console.error('Usage: node tools/package-d6-static-pages.mjs --in=<verified-dist> --out=<isolated-upload-dir> [--mode=owner-read-only]');
  process.exitCode=1;
 }else packageD6StaticPages({source:input,destination:output,mode})
  .then(x=>console.log(JSON.stringify(x,null,2)))
  .catch(e=>{console.error(e);process.exitCode=1;});
}
