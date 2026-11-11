import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6OwnerSessionReadiness} from '../src/d6-owner-session-readiness.mjs';
import {D6_READER_ORIGIN} from '../src/d6-public-reader.mjs';

const root=D6_READER_ORIGIN+'/fishing/';
const automatic={readingMode:'Automatic'};
const respond=(body,{status=200,contentType='application/json'}={})=>
 new Response(typeof body==='string'?body:JSON.stringify(body),{
  status,headers:{'Content-Type':contentType},
 });
const make=(request,opts={})=>createD6OwnerSessionReadiness({
 root,request,enabled:()=>true,online:()=>true,...opts,
});

test('D6-SES01 default-off and unverified reading mode never make session requests',async()=>{
 let requests=0;
 const fake=()=>{requests++;return respond({authenticated:true,authorized:true});};
 const disabled=make(fake,{enabled:()=>false});
 assert.deepEqual(await disabled.check(automatic),{state:'Offline',canPublish:false});
 const networkOff=make(fake,{online:()=>false});
 assert.deepEqual(await networkOff.check(automatic),{state:'Offline',canPublish:false});
 const available=make(fake);
 for(const mode of [undefined,'Checking','Work Offline','Unknown']){
  const result=await available.check(mode?{readingMode:mode}:undefined);
  assert.deepEqual(result,{state:'Offline',canPublish:false});
 }
 assert.equal(requests,0);
});

test('D6-SES02 session is a one-time same-origin, credentialed READ with no write',async()=>{
 const requests=[];
 const probe=make(async(url,options)=>{
  requests.push({url,options});
  return respond({authenticated:true,authorized:true,
   ownerLogin:'ginosega',csrfToken:'secret-that-must-not-be-kept',
   sandboxPublishingReady:true});
 });
 const result=await probe.check(automatic);
 assert.deepEqual(result,{state:'Owner',canPublish:false,ownerLogin:'ginosega'});
 assert.equal(Object.hasOwn(result,'csrfToken'),false);
 assert.equal(Object.hasOwn(result,'sandboxPublishingReady'),false);
 assert.equal(Object.hasOwn(result,'publish'),false);
 assert(Object.isFrozen(result));
 assert.deepEqual(requests,[{url:D6_READER_ORIGIN+'/session',options:{
  method:'GET',credentials:'same-origin',cache:'no-store',
  redirect:'manual',headers:{Accept:'application/json'},
 }}]);
});

test('D6-SES03 signed-out, nonowner and malformed owner names do not enable edits',async()=>{
 for(const [reply,expected] of [
  [{authenticated:false,authorized:false},'Signed out'],
  [{authenticated:true,authorized:false},'Not authorized'],
  [{authenticated:true,authorized:true,ownerLogin:'not a valid login!'},'Owner'],
 ]){
  const result=await make(async()=>respond(reply)).check(automatic);
  assert.equal(result.state,expected);
  assert.equal(result.canPublish,false);
  assert.equal(Object.hasOwn(result,'ownerLogin'),false);
 }
});

test('D6-SES04 malformed, redirected, unavailable and contradictory sessions fail closed',async()=>{
 const invalid=[
  async()=>respond('{}'),
  async()=>respond({authenticated:false,authorized:true}),
  async()=>respond({authenticated:'yes',authorized:true}),
  async()=>respond([]),
  async()=>respond('not json'),
  async()=>respond({authenticated:true,authorized:true},{status:403}),
  async()=>respond({authenticated:true,authorized:true},{status:302}),
  async()=>respond({authenticated:true,authorized:true},{contentType:'text/html'}),
  async()=>{throw Error('offline');},
  async()=>null,
 ];
 for(const request of invalid){
  const result=await make(request).check(automatic);
  assert.deepEqual(result,{state:'Unavailable',canPublish:false});
 }
});

test('D6-SES05 foreign, sandbox, rootless and credential-bearing addresses denied',()=>{
 const locations=[
  'https://ginosega.github.io/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/',
  'https://fishing.ginosega.workers.dev/fishing/__v3_owner_candidate__/',
  'http://fishing.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/fishing/?session=1',
  'https://u:p@fishing.ginosega.workers.dev/fishing/',
  'not a URL',
 ];
 for(const location of locations)
  assert.throws(()=>createD6OwnerSessionReadiness({
   root:location,request:async()=>respond({}),enabled:()=>true,online:()=>true,
  }),/invalid|denied/);
 const local=createD6OwnerSessionReadiness({
  root:'http://127.0.0.1:4173/fishing/',
  request:async()=>respond({authenticated:false,authorized:false}),
  enabled:()=>true,online:()=>true,
 });
 assert.equal(typeof local.check,'function');
});

test('D6-SES06 source entry has only read-only owner gate and no publisher',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const entry=read('../src/entry.mjs'),ui=read('../src/ui.mjs');
 const reader=read('../src/d6-public-reader.mjs');
 assert.match(entry,/if\(!d6Reader\)return \{\}/);
 assert.match(entry,/createD6OwnerSessionReadiness/);
 assert.match(entry,/ownerReadiness/);
 assert.match(ui,/Owner session verified/);
 assert.match(ui,/Editing and publishing are not enabled in this preview/);
 assert.match(ui,/if\(readerOnly\)void offline\.refreshMode\(\)\.then/);
 assert.match(ui,/ownerProbeSerial/);
 assert.match(ui,/check\(\{readingMode:mode\}\)/);
 assert.match(ui,/if\(readerOnly&&!ownerEditorPreview\)return missing\('V3 reader preview is read-only/);
 assert.match(ui,/const ownerEditorPreview=approvedConnection&&ctx\.v3\?\.ownerEditorPreview===true/);
 assert.match(ui,/await verifiedPreviewContext\(\)/);
 assert.match(reader,/readerOnly:true/);
 assert.doesNotMatch(entry,/createD3OwnerTestShell|createD3AuthoringClient|publishChange/);
});
