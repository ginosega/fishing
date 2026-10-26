import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD3PrivateHostProof,D3HostProofError}
 from '../src/d3-private-host-proof.mjs';
import {createD3PrivateHostedAsset,D3HostedAssetError}
 from '../src/d3-private-hosted-asset.mjs';
import {d3HostedTestPath,parseD3HostedTestPath,expectedD3HostedPaths}
 from '../src/d3-sandbox-host-paths.mjs';
const ORIGIN='https://fishing.example',ID=1430581407;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const OP='p3_01234567-1234-4234-8234-123456789abc';
const MERGE='a'.repeat(40),TREE='b'.repeat(40);
const NOTE='KB/Locations/content/P3 Test Lake.md';
const JSON_PATH='pwa/KB/kb.json',MD_PATH='pwa/'+NOTE;
const pkg={
 format:'fishing-companion-change-v2',domain:'kb',operation:'edit',
 id:'location-p3-test-lake',picture:{action:'keep'},
 pictureSequence:{action:'keep'},
 notes:{action:'replace',path:NOTE,body:'# Updated notes\n',
  baseSha256:'f'.repeat(64)},
};
const byteSources={
 [JSON_PATH]:Buffer.from('{"schemaVersion":2,"entities":[]}\n'),
 [MD_PATH]:Buffer.from('# Updated notes\n'),
};
const gitSha=data=>createHash('sha1')
 .update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
const hex=data=>createHash('sha256').update(data).digest('hex');
const proofError=code=>e=>e instanceof D3HostProofError&&e.code===code;
const assetError=code=>e=>e instanceof D3HostedAssetError&&e.code===code;
const reply=(value,status=200)=>({
 ok:status===200,status,redirected:false,json:async()=>value,
});
function setup({enabled=true,foreign=false,alterHosted=false,
 moveAfter=false,missingMarkdown=false}={}){
 const blobs={},entries=[];
 for(const [path,bytes] of Object.entries(byteSources)){
  if(missingMarkdown&&path===MD_PATH)continue;
  const sha=gitSha(bytes);
  entries.push({path,sha,type:'blob',mode:'100644',size:bytes.length});
  blobs[sha]={sha,size:bytes.length,encoding:'base64',
   content:bytes.toString('base64')};
 }
 const calls={github:0,hosted:0,issued:0,main:0};
 const store={
  get:async operationId=>operationId===OP?{
   operationId,state:'Verifying',mergeSha:MERGE,workflowRunId:182,
  }:null,
  readSnapshot:async operationId=>operationId===OP?
   {package:pkg,media:[]}:null,
 };
 const issueReadToken=async args=>{
  calls.issued++;
  assert.deepEqual(args,{repositoryId:ID,permissions:{contents:'read'}});
  return {repositoryId:ID,permissions:{contents:'read'},
   token:'sandbox-contents-read-opaque-test'};
 };
 const requestGitHub=async(url,options)=>{
  calls.github++;
  assert(url===API||url.startsWith(API+'/'));
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.Authorization,
   'Bearer sandbox-contents-read-opaque-test');
  if(url===API)return reply({id:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main'){
   calls.main++;
   return reply({object:{sha:moveAfter&&calls.main>1?'c'.repeat(40):MERGE}});
  }
  if(url===API+'/git/commits/'+MERGE)
   return reply({sha:MERGE,tree:{sha:TREE}});
  if(url===API+'/git/trees/'+TREE+'?recursive=1')
   return reply({sha:TREE,truncated:false,tree:entries});
  if(url.startsWith(API+'/git/blobs/')){
   const b=blobs[url.slice((API+'/git/blobs/').length)];
   return b?reply(b):reply({},404);
  }
  assert.fail('Unallowlisted GitHub URL '+url);
 };
 let proof;
 const asset=createD3PrivateHostedAsset({
  origin:ORIGIN,ownerSession:{authorizeStatus:async()=>{
   throw Error('Owner cookie not supplied by internal verifier');}},
  store,issueReadToken,requestGitHub,
  enabled:()=>enabled,
  authorizeProbe:(req,op,file)=>proof.authorizeProbe(req,op,file),
 });
 const requestHosted=async(url,options)=>{
  calls.hosted++;
  const served=await asset.serve(new Request(url,options));
  if(!alterHosted)return served;
  const bad=new Uint8Array(await served.arrayBuffer());
  bad[0]^=1;
  return new Response(bad,{status:200,headers:served.headers});
 };
 proof=createD3PrivateHostProof({
  origin:ORIGIN,key:'isolated-d3-hmac-test-secret-very-long-012345',
  store,issueReadToken,requestGitHub,requestHosted,
  now:()=>1800000000,
 });
 const info={
  operationId:OP,repositoryId:foreign?1350909744:ID,
  mergeSha:MERGE,expectedPaths:[JSON_PATH,MD_PATH],canonicalLive:false,
 };
 return {proof,asset,info,calls};
}
test('D3-H01 canonical paths preserve space encoding; unsafe aliases refused',()=>{
 const p=d3HostedTestPath(OP,MD_PATH);
 assert(p.endsWith('/P3%20Test%20Lake.md'));
 assert.deepEqual(parseD3HostedTestPath(p),{
  operationId:OP,file:MD_PATH,
 });
 assert.equal(parseD3HostedTestPath(p.replace('%20',' ')),null);
 assert.equal(parseD3HostedTestPath('/__d3_test__/operations/'+OP+
  '/pwa/KB/../../README.md'),null);
 assert.deepEqual(expectedD3HostedPaths(pkg),[JSON_PATH,MD_PATH]);
});
test('D3-H02 real immutable sandbox JSON+Markdown bytes verify on intended origin',async()=>{
 const x=setup();
 const result=await x.proof.verifyHosted(x.info);
 assert.equal(result.verified,true);
 assert.equal(result.repositoryId,ID);
 assert.equal(result.canonicalLive,false);
 assert.equal(result.mergeSha,MERGE);
 assert.deepEqual(result.verifiedPaths,[JSON_PATH,MD_PATH]);
 assert.match(result.verifiedReleaseId,/^[0-9a-f]{32}$/);
 assert.equal(result.workflowRunId,182);
 assert.equal(x.calls.hosted,2);
 assert(x.calls.github>=10);
});
test('D3-H03 missing probe cannot read private content, even if enabled',async()=>{
 const x=setup();
 const bad=new Request(ORIGIN+d3HostedTestPath(OP,MD_PATH));
 await assert.rejects(x.asset.serve(bad),assetError('HOST_AUTH_DENIED'));
 assert.equal(x.calls.github,0);
});
test('D3-H04 one byte modified on the host rejects the ENTIRE multi-file proof',async()=>{
 const x=setup({alterHosted:true});
 await assert.rejects(x.proof.verifyHosted(x.info),
  proofError('HOSTED_BYTES_MISMATCH'));
});
test('D3-H05 missing Markdown refuses Live even if canonical JSON exists',async()=>{
 const x=setup({missingMarkdown:true});
 await assert.rejects(x.proof.verifyHosted(x.info),
  proofError('FILE_DENIED'));
});
test('D3-H06 repository substitution is denied before any external reads',async()=>{
 const x=setup({foreign:true});
 await assert.rejects(x.proof.verifyHosted(x.info),
  proofError('INVALID_RECEIPT'));
 assert.equal(x.calls.github,0);
});
test('D3-H07 moving sandbox main refuses release identity after bytes',async()=>{
 const x=setup({moveAfter:true});
 await assert.rejects(x.proof.verifyHosted(x.info),
  proofError('MAIN_MOVED'));
});
test('D3-H08 disabled hosted route blocks internal verification without false Live',async()=>{
 const x=setup({enabled:false});
 await assert.rejects(x.proof.verifyHosted(x.info),
  proofError('PRODUCTION_ORIGIN_UNAVAILABLE'));
 assert.equal(x.calls.hosted,1);
});
test('D3-H09 unowned path cannot masquerade as a valid KB hosted edit',async()=>{
 const x=setup(),bad={...x.info,expectedPaths:[JSON_PATH,'pwa/KB/content/forged.md']};
 await assert.rejects(x.proof.verifyHosted(bad),
  proofError('PATHS_MISMATCH'));
});
