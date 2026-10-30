/**
 * FISH118 P3 sandbox-only source-aware candidate bridge. SOURCE ONLY.
 * In a future trusted Node runner, an exact-sha GitHub checkout must be
 * provisioned by a GitHub App-scoped, server-owned checkout step. Never take
 * root/checkout/repository identity or a validated flag from a browser.
 *
 * A clean local Git SHA + remote URL is a local consistency check, NOT proof
 * that remote GitHub authorized or supplied the content. Independent remote
 * commit verification and runner trust are separate deployment gates.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {execFile as execFileCb} from 'node:child_process';
import {createCanonicalSourceAware} from './source-aware.mjs';

const execFile=promisify(execFileCb);
const SANDBOX='ginosega/fishing-p3-sandbox',ID=1430581407;
const SHA=/^[0-9a-f]{40}$/;
const REMOTES=new Set([
 'https://github.com/ginosega/fishing-p3-sandbox.git',
 'https://github.com/ginosega/fishing-p3-sandbox',
 'git@github.com:ginosega/fishing-p3-sandbox.git',
 'ssh://git@github.com/ginosega/fishing-p3-sandbox.git',
]);
const op=s=>typeof s==='string'&&/^p3_[0-9a-f-]{36}$/.test(s);
export class TrustedCandidateError extends Error{
 constructor(code){super('Sandbox source candidate could not be trusted');this.name='TrustedCandidateError';this.code=code;}
}
const deny=code=>{throw new TrustedCandidateError(code);};
const assert=(truth,code)=>{if(!truth)deny(code);};
const run=async(root,...args)=>{
 try{return (await execFile('git',['-C',root,...args],{
  timeout:15000,maxBuffer:16384,env:{
   ...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',
   GIT_OPTIONAL_LOCKS:'0',
  },
 })).stdout.trim();}
 catch{deny('CHECKOUT_GIT_FAILED');}
};
// A Git checkout may legitimately contain tracked symlinks. None may be
// trusted as canonical input: a symlinked Gear/KB root or Markdown/media file
// could otherwise escape the checkout before the inventory opens it.
async function verifyCanonicalTree(pwa){
 const required=['Gear','KB','Catches'];
 for(const name of required){
  const info=await fs.lstat(path.join(pwa,name)).catch(()=>null);
  assert(info?.isDirectory()&&!info.isSymbolicLink(),'CHECKOUT_UNSAFE_TREE');
 }
 let count=0;
 async function visit(directory){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
   count++;
   assert(count<=20000,'CHECKOUT_TOO_MANY_FILES');
   assert(!entry.isSymbolicLink(),'CHECKOUT_UNSAFE_TREE');
   if(entry.isDirectory())await visit(path.join(directory,entry.name));
   else assert(entry.isFile(),'CHECKOUT_UNSAFE_TREE');
  }
 }
 await visit(pwa);
}
export function createTrustedSandboxCandidate({trustedCheckout,store,
 sourceAware=createCanonicalSourceAware(),releaseCheckout,
}={}){
 assert(typeof trustedCheckout==='function'&&typeof store?.readSnapshot==='function'&&
  typeof sourceAware?.promote==='function'&&typeof releaseCheckout==='function',
  'INVALID_CONFIGURATION');
 return async function candidate({baseSha,domain,operationId}={}){
  assert(SHA.test(baseSha??'')&&['gear','kb'].includes(domain)&&op(operationId),'INVALID_OPERATION');
  // Always retrieve immutable snapshot from server-owned D1; client cannot
  // replace a package, supply media bytes or claim source validation.
  const snapshot=await store.readSnapshot(operationId);
  assert(snapshot?.package?.domain===domain&&snapshot?.package?.format==='fishing-companion-change-v2'
   &&Array.isArray(snapshot.media)&&snapshot.media.length===0,'INVALID_DURABLE_SNAPSHOT');
  const lease=await trustedCheckout({repositoryId:ID,repository:SANDBOX,commitSha:baseSha});
  let root;
  try{
   assert(lease?.repositoryId===ID&&lease?.repository===SANDBOX&&lease?.commitSha===baseSha&&
    typeof lease?.root==='string'&&path.isAbsolute(lease.root),'UNTRUSTED_CHECKOUT');
   root=await fs.realpath(lease.root);
   const stat=await fs.stat(root);
   assert(stat.isDirectory(),'UNTRUSTED_CHECKOUT');
   // Git verification happens locally, in the backend only.
   assert(await run(root,'rev-parse','--verify','HEAD')===baseSha,'CHECKOUT_SHA_MISMATCH');
   const dirty=await run(root,'status','--porcelain','--untracked-files=all');
   assert(!dirty,'CHECKOUT_DIRTY');
   const origin=await run(root,'remote','get-url','origin');
   assert(REMOTES.has(origin),'CHECKOUT_REMOTE_DENIED');
   const pwaEntry=await fs.lstat(path.join(root,'pwa')).catch(()=>null);
   assert(pwaEntry?.isDirectory()&&!pwaEntry.isSymbolicLink(),'CHECKOUT_UNSAFE_TREE');
   const pwa=await fs.realpath(path.join(root,'pwa'));
   assert(pwa.startsWith(root+path.sep),'CHECKOUT_PATH_ESCAPE');
   await verifyCanonicalTree(pwa);
   const source=await sourceAware.promote({
    package:structuredClone(snapshot.package),
    media:[],snapshot:{mainSha:baseSha,root:pwa},
   });
   assert(source?.validated===true&&source.sourceRevision===baseSha&&
    Array.isArray(source.changes)&&source.changes.length>0,'VALIDATION_FAILED');
   // Real pwa inventorySource is called inside canonical source-aware.promote.
   return source;
  }finally{
   // Trusted checkout provider owns cleanup. Never use an untrusted path to
   // delete files directly; no exception may leak access tokens.
   if(lease)await releaseCheckout(lease);
  }
 };
}
