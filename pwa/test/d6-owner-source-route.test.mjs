import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {collectPaths} from '../src/validation.mjs';
import {createD6OwnerSourceRoute,D6_SOURCE_ORIGIN,D6_SOURCE_PATH}
 from '../../experiments/p3/preview/src/d6-owner-source-route.mjs';
import {createD6HostedRevisionReader,D6HostedProofError,D6_TRUSTED_PAGES_BASE}
 from '../../experiments/p3/preview/src/d6-hosted-revision-reader.mjs';
import {createD6CanonicalSourceClient} from '../src/d6-canonical-authoring-source.mjs';

const REV='a'.repeat(40),TREE='b'.repeat(40),RID='c'.repeat(32),M='d'.repeat(64);
const proof=()=>({sourceRevision:REV,releaseId:RID,manifestSha256:M});
const data=Object.fromEntries(['gear','kb','catches'].map(domain=>[domain,
 JSON.parse(readFileSync(new URL('../'+({
  gear:'Gear/gear.json',kb:'KB/kb.json',catches:'Catches/catches.json',
 }[domain]),import.meta.url),'utf8'))]));
const files=[...collectPaths(data)];
const markdown=new Map(files.filter(p=>p.endsWith('.md')).map(p=>[p,'# Verified test narrative']));
const snapshot=()=>({
 repositoryId:1350909744,repositoryFullName:'ginosega/fishing',
 ref:'refs/heads/main',sourceRevision:REV,treeSha:TREE,
 sourceOnly:true,canPublish:false,
 data,files:new Set(files),markdown:new Map(markdown),
});
const owner=()=>({authorizeStatus:async()=>({
 authorized:true,ownerGitHubId:265665562,
})});
const req=(path=D6_SOURCE_PATH,init={})=>new Request(D6_SOURCE_ORIGIN+path,init);
const setup=({enabled=()=>true,ownerSession=owner(),
 readHostedRevision=async()=>proof(),loadSnapshot=async()=>snapshot()}={})=>
 createD6OwnerSourceRoute({ownerSession,readHostedRevision,loadSnapshot,enabled});
const parse=async response=>response.json();
const sha=v=>createHash('sha256').update(v).digest('hex');

function hostedFixture({change=()=>{},status=200,changedManifest=false}={}){
 const entries=[
  'index.html','loader.js','sw.js','manifest.webmanifest','icon.png',
  'releases/'+RID+'/app.js','releases/'+RID+'/styles.css',
  'releases/'+RID+'/content/Gear/gear.json',
  'releases/'+RID+'/content/KB/kb.json',
  'releases/'+RID+'/content/Catches/catches.json',
 ].map(path=>({path,bytes:0,sha256:'e'.repeat(64)}));
 const manifest={
  format:'fishing-companion-release-v2',releaseId:RID,
  sourceRevision:REV,base:'/fishing/',pendingMedia:false,
  d6ReaderCandidate:true,schemaVersions:{gear:2,kb:2,catches:2},
  files:entries,totalBytes:0,cardThumbnails:null,
 };
 const bytes=JSON.stringify(manifest);
 const pointer={
  id:RID,sourceRevision:REV,manifest:'releases/'+RID+'/manifest.json',
  manifestSha256:sha(bytes),schemaVersions:manifest.schemaVersions,
  pendingMedia:false,d6ReaderCandidate:true,
 };
 change(pointer,manifest);
 const responses={
  [D6_TRUSTED_PAGES_BASE+'release.json']:JSON.stringify(pointer),
  [D6_TRUSTED_PAGES_BASE+pointer.manifest]:
   changedManifest?JSON.stringify({...manifest,base:'/wrong/'}):JSON.stringify(manifest),
 };
 const calls=[];
 return {
  calls,
  fetchAsset:async(url,opts)=>{
   calls.push({url,opts});
   const body=responses[url];
   return new Response(body??'{}',{
    status:body===undefined?404:status,
    headers:{'Content-Type':'application/json'},
   });
  },
 };
}

test('D6-ROUTE01 disabled route never checks session, hosted release or GitHub',async()=>{
 let calls=0;
 const route=setup({enabled:()=>false,ownerSession:{
  authorizeStatus:async()=>{calls++;return {};},
 },readHostedRevision:async()=>{calls++;return proof();},
 loadSnapshot:async()=>{calls++;return snapshot();}});
 const res=await route.serve(req());
 assert.equal(res.status,503);assert.equal(calls,0);
 assert.equal((await parse(res)).error,'TEMPORARILY_UNAVAILABLE');
});

test('D6-ROUTE02 URL/method/header allowlist rejects before auth or GitHub',async()=>{
 let count=0;
 const route=setup({ownerSession:{
  authorizeStatus:async()=>{count++;return owner().authorizeStatus();},
 }});
 for(const request of [
  req('/api/v3/operations'),
  req('/api/v3/authoring-source?sourceRevision='+REV),
  req('/api/v3/authoring-source#data'),
  req('/api/v3/authoring-source',{method:'POST'}),
  req('/api/v3/authoring-source',{headers:{Authorization:'Bearer fake'}}),
  new Request('https://attacker.invalid/api/v3/authoring-source'),
  new Request('http://fishing.ginosega.workers.dev/api/v3/authoring-source'),
  new Request('https://fishing-auth-p0-test.ginosega.workers.dev/api/v3/authoring-source'),
 ]){
  const res=await route.serve(request);
  assert.equal(res.status,404,request.url);
 }
 assert.equal(count,0);
});

test('D6-ROUTE03 nonowner, expired owner session and auth error never fetch source',async()=>{
 let calls=0;
 for(const session of [
  {authorizeStatus:async()=>({authorized:false,ownerGitHubId:265665562})},
  {authorizeStatus:async()=>({authorized:true,ownerGitHubId:123})},
  {authorizeStatus:async()=>{throw Error('expired');}},
 ]){
  const route=setup({ownerSession:session,
   readHostedRevision:async()=>{calls++;return proof();},
   loadSnapshot:async()=>{calls++;return snapshot();},
  });
  const res=await route.serve(req());
  assert.equal(res.status,401);
  assert.equal((await parse(res)).error,'OWNER_SESSION_REQUIRED');
 }
 assert.equal(calls,0);
});

test('D6-ROUTE04 owner response is read-only, scoped, no-store, no secret',async()=>{
 const checks=[];
 const route=setup({
  readHostedRevision:async()=>{checks.push('hosted');return proof();},
  loadSnapshot:async a=>{checks.push(a);return {
   ...snapshot(),token:'secret-must-not-leak',
   csrfToken:'private',writeToken:'private',canPublish:false,
  };},
 });
 const res=await route.serve(req());
 assert.equal(res.status,200);
 const body=await parse(res);
 assert.deepEqual(checks,['hosted',{expectedReleaseRevision:REV},'hosted']);
 assert.equal(body.repositoryId,1350909744);
 assert.equal(body.repositoryFullName,'ginosega/fishing');
 assert.equal(body.ref,'refs/heads/main');
 assert.equal(body.sourceRevision,REV);
 assert.equal(body.treeSha,TREE);
 assert.equal(body.sandboxOnly,false);
 assert.equal(body.markdown.length,markdown.size);
 assert.equal(body.files.length,files.length);
 assert.equal(res.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert.equal(res.headers.get('Vary'),'Cookie');
 assert.equal(res.headers.get('X-Robots-Tag'),'noindex, nofollow');
 for(const secret of ['token','csrfToken','writeToken','canPublish',
  'published','live','installationId','ownerGitHubId'])
  assert(!Object.hasOwn(body,secret),secret);
});

test('D6-ROUTE05 browser canonical-source client accepts projected source',async()=>{
 const route=setup();
 const client=createD6CanonicalSourceClient({
  root:D6_SOURCE_ORIGIN+'/fishing/',
  request:(url,opts)=>route.serve(new Request(url,opts)),
  expectedReleaseRevision:REV,enabled:()=>true,online:()=>true,
 });
 const data=await client.load({ownerVerified:true,readingMode:'Automatic'});
 assert.equal(data.sourceRevision,REV);
 assert.equal(data.repositoryId,1350909744);
 assert.equal(data.canPublish,false);
 assert.equal(data.sourceOnly,true);
});

test('D6-ROUTE06 main mismatch or changed hosted release never emits content',async()=>{
 for(const alter of [
  {sourceRevision:'f'.repeat(40)},
  {repositoryId:1430581407},
  {repositoryFullName:'ginosega/fishing-p3-sandbox'},
  {sourceOnly:false},
  {canPublish:true},
  {treeSha:'bad'},
  {files:[]},
 ]){
  const route=setup({loadSnapshot:async()=>({...snapshot(),...alter})});
  const result=await route.serve(req());
  assert.equal(result.status,503,JSON.stringify(alter));
  assert.equal((await parse(result)).ok,false);
 }
 let count=0;
 const changed=setup({
  readHostedRevision:async()=>count++===0?proof():{...proof(),releaseId:'e'.repeat(32)},
 });
 const res=await changed.serve(req());
 assert.equal(res.status,503);
 assert.equal((await parse(res)).error,'HOSTED_RELEASE_CHANGED');
});

test('D6-ROUTE07 malformed paths, unbounded output and provider errors deny',async()=>{
 for(const source of [
  {...snapshot(),files:new Set([...files,'Gear/%2e%2e/escape.png'])},
  {...snapshot(),markdown:new Map([...markdown,['Gear/unknown.md','bad']])},
  {...snapshot(),markdown:new Map([...markdown].map(([k,v],i)=>
   [k,i===0?'X'.repeat(131073):v]))},
 ]){
  const res=await setup({loadSnapshot:async()=>source}).serve(req());
  assert.equal(res.status,503);
 }
 for(const task of ['readHostedRevision','loadSnapshot']){
  const route=setup({[task]:async()=>{throw Error('provider down');}});
  assert.equal((await route.serve(req())).status,503);
 }
});

test('D6-HOST01 verifier uses only fixed Pages pointer and hashed V3 manifest',async()=>{
 const fixture=hostedFixture();
 const reader=createD6HostedRevisionReader({fetchAsset:fixture.fetchAsset,
  enabled:()=>true});
 const release=await reader.readHostedRevision();
 assert.equal(release.sourceRevision,REV);
 assert.equal(release.releaseId,RID);
 assert.equal(fixture.calls.length,2);
 assert.deepEqual(fixture.calls.map(x=>x.url),[
  D6_TRUSTED_PAGES_BASE+'release.json',
  D6_TRUSTED_PAGES_BASE+'releases/'+RID+'/manifest.json',
 ]);
 assert(fixture.calls.every(x=>x.opts.method==='GET'&&
  x.opts.redirect==='manual'&&x.opts.cache==='no-store'));
});

test('D6-HOST02 no network when disabled; V2, broken digest or hosted scope denied',async()=>{
 let count=0;
 const disabled=createD6HostedRevisionReader({
  fetchAsset:async()=>{count++;return new Response('{}');},
 });
 await assert.rejects(disabled.readHostedRevision(),
  x=>x instanceof D6HostedProofError&&x.code==='DISABLED');
 assert.equal(count,0);
 for(const fixture of [
  hostedFixture({change:p=>{p.d6ReaderCandidate=false;}}),
  hostedFixture({change:p=>{p.sourceRevision='bad';}}),
  hostedFixture({change:p=>{p.manifestSha256='f'.repeat(64);}}),
  hostedFixture({changedManifest:true}),
  hostedFixture({status:302}),
 ]){
  await assert.rejects(createD6HostedRevisionReader({
   fetchAsset:fixture.fetchAsset,enabled:()=>true,
  }).readHostedRevision(),x=>x instanceof D6HostedProofError);
 }
});

test('D6-HOST03 oversized manifest or pointer rejected without client fallback',async()=>{
 const fixture=hostedFixture();
 const fetchAsset=async(url,opts)=>{
  const r=await fixture.fetchAsset(url,opts);
  if(url.endsWith('release.json')){
   return new Response('X'.repeat(65537),{headers:{'Content-Type':'application/json'}});
  }
  return r;
 };
 await assert.rejects(createD6HostedRevisionReader({
  fetchAsset,enabled:()=>true,
 }).readHostedRevision(),e=>e.code==='HOSTED_TOO_LARGE');
});

test('D6-ROUTE08 source files do not install Worker, App token issuer or writer',()=>{
 const src=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-owner-source-route.mjs',
  import.meta.url),'utf8');
 assert.match(src,/enabled=\(\)=>false/);
 assert.match(src,/ownerSession\.authorizeStatus/);
 assert.match(src,/readHostedRevision\(\)/);
 assert.match(src,/loadSnapshot\(\{/);
 assert.doesNotMatch(src,/method:'POST'|method:'PUT'|method:'PATCH'|issueWriteToken/);
});
