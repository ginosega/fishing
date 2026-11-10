import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionPublishIntake,D6PublishIntakeError,
 D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';

const MAIN='a'.repeat(40),OLD='b'.repeat(40),ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const key='sample_idempotency_key_1234';
const pkg=()=>({
 format:'fishing-companion-change-v2',
 domain:'gear',operation:'add',id:'test-item',
 base:{schemaVersion:2,sourceRevision:MAIN,recordHash:null},
 record:{id:'test-item',name:'Test item',category:'Lures'},
 notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'},
});
const body=(packageValue=pkg(),media=[])=>JSON.stringify({
 idempotencyKey:key,snapshot:{package:packageValue,media},
});
const req=(payload=body(),options={})=>{
 const {headers:extraHeaders={},...rest}=options;
 return new Request(ORIGIN+'/api/v3/operations',{
  method:'POST',...rest,
  headers:{
   Origin:ORIGIN,'Sec-Fetch-Site':'same-origin',
   'X-Fish-V3-Intent':'publish',
   'X-Fish-V3-CSRF':'C'.repeat(43),
   'Content-Type':'application/json',
   ...extraHeaders,
  },
  body:payload,
 });
};
const expectCode=async(promise,code)=>assert.rejects(promise,
 error=>error instanceof D6PublishIntakeError&&error.code===code);
function setup({enabled=true,ownerId=265665562,denyOwner=false}={}){
 let calls=0,created=0;
 const instance=createD6ProductionPublishIntake({
  enabled:()=>enabled,
  sessionFactory:config=>{
   created++;
   assert.equal(config.ownerGitHubId,265665562);
   assert.equal(config.origin,ORIGIN);
   return {authorizeWrite:async request=>{
    calls++;
    if(denyOwner||request.method!=='POST'||
       request.headers.get('Origin')!==ORIGIN||
       request.headers.get('Sec-Fetch-Site')!=='same-origin'||
       request.headers.get('X-Fish-V3-Intent')!=='publish'||
       request.headers.get('X-Fish-V3-CSRF')!=='C'.repeat(43))
     throw Error('D2 session/CSRF denied');
    return {ownerGitHubId:ownerId,authorized:true};
   }};
  },
 });
 return {instance,counts:()=>({created,calls})};
}
test('D6-INTAKE01 globally default-OFF with no D1/GitHub access',async()=>{
 let sessionBuilds=0;
 const intake=createD6ProductionPublishIntake({
  sessionFactory:()=>{sessionBuilds++;throw Error('unexpected');},
 });
 await expectCode(intake.inspect(req(),{trustedMainSha:MAIN}),'DISABLED');
 assert.equal(sessionBuilds,0);
 assert.deepEqual(Object.keys(intake),['inspect']);
 assert(Object.isFrozen(intake));
});
test('D6-INTAKE02 exact HTTPS origin, route, method and no query/bearer',async()=>{
 const x=setup();
 for(const request of [
  new Request('https://other.invalid/api/v3/operations',{method:'POST'}),
  new Request(ORIGIN+'/api/v3/operations?repo=other',{method:'POST'}),
  new Request(ORIGIN+'/api/v3/operations/123',{method:'POST'}),
  new Request(ORIGIN+'/api/v3/operations'),
  req(body(),{headers:{Authorization:'Bearer bad'}}),
 ]){
  await expectCode(x.instance.inspect(request,{trustedMainSha:MAIN}),
   'ROUTE_DENIED');
 }
 assert.deepEqual(x.counts(),{created:0,calls:0});
});
test('D6-INTAKE03 real server-supplied exact canonical main SHA required',async()=>{
 const x=setup();
 for(const main of [undefined,'','bad','1'.repeat(39)]){
  await expectCode(x.instance.inspect(req(),{trustedMainSha:main}),
   'UNVERIFIED_MAIN');
 }
 assert.deepEqual(x.counts(),{created:0,calls:0});
});
test('D6-INTAKE04 reuses owner CSRF verifier; unauthorized never parsed',async()=>{
 const x=setup({denyOwner:true});
 await expectCode(x.instance.inspect(req('{invalid json'),
  {trustedMainSha:MAIN}),'OWNER_DENIED');
 assert.deepEqual(x.counts(),{created:1,calls:1});
 const y=setup({ownerId:1430581407});
 await expectCode(y.instance.inspect(req(),{trustedMainSha:MAIN}),
  'OWNER_DENIED');
});
test('D6-INTAKE05 approved owner yields internal non-submitting envelope',async()=>{
 const x=setup();
 const result=await x.instance.inspect(req(),{trustedMainSha:MAIN});
 assert.deepEqual(Object.keys(D6_PUBLISH_REPOSITORY).sort(),
  ['id','name','ownerGitHubId','ref']);
 assert.equal(result.id,1350909744);
 assert.equal(result.name,'ginosega/fishing');
 assert.equal(result.ref,'refs/heads/main');
 assert.equal(result.ownerGitHubId,265665562);
 assert.equal(result.trustedMainSha,MAIN);
 assert.equal(result.submittedSourceRevision,MAIN);
 assert.equal(result.idempotencyKey,key);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.requiresSourceReview,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.operationId,undefined);
 assert.equal(result.releaseId,undefined);
 assert(Object.isFrozen(result));
 assert(Object.isFrozen(result.snapshot));
 assert(Object.isFrozen(result.snapshot.package.base));
 assert.deepEqual(x.counts(),{created:1,calls:1});
});
test('D6-INTAKE06 stale submitted source does not silently overwrite',async()=>{
 const p=pkg();p.base.sourceRevision=OLD;
 const result=await setup().instance.inspect(req(body(p)),
  {trustedMainSha:MAIN});
 assert.equal(result.submittedSourceRevision,OLD);
 assert.equal(result.trustedMainSha,MAIN);
 assert.equal(result.requiresSourceReview,true);
 assert.equal(result.canPublish,false);
});
test('D6-INTAKE07 sandbox/repository/identity injection is rejected',async()=>{
 const variants=[
  {...JSON.parse(body()),repositoryId:1430581407},
  {...JSON.parse(body()),ownerGitHubId:265665562},
  {...JSON.parse(body()),canPublish:true},
  {...JSON.parse(body()),sandboxOnly:true},
 ];
 for(const value of variants){
  await expectCode(setup().instance.inspect(req(JSON.stringify(value)),
   {trustedMainSha:MAIN}),'INVALID_SUBMISSION');
 }
});
test('D6-INTAKE08 media, pictures and Catch are not yet enabled',async()=>{
 const image={path:'Gear/x/assets/a.png',bytes:3};
 await expectCode(setup().instance.inspect(req(body(pkg(),[image])),
  {trustedMainSha:MAIN}),'INVALID_SUBMISSION');
 const withPicture=pkg();withPicture.picture.action='add';
 await expectCode(setup().instance.inspect(req(body(withPicture)),
  {trustedMainSha:MAIN}),'INVALID_SUBMISSION');
 const catchPkg=pkg();catchPkg.domain='catches';
 await expectCode(setup().instance.inspect(req(body(catchPkg)),
  {trustedMainSha:MAIN}),'INVALID_SUBMISSION');
});
test('D6-INTAKE09 strict package/JSON/idempotency/shape guard',async()=>{
 const badBase=pkg();badBase.base.sourceRevision='bad';
 const cases=[
  '{not json',body(badBase),
  JSON.stringify({idempotencyKey:'short',
   snapshot:{package:pkg(),media:[]}}),
  JSON.stringify({idempotencyKey:key,snapshot:{package:pkg()}}),
  JSON.stringify(JSON.parse(body()),null,2),
  '{"idempotencyKey":"'+key+'","snapshot":{"package":'+
   JSON.stringify(pkg())+',"media":[]},"__proto__":{"x":1}}',
 ];
 for(const payload of cases){
  await assert.rejects(setup().instance.inspect(req(payload),
   {trustedMainSha:MAIN}),D6PublishIntakeError);
 }
});
test('D6-INTAKE10 original non-submitting contract caps input bytes',async()=>{
 const x=setup();
 const huge=body().slice(0,-1)+('x'.repeat(130*1024))+'}';
 await expectCode(x.instance.inspect(req(huge),
  {trustedMainSha:MAIN}),'PAYLOAD_TOO_LARGE');
 await expectCode(x.instance.inspect(req(body(),{headers:{
  'Content-Length':'999999999',
 }}),{trustedMainSha:MAIN}),'PAYLOAD_TOO_LARGE');
});
test('D6-INTAKE11 missing runtime D1/CSRF fails closed when enabled',async()=>{
 const intake=createD6ProductionPublishIntake({enabled:()=>true});
 await expectCode(intake.inspect(req(),{trustedMainSha:MAIN}),
  'OWNER_DENIED');
});
