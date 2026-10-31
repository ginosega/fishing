import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {createD3SandboxSnapshotLoader,D3SnapshotError}
  from '../src/d3-sandbox-snapshot-loader.mjs';
import {createD3TrustedGearKBCandidate}
  from '../src/d3-trusted-gear-kb-candidate.mjs';

const ID=1430581407,OWNER=265665562;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const MAIN='8'.repeat(40),TREE='9'.repeat(40);
const OP='p3_01234567-1234-4234-8234-123456789abc';
const NARRATIVE='KB/Locations/content/P3 Test Lake.md';
const original={
  id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
  name:'P3 Test Rod D2 Verification',manufacturer:'Fixture Only',
};
const kb={id:'location-p3-test-lake',type:'location',
  name:'P3 Test Lake',content:NARRATIVE};
const sources={
  'README.md':'Unrelated repository file',
  'pwa/Gear/gear.json':{schemaVersion:2,items:[original]},
  'pwa/KB/kb.json':{schemaVersion:2,entities:[kb]},
  'pwa/Catches/catches.json':{schemaVersion:2,catches:[]},
  ['pwa/'+NARRATIVE]:'# P3 Test Lake\n\nTrusted fixture.\n',
  'pwa/Gear/Rods-Reels/assets/test.jpg':'binary file inventory only',
};
const blobHash=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const answer=(value,status=200)=>({ok:status===200,status,redirected:false,
  json:async()=>value});
const denial=code=>err=>err instanceof D3SnapshotError&&err.code===code;

function fixture({enabled=true,badToken=false,repoId=ID,moveMain=false,
  corrupt=false,omitNarrative=false,duplicate=false,largeNarrative=false,
  redirect=false,inlineGearNotes=false}={}){
  const current=structuredClone(sources);
  if(inlineGearNotes){
    const notes='Gear/Lures/content/Rapala Demon Test.md';
    const media='Gear/Lures/assets/p3-rapala-demon-test/notes/step-02.jpg';
    current['pwa/Gear/gear.json'].items.push({
      id:'p3-rapala-demon-test',category:'lures',
      type:'Crankbaits and hard jerkbaits',name:'Rapala Demon Test',
      notes,
    });
    current['pwa/'+notes]=
      '![step 02](../assets/p3-rapala-demon-test/notes/step-02.jpg "viewer: Step 2")';
    current['pwa/'+media]='synthetic JPG original bytes';
  }
  if(omitNarrative)delete current['pwa/'+NARRATIVE];
  if(largeNarrative)current['pwa/'+NARRATIVE]='x'.repeat(140000);
  const entries=[],blobs=new Map();
  for(const [path,value] of Object.entries(current)){
    const bytes=Buffer.from(typeof value==='string'?value:JSON.stringify(value));
    const sha=blobHash(bytes);
    entries.push({path,type:'blob',mode:'100644',sha,size:bytes.length});
    blobs.set(sha,{sha,size:bytes.length,encoding:'base64',
      content:bytes.toString('base64')});
  }
  if(duplicate)entries.push({...entries.find(x=>x.path==='pwa/Gear/gear.json')});
  const trace=[];let refs=0,issued=0;
  const request=async(url,opts)=>{
    trace.push({url,method:opts.method,redirect:opts.redirect});
    assert(url===API||url.startsWith(API+'/'),'sandbox URL only');
    assert.equal(opts.headers.Authorization,'Bearer d3-read-token-example');
    if(redirect)return {...answer({}),redirected:true};
    if(url===API)return answer({id:repoId,
      full_name:'ginosega/fishing-p3-sandbox',private:true});
    if(url===API+'/git/ref/heads/main'){
      refs++;
      return answer({object:{sha:moveMain&&refs>1?'a'.repeat(40):MAIN}});
    }
    if(url===API+'/git/commits/'+MAIN)
      return answer({sha:MAIN,tree:{sha:TREE}});
    if(url===API+'/git/trees/'+TREE+'?recursive=1')
      return answer({sha:TREE,truncated:false,tree:entries});
    if(url.startsWith(API+'/git/blobs/')){
      const body=blobs.get(url.slice((API+'/git/blobs/').length));
      if(!body)return answer({error:'not found'},404);
      return answer(corrupt?{...body,content:Buffer.from('tampered').toString('base64')}:body);
    }
    throw Error('Unexpected GitHub call: '+url);
  };
  const reader=createD3SandboxSnapshotLoader({
    request,enabled:()=>enabled,
    issueReadToken:async args=>{
      issued++;
      assert.deepEqual(args,{repositoryId:ID,permissions:{contents:'read'}});
      return {repositoryId:ID,permissions:{contents:badToken?'write':'read'},
        token:'d3-read-token-example'};
    },
  });
  return {reader,trace,get refs(){return refs;},
    get issued(){return issued;}};
}
const load=x=>x.reader.loadSnapshot({repositoryId:ID,
  expectedMainSha:MAIN,operationId:OP});

test('D3-L01 immutable actual Git blobs load all domains, markdown and inventory',async()=>{
  const x=fixture(),snapshot=await load(x);
  assert.equal(snapshot.repositoryId,ID);
  assert.equal(snapshot.sourceRevision,MAIN);
  assert.equal(snapshot.treeSha,TREE);
  assert.equal(snapshot.ref,'refs/heads/main');
  assert.equal(snapshot.operationId,OP);
  assert.deepEqual(snapshot.data.gear.items,[original]);
  assert.deepEqual(snapshot.data.kb.entities,[kb]);
  assert.deepEqual(snapshot.data.catches.catches,[]);
  assert(snapshot.files.has(NARRATIVE));
  assert(snapshot.files.has('Gear/Rods-Reels/assets/test.jpg'));
  assert(snapshot.markdown.get(NARRATIVE).includes('Trusted fixture.'));
  assert.equal(snapshot.blobHashes.size,5);
  // A private original-image read must be pinned to the immutable full tree,
  // even when an image isn't a first-class picture field in record JSON.
  const image='pwa/Gear/Rods-Reels/assets/test.jpg';
  assert.match(snapshot.blobHashes.get(image),/^[0-9a-f]{40}$/);
  assert.equal(snapshot.blobHashes.get(image),blobHash(Buffer.from(sources[image])));
  assert.equal(x.refs,2);
  assert.equal(x.issued,1);
  assert(x.trace.every(c=>c.method==='GET'&&c.redirect==='manual'));
  assert(!JSON.stringify(snapshot).includes('d3-read-token-example'));
});

test('D3-L02 trusted source feeds actual D3 Gear planner, with owner/repo boundary',async()=>{
  const x=fixture();
  const change=await prepareChange({
    domain:'gear',operation:'edit',id:original.id,
    record:{...original,name:'P3 Test Rod D3 Verified'},
    baseRecord:original,sourceRevision:MAIN,
  });
  const planner=createD3TrustedGearKBCandidate({
    enabled:()=>true,loadSnapshot:x.reader.loadSnapshot,
  });
  const result=await planner.plan({
    package:change,repositoryId:ID,ownerGitHubId:OWNER,
    expectedMainSha:MAIN,operationId:OP,
  });
  assert.equal(result.validated,true);
  assert.equal(result.operationId,OP);
  assert.deepEqual(result.changes.map(w=>w.path),['pwa/Gear/gear.json']);
  assert.equal(JSON.parse(result.changes[0].body).items[0].name,
    'P3 Test Rod D3 Verified');
  assert.equal(x.refs,2);
});

test('D3-L03 disabled and forged token reject before touching GitHub',async()=>{
  const disabled=fixture({enabled:false});
  await assert.rejects(load(disabled),denial('DISABLED'));
  assert.equal(disabled.issued,0);
  assert.equal(disabled.trace.length,0);
  const bad=fixture({badToken:true});
  await assert.rejects(load(bad),denial('READ_SCOPE_DENIED'));
  assert.equal(bad.trace.length,0);
});

test('D3-L04 wrong immutable repo identity and expected-main drift fail closed',async()=>{
  const badRepo=fixture({repoId:1350909744});
  await assert.rejects(load(badRepo),denial('REPOSITORY_DENIED'));
  assert.equal(badRepo.refs,0);
  const moved=fixture({moveMain:true});
  await assert.rejects(load(moved),denial('MAIN_MOVED'));
  assert.equal(moved.refs,2);
  const wrong=fixture();
  await assert.rejects(wrong.reader.loadSnapshot({
    repositoryId:ID,expectedMainSha:'f'.repeat(40),
  }),denial('MAIN_MOVED'));
  assert.equal(wrong.refs,1);
});

test('D3-L05 exact blob digest mismatch, duplicated tree path deny',async()=>{
  await assert.rejects(load(fixture({corrupt:true})),
    denial('BLOB_DIGEST_DENIED'));
  await assert.rejects(load(fixture({duplicate:true})),
    denial('AMBIGUOUS_TREE_ENTRY'));
});

test('D3-L06 missing canonical Markdown and oversized Markdown refuse',async()=>{
  await assert.rejects(load(fixture({omitNarrative:true})),
    denial('MISSING_REFERENCED_FILE'));
  await assert.rejects(load(fixture({largeNarrative:true})),
    denial('MISSING_OR_LARGE_FILE'));
});

test('D3-L07 redirect/network ambiguity and hostile request are not retried',async()=>{
  const x=fixture({redirect:true});
  await assert.rejects(load(x),denial('SOURCE_UNAVAILABLE'));
  assert.equal(x.trace.length,1);
  await assert.rejects(x.reader.loadSnapshot({
    repositoryId:ID,expectedMainSha:'untrusted',
  }),denial('INVALID_REQUEST'));
});


test('D3-L08 published Rapala Gear Notes-only picture SHA is pinned to the trusted tree',async()=>{
 const x=fixture({inlineGearNotes:true});
 const snapshot=await load(x);
 const note='Gear/Lures/content/Rapala Demon Test.md';
 const image='Gear/Lures/assets/p3-rapala-demon-test/notes/step-02.jpg';
 assert(snapshot.files.has(image));
 assert.equal(snapshot.markdown.get(note),
  '![step 02](../assets/p3-rapala-demon-test/notes/step-02.jpg "viewer: Step 2")');
 assert(!snapshot.data.gear.items.some(r=>r.picture?.src===image),
  'The new image is referenced only inside Notes Markdown');
 assert.equal(snapshot.blobHashes.get('pwa/'+image),
  blobHash(Buffer.from('synthetic JPG original bytes')));
 assert.equal(snapshot.blobHashes.size,7);
 // This hash proves membership in the immutable source tree, not permission.
 // D4 still authorizes every requested image against the current Notes body.
 assert.equal(x.refs,2);
 assert.equal(x.issued,1);
});
