#!/usr/bin/env node
/**
 * FISH-TODO-118 WP3 H1: prepare, NEVER execute, isolated D1 migration files.
 *
 * H1 operator approval covers only fresh auth/operation test databases.
 * This is deliberately not wired into Worker, CI deploy, wrangler or runtime.
 * Never point the generated files at WP2 or production D1.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {D6_WP3_D1_SCHEMA_PLAN}
 from '../../experiments/p3/preview/src/d6-production-wp3-d1-readiness.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const auth=path.resolve(here,'../../experiments/p3/preview/migrations/0001_wp3_h1_auth.sql');
const digest=x=>createHash('sha256').update(x).digest('hex');
const SHA=/^[a-f0-9]{40}$/;
const NAME=/^[a-z][a-z0-9_]{1,80}$/;
const expectedNames=Object.freeze([
 'd6_operation_receipts','d6_provider_step_fences',
 'd6_media_stage_verified','d6_atomic_tree_verified',
 'd6_publish_branch_verified','d6_publish_commit_verified',
 'd6_publish_tree_candidates','d6_publish_commit_candidates',
 'd6_publish_advance_verified','d6_publish_pr_verified',
]);
const deny=message=>{throw Error('WP3 H1 migration preparation denied: '+message);};

/** Writes only to a caller-chosen NEW output directory. No D1 side effects. */
export async function prepareD6Wp3H1Migrations({
 destination,sourceRevision,
}={}){
 if(typeof destination!=='string'||destination.length===0||
  typeof sourceRevision!=='string'||!SHA.test(sourceRevision))
  deny('explicit unused output path and exact source SHA required');
 const output=path.resolve(destination);
 const repo=path.resolve(here,'../..');
 // No in-repository data or generated production/preview release is writable.
 const inside=(parent,child)=>child===parent||
  child.startsWith(parent+path.sep);
 if(inside(repo,output))deny('output must be outside the repository');
 if(await fs.stat(output).then(()=>true,()=>false))
  deny('output already exists');
 const definitions=D6_WP3_D1_SCHEMA_PLAN;
 if(definitions.length!==expectedNames.length||
  definitions.some((x,i)=>x.table!==expectedNames[i]||!NAME.test(x.table)||
   x.sourceOnly!==true||x.canApply!==false||
   typeof x.sql!=='string'||
   (x.sql.match(/\bCREATE TABLE IF NOT EXISTS\b/g)||[]).length!==1))
  deny('source-owned operations table inventory changed');
 const authSql=await fs.readFile(auth,'utf8');
 if(!/CREATE TABLE IF NOT EXISTS auth_flows/.test(authSql)||
  !/CREATE TABLE IF NOT EXISTS sessions/.test(authSql)||
  !/CREATE INDEX IF NOT EXISTS sessions_expiry/.test(authSql)||
  !/CREATE INDEX IF NOT EXISTS auth_flows_expiry/.test(authSql)||
  (authSql.match(/\bCREATE TABLE IF NOT EXISTS\b/g)||[]).length!==2)
  deny('AUTH-P0 SQL changed');
 const operationsSql=definitions.map(x=>x.sql.trim()).join('\n\n')+'\n';
 if(!/CREATE UNIQUE INDEX IF NOT EXISTS d6_operation_active_record/.test(operationsSql)||
  !/UNIQUE\(owner_github_id,idempotency_key\)/.test(operationsSql))
  deny('operation receipt uniqueness missing');
 await fs.mkdir(output,{recursive:false});
 try{
  await fs.writeFile(path.join(output,'auth.sql'),authSql,{flag:'wx'});
  await fs.writeFile(path.join(output,'operations.sql'),operationsSql,{flag:'wx'});
  const manifest={
   format:'fishing-wp3-h1-isolated-d1-migrations-v1',
   sourceRevision,
   targetAuthDb:'fishing-v3-wp3-auth-test',
   targetOperationsDb:'fishing-v3-wp3-operations-test',
   auth:{file:'auth.sql',sha256:digest(authSql),tables:['auth_flows','sessions']},
   operations:{file:'operations.sql',sha256:digest(operationsSql),
    tables:[...expectedNames]},
   output,
   prepared:true,executed:false,hostedVerified:false,
   canPublish:false,writeAuthorized:false,
  };
  await fs.writeFile(path.join(output,'manifest.json'),
   JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  return Object.freeze(manifest);
 }catch(e){
  await fs.rm(output,{recursive:true,force:true});
  throw e;
 }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const dest=args.find(x=>x.startsWith('--out='))?.slice(6);
 const sha=args.find(x=>x.startsWith('--source-revision='))?.slice(18);
 if(args.length!==2||!dest||!sha||args.some(x=>
   !x.startsWith('--out=')&&!x.startsWith('--source-revision='))){
  console.error('Usage: node tools/prepare-d6-wp3-h1-migrations.mjs --out=<unused-outside-repo-dir> --source-revision=<40-char-SHA>');
  process.exitCode=1;
 }else prepareD6Wp3H1Migrations({destination:dest,sourceRevision:sha})
  .then(x=>console.log(JSON.stringify(x,null,2)))
  .catch(e=>{console.error(e);process.exitCode=1;});
}
