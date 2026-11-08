import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 createD6HostedBytesPreflight,D6HostedBytesError,D6_PROOF_ORIGINS,
} from '../../experiments/p3/preview/src/d6-hosted-bytes-preflight.mjs';

const REV='a'.repeat(40);
const RELEASE='b'.repeat(32);
const H='c'.repeat(64);
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const source=readFileSync(new URL('../Gear/gear.json',import.meta.url),'utf8');
const required=[
 'index.html','loader.js','sw.js','manifest.webmanifest','icon.png',
 'releases/'+RELEASE+'/app.js',
 'releases/'+RELEASE+'/styles.css',
 'releases/'+RELEASE+'/content/Gear/gear.json',
 'releases/'+RELEASE+'/content/KB/kb.json',
 'releases/'+RELEASE+'/content/Catches/catches.json',
];
function fixture({v3=true,revision=REV,mutateManifest=()=>{},
 mutatePointer=()=>{},extra=false}={}){
 const fileBytes=new Map(required.map(path=>[path,
  path.endsWith('Gear/gear.json')?source:'D6 asset '+path]));
 if(extra)fileBytes.set('releases/'+RELEASE+'/content/Gear/Some art #?.png',
  'binary fixture that needs URL encoding');
 const files=[...fileBytes].map(([path,body])=>({
  path,bytes:Buffer.byteLength(body),sha256:hash(body),
 }));
 const manifest={
  format:'fishing-companion-release-v2',releaseId:RELEASE,
  sourceRevision:revision,pendingMedia:false,base:'/fishing/',
  d6ReaderCandidate:v3,schemaVersions:{gear:2,kb:2,catches:2},
  files,totalBytes:files.reduce((total,x)=>total+x.bytes,0),
  cardThumbnails:null,
 };
 mutateManifest(manifest);
 const manifestJson=JSON.stringify(manifest);
 const pointer={
  id:RELEASE,sourceRevision:revision,pendingMedia:false,
  d6ReaderCandidate:v3,schemaVersions:manifest.schemaVersions,
  manifest:'releases/'+RELEASE+'/manifest.json',
  manifestSha256:hash(manifestJson),
 };
 mutatePointer(pointer);
 const results=new Map([
  ['release.json',JSON.stringify(pointer)],
  [pointer.manifest,manifestJson],
  ...fileBytes,
 ]);
 return {results,pointer,manifest};
}
function transport({pages,worker,failPath,redirectPath,
 onFetch=()=>{}}={}){
 const calls=[];
 const baseFixture=fixture();
 const original=pages??baseFixture.results;
 const second=worker??original;
 const build=(origin,files,name)=>async(url,options)=>{
  calls.push({origin,name,url,options});
  onFetch({origin,name,url,options,files});
  assert(url.startsWith(origin));
  assert.deepEqual(options,{method:'GET',redirect:'manual',cache:'no-store'});
  const path=url.slice(origin.length);
  const logical=path===''?'index.html':decodeURIComponent(path);
  if(logical===failPath)return new Response('fail',{status:503});
  if(logical===redirectPath)return new Response(null,{status:302,
   headers:{Location:origin+'fishing/' }});
  const body=files.get(logical);
  return body===undefined?new Response('absent',{status:404}):
   new Response(body,{status:200,headers:{
    'Content-Type':logical.endsWith('.json')?'application/json':'application/octet-stream',
   }});
 };
 const fetchPages=build(D6_PROOF_ORIGINS.pages,original,'pages');
 const fetchGateway=build(D6_PROOF_ORIGINS.gateway,second,'gateway');
 return {fetchPages,fetchGateway,calls};
}
const preflight=({fetchPages,fetchGateway},enabled=()=>true)=>
 createD6HostedBytesPreflight({fetchPages,fetchGateway,enabled});
const denied=async(promise,code)=>assert.rejects(promise,
 e=>e instanceof D6HostedBytesError&&e.code===code);

test('D6-BYTES01 complete source and Worker file inventory matches manifest SHA',async()=>{
 const f=fixture({extra:true});
 const transporters=transport({pages:f.results});
 const result=await preflight(transporters).verify({expectedSourceRevision:REV});
 assert.equal(result.sourceRevision,REV);
 assert.equal(result.releaseId,RELEASE);
 assert.equal(result.manifestSha256,f.pointer.manifestSha256);
 assert.equal(result.filesVerified,f.manifest.files.length);
 assert.equal(result.totalBytes,f.manifest.totalBytes);
 assert.equal(result.pagesAndGatewayBytesMatch,true);
 assert.equal(result.canPublish,false);
 assert.equal(result.publicCutoverApproved,false);
 assert(Object.isFrozen(result));
 assert.equal(transporters.calls.length,2*(f.manifest.files.length+4));
 assert(transporters.calls.some(c=>c.url===D6_PROOF_ORIGINS.pages));
 assert(transporters.calls.some(c=>c.url===D6_PROOF_ORIGINS.gateway));
 assert(transporters.calls.some(c=>c.url.includes('Some%20art%20%23%3F.png')));
 assert(transporters.calls.every(c=>!('Authorization' in c.options)));
});

test('D6-BYTES02 default off or invalid revision never fetches a single byte',async()=>{
 let requests=0;
 const never=async()=>{requests++;throw Error('unexpected fetch');};
 const instance=createD6HostedBytesPreflight({
  fetchPages:never,fetchGateway:never,
 });
 await denied(instance.verify({expectedSourceRevision:REV}),'DISABLED');
 const enabled=preflight({fetchPages:never,fetchGateway:never});
 await denied(enabled.verify({expectedSourceRevision:'unverified'}),
  'INVALID_REQUEST');
 assert.equal(requests,0);
});

test('D6-BYTES03 deny V2, stale hosted commit or tampered manifest pointer',async()=>{
 await denied(preflight(transport({pages:fixture({v3:false}).results}))
  .verify({expectedSourceRevision:REV}),'NOT_APPROVED_V3_RELEASE');
 await denied(preflight(transport({pages:fixture({revision:'d'.repeat(40)}).results}))
  .verify({expectedSourceRevision:REV}),'NOT_APPROVED_V3_RELEASE');
 const changed=fixture();
 changed.results.set('release.json',JSON.stringify({
  ...changed.pointer,manifestSha256:H,
 }));
 await denied(preflight(transport({pages:changed.results}))
  .verify({expectedSourceRevision:REV}),'MANIFEST_DIGEST_MISMATCH');
});

test('D6-BYTES04 refuse first differing Worker asset before acceptance',async()=>{
 const a=fixture();const b=new Map(a.results);
 b.set('releases/'+RELEASE+'/app.js','A different Worker asset');
 await denied(preflight(transport({pages:a.results,worker:b}))
  .verify({expectedSourceRevision:REV}),'GATEWAY_BYTES_DIFFER');
});

test('D6-BYTES05 refuse two hosts with identically corrupted advertised assets',async()=>{
 const a=fixture();
 a.results.set('releases/'+RELEASE+'/app.js','corrupted asset');
 await denied(preflight(transport({pages:a.results}))
  .verify({expectedSourceRevision:REV}),'ASSET_BYTES_MISMATCH');
});

test('D6-BYTES06 fail closed on missing asset, redirect and wrong asset size',async()=>{
 const a=fixture();
 await denied(preflight(transport({pages:a.results,
  failPath:'releases/'+RELEASE+'/app.js'}))
  .verify({expectedSourceRevision:REV}),'HOSTED_UNAVAILABLE');
 await denied(preflight(transport({pages:a.results,redirectPath:'index.html'}))
  .verify({expectedSourceRevision:REV}),'HOSTED_UNAVAILABLE');
 const b=fixture();
 b.manifest.files.find(x=>x.path.endsWith('/app.js')).bytes=1;
 b.manifest.totalBytes=b.manifest.files.reduce((sum,x)=>sum+x.bytes,0);
 const newManifest=JSON.stringify(b.manifest);
 b.pointer.manifestSha256=hash(newManifest);
 b.results.set(b.pointer.manifest,newManifest);
 b.results.set('release.json',JSON.stringify(b.pointer));
 await denied(preflight(transport({pages:b.results}))
  .verify({expectedSourceRevision:REV}),'HOSTED_BYTES_LIMIT');
});

test('D6-BYTES07 reject malformed/unsafe manifest path and too many bytes',async()=>{
 const unsafe=fixture({
  mutateManifest:m=>m.files.push({path:'../escape.png',bytes:0,
   sha256:H}),
 });
 unsafe.manifest.totalBytes=unsafe.manifest.files.reduce((sum,x)=>sum+x.bytes,0);
 const manifestString=JSON.stringify(unsafe.manifest);
 unsafe.pointer.manifestSha256=hash(manifestString);
 unsafe.results.set(unsafe.pointer.manifest,manifestString);
 unsafe.results.set('release.json',JSON.stringify(unsafe.pointer));
 await denied(preflight(transport({pages:unsafe.results}))
  .verify({expectedSourceRevision:REV}),'INVALID_MANIFEST');
 const large=fixture({
  mutateManifest:m=>{
   m.files[0].bytes=33*1024*1024;
   m.totalBytes=m.files.reduce((sum,x)=>sum+x.bytes,0);
  },
 });
 await denied(preflight(transport({pages:large.results}))
  .verify({expectedSourceRevision:REV}),'MANIFEST_DIGEST_MISMATCH');
});

test('D6-BYTES08 read race catches a pointer change after all file checks',async()=>{
 const f=fixture();
 let count=0;
 const transporters=transport({pages:f.results,onFetch:({name,url,files})=>{
  if(name==='pages'&&url===D6_PROOF_ORIGINS.pages+'release.json'&&
   ++count===2){
   files.set('release.json',JSON.stringify({
    ...f.pointer,id:'e'.repeat(32),
   }));
  }
 }});
 await denied(preflight(transporters).verify({expectedSourceRevision:REV}),
  'GATEWAY_BYTES_DIFFER');
});

test('D6-BYTES09 no credentials, deployment, writer or application data mutation',()=>{
 const src=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-hosted-bytes-preflight.mjs',
  import.meta.url),'utf8');
 assert.match(src,/enabled=\(\)=>false/);
 assert.match(src,/validateManifest/);
 assert.match(src,/MAX_TOTAL/);
 assert.match(src,/RELEASE_CHANGED_DURING_PROOF/);
 assert.doesNotMatch(src,/issueReadToken|issueWriteToken|publishChange|writeFile/);
 assert.doesNotMatch(src,/export default|addEventListener\(/);
});
