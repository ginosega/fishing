import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {collectPaths} from '../src/validation.mjs';
import {createD6CanonicalSnapshotLoader,D6TrustedSourceError,
 D6_SOURCE_REPOSITORY} from '../../experiments/p3/preview/src/d6-canonical-snapshot-loader.mjs';

const API='https://api.github.com/repos/ginosega/fishing';
const SHA='a'.repeat(40),TREE='b'.repeat(40),PWA='c'.repeat(40);
const root=Object.fromEntries([
 ['gear','Gear/gear.json'],['kb','KB/kb.json'],['catches','Catches/catches.json'],
]);
const data=Object.fromEntries(Object.entries(root).map(([k,p])=>[k,
 JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'))]));
const paths=[...collectPaths(data)];
const contents=new Map(Object.entries(root).map(([k,p])=>[p,JSON.stringify(data[k])]));
for(const p of paths.filter(p=>p.endsWith('.md')))
 contents.set(p,'# Canonical read-only test narrative');
const imagePaths=paths.filter(x=>!x.endsWith('.md'));
const shaBlob=value=>{
 const raw=Buffer.from(value);
 return createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+raw.length+'\0'),raw,
 ])).digest('hex');
};
const blobEntries=new Map([...contents].map(([path,value])=>[path,{
 path,type:'blob',mode:'100644',size:Buffer.byteLength(value),sha:shaBlob(value),
}]));
for(const p of imagePaths)blobEntries.set(p,{
 path:p,type:'blob',mode:'100644',size:3,sha:shaBlob('img'),
});
const jsonBody=(body,{status=200,contentType='application/json'}={})=>
 new Response(JSON.stringify(body),{status,headers:{'Content-Type':contentType}});
function githubFixture({mutate=()=>{},moveHead=false,
 failUrl=null,badBlob=false,duplicate=false}={}){
 const rootTree={sha:TREE,truncated:false,tree:[
  {path:'pwa',mode:'040000',type:'tree',sha:PWA},
 ]};
 const entries=[...blobEntries.values()];
 if(duplicate)entries.push({...entries[0]});
 const contentTree={sha:PWA,truncated:false,tree:entries};
 const git={
  [API]:{id:1350909744,full_name:'ginosega/fishing',default_branch:'main'},
  [API+'/git/ref/heads/main']:{ref:'refs/heads/main',
   object:{type:'commit',sha:SHA}},
  [API+'/git/commits/'+SHA]:{sha:SHA,tree:{sha:TREE}},
  [API+'/git/trees/'+TREE]:rootTree,
  [API+'/git/trees/'+PWA+'?recursive=1']:contentTree,
 };
 for(const [path,body] of contents){
  const entry=blobEntries.get(path);
  git[API+'/git/blobs/'+entry.sha]={
   sha:entry.sha,encoding:'base64',size:entry.size,
   content:Buffer.from(body).toString('base64'),
  };
 }
 mutate(git);
 let refReads=0;
 const calls=[];
 const request=async(url,opts)=>{
  calls.push({url,opts});
  if(url===failUrl)return jsonBody({}, {status:302});
  let value=git[url];
  if(url===API+'/git/ref/heads/main'&&moveHead&&++refReads===2)
   value={ref:'refs/heads/main',object:{type:'commit',sha:'d'.repeat(40)}};
  if(badBlob&&url.includes('/git/blobs/'))value={...value,content:'YmFk'};
  return value===undefined?jsonBody({message:'Not Found'},{status:404}):
   jsonBody(value);
 };
 return {request,calls,git};
}
function loader({request,enabled=()=>true,
 issuer=async()=>({repositoryId:1350909744,
  token:'github-test-read-token',permissions:{contents:'read'}})}={}){
 const f=githubFixture();
 return createD6CanonicalSnapshotLoader({
  request:request??f.request,issueReadToken:issuer,enabled,
 });
}
const denied=async(value,code)=>assert.rejects(value,e=>
 e instanceof D6TrustedSourceError&&e.code===code);

test('D6-TRUST01 exact canonical repository and immutable Git tree pass read-only',async()=>{
 const f=githubFixture();
 const issued=[];
 const trusted=createD6CanonicalSnapshotLoader({
  request:f.request,enabled:()=>true,
  issueReadToken:async grant=>{
   issued.push(grant);
   return {repositoryId:1350909744,token:'github-test-read-token',
    permissions:{contents:'read'}};
  },
 });
 const result=await trusted.loadSnapshot({expectedReleaseRevision:SHA});
 assert.deepEqual(issued,[{repositoryId:1350909744,permissions:{contents:'read'}}]);
 assert.equal(result.repositoryId,1350909744);
 assert.equal(result.repositoryFullName,'ginosega/fishing');
 assert.equal(result.ref,'refs/heads/main');
 assert.equal(result.sourceRevision,SHA);assert.equal(result.treeSha,TREE);
 assert.equal(result.canPublish,false);assert.equal(result.sourceOnly,true);
 assert.equal(result.files.size,blobEntries.size);
 assert.equal(result.markdown.size,paths.filter(p=>p.endsWith('.md')).length);
 assert(Object.isFrozen(result));
 assert(!Object.hasOwn(result,'token')&&!Object.hasOwn(result,'writeToken'));
 assert(!Object.hasOwn(result,'publish')&&!Object.hasOwn(result,'csrf'));
 assert.equal(f.calls.filter(c=>c.url===API+'/git/ref/heads/main').length,2);
 assert(f.calls.every(c=>c.opts.method==='GET'&&c.opts.redirect==='manual'&&
  c.opts.headers.Authorization==='Bearer github-test-read-token'));
});

test('D6-TRUST02 disabled/default-off and invalid source SHA never issue tokens',async()=>{
 let issued=0,requests=0;
 const obj=createD6CanonicalSnapshotLoader({
  request:async()=>{requests++;return jsonBody({});},
  issueReadToken:async()=>{issued++;return {};},
 });
 await denied(obj.loadSnapshot({expectedReleaseRevision:SHA}),'DISABLED');
 const enabled=createD6CanonicalSnapshotLoader({
  request:async()=>{requests++;return jsonBody({});},
  issueReadToken:async()=>{issued++;return {};},enabled:()=>true,
 });
 await denied(enabled.loadSnapshot({expectedReleaseRevision:'not a SHA'}),'INVALID_REQUEST');
 assert.equal(issued,0);assert.equal(requests,0);
});

test('D6-TRUST03 repo-scoped contents:read grant required, never write permission',async()=>{
 for(const grant of [
  {repositoryId:1430581407,token:'github-test-read-token',
   permissions:{contents:'read'}},
  {repositoryId:1350909744,token:'github-test-read-token',
   permissions:{contents:'write'}},
  {repositoryId:1350909744,token:'github-test-read-token',
   permissions:{contents:'read',issues:'write'}},
  {repositoryId:1350909744,token:'too-short',
   permissions:{contents:'read'}},
 ]){
  const f=githubFixture();
  await denied(createD6CanonicalSnapshotLoader({
   request:f.request,issueReadToken:async()=>grant,enabled:()=>true,
  }).loadSnapshot({expectedReleaseRevision:SHA}),'READ_SCOPE_DENIED');
  assert.equal(f.calls.length,0);
 }
});

test('D6-TRUST04 spoofed repository and stale hosted release rejected',async()=>{
 for(const [mutation,code] of [
  [git=>{git[API].id=1430581407;},'REPOSITORY_DENIED'],
  [git=>{git[API].full_name='ginosega/fishing-p3-sandbox';},'REPOSITORY_DENIED'],
  [git=>{git[API].default_branch='feature/test';},'REPOSITORY_DENIED'],
  [git=>{git[API+'/git/ref/heads/main'].object.sha='e'.repeat(40);},
   'MAIN_RELEASE_MISMATCH'],
  [git=>{git[API+'/git/trees/'+TREE].sha='e'.repeat(40);},
   'INVALID_ROOT_TREE'],
 ]){
  const f=githubFixture({mutate:mutation});
  await denied(loader({request:f.request}).loadSnapshot({
   expectedReleaseRevision:SHA,
  }),code);
 }
});

test('D6-TRUST05 truncated tree, ambiguous paths and invalid modes fail closed',async()=>{
 for(const [mutation,code] of [
  [git=>{git[API+'/git/trees/'+PWA+'?recursive=1'].truncated=true;},
   'INVALID_PWA_TREE'],
  [git=>{git[API+'/git/trees/'+PWA+'?recursive=1'].tree.push(
   {...blobEntries.values().next().value});},'AMBIGUOUS_CONTENT_PATH'],
  [git=>{git[API+'/git/trees/'+PWA+'?recursive=1'].tree[0].mode='120000';},
   'UNSAFE_CONTENT_ENTRY'],
 ]){
  const f=githubFixture({mutate:mutation});
  await denied(loader({request:f.request}).loadSnapshot({
   expectedReleaseRevision:SHA,
  }),code);
 }
});

test('D6-TRUST06 corrupted Markdown bytes and final main ref movement rejected',async()=>{
 const f=githubFixture({badBlob:true});
 await denied(loader({request:f.request}).loadSnapshot({
  expectedReleaseRevision:SHA,
 }),'GIT_BLOB_INTEGRITY_FAILED');
 const moved=githubFixture({moveHead:true});
 await denied(loader({request:moved.request}).loadSnapshot({
  expectedReleaseRevision:SHA,
 }),'MAIN_MOVED');
});

test('D6-TRUST07 read-only provider requires same-tree referenced content',async()=>{
 const f=githubFixture({mutate:git=>{
  const tree=git[API+'/git/trees/'+PWA+'?recursive=1'];
  const missing=paths[0];
  tree.tree=tree.tree.filter(x=>x.path!==missing);
 }});
 await denied(loader({request:f.request}).loadSnapshot({
  expectedReleaseRevision:SHA,
 }),'MISSING_REFERENCED_CONTENT');
});

test('D6-TRUST08 transport failure or redirect never reads an alternate endpoint',async()=>{
 const f=githubFixture({failUrl:API+'/git/commits/'+SHA});
 await denied(loader({request:f.request}).loadSnapshot({
  expectedReleaseRevision:SHA,
 }),'GITHUB_UNAVAILABLE');
 assert(f.calls.every(c=>c.url===API||c.url.startsWith(API+'/')));
});

test('D6-TRUST09 no production route, GitHub writer or credential activation',()=>{
 const src=readFileSync(new URL('../../experiments/p3/preview/src/d6-canonical-snapshot-loader.mjs',import.meta.url),'utf8');
 assert.match(src,/enabled=\(\)=>false/);
 assert.match(src,/permissions:\{contents:'read'\}/);
 assert.match(src,/expectedReleaseRevision/);
 assert.match(src,/ref:'refs\/heads\/main'/);
 assert.doesNotMatch(src,/method:'POST'|method:'PATCH'|method:'PUT'|issueWriteToken|publishChange/);
 assert(!src.includes('D2_GITHUB_APP_PRIVATE_KEY'));
});
