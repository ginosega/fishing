import test from 'node:test';
import assert from 'node:assert/strict';
import {D6_PUBLISH_REPOSITORY as REPO}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {describeD6AtomicTreeStep,D6AtomicTreeStepError}
 from '../../experiments/p3/preview/src/d6-production-atomic-tree-step.mjs';
import {createD6ProductionPublishProviderTransport,
 D6PublishProviderTransportError}
 from '../../experiments/p3/preview/src/d6-production-publish-provider-transport.mjs';
import {createD6Wp3CanonicalSourceTransport,
 D6Wp3CanonicalSourceTransportError}
 from '../../experiments/p3/preview/src/d6-production-wp3-canonical-source-transport.mjs';

const ROOT='https://api.github.com/repos/'+REPO.name;
const SHA='a'.repeat(40),TREE='b'.repeat(40);
const OP='123e4567-e89b-42d3-a456-426614174000';
const TOKEN='TEST-ONLY-READ-TOKEN-AAAAAAAAAAAAAAAA';
const blobPath='Catches/catches.json';
const HEADERS={
 Authorization:'Bearer '+TOKEN,
 Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-d6-canonical-read-only',
};
const pHeaders={...HEADERS,'User-Agent':'fishing-d6-atomic-tree-readback-source'};
const publishGet=()=>({method:'GET',
 headers:pHeaders,redirect:'manual',cache:'no-store',credentials:'omit'});
const sourceGet=()=>({method:'GET',headers:HEADERS,redirect:'manual'});
const object={operationId:OP,state:'Accepted',
 ownerGitHubId:REPO.ownerGitHubId,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:SHA,snapshotSha256:'c'.repeat(64),
 domain:'catches',operation:'add',recordId:'example'};
const sourcePlan=()=>({
 atomicTreeReady:true,sourceOnly:true,canSubmitTree:false,
 canPublish:false,isLive:false,
 requiresDurableGitStepFence:true,
 requiresIndependentTreeReadback:true,
 requiresSourceConflictRecheck:true,
 operationId:OP,repositoryId:REPO.id,ref:REPO.ref,
 sourceRevision:SHA,baseTreeSha:TREE,
 domain:'catches',recordId:'example',
 textCount:1,mediaCount:0,fileCount:1,
 canonicalJsonUnchanged:false,
 verifiedText:[{path:blobPath,sha:'d'.repeat(40),bytes:200}],
 entries:[{path:blobPath,mode:'100644',type:'blob',
  sha:'d'.repeat(40)}],
});
const blocked=(p,kind)=>assert.rejects(p,e=>
 e instanceof kind);

test('WP3-END01 canonical source-relative entry produces ONLY pwa/-root Git mutation',async()=>{
 const claim=await describeD6AtomicTreeStep({
  operation:object,plan:sourcePlan(),
 });
 assert.equal(claim.body.base_tree,TREE);
 assert.deepEqual(claim.body.tree,[{
  path:'pwa/'+blobPath,mode:'100644',type:'blob',
  sha:'d'.repeat(40),
 }]);
 assert.equal(claim.entryCount,1);
 assert.equal(claim.requestSha256.length,64);
 assert.equal(claim.body.tree.some(x=>/^(?:Catches|Gear|KB)\//.test(x.path)),
  false);
 assert.equal(claim.body.tree.every(x=>x.path.startsWith('pwa/')),true);
});

test('WP3-END02 forged root paths and double-prefix paths denied before D1',async()=>{
 for(const path of [
  'pwa/Catches/catches.json','Gear/gear.json',
  '../Catches/catches.json','Catches/../../.github/workflows/main.yml',
 ]){
  const plan=sourcePlan();
  plan.entries=[{...plan.entries[0],path}];
  await blocked(describeD6AtomicTreeStep({
   operation:object,plan,
  }),D6AtomicTreeStepError);
 }
});

test('WP3-END03 existing independent Git-tree verifier exact recursive reads are permitted',async()=>{
 const calls=[];
 const transport=createD6ProductionPublishProviderTransport({
  upstream:async(url,options)=>{
   calls.push({url,options});
   return new Response('{}',{headers:{'Content-Type':'application/json'}});
  },enabled:()=>true,
 });
 for(const url of [
  ROOT+'/git/trees/'+TREE+'?recursive=1',
  ROOT+'/git/trees/'+SHA,
  ROOT+'/git/commits/'+SHA,
 ]){
  const res=await transport.request(url,publishGet());
  assert.equal(res.status,200);
 }
 assert.equal(calls.length,3);
 assert(calls.every(x=>x.options.method==='GET'));
 assert(calls.every(x=>x.options.credentials==='omit'));
});

test('WP3-END04 recursive query cannot select a different tree or URL',async()=>{
 const calls=[];
 const transport=createD6ProductionPublishProviderTransport({
  upstream:async()=>{calls.push(1);return new Response('{}')},
  enabled:()=>true,
 });
 for(const url of [
  ROOT+'/git/trees/'+TREE+'?recursive=0',
  ROOT+'/git/trees/'+TREE+'?recursive=1&force=true',
  ROOT+'/git/trees/'+TREE+'?Recursive=1',
  ROOT+'/git/commits/'+SHA+'?recursive=1',
  ROOT+'/git/blobs/'+SHA+'?recursive=1',
  ROOT+'/git/trees/'+TREE+'#fragment',
  'https://malicious.invalid/repos/'+REPO.name+
   '/git/trees/'+TREE+'?recursive=1',
 ])await blocked(transport.request(url,publishGet()),
  D6PublishProviderTransportError);
 assert.equal(calls.length,0);
});

test('WP3-END05 WP2 canonical source GET request shape is normalized to strict no-cookie transport',async()=>{
 const calls=[];
 const original=createD6Wp3CanonicalSourceTransport({
  upstream:async(url,options)=>{
   calls.push({url,options});
   return new Response('{}',{headers:{'Content-Type':'application/json'}});
  },
  enabled:()=>true,
 });
 for(const url of [
  ROOT,
  ROOT+'/git/ref/heads/main',
  ROOT+'/git/trees/'+TREE+'?recursive=1',
  ROOT+'/git/trees/'+TREE,
  ROOT+'/git/commits/'+SHA,
  ROOT+'/git/blobs/'+SHA,
 ]){
  assert.equal((await original.request(url,sourceGet())).status,200);
 }
 assert.equal(calls.length,6);
 for(const x of calls){
  assert.equal(x.options.method,'GET');
  assert.equal(x.options.cache,'no-store');
  assert.equal(x.options.credentials,'omit');
  assert.equal(x.options.redirect,'manual');
  assert.equal(x.options.headers.Authorization,'Bearer '+TOKEN);
  assert.equal(Object.hasOwn(x.options,'body'),false);
 }
});

test('WP3-END06 exact bounded immutable Markdown GraphQL read only',async()=>{
 const calls=[];
 const original=createD6Wp3CanonicalSourceTransport({
  upstream:async(url,opts)=>{
   calls.push({url,opts});return new Response('{}');
  },enabled:()=>true,
 });
 const gql='https://api.github.com/graphql';
 const input={...sourceGet(),method:'POST',
  headers:{...HEADERS,'Content-Type':'application/json'},
  body:JSON.stringify({query:'query WP2VerifiedMarkdown {repository(owner:"ginosega",name:"fishing"){databaseId}}'}),
 };
 assert.equal((await original.request(gql,input)).status,200);
 assert.equal(calls.length,1);
 assert.equal(calls[0].opts.credentials,'omit');
 for(const body of [
  '{"query":"mutation Danger {deleteRepository(input:{})}"}',
  '{"query":"query Another {viewer {login}}"}',
 ]){
  await blocked(original.request(gql,{...input,body}),
   D6Wp3CanonicalSourceTransportError);
 }
 assert.equal(calls.length,1);
});

test('WP3-END07 source transport denies external origins and all repository mutations',async()=>{
 const calls=[];
 const reader=createD6Wp3CanonicalSourceTransport({
  enabled:()=>true,
  upstream:async()=>{calls.push(1);return new Response('{}')},
 });
 for(const [url,opts] of [
  [ROOT+'/git/trees/'+TREE+'?recursive=2',sourceGet()],
  [ROOT+'/git/ref/heads/main?force=true',sourceGet()],
  ['https://api.github.com/repos/another/fishing',sourceGet()],
  [ROOT+'/git/trees',{...sourceGet(),method:'POST',
   body:'{}'}],
  [ROOT+'/git/trees/'+TREE,{...sourceGet(),redirect:'follow'}],
  [ROOT+'/git/trees/'+TREE,{...sourceGet(),credentials:'include'}],
  [ROOT+'/git/trees/'+TREE,{...sourceGet(),
   headers:{...HEADERS,Cookie:'session=forged'}}],
  [ROOT+'/git/trees/'+TREE,{...sourceGet(),
   headers:{...HEADERS,Authorization:'Bearer wrong'}}],
  [ROOT+'/git/trees/'+TREE,{...sourceGet(),body:'{}'}],
 ]){
  await blocked(reader.request(url,opts),
   D6Wp3CanonicalSourceTransportError);
 }
 assert.deepEqual(calls,[]);
 assert.deepEqual(Object.keys(reader),['request']);
});

test('WP3-END08 external transport revocation is rechecked before any outbound',async()=>{
 const calls=[],flag={enabled:false};
 const reader=createD6Wp3CanonicalSourceTransport({
  upstream:async()=>{calls.push(1);return new Response('{}')},
  enabled:()=>flag.enabled,
 });
 await blocked(reader.request(ROOT,sourceGet()),
  D6Wp3CanonicalSourceTransportError);
 assert.equal(calls.length,0);
 flag.enabled=true;
 await reader.request(ROOT,sourceGet());
 assert.equal(calls.length,1);
 flag.enabled=false;
 await blocked(reader.request(ROOT,sourceGet()),
  D6Wp3CanonicalSourceTransportError);
 assert.equal(calls.length,1);
});

test('WP3-END09 provider transport preserves original exact non-force write gates',async()=>{
 const calls=[];
 const writer=createD6ProductionPublishProviderTransport({
  upstream:async(url,opts)=>{calls.push({url,opts});return new Response('{}')},
  enabled:()=>true,
 });
 const url=ROOT+'/git/refs/heads/fish-v3/publish/'+OP;
 const options={method:'PATCH',headers:{...pHeaders,
  'Content-Type':'application/json'},redirect:'manual',
  cache:'no-store',credentials:'omit',
  body:JSON.stringify({sha:TREE,force:false})};
 await writer.request(url,options);
 assert.equal(calls.length,1);
 for(const bad of [
  {...options,body:JSON.stringify({sha:TREE,force:true})},
  {...options,credentials:'include'},
 ]){
  await blocked(writer.request(url,bad),
   D6PublishProviderTransportError);
 }
 assert.equal(calls.length,1);
});
