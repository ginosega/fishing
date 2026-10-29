/**
 * FISH118 P3-7: exact-head sandbox PR source validator.
 * Trusted Node CLI only. Do not copy this module into an untrusted sandbox PR.
 * Its canonical validator/dependencies must be checked out at a reviewed,
 * immutable Fishing source SHA before running on untrusted sandbox bytes.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile as execFileCb} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {inventorySource} from '../../../../pwa/tools/library.mjs';

const execFile=promisify(execFileCb);
const SHA=/^[a-f0-9]{40}$/;
const SANDBOX_ID=1430581407;
const REMOTES=new Set([
 'https://github.com/ginosega/fishing-p3-sandbox',
 'https://github.com/ginosega/fishing-p3-sandbox.git',
]);
const MAX_FILES=2000,MAX_BYTES=64*1024*1024;
export class SandboxHeadError extends Error {
 constructor(code){super('Sandbox exact-head validation failed');this.name='SandboxHeadError';this.code=code;}
}
const fail=code=>{throw new SandboxHeadError(code);};
const assert=(yes,code)=>{if(!yes)fail(code);};
const gitEnv=()=>({...process.env,
 GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:os.devNull,
 GIT_TERMINAL_PROMPT:'0',GIT_OPTIONAL_LOCKS:'0',
 GIT_NO_REPLACE_OBJECTS:'1',GIT_LFS_SKIP_SMUDGE:'1',
});
const git=async(root,args)=>{
 try{
  return (await execFile('git',['-C',root,'-c','core.hooksPath='+os.devNull,
   '-c','protocol.ext.allow=never',...args],{
   env:gitEnv(),timeout:30000,maxBuffer:256*1024,encoding:'utf8',
  })).stdout.trim();
 }catch{fail('GIT_VERIFICATION_FAILED');}
};
async function verifyTree(pwa){
 const top=await fs.lstat(pwa).catch(()=>null);
 assert(top?.isDirectory()&&!top.isSymbolicLink(),'UNSAFE_CANONICAL_TREE');
 let files=0,bytes=0;
 async function visit(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
   assert(!entry.isSymbolicLink(),'UNSAFE_CANONICAL_TREE');
   if(entry.isDirectory())await visit(path.join(dir,entry.name));
   else {
    assert(entry.isFile(),'UNSAFE_CANONICAL_TREE');
    files++;
    const stat=await fs.lstat(path.join(dir,entry.name));
    bytes+=stat.size;
    assert(files<=MAX_FILES&&bytes<=MAX_BYTES,'CANONICAL_BUDGET_EXCEEDED');
   }
  }
 }
 for(const root of ['Gear','KB','Catches']){
  const dir=path.join(pwa,root),stat=await fs.lstat(dir).catch(()=>null);
  assert(stat?.isDirectory()&&!stat.isSymbolicLink(),'UNSAFE_CANONICAL_TREE');
  await visit(dir);
 }
 return {files,bytes};
}
const allowedPath=p=>/^pwa\/(?:Gear|KB|Catches)\/[^/]/.test(p)&&
 !p.includes('\\')&&!p.split('/').some(s=>s==='..'||s==='.'||s==='.git');
/**
 * Event fields must be obtained from GitHub's trusted pull_request context,
 * NOT from files in the submitted checkout or a user-supplied request body.
 * No token, code or workflow from the PR head is run by this validator.
 */
export async function validateSandboxHead({
 checkoutRoot,expectedHeadSha,expectedBaseSha,
 headRepoId,baseRepoId,baseRef,
}={}){
 assert(typeof checkoutRoot==='string'&&path.isAbsolute(checkoutRoot),'INVALID_CHECKOUT');
 assert(headRepoId===SANDBOX_ID&&baseRepoId===SANDBOX_ID&&baseRef==='main',
  'REPOSITORY_EVENT_DENIED');
 assert(SHA.test(expectedHeadSha??'')&&SHA.test(expectedBaseSha??'')&&
  expectedHeadSha!==expectedBaseSha,'INVALID_EVENT_SHA');
 const root=await fs.realpath(checkoutRoot).catch(()=>fail('INVALID_CHECKOUT'));
 const top=await git(root,['rev-parse','--show-toplevel']);
 assert(path.resolve(top)===root,'INVALID_GIT_WORKTREE');
 assert(await git(root,['rev-parse','HEAD'])===expectedHeadSha,'WRONG_PR_HEAD');
 const remote=await git(root,['remote','get-url','origin']);
 assert(REMOTES.has(remote),'INVALID_GIT_REMOTE');
 assert(await git(root,['status','--porcelain','--untracked-files=all'])==='','DIRTY_CHECKOUT');
 // The actual base SHA must be an ancestor: a stale PR is not silently rebased
 // or validated against a different, moving main.
 await git(root,['merge-base','--is-ancestor',expectedBaseSha,expectedHeadSha]);
 const paths=(await git(root,['diff','--no-renames','--name-only','-z',
  expectedBaseSha,expectedHeadSha])).split('\0').filter(Boolean);
 assert(paths.length>0&&paths.length<=100,'INVALID_CHANGE_SET');
 assert(paths.every(allowedPath),'CHANGED_PATH_DENIED');
 const pwa=path.join(root,'pwa');
 const limits=await verifyTree(pwa);
 // This is the actual canonical source inventory, including Ajv, Markdown,
 // references, image decoding and hashes. No source files are executed.
 const result=await inventorySource(pwa,{pendingMedia:false});
 // This private P3 repository is for clearly fabricated tests only.
 // D4 Catch acceptance may use a small number of synthetic IDs; never
 // permit a second copy of real production Fishing catches or Gear.
 assert(result.data.gear.items.length<=10&&
  result.data.kb.entities.length<=10&&
  result.data.catches.catches.length<=5&&
  result.data.gear.items.every(item=>item.id?.startsWith('p3-'))&&
  result.data.kb.entities.every(item=>item.id?.includes('p3-'))&&
  result.data.catches.catches.every(c=>
   c.id?.startsWith('p3-test-catch-')&&
   ['speciesName','locationName','lureOrBaitName'].every(k=>
    !c[k]||/p3|test|synthetic/i.test(c[k])||
    (k==='lureOrBaitName'&&c[k]==='Other'))),
  'NON_SYNTHETIC_SANDBOX_SOURCE');
 return Object.freeze({
  repositoryId:SANDBOX_ID,headSha:expectedHeadSha,baseSha:expectedBaseSha,
  changedFiles:paths.length,files:limits.files,bytes:limits.bytes,
  gear:result.data.gear.items.length,kb:result.data.kb.entities.length,
  catches:result.data.catches.catches.length,
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 validateSandboxHead({
  checkoutRoot:process.env.P3_SANDBOX_ROOT,
  expectedHeadSha:process.env.P3_PR_HEAD_SHA,
  expectedBaseSha:process.env.P3_PR_BASE_SHA,
  headRepoId:Number(process.env.P3_HEAD_REPO_ID),
  baseRepoId:Number(process.env.P3_BASE_REPO_ID),
  baseRef:process.env.P3_BASE_REF,
 }).then(value=>console.log(JSON.stringify(value))).catch(error=>{
  console.error('Sandbox exact-head validation refused:',error instanceof SandboxHeadError?error.code:'CANONICAL_VALIDATION_FAILED');
  process.exitCode=1;
 });
}
