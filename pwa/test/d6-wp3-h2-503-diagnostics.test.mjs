import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ProductionPublishWriteRouteCandidate}
 from '../../experiments/p3/preview/src/d6-production-publish-write-route-candidate.mjs';

const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const SHA='fc85bd38c4c688026700971b4c2d463c293eebf3';
const trusted=()=>({verified:true,repositoryId:1350909744,
 ref:'refs/heads/main',sourceRevision:SHA});
const accepted=()=>({operationId:'123e4567-e89b-42d3-a456-426614174000',
 status:'Accepted',sourceRevision:SHA,sourceOnly:true,
 canPublish:false,isLive:false});
const request=()=>new Request(ORIGIN+'/api/v3/operations',{
 method:'POST',headers:{
  Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
  'X-Fish-V3-Intent':'publish','Content-Type':'application/json',
 },body:'{}',
});
function route({main=async()=>trusted(),accept=async()=>accepted(),
 diagnostic=()=>false,auth=async()=>({authorized:true,ownerGitHubId:265665562}),
 enabled=()=>true}={}){
 return createD6ProductionPublishWriteRouteCandidate({
  session:{authorizeWrite:auth},receipts:{accept},
  dispatcher:{
   current:async()=>{throw Error('unexpected current');},
   beginOne:async()=>{throw Error('unexpected begin');},
   reconcileOne:async()=>{throw Error('unexpected reconcile');},
  },
  getTrustedCurrentMain:main,
  enabled,writeEnabled:enabled,origin:ORIGIN,
  isolatedOriginEnabled:()=>true,
  diagnosticStageEnabled:diagnostic,
 });
}
const stage='X-Fish-V3-H2-Failure-Stage';
test('H2-503-01 fixed stage codes distinguish main and receipt without leaking errors',async()=>{
 const cases=[
  ['MAIN_LOOKUP',{main:async()=>{throw Error('private jwt text');}}],
  ['MAIN_UNVERIFIED',{main:async()=>({...trusted(),verified:false})}],
  ['RECEIPT_ACCEPT',{accept:async()=>{throw Error('private D1 or source details');}}],
  ['RECEIPT_FORMAT',{accept:async()=>({...accepted(),status:'bad'})}],
 ];
 for(const [expected,opts] of cases){
  const resp=await route({...opts,diagnostic:()=>true}).serve(request());
  assert.equal(resp.status,503,expected);
  assert.equal(resp.headers.get(stage),expected);
  assert.equal(resp.headers.get('Vary'),'Cookie');
  assert.equal(resp.headers.get('Cache-Control'),'private, no-store, max-age=0');
  assert.equal(resp.headers.has('Set-Cookie'),false);
  assert.equal(resp.headers.has('Access-Control-Allow-Origin'),false);
  assert.deepEqual(await resp.json(),{ok:false,error:'TEMPORARILY_UNAVAILABLE'});
 }
});
test('H2-503-02 default and denied requests never disclose stages',async()=>{
 const generic=await route({
  main:async()=>{throw Error('hidden');},
 }).serve(request());
 assert.equal(generic.status,503);
 assert.equal(generic.headers.has(stage),false);
 assert.deepEqual(await generic.json(),
  {ok:false,error:'TEMPORARILY_UNAVAILABLE'});
 const denied=await route({
  diagnostic:()=>true,
  auth:async()=>({authorized:false,ownerGitHubId:123}),
 }).serve(request());
 assert.equal(denied.status,403);
 assert.equal(denied.headers.has(stage),false);
 const success=await route({diagnostic:()=>true}).serve(request());
 assert.equal(success.status,202);
 assert.equal(success.headers.has(stage),false);
 const body=await success.json();
 assert.equal(body.state,'Accepted');
 assert.equal(body.canPublish,false);
 assert.equal(body.isLive,false);
});
test('H2-503-03 diagnostic failure is fail-closed and config is OFF',async()=>{
 const failedFlag=await route({
  diagnostic:()=>{throw Error('flag lookup');},
  main:async()=>{throw Error('hidden');},
 }).serve(request());
 assert.equal(failedFlag.status,503);
 assert.equal(failedFlag.headers.has(stage),false);
 const config=JSON.parse(readFileSync(new URL(
  '../wrangler.wp3-h2-candidate.jsonc',import.meta.url),'utf8'));
 assert.equal(config.vars.D6_WP3_H2_DIAGNOSTICS_ENABLED,'false');
 for(const flag of [
  'D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
  'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
  'D6_WP3_H2_OPERATOR_APPROVED'
 ])assert.equal(config.vars[flag],'false',flag);
});
