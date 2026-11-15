import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker,{createD6Wp3H2Worker}
 from '../server/d6-wp3-h2-worker.mjs';
import {createD6Wp3H2OperatorApproval}
 from '../server/d6-wp3-h2-operator-approval.mjs';
import {D6_WP3_STAGING_ORIGIN as ORIGIN}
 from '../src/d6-public-reader.mjs';
import {D6_WP3_ISOLATED_PAGES_BASE as PAGES}
 from '../server/d6-pages-path-gateway.mjs';

const NOW=2000000000,MAIN='a'.repeat(40);
const OP='123e4567-e89b-42d3-a456-426614174000';
const REC='h2-synthetic-kb-publishing-proof';
const PATH='KB/Techniques/content/'+REC+'.md';
const STEPS=['tree','branch','commit','advance','pr'];
const payload=()=>JSON.stringify({
 idempotencyKey:'h2_synthetic_single_intent_key',
 snapshot:{package:{
  format:'fishing-companion-change-v2',domain:'kb',
  operation:'add',id:REC,
  base:{schemaVersion:2,sourceRevision:MAIN,recordHash:null},
  record:{id:REC,type:'technique',name:'H2 synthetic proof'},
  notes:{action:'create',path:PATH,body:'# H2 synthetic proof\n'},
  picture:{action:'keep'},pictureSequence:{action:'keep'},
 },media:[]},
});
const digest=x=>createHash('sha256').update(x).digest('hex');
const approval=(extra={})=>({
 D6_WP3_H2_OPERATOR_APPROVED:'true',
 D6_WP3_H2_TEST_NAME:'WP3-H2-SYNTH-KB-001',
 D6_WP3_H2_APPROVED_PHASE:'intake',
 D6_WP3_H2_APPROVED_START:String(NOW-100),
 D6_WP3_H2_APPROVED_END:String(NOW+100),
 D6_WP3_H2_APPROVED_SOURCE_REVISION:MAIN,
 D6_WP3_H2_APPROVED_ENVELOPE_SHA256:digest(payload()),
 D6_WP3_H2_APPROVED_RECORD_ID:REC,
 D6_WP3_H2_APPROVED_NOTES_PATH:PATH,
 ...extra,
});
const req=(path='/api/v3/operations',body=payload(),url=ORIGIN)=>
 new Request(url+path,{method:'POST',headers:{
  'Content-Type':'application/json',
  Origin:url,'Sec-Fetch-Site':'same-origin',
 },body});
const gate=(env,now=()=>NOW)=>createD6Wp3H2OperatorApproval({
 env,now,cryptoApi:webcrypto,
});
const phase=(step='tree',extra={})=>approval({
 D6_WP3_H2_APPROVED_PHASE:'steps',
 D6_WP3_H2_APPROVED_OPERATION_ID:OP,
 D6_WP3_H2_APPROVED_STEP:step,
 D6_WP3_H2_APPROVED_STEP_PREFIX:
  STEPS.slice(0,STEPS.indexOf(step)).join(','),
 ...extra,
});

test('WP3-H2S01 no operator grant until exact two-phase server approval',async()=>{
 for(const v of [
  {},approval({D6_WP3_H2_OPERATOR_APPROVED:'false'}),
  approval({D6_WP3_H2_TEST_NAME:'other'}),
  approval({D6_WP3_H2_APPROVED_PHASE:'other'}),
  approval({D6_WP3_H2_APPROVED_RECORD_ID:'real-record'}),
  approval({D6_WP3_H2_APPROVED_END:String(NOW+4000)}),
  approval({D6_WP3_H2_APPROVED_ENVELOPE_SHA256:'not-hash'}),
  approval({D6_WP3_H2_APPROVED_NOTES_PATH:'KB/Knots/content/x.md'}),
  approval({D6_WP3_H2_APPROVED_OPERATION_ID:OP}),
 ]){
  const g=gate(v);
  assert.equal(g.approved(),false);
  assert.equal(await g.permit(req()),false);
 }
 const current=approval();
 assert.equal(gate(current,()=>NOW+200).approved(),false);
 assert.equal(gate(current,()=>NOW-200).approved(),false);
});

test('WP3-H2S02 exact approved synthetic intent, no bytes changed in clone',async()=>{
 const env=approval(),g=gate(env);
 assert.equal(g.approved(),true);
 const request=req();
 assert.equal(await g.permit(request),true);
 assert.equal(await request.text(),payload());
 assert.equal(await g.permit(req('/api/v3/media')),false);
 assert.equal(await g.permit(req('/api/v3/operations/'+OP+'/begin')),false);
 assert.equal(await g.permit(req('/api/v3/operations?other=1')),false);
 assert.equal(await g.permit(req('/api/v3/operations',payload(),
  'https://evil.invalid')),false);
});

test('WP3-H2S03 altered metadata/body/record/revision always deny before writer',async()=>{
 const g=gate(approval());
 const variants=[
  payload()+' ',
  payload().replace('H2 synthetic proof','Real gear record'),
  payload().replace('"domain":"kb"','"domain":"gear"'),
  payload().replace('"type":"technique"','"type":"equipment"'),
  payload().replace(MAIN,'b'.repeat(40)),
  payload().replace('"media":[]','"media":[{"path":"x"}]'),
 ];
 for(const body of variants)
  assert.equal(await g.permit(req('/api/v3/operations',body)),false);
 const bearer=new Request(ORIGIN+'/api/v3/operations',{
  method:'POST',headers:{Authorization:'Bearer hidden',
   'Content-Type':'application/json'},body:payload(),
 });
 assert.equal(await g.permit(bearer),false);
});

test('WP3-H2S04 second phase permits only the operation-owned status/begin/reconcile',async()=>{
 const g=gate(phase('tree'));
 assert.equal(g.approved(),true);
 for(const op of ['status','begin','reconcile'])
  assert.equal(await g.permit(req('/api/v3/operations/'+OP+'/'+op)),
   true,op);
 for(const path of [
  '/api/v3/operations',
  '/api/v3/media','/api/v3/media/reconcile',
  '/api/v3/operations/'+OP+'/publish',
  '/api/v3/operations/111e4567-e89b-42d3-a456-426614174000/begin',
 ])assert.equal(await g.permit(req(path)),false,path);
});

test('WP3-H2S05 one exact step needs server-held prefix and operation proof',async()=>{
 for(let i=0;i<STEPS.length;i++){
  const step=STEPS[i],env=phase(step),g=gate(env);
  const proof={operationId:OP,step,domain:'kb',recordId:REC,
   sourceRevision:MAIN,verifiedSteps:STEPS.slice(0,i)};
  assert.equal(await g.authorizeStep(proof),true,step);
  for(const bad of [
   {...proof,operationId:'111e4567-e89b-42d3-a456-426614174000'},
   {...proof,step:'pr'}, {...proof,domain:'gear'},
   {...proof,recordId:'h2-synthetic-other'},
   {...proof,sourceRevision:'b'.repeat(40)},
   {...proof,verifiedSteps:[]},
  ])if(JSON.stringify(bad)!==JSON.stringify(proof))
   assert.equal(await g.authorizeStep(bad),false,step);
  env.D6_WP3_H2_APPROVED_STEP_PREFIX='pr';
  if(step!=='pr')assert.equal(await g.authorizeStep(proof),false);
 }
 const expired=gate(phase('tree'),()=>NOW+10000);
 assert.equal(await expired.authorizeStep({operationId:OP,step:'tree'}),false);
});

const readEnv=(extra={})=>({
 D6_WP3_H2_SOURCE_READY:'true',D6_WP3_H1_READ_ONLY_ENABLED:'false',
 D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
 D6_ORIGIN:ORIGIN,D6_OWNER_GITHUB_ID:'265665562',
 D6_REPOSITORY_ID:'1350909744',
 D6_WP3_ISOLATED_READ_ENABLED:'true',
 D6_WP3_ISOLATED_PAGES_ENABLED:'true',
 D6_WP3_READ_PROFILE_ENABLED:'true',
 D6_WP2_STAGING_ENABLED:'false',
 D6_ISOLATED_PAGES_ENABLED:'false',
 D6_STATIC_ENABLED:'true',D6_SESSION_ENABLED:'true',
 D6_OAUTH_ENABLED:'true',D6_SOURCE_ENABLED:'true',
 D6_READ_TOKEN_ENABLED:'true',D6_SIGNER_ENABLED:'true',
 D6_WP3_RUNTIME_ENABLED:'false',
 D6_WP3_WRITE_ENABLED:'false',
 D6_WP3_MOUNT_ENABLED:'false',
 D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:'false',
 D6_WP3_H2_OPERATOR_APPROVED:'false',
 ...extra,
});
function fixture(){
 const calls=[];
 const host=createD6Wp3H2Worker({
  now:()=>NOW,cryptoApi:webcrypto,
  network:async(url,options)=>{
   calls.push({url,method:options.method});
   if(url===PAGES+'release.json')return new Response(
    '{"isolatedH2ReadCandidate":true}',{
     status:200,headers:{'Content-Type':'application/json'},
    });
   throw Error('No actual GitHub provider call is permitted');
  },
 });
 return {host,calls};
}
const page=()=>new Request(ORIGIN+'/fishing/release.json');

test('WP3-H2W01 exact isolated read remains available, all writer gates off',async()=>{
 const x=fixture();
 assert.equal((await x.host.fetch(page(),readEnv())).status,200);
 assert.deepEqual(x.calls,[{url:PAGES+'release.json',method:'GET'}]);
 for(const path of ['/api/v3/operations',
  '/api/v3/operations/'+OP+'/begin','/api/v3/media',
  '/api/v3/media/reconcile']){
  assert.equal((await x.host.fetch(req(path),readEnv())).status,404);
 }
 assert.equal(x.calls.length,1);
 assert.equal((await x.host.fetch(page(),{})).status,503);
});

test('WP3-H2W02 wrong/combined read profile cannot construct H2 writer',async()=>{
 for(const overrides of [
  {D6_WP3_H2_SOURCE_READY:'false'},
  {D6_WP3_H1_READ_ONLY_ENABLED:'true'},
  {D6_ORIGIN:'https://fishing.ginosega.workers.dev'},
  {D6_WP2_STAGING_ENABLED:'true'},
  {D6_ISOLATED_PAGES_ENABLED:'true'},
  {D6_OWNER_GITHUB_ID:'1'},
  {D6_WP3_ISOLATED_READ_ENABLED:'false'},
 ]){
  const x=fixture();
  assert.equal((await x.host.fetch(page(),readEnv(overrides))).status,
   503);
  assert.equal(x.calls.length,0);
 }
});

test('WP3-H2W03 even four write switches ON cannot bypass operator or content',async()=>{
 const x=fixture(),flags={
  D6_WP3_RUNTIME_ENABLED:'true',
  D6_WP3_WRITE_ENABLED:'true',D6_WP3_MOUNT_ENABLED:'true',
  D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:'true',
 };
 assert.equal((await x.host.fetch(req(),readEnv(flags))).status,404);
 const approved=readEnv({...flags,...approval()});
 assert.equal((await x.host.fetch(req('/api/v3/operations',
  payload()+' '),approved)).status,404);
 assert.equal((await x.host.fetch(req('/api/v3/media'),approved)).status,
  404);
 // Exact intent reaches existing trusted D2 boundary, but does not bypass
 // the absent owner session/CSRF or cause D1/GitHub mutation.
 assert.equal((await x.host.fetch(req(),approved)).status,403);
 assert.equal(x.calls.length,0);
 approved.D6_WP3_H2_OPERATOR_APPROVED='false';
 assert.equal((await x.host.fetch(req(),approved)).status,404);
});

test('WP3-H2W04 source-only config, no installed grant or Worker token methods',()=>{
 const config=JSON.parse(readFileSync(new URL(
  '../wrangler.wp3-h2-candidate.jsonc',import.meta.url),'utf8'));
 assert.equal(config.name,'fishing-v3-wp3-test');
 assert.equal(config.main,'./server/d6-wp3-h2-worker.mjs');
 for(const flag of ['D6_WP3_RUNTIME_ENABLED','D6_WP3_WRITE_ENABLED',
  'D6_WP3_MOUNT_ENABLED','D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED',
  'D6_WP3_H2_OPERATOR_APPROVED'])
  assert.equal(config.vars[flag],'false');
 assert.equal(config.vars.D6_WP3_H2_SOURCE_READY,'true');
 assert.deepEqual(Object.keys(worker),['fetch']);
 assert(Object.isFrozen(worker));
 for(const name of ['authorizeStep','ownerApproval','issueToken','publish',
  'merge','migrate','deploy','receipt','sign'])
  assert.equal(name in worker,false);
});
