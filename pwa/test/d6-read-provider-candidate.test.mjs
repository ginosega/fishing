import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6ReadProviderCandidate}
 from '../../experiments/p3/preview/src/d6-read-provider-candidate.mjs';
import {D6HostedBytesError}
 from '../../experiments/p3/preview/src/d6-hosted-bytes-preflight.mjs';

const O='https://fishing.ginosega.workers.dev';
const PAGE='https://ginosega.github.io/fishing/';
const ownerSession={
 describe:async()=>({authenticated:true,authorized:true,
  ownerLogin:'ginosega',ownerGitHubId:265665562,csrfToken:'SECRET'}),
 authorizeStatus:async()=>({authorized:true,ownerGitHubId:265665562}),
};
const request=(path,opt={})=>new Request(O+path,opt);
const make=(opts={})=>createD6ReadProviderCandidate({
 transport:async()=>{throw Error('Unexpected outgoing request');},
 issueReadToken:async()=>{throw Error('No token issuance');},
 ownerSession,...opts,
});

test('D6-PROV01 global default OFF and full preflight disabled',async()=>{
 let requests=0;
 const candidate=make({transport:async()=>{requests++;throw Error('forbidden');}});
 assert.equal((await candidate.fetch(request('/'))).status,503);
 assert.equal((await candidate.fetch(request('/session'))).status,503);
 assert.equal((await candidate.fetch(request('/api/v3/authoring-source'))).status,503);
 await assert.rejects(candidate.verifyHostedBytes({
  expectedSourceRevision:'a'.repeat(40),
 }),e=>e instanceof D6HostedBytesError&&e.code==='DISABLED');
 assert.equal(requests,0);
 assert(Object.isFrozen(candidate));
 assert.equal(Object.keys(candidate).sort().join(','),'fetch,verifyHostedBytes');
});

test('D6-PROV02 scoped public fetch sends only uncredentialed Pages GET',async()=>{
 const outgoing=[];
 const candidate=make({
  gatewayEnabled:true,staticEnabled:true,
  transport:async(url,options)=>{
   outgoing.push({url,options});
   return new Response('test-asset',{headers:{
    'Content-Type':'text/plain','Set-Cookie':'malicious=1',
    'Access-Control-Allow-Origin':'*',
   }});
  },
 });
 assert.equal((await candidate.fetch(request('/'))).status,302);
 const r=await candidate.fetch(request('/fishing/release.json',{
  headers:{Cookie:'private-session=secret'},
 }));
 assert.equal(r.status,200);
 assert.equal(await r.text(),'test-asset');
 assert.equal(r.headers.get('Set-Cookie'),null);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 assert.deepEqual(outgoing,[{
  url:PAGE+'release.json',
  options:{method:'GET',redirect:'manual',cache:'no-store',
   credentials:'omit'},
 }]);
});

test('D6-PROV03 status is read-only; source flag alone never reads GitHub',async()=>{
 let transportCalls=0,issueCalls=0;
 const c=make({
  gatewayEnabled:true,sessionEnabled:true,
  transport:async()=>{transportCalls++;return new Response('{}');},
  issueReadToken:async()=>{issueCalls++;return {};},
 });
 const status=await c.fetch(request('/session'));
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{
  authenticated:true,authorized:true,ownerLogin:'ginosega',
 });
 assert.equal((await c.fetch(request('/api/v3/authoring-source'))).status,503);
 assert.equal(transportCalls,0);
 assert.equal(issueCalls,0);
});

test('D6-PROV04 source gate rejects old V2 hosted pointer before any token',async()=>{
 let issued=0,urls=[];
 const c=make({
  gatewayEnabled:true,sessionEnabled:true,sourceEnabled:true,
  transport:async(url,options)=>{
   urls.push({url,options});
   return new Response(JSON.stringify({
    id:'b'.repeat(32),sourceRevision:'a'.repeat(40),
    manifest:'releases/'+('b'.repeat(32))+'/manifest.json',
    manifestSha256:'c'.repeat(64),
    schemaVersions:{gear:2,kb:2,catches:2},
    pendingMedia:false,
    // no d6ReaderCandidate intentionally
   }),{headers:{'Content-Type':'application/json'}});
  },
  issueReadToken:async()=>{issued++;return {};},
 });
 const result=await c.fetch(request('/api/v3/authoring-source'));
 assert.equal(result.status,503);
 assert.equal(issued,0);
 assert.equal(urls.length,1);
 assert.equal(urls[0].url,PAGE+'release.json');
 assert.equal(urls[0].options.method,'GET');
 assert.equal(urls[0].options.credentials,'omit');
 assert.equal(urls[0].options.redirect,'manual');
 assert.equal(urls[0].options.headers.Accept,'application/json');
});

test('D6-PROV05 reject unexpected methods, credentials, origins, and write URLs',async()=>{
 let requests=0;
 const c=make({gatewayEnabled:true,staticEnabled:true,
  sessionEnabled:true,sourceEnabled:true,
  transport:async()=>{requests++;return new Response('test');},
 });
 for(const r of [
  request('/api/v3/operations',{method:'POST'}),
  request('/api/v3/media',{method:'PUT'}),
  request('/auth/callback'),
  request('/fishing/secret/file'),
  request('/fishing/%2e%2e/escape'),
  new Request('https://attacker.invalid/fishing/release.json'),
  request('/session',{headers:{Origin:'https://attacker.invalid'}}),
  request('/session',{headers:{'Sec-Fetch-Site':'cross-site'}}),
 ]){
  const response=await c.fetch(r);
  assert([400,403,404,405].includes(response.status),r.url);
 }
 assert.equal(requests,0);
});

test('D6-PROV06 invalid flags and missing trusted owner provider fail at factory',()=>{
 assert.throws(()=>make({gatewayEnabled:'true'}));
 assert.throws(()=>make({sessionEnabled:()=>true}));
 assert.throws(()=>make({ownerSession:{describe:async()=>({})}}));
 assert.throws(()=>make({issueReadToken:null}));
 assert.throws(()=>make({transport:null}));
});

test('D6-PROV07 source adapter has no deploy entry, token minting or writer',()=>{
 const src=readFileSync(new URL(
  '../../experiments/p3/preview/src/d6-read-provider-candidate.mjs',
  import.meta.url),'utf8');
 assert.match(src,/createD6SameOriginGateway/);
 assert.match(src,/createD6HostedBytesPreflight/);
 assert.match(src,/credentials:'omit'/);
 assert.doesNotMatch(src,/export default|addEventListener\(|issueWriteToken/);
 assert.doesNotMatch(src,/method:'POST'|method:'PUT'|method:'PATCH'/);
 assert.doesNotMatch(src,/D2_GITHUB_APP_PRIVATE_KEY|D3_SANDBOX_REPO_ID/);
});
