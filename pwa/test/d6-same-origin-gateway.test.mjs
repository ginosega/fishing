import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {collectPaths} from '../src/validation.mjs';
import {createD6SameOriginGateway} from
 '../../experiments/p3/preview/src/d6-same-origin-gateway.mjs';
import {createD6CanonicalSourceClient} from '../src/d6-canonical-authoring-source.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const PAGES='https://ginosega.github.io/fishing/';
const API='https://api.github.com/repos/ginosega/fishing';
const HEAD='a'.repeat(40),TREE='b'.repeat(40),PWA='c'.repeat(40);
const RELEASE='d'.repeat(32);
const sha256=raw=>createHash('sha256').update(raw).digest('hex');
const sha1=raw=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+Buffer.byteLength(raw)+'\0'),Buffer.from(raw),
])).digest('hex');
const json=x=>new Response(JSON.stringify(x),
 {headers:{'Content-Type':'application/json'}});
const req=(p='/',opt={})=>new Request(ORIGIN+p,opt);
const owner=()=>({
 describe:async()=>({authenticated:true,authorized:true,
  ownerLogin:'ginosega',ownerGitHubId:265665562,
  csrfToken:'PRIVATE_CSRF_SHOULD_NOT_LEAK',expiresAt:12345}),
 authorizeStatus:async()=>({ownerGitHubId:265665562,authorized:true}),
});
const rejectTransport=async()=>{throw Error('Provider must not be called');};
function gateway({
 flags={},fetchStaticAsset=rejectTransport,fetchHostedAsset=rejectTransport,
 requestGitHub=rejectTransport,issueReadToken=rejectTransport,
 ownerSession=owner(),
}={}){
 return createD6SameOriginGateway({
  fetchStaticAsset,fetchHostedAsset,requestGitHub,issueReadToken,ownerSession,
  gatewayEnabled:()=>flags.gateway??false,
  staticEnabled:()=>flags.static??false,
  sessionEnabled:()=>flags.session??false,
  sourceEnabled:()=>flags.source??false,
 });
}

test('D6-GW01 globally default off rejects every route without any providers',async()=>{
 let called=0;
 const fail=async()=>{called++;throw Error('Must not call');};
 const app=gateway({fetchStaticAsset:fail,fetchHostedAsset:fail,
  requestGitHub:fail,issueReadToken:fail,ownerSession:{
   describe:fail,authorizeStatus:fail,
  }});
 for(const p of ['/','/fishing/','/fishing/release.json','/session',
  '/api/v3/authoring-source','/auth/start','/api/v3/operations']){
  const r=await app.fetch(req(p));
  assert.equal(r.status,503,p);
  assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
 }
 assert.equal(called,0);
});

test('D6-GW02 explicit static gate maps root redirect and public Pages only',async()=>{
 const calls=[];
 const app=gateway({
  flags:{gateway:true,static:true},
  fetchStaticAsset:async(url,options)=>{
   calls.push({url,options});
   return new Response('pinned release',{headers:{
    'Content-Type':'application/json','Set-Cookie':'leak=1',
    Location:'https://attacker.invalid','Access-Control-Allow-Origin':'*',
   }});
  },
 });
 const redirect=await app.fetch(req('/'));
 assert.equal(redirect.status,302);
 assert.equal(redirect.headers.get('Location'),'/fishing/');
 assert.equal(calls.length,0);
 const asset=await app.fetch(req('/fishing/release.json'));
 assert.equal(asset.status,200);
 assert.equal(await asset.text(),'pinned release');
 assert.equal(asset.headers.get('Set-Cookie'),null);
 assert.equal(asset.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(asset.headers.get('Location'),null);
 assert.deepEqual(calls,[{url:PAGES+'release.json',
  options:{method:'GET',redirect:'manual'}}]);
 const head=await app.fetch(req('/fishing/sw.js',{method:'HEAD'}));
 assert.equal(head.status,200);assert.equal(head.body,null);
 assert.equal(calls[1].options.method,'HEAD');
});

test('D6-GW03 static-only operation cannot reach session, source or a write API',async()=>{
 let called=0;
 const app=gateway({flags:{gateway:true,static:true},
  ownerSession:{
   describe:async()=>{called++;return {};},
   authorizeStatus:async()=>{called++;return {};},
  },fetchStaticAsset:async()=>new Response('asset')});
 for(const p of ['/session','/api/v3/authoring-source']){
  const r=await app.fetch(req(p));assert.equal(r.status,503,p);
 }
 for(const p of ['/api/v3/operations','/api/v3/media','/auth/start',
  '/auth/callback','/session/signout','/api/v3/assets/original',
  '/fishing/__v3_owner_candidate__/','/fishing/__d3_pilot__/',
  '/fishing/secret','/fishing/releases/malformed/app.js']){
  const r=await app.fetch(req(p));assert.equal(r.status,404,p);
 }
 assert.equal(called,0);
});

test('D6-GW04 session status strips CSRF, owner ID, session and token fields',async()=>{
 const app=gateway({flags:{gateway:true,session:true}});
 const r=await app.fetch(req('/session'));
 assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 for(const key of ['Set-Cookie','Access-Control-Allow-Origin'])
  assert.equal(r.headers.get(key),null);
 assert.equal(r.headers.get('Vary'),'Cookie');
 assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
 const noOwner=gateway({flags:{gateway:true,session:true},ownerSession:{
  describe:async()=>({authenticated:false,authorized:false,
   csrfToken:'SECRET'}),authorizeStatus:async()=>({authorized:false}),
 }});
 const status=await noOwner.fetch(req('/session'));
 assert.deepEqual(await status.json(),{authenticated:false,authorized:false});
});

test('D6-GW05 session errors, contradictions and bearer headers fail closed',async()=>{
 for(const describe of [
  async()=>{throw Error('DB expired');},
  async()=>({authenticated:true}),
  async()=>({authenticated:false,authorized:true}),
 ]){
  const app=gateway({flags:{gateway:true,session:true},
   ownerSession:{describe,authorizeStatus:async()=>({authorized:false})}});
  assert.equal((await app.fetch(req('/session'))).status,503);
 }
 const app=gateway({flags:{gateway:true,session:true}});
 for(const r of [
  req('/session?sourceRevision='+HEAD),
  req('/session',{method:'POST'}),
  req('/session',{headers:{Authorization:'Bearer fake'}}),
 ]){
  assert.equal((await app.fetch(r)).status,404);
 }
});

test('D6-GW06 no cross-origin access or writable request reaches provider',async()=>{
 let called=0;
 const record=async()=>{called++;return json({});};
 const app=gateway({flags:{gateway:true,static:true,session:true,source:true},
  fetchStaticAsset:record,fetchHostedAsset:record,requestGitHub:record,
  issueReadToken:record,ownerSession:{describe:record,authorizeStatus:record}});
 for(const r of [
  new Request('https://attacker.invalid/session'),
  new Request('http://fishing.ginosega.workers.dev/session'),
  req('/session',{headers:{Origin:'https://attacker.invalid'}}),
  req('/session',{headers:{'Sec-Fetch-Site':'cross-site'}}),
  req('/api/v3/operations',{method:'POST'}),
  req('/api/v3/authoring-source',{method:'POST'}),
 ]){
  const response=await app.fetch(r);
  assert([403,404].includes(response.status),r.url);
 }
 assert.equal(called,0);
});

test('D6-GW07 owner source flag requires session flag and owner authorization',async()=>{
 let count=0;
 const countRead=async()=>{count++;return json({});};
 const app=gateway({flags:{gateway:true,source:true},
  fetchHostedAsset:countRead,issueReadToken:countRead,requestGitHub:countRead});
 assert.equal((await app.fetch(req('/api/v3/authoring-source'))).status,503);
 assert.equal(count,0);
 const unauth=gateway({flags:{gateway:true,session:true,source:true},
  ownerSession:{describe:async()=>({authenticated:false,authorized:false}),
   authorizeStatus:async()=>({authorized:false,ownerGitHubId:265665562})},
  fetchHostedAsset:countRead,issueReadToken:countRead,requestGitHub:countRead});
 assert.equal((await unauth.fetch(req('/api/v3/authoring-source'))).status,401);
 assert.equal(count,0);
});

function providerFixtures(){
 const contents=new Map(Object.entries({
  'Gear/gear.json':JSON.stringify(JSON.parse(
   readFileSync(new URL('../Gear/gear.json',import.meta.url),'utf8'))),
  'KB/kb.json':JSON.stringify(JSON.parse(
   readFileSync(new URL('../KB/kb.json',import.meta.url),'utf8'))),
  'Catches/catches.json':JSON.stringify(JSON.parse(
   readFileSync(new URL('../Catches/catches.json',import.meta.url),'utf8'))),
 }));
 const data=Object.fromEntries([...contents].filter(([p])=>p.endsWith('.json'))
  .map(([p,body])=>[p.split('/')[0].toLowerCase(),JSON.parse(body)]));
 const paths=[...collectPaths(data)];
 for(const path of paths.filter(p=>p.endsWith('.md')))
  contents.set(path,'# Verified synthetic Markdown from canonical Git tree');
 const entries=[...contents].map(([path,body])=>({
  path,type:'blob',mode:'100644',size:Buffer.byteLength(body),sha:sha1(body),
 }));
 for(const p of paths.filter(p=>!p.endsWith('.md')))
  entries.push({path:p,type:'blob',mode:'100644',size:3,sha:sha1('img')});
 const files=new Map([...contents].map(([p,body])=>[
  API+'/git/blobs/'+sha1(body),{
   sha:sha1(body),encoding:'base64',size:Buffer.byteLength(body),
   content:Buffer.from(body).toString('base64'),
  },
 ]));
 const api=new Map([
  [API,{id:1350909744,full_name:'ginosega/fishing',default_branch:'main'}],
  [API+'/git/ref/heads/main',{ref:'refs/heads/main',
   object:{type:'commit',sha:HEAD}}],
  [API+'/git/commits/'+HEAD,{sha:HEAD,tree:{sha:TREE}}],
  [API+'/git/trees/'+TREE,{sha:TREE,truncated:false,tree:[
   {path:'pwa',type:'tree',mode:'040000',sha:PWA},
  ]}],
  [API+'/git/trees/'+PWA+'?recursive=1',{
   sha:PWA,truncated:false,tree:entries,
  }],
  ...files,
 ]);
 const manifestFiles=[
  'index.html','loader.js','sw.js','manifest.webmanifest','icon.png',
  'releases/'+RELEASE+'/app.js','releases/'+RELEASE+'/styles.css',
  'releases/'+RELEASE+'/content/Gear/gear.json',
  'releases/'+RELEASE+'/content/KB/kb.json',
  'releases/'+RELEASE+'/content/Catches/catches.json',
 ].map(path=>({path,bytes:0,sha256:'e'.repeat(64)}));
 const manifest=JSON.stringify({
  format:'fishing-companion-release-v2',releaseId:RELEASE,
  sourceRevision:HEAD,base:'/fishing/',pendingMedia:false,
  d6ReaderCandidate:true,schemaVersions:{gear:2,kb:2,catches:2},
  files:manifestFiles,totalBytes:0,
 });
 const release=JSON.stringify({
  id:RELEASE,sourceRevision:HEAD,pendingMedia:false,
  d6ReaderCandidate:true,schemaVersions:{gear:2,kb:2,catches:2},
  manifest:'releases/'+RELEASE+'/manifest.json',
  manifestSha256:sha256(manifest),
 });
 let githubCalls=0,hostedCalls=0,issued=0;
 const fetchHostedAsset=async(url)=>{
  hostedCalls++;
  const body=url===PAGES+'release.json'?release:
   url===PAGES+'releases/'+RELEASE+'/manifest.json'?manifest:null;
  return body===null?new Response('{}',{status:404}):
   new Response(body,{headers:{'Content-Type':'application/json'}});
 };
 const requestGitHub=async(url,options)=>{
  githubCalls++;
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.Authorization,'Bearer read-only-fixture-token');
  return api.has(url)?json(api.get(url)):new Response('{}',{status:404});
 };
 const issueReadToken=async args=>{
  issued++;
  assert.deepEqual(args,{repositoryId:1350909744,
   permissions:{contents:'read'}});
  return {repositoryId:1350909744,permissions:{contents:'read'},
   token:'read-only-fixture-token'};
 };
 return {fetchHostedAsset,requestGitHub,issueReadToken,
  counts:()=>({githubCalls,hostedCalls,issued})};
}

test('D6-GW08 full read-only composition matches V3 browser client contract',async()=>{
 const provider=providerFixtures();
 const app=gateway({flags:{gateway:true,session:true,source:true},
  ...provider});
 const response=await app.fetch(req('/api/v3/authoring-source'));
 assert.equal(response.status,200,await response.clone().text());
 const body=await response.json();
 assert.equal(body.repositoryId,1350909744);
 assert.equal(body.repositoryFullName,'ginosega/fishing');
 assert.equal(body.sourceRevision,HEAD);
 assert.equal(body.sandboxOnly,false);
 assert(!Object.hasOwn(body,'csrfToken'));
 assert(!Object.hasOwn(body,'canPublish'));
 assert(!Object.hasOwn(body,'token'));
 const counts=provider.counts();
 assert.equal(counts.hostedCalls,4); // hosted pointer + manifest, twice
 assert.equal(counts.issued,1);
 assert(counts.githubCalls>=6);
 const client=createD6CanonicalSourceClient({
  root:ORIGIN+'/fishing/',request:(url,options)=>app.fetch(
   new Request(url,options)),
  expectedReleaseRevision:HEAD,enabled:()=>true,online:()=>true,
 });
 const source=await client.load({readingMode:'Automatic',ownerVerified:true});
 assert.equal(source.repositoryId,1350909744);
 assert.equal(source.sourceRevision,HEAD);
 assert.equal(source.sourceOnly,true);
 assert.equal(source.canPublish,false);
});

test('D6-GW09 V2 Pages source is rejected without GitHub token issuance',async()=>{
 let issued=0;
 const f=providerFixtures();
 const app=gateway({flags:{gateway:true,session:true,source:true},
  fetchHostedAsset:async(url)=>{
   const response=await f.fetchHostedAsset(url);
   if(url===PAGES+'release.json'){
    const pointer=await response.json();
    delete pointer.d6ReaderCandidate;
    return json(pointer);
   }
   return response;
  },
  requestGitHub:f.requestGitHub,
  issueReadToken:async()=>{issued++;throw Error('no tokens');},
 });
 const response=await app.fetch(req('/api/v3/authoring-source'));
 assert.equal(response.status,503);
 assert.equal(issued,0);
});

test('D6-GW10 only source-only function exported; no Worker or write wiring',()=>{
 const source=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-same-origin-gateway.mjs',
  import.meta.url),'utf8');
 assert.match(source,/gatewayEnabled=\(\)=>false/);
 assert.match(source,/staticEnabled=\(\)=>false/);
 assert.match(source,/sessionEnabled=\(\)=>false/);
 assert.match(source,/sourceEnabled=\(\)=>false/);
 assert.match(source,/createD6CanonicalSnapshotLoader/);
 assert.match(source,/createD6OwnerSourceRoute/);
 assert.doesNotMatch(source,/export default|addEventListener\(|issueWriteToken|method:'POST'|method:'PUT'/);
});
