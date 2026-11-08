import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectPaths} from '../src/validation.mjs';
import {
 createD6CanonicalSourceClient,D6SourceError,D6_CANONICAL_REPOSITORY,
} from '../src/d6-canonical-authoring-source.mjs';
import {D6_READER_ORIGIN} from '../src/d6-public-reader.mjs';

const REV='a'.repeat(40),TREE='b'.repeat(40);
const root=D6_READER_ORIGIN+'/fishing/';
const data=Object.fromEntries(['gear','kb','catches'].map(k=>[k,
 JSON.parse(readFileSync(new URL('../'+({gear:'Gear/gear.json',
  kb:'KB/kb.json',catches:'Catches/catches.json'}[k]),import.meta.url),'utf8'))]));
const referenced=[...collectPaths(data)];
const markdownPaths=referenced.filter(p=>p.endsWith('.md'));
const canonical=()=>({
 ok:true,repositoryId:D6_CANONICAL_REPOSITORY.id,
 repositoryFullName:D6_CANONICAL_REPOSITORY.fullName,
 ref:D6_CANONICAL_REPOSITORY.ref,sourceRevision:REV,treeSha:TREE,
 sandboxOnly:false,data,files:[...referenced],
 markdown:markdownPaths.map(path=>({path,body:'Canonical synthetic Markdown fixture.'})),
});
const response=(body,{status=200,contentType='application/json'}={})=>
 new Response(typeof body==='string'?body:JSON.stringify(body),
 {status,headers:{'Content-Type':contentType}});
const client=(request,opts={})=>createD6CanonicalSourceClient({
 root,expectedReleaseRevision:REV,request,
 enabled:()=>true,online:()=>true,...opts,
});
const ok={readingMode:'Automatic',ownerVerified:true};
const rejected=async(request,code='UNTRUSTED_SOURCE')=>{
 await assert.rejects(client(request).load(ok),e=>
  e instanceof D6SourceError&&e.code===code);
};

test('D6-SRC01 canonical GitHub response validates real Gear/KB/Catches schemas',async()=>{
 assert(referenced.length>10);
 assert(markdownPaths.length>0);
 const calls=[];
 const result=await client(async(url,options)=>{
  calls.push({url,options});
  return response(canonical());
 }).load(ok);
 assert.deepEqual(calls,[{
  url:D6_READER_ORIGIN+'/api/v3/authoring-source',
  options:{method:'GET',credentials:'same-origin',cache:'no-store',
   redirect:'manual',headers:{Accept:'application/json'}},
 }]);
 assert.equal(result.sourceRevision,REV);
 assert.equal(result.repositoryId,1350909744);
 assert.equal(result.repositoryFullName,'ginosega/fishing');
 assert.equal(result.ref,'refs/heads/main');
 assert.equal(result.treeSha,TREE);
 assert.equal(result.files.size,referenced.length);
 assert.equal(result.markdown.size,markdownPaths.length);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.canPublish,false);
 assert.equal(Object.isFrozen(result),true);
 for(const field of ['publish','auth','csrfToken','stageMedia','installationToken',
  'canonicalLive','authorized','sandboxOnly'])assert.equal(Object.hasOwn(result,field),false);
});

test('D6-SRC02 no request unless explicitly enabled, owner verified, online and Automatic',async()=>{
 let requests=0;
 const fn=async()=>{requests++;return response(canonical());};
 await assert.rejects(client(fn,{enabled:()=>false}).load(ok),
  e=>e.code==='DISABLED');
 await assert.rejects(client(fn,{online:()=>false}).load(ok),
  e=>e.code==='OFFLINE');
 for(const readingMode of ['Checking','Work Offline','Unknown']){
  await assert.rejects(client(fn).load({ownerVerified:true,readingMode}),
   e=>e.code==='OFFLINE');
 }
 for(const ownerVerified of [false,undefined,null]){
  await assert.rejects(client(fn).load({readingMode:'Automatic',ownerVerified}),
   e=>e.code==='OWNER_SESSION_REQUIRED');
 }
 assert.equal(requests,0);
});

test('D6-SRC03 sandbox, foreign repo, other branch and spoofed content source rejected',async()=>{
 for(const overrides of [
  {repositoryId:1430581407},{repositoryFullName:'ginosega/fishing-p3-sandbox'},
  {ref:'refs/heads/feature/foo'},{sandboxOnly:true},
  {ok:false},{treeSha:'bad'}, {sourceRevision:'notsha'},
  {files:null},{markdown:null},{data:null},
 ]){
  await rejected(async()=>response({...canonical(),...overrides}));
 }
});

test('D6-SRC04 changed GitHub main revision cannot be used with older release',async()=>{
 await rejected(async()=>response({...canonical(),sourceRevision:'c'.repeat(40)}),
  'SOURCE_REVISION_MISMATCH');
});

test('D6-SRC05 missing files, markdown, case collisions and path escape fail closed',async()=>{
 const initial=canonical(),first=referenced.find(path=>!path.endsWith('.md')),
  markdown=markdownPaths[0];
 assert(first&&markdown);
 const invalid=[
  {...initial,files:initial.files.filter(path=>path!==first)},
  {...initial,markdown:initial.markdown.filter(item=>item.path!==markdown)},
  {...initial,files:[...initial.files,first.toUpperCase()]},
  {...initial,files:[...initial.files,'Gear/../private.png']},
  {...initial,files:[...initial.files,'Gear/%2e%2e/fake.png']},
 ];
 const codes=['MISSING_CANONICAL_FILE','MISSING_CANONICAL_MARKDOWN',
  'UNTRUSTED_SOURCE','UNTRUSTED_SOURCE','UNTRUSTED_SOURCE'];
 for(let i=0;i<invalid.length;i++)
  await rejected(async()=>response(invalid[i]),codes[i]);
});

test('D6-SRC05B Markdown inline image references must match the canonical file tree',async()=>{
 const broken=canonical();
 broken.markdown=broken.markdown.map((item,index)=>index===0?
  {...item,body:'![Missing local image](./d6-synthetic-missing-image.png)'}:item);
 await rejected(async()=>response(broken),'INVALID_MARKDOWN_REFERENCES');
});

test('D6-SRC06 malformed or oversized JSON, stale token and bad schema fail closed',async()=>{
 await rejected(async()=>response({}), 'UNTRUSTED_SOURCE');
 await rejected(async()=>response('not json'), 'INVALID_RESPONSE');
 await rejected(async()=>response(canonical(),{status:403}), 'OWNER_SESSION_REQUIRED');
 await rejected(async()=>response(canonical(),{status:302}), 'SOURCE_UNAVAILABLE');
 await rejected(async()=>response(canonical(),{contentType:'text/html'}),
  'SOURCE_UNAVAILABLE');
 await rejected(async()=>{throw Error('offline');}, 'SOURCE_UNAVAILABLE');
 await rejected(async()=>response('x'.repeat(2*1024*1024+1)), 'SOURCE_TOO_LARGE');
 await rejected(async()=>response({...canonical(),data:{...data,gear:null}}),
  'INVALID_RECORDS');
});

test('D6-SRC07 exact intended origin and verified root required',()=>{
 for(const path of [
  'https://ginosega.github.io/fishing/',
  'https://fishing-auth-p0-test.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/',
  'https://fishing.ginosega.workers.dev/fishing/__v3_owner_candidate__/',
  'http://fishing.ginosega.workers.dev/fishing/',
  'https://fishing.ginosega.workers.dev/fishing/?source=sandbox',
  'https://u:p@fishing.ginosega.workers.dev/fishing/',
  'not a URL',
 ]){
  assert.throws(()=>client(async()=>response(canonical()),{root:path}),
   e=>e.code==='INVALID_CONFIG');
 }
 assert.throws(()=>client(async()=>response(canonical()),
  {expectedReleaseRevision:'notsha'}),e=>e.code==='INVALID_CONFIG');
});

test('D6-SRC08 bootstrap and owner status are read-only, not publication integration',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const entry=read('../src/entry.mjs'),ui=read('../src/ui.mjs');
 assert.match(entry,/createD6CanonicalSourceClient/);
 assert.match(entry,/expectedReleaseRevision:settings.release.sourceRevision/);
 assert.match(ui,/ownerVerified:true/);
 assert.match(ui,/canonicalSource\?\.load/);
 assert.match(ui,/source\?\.sourceOnly===true/);
 assert.match(ui,/source\?\.canPublish===false/);
 assert.match(ui,/Editing and publishing are disabled/);
 assert.match(ui,/if\(readerOnly\)return missing\('V3 reader preview is read-only/);
 assert.doesNotMatch(entry,/createD3OwnerTestShell|createD3AuthoringClient|publishChange/);
});
