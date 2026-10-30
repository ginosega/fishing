#!/usr/bin/env node
/**
 * FISH118 D3 zero-provider offline validation of the entire deployable
 * Worker-internal private pilot. Run AFTER build-d3-pilot.mjs.
 *
 * This is an esbuild/Node dry bundling exercise, NOT a Wrangler deploy,
 * GitHub write, Cloudflare secret access or hosted acceptance test.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as esbuild from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const src=path.join(root,'experiments/p3/preview/src');
const output=path.join(src,'generated/d3-pilot.bundle.txt');
const meta=path.join(src,'generated/d3-pilot.bundle.sha256.json');
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
async function main(){
 const [asset,manifest]=await Promise.all([
  fs.readFile(output),fs.readFile(meta,'utf8').then(JSON.parse),
 ]);
 assert.match(manifest.sha256,/^[0-9a-f]{64}$/);
 assert.equal(manifest.sha256,digest(asset));
 assert.equal(manifest.bytes,asset.length);
 assert(asset.length>1024&&asset.length<=3*1024*1024);
 assert(!asset.includes(Buffer.from('sourceMappingURL=')));
 const built=await esbuild.build({
  entryPoints:[path.join(src,'d3-owner-runtime.mjs')],
  outfile:path.join(os.tmpdir(),'fishing-d3-runtime-check.mjs'),
  write:false,bundle:true,platform:'browser',format:'esm',
  target:'es2022',sourcemap:false,loader:{'.txt':'text'},
  legalComments:'none',logLevel:'silent',
 });
 assert.equal(built.outputFiles.length,1);
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-d3-worker-'));
 try{
  const bundle=path.join(tmp,'d3-owner-runtime.mjs');
  await fs.writeFile(bundle,built.outputFiles[0].contents);
  const runtime=(await import(pathToFileURL(bundle).href)).default;
  assert.equal(typeof runtime?.fetch,'function');
  assert.equal(typeof runtime?.scheduled,'function');
  const origin='https://fishing.example';
  const request=new Request(origin+'/__d3_pilot__/');
  const response=await runtime.fetch(request,{
   APP_ORIGIN:origin,D3_PILOT_ENABLED:'false',
  },{});
  assert.equal(response.status,404,'An unarmed pilot must not serve HTML');
  const response2=await runtime.fetch(new Request(
   origin+'/__d3_pilot__/pilot.js'),{
    APP_ORIGIN:origin,D3_PILOT_ENABLED:'false',
   },{});
  assert.equal(response2.status,404,'An unarmed pilot must not serve JS');
  const response3=await runtime.fetch(request,{
   APP_ORIGIN:origin,D3_PILOT_ENABLED:'true',
  },{});
  assert.equal(response3.status,503,
   'Even a pilot flag without validated binding/session must fail closed');
  // Scheduled handler should remain inert without all privileged gates.
  let wait=0;
  await runtime.scheduled({},{
   APP_ORIGIN:origin,D3_RUNNER_ENABLED:'false',
   D3_PILOT_ENABLED:'false',
  },{waitUntil(){wait++;}});
  assert.equal(wait,0);
  const parsed=JSON.stringify({
   verified:true,workerBundled:true,isolatedPilot:true,
   pilotSha256:manifest.sha256,pilotBytes:asset.length,
   bundleBytes:built.outputFiles[0].contents.length,
   disabledRouteStatus:response.status,disabledCron:true,
   noDeployment:true,
  });
  process.stdout.write(parsed+'\n');
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}
main().catch(e=>{
 console.error('D3_RUNTIME_VERIFY_FAILED',e.message);
 process.exitCode=1;
});
