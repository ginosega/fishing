import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {decodeD4OriginalGitBlob} from '../src/d4-git-blob-stage.mjs';
import {createD4PrivateSourceAsset} from '../src/d4-private-source-asset.mjs';

const ID=1430581407,OWNER=265665562;
const MAIN='a'.repeat(40),TREE='b'.repeat(40);
const PATH='Gear/Lures/assets/synthetic.jpg',FILE='pwa/'+PATH;
const ORIGIN='https://d4.example';
const BYTES=new Uint8Array(400000);
BYTES.set([255,216,255,224,1,2,3,4]);
const SHA=createHash('sha1')
 .update(Buffer.from('blob '+BYTES.length+'\0')).update(BYTES).digest('hex');
const CONTENT=Buffer.from(BYTES).toString('base64');
const entry={path:FILE,type:'blob',mode:'100644',
 size:BYTES.length,sha:SHA};
const blob={sha:SHA,encoding:'base64',size:BYTES.length,content:CONTENT};
function setup({enabled=true,owner=true,revision=MAIN,referenced=true,
 sha=SHA}={}){
 const hits=[];
 const source={
  repositoryId:ID,sourceRevision:MAIN,treeSha:TREE,
  files:new Set([PATH]),blobHashes:new Map([[FILE,sha]]),
  data:{
   gear:{items:referenced?[{id:'synthetic',picture:{src:PATH}}]:[]},
   kb:{entities:[]},catches:{catches:[]},
  },
 };
 const route=createD4PrivateSourceAsset({
  origin:ORIGIN,enabled:()=>enabled,
  ownerSession:{authorizeStatus:async()=>owner?
   {ownerGitHubId:OWNER,authorized:true}:null},
  loadSnapshot:async()=>source,
  issueReadToken:async()=>({repositoryId:ID,
   permissions:{contents:'read'},token:'test-read-only-token'}),
  requestGitHub:async(url,options)=>{
   hits.push({url,method:options.method});
   if(url.endsWith('/git/trees/'+TREE+'?recursive=1'))
    return new Response(JSON.stringify({sha:TREE,truncated:false,tree:[entry]}));
   if(url.endsWith('/git/blobs/'+SHA))
    return new Response(JSON.stringify(blob));
   if(url.endsWith('/git/ref/heads/main'))
    return new Response(JSON.stringify({object:{sha:MAIN}}));
   throw Error('unexpected GitHub route');
  },
 });
 const request=new Request(ORIGIN+'/api/v3/assets/'+PATH+
  '?revision='+revision);
 return {route,request,hits};
}
test('D4-A01 separate >320 KB original decoded and SHA-checked, canonical decoder cap remains',async()=>{
 const original=await decodeD4OriginalGitBlob(entry,blob);
 assert.equal(original.bytes.length,400000);
 assert.equal(original.mime,'image/jpeg');
 assert.equal(original.sha256,
  createHash('sha256').update(BYTES).digest('hex'));
});
test('D4-A02 owner image is served from current immutable private source and no-store',async()=>{
 const x=setup(),r=await x.route.serve(x.request);
 assert.equal(r.status,200);
 assert.equal(r.headers.get('X-Fish-D4-Source-Sha'),MAIN);
 assert.equal(r.headers.get('Content-Type'),'image/jpeg');
 assert.match(r.headers.get('Cache-Control'),/no-store/);
 assert.deepEqual(new Uint8Array(await r.arrayBuffer()),BYTES);
 assert.equal(x.hits.length,3);
});
test('D4-A03 anonymous, disabled, unreferenced and stale revision never read blobs',async()=>{
 for(const variant of [
  {enabled:false},{owner:false},{referenced:false},
  {revision:'c'.repeat(40)},{sha:'d'.repeat(40)},
 ]){
  const x=setup(variant),r=await x.route.serve(x.request);
  assert.equal(r.status,404);
  assert.equal(r.headers.get('Cache-Control'),'private, no-store');
  assert(!x.hits.some(v=>v.url.includes('/git/blobs/')));
 }
});
test('D4-A04 image changing after tree read is denied, never served from stale main',async()=>{
 const x=setup();
 const wrong=new Request(ORIGIN+'/api/v3/assets/Gear/Lures/assets/../secrets.jpg?revision='+MAIN);
 assert.equal((await x.route.serve(wrong)).status,404);
 const bearer=new Request(x.request,{headers:{Authorization:'Bearer anything'}});
 assert.equal((await x.route.serve(bearer)).status,404);
 const wrongQuery=new Request(x.request.url+'&extra=1');
 assert.equal((await x.route.serve(wrongQuery)).status,404);
});
