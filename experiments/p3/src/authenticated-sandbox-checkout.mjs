/**
 * FISH118 P3-6: trusted, server-only GitHub App sandbox checkout.
 * SOURCE ONLY. Not imported by the Cloudflare Worker, not deployed.
 * No client-provided paths, remote URLs, branches, tokens or validation booleans.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile as callbackExecFile} from 'node:child_process';
import {promisify} from 'node:util';

const execFile=promisify(callbackExecFile);
const REPO='ginosega/fishing-p3-sandbox';
const ID=1430581407;
const API='https://api.github.com/repos/'+REPO;
const ORIGIN='https://github.com/'+REPO+'.git';
const SHA=/^[0-9a-f]{40}$/;
const JSON_HEADERS={
 'Accept':'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-p3-sandbox-publisher',
};
export class AuthenticatedCheckoutError extends Error{
 constructor(code){super('Authenticated sandbox checkout refused');this.name='AuthenticatedCheckoutError';this.code=code;}
}
const fail=code=>{throw new AuthenticatedCheckoutError(code);};
const ok=(value,code)=>{if(!value)fail(code);};
const gitEnv=(token,askpass)=>({
 PATH:process.env.PATH??'/usr/bin:/bin',
 HOME:os.homedir(),TMPDIR:os.tmpdir(),
 GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:os.devNull,
 GIT_CONFIG_COUNT:'0',GIT_TERMINAL_PROMPT:'0',
 GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1',
 GIT_LFS_SKIP_SMUDGE:'1',
 ...(token?{GIT_ASKPASS:askpass,P3_GIT_AUTH_PASSWORD:token}:{}),
});
/**
 * The request and gitExec injections are trusted runner dependencies, never
 * HTTP request fields. A test double may redirect the Git fetch to a local
 * bare fixture; production always fetches the hard-coded GitHub remote.
 */
export function createAuthenticatedSandboxCheckout({
 issueReadToken,request=fetch,gitExec=execFile,workspaceRoot=os.tmpdir(),
}={}){
 ok(typeof issueReadToken==='function'&&typeof request==='function'&&
  typeof gitExec==='function'&&typeof workspaceRoot==='string'&&
  path.isAbsolute(workspaceRoot),'INVALID_CONFIGURATION');
 const leases=new Map();
 const git=async(root,args,token,askpass)=>{
  let result;
  try{
   result=await gitExec('git',[
    '-C',root,'-c','credential.helper=','-c','protocol.file.allow=never',
    '-c','protocol.ext.allow=never','-c','core.hooksPath='+os.devNull,
    ...args],{env:gitEnv(token,askpass),timeout:30000,maxBuffer:65536});
  }catch{fail('GIT_COMMAND_FAILED');}
  return String(result?.stdout??'').trim();
 };
 const token=async()=>{
  let grant;
  try{grant=await issueReadToken({repositoryId:ID,permissions:{contents:'read'}});}
  catch{fail('READ_TOKEN_UNAVAILABLE');}
  ok(grant?.repositoryId===ID&&
   grant?.permissions?.contents==='read'&&
   Object.keys(grant.permissions).length===1&&
   typeof grant?.token==='string'&&grant.token.length>=12,'TOKEN_SCOPE_DENIED');
  return grant.token;
 };
 const get=async(url,secret)=>{
  ok(url===API||url.startsWith(API+'/'),'REPOSITORY_DENIED');
  let response;
  try{response=await request(url,{method:'GET',headers:{
   ...JSON_HEADERS,Authorization:'Bearer '+secret,
  }});}catch{fail('GITHUB_NETWORK_ERROR');}
  ok(response?.ok===true,'GITHUB_RESPONSE_DENIED');
  try{return await response.json();}catch{fail('INVALID_GITHUB_JSON');}
 };
 const identity=async(secret)=>{
  const details=await get(API,secret);
  ok(details?.id===ID&&details?.full_name===REPO&&
   details?.private===true&&!details?.archived,'REPOSITORY_IDENTITY_MISMATCH');
 };
 const head=async(secret)=>{
  await identity(secret);
  const ref=await get(API+'/git/ref/heads/main',secret);
  const sha=ref?.object?.sha;
  ok(ref?.ref==='refs/heads/main'&&ref?.object?.type==='commit'&&
   SHA.test(sha??''),'INVALID_MAIN_REF');
  return sha;
 };
 async function readMainSha({repositoryId}={}){
  ok(repositoryId===ID,'REPOSITORY_DENIED');
  const secret=await token();
  const sha=await head(secret);
  return Object.freeze({repositoryId:ID,sha});
 }
 async function trustedCheckout({repositoryId,repository,commitSha}={}){
  ok(repositoryId===ID&&repository===REPO&&SHA.test(commitSha??''),'CHECKOUT_TARGET_DENIED');
  const secret=await token();
  // Resolve main and immutable commit from the restricted installation token.
  const main=await head(secret);
  ok(main===commitSha,'REMOTE_HEAD_MOVED');
  const commit=await get(API+'/git/commits/'+commitSha,secret);
  ok(commit?.sha===commitSha&&SHA.test(commit?.tree?.sha??''),'COMMIT_IDENTITY_MISMATCH');
  let root;
  try{
   root=await fs.mkdtemp(path.join(workspaceRoot,'fish-p3-authenticated-'));
   // Contents never include credentials. Do not persist authorization in Git
   // remotes/config; askpass reads a secret from the child process environment.
   await git(root,['init','-q']);
   const askpass=path.join(root,'.git','p3-askpass.sh');
   await fs.writeFile(askpass,
    '#!/bin/sh\ncase "$1" in *Username*) printf "%s\\n" "x-access-token";; *Password*) printf "%s\\n" "$P3_GIT_AUTH_PASSWORD";; *) exit 1;; esac\n',
    {mode:0o700});
   await git(root,['remote','add','origin',ORIGIN]);
   // Fetch a server-fixed ref, then compare its object identity with the
   // immutable SHA from GitHub. Never fall back to a moving or other branch.
   await git(root,['fetch','--no-tags','--depth=1','origin','refs/heads/main'],secret,askpass);
   const fetched=await git(root,['rev-parse','--verify','FETCH_HEAD']);
   ok(fetched===commitSha,'FETCHED_SHA_MISMATCH');
   await git(root,['checkout','--detach','-q',commitSha]);
   ok(await git(root,['rev-parse','--verify','HEAD'])===commitSha,'CHECKOUT_SHA_MISMATCH');
   ok((await git(root,['remote','get-url','origin']))===ORIGIN,'CHECKOUT_REMOTE_DENIED');
   // Askpass is temporary credential plumbing and MUST NOT be visible to
   // the downstream canonical inventory or copied into its staged source.
   await fs.rm(askpass,{force:true});
   ok((await git(root,['status','--porcelain','--untracked-files=all']))==='','CHECKOUT_DIRTY');
   const lease=Object.freeze({repositoryId:ID,repository:REPO,commitSha,root});
   leases.set(lease,root);
   return lease;
  }catch(e){
   if(root)await fs.rm(root,{recursive:true,force:true});
   if(e instanceof AuthenticatedCheckoutError)throw e;
   fail('CHECKOUT_PREPARATION_FAILED');
  }
 }
 async function releaseCheckout(lease){
  const root=leases.get(lease);
  ok(typeof root==='string'&&lease?.root===root,'UNKNOWN_CHECKOUT_LEASE');
  leases.delete(lease);
  // Only paths allocated by this provider are ever deleted.
  await fs.rm(root,{recursive:true,force:true});
 }
 return Object.freeze({readMainSha,trustedCheckout,releaseCheckout});
}
