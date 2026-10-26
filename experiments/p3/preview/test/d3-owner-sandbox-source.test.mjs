import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3OwnerSandboxSource} from '../src/d3-owner-sandbox-source.mjs';
const ID=1430581407,OWNER=265665562;
const ORIGIN='https://fishing.example';
const URL=ORIGIN+'/api/v3/authoring-source';
const main='a'.repeat(40),tree='b'.repeat(40);
const note='KB/Locations/content/P3 Test Lake.md';
function fixture({enabled=true,owner=OWNER,authenticated=true,
  fails=false,valid=true,large=false}={}){
  const calls={session:0,source:0};
  const session={authorizeStatus:async()=>{
    calls.session++;
    if(!authenticated)throw Error('unauthorized');
    return {authorized:true,ownerGitHubId:owner};
  }};
  const source=async input=>{
    calls.source++;assert.deepEqual(input,{repositoryId:ID});
    if(fails)throw Error('GitHub offline');
    return {
      repositoryId:valid?ID:123,
      sourceRevision:main,treeSha:tree,
      data:{gear:{schemaVersion:2,items:[]},
        kb:{schemaVersion:2,entities:[]},
        catches:{schemaVersion:2,catches:[]}},
      files:new Set([note]),
      markdown:new Map([[note,large?'x'.repeat(1100000):
        '# P3 Test Lake\n\nSynthetic sandbox fixture.\n']]),
      token:'server-only-GitHub-token-never-serialized',
    };
  };
  const service=createD3OwnerSandboxSource({
    origin:ORIGIN,ownerSession:session,loadSnapshot:source,
    enabled:()=>enabled,
  });
  return {service,calls};
}
const get=()=>new Request(URL);

test('D3-SR01 disabled denies before any session/GitHub call',async()=>{
  const x=fixture({enabled:false});
  const res=await x.service.serve(get());
  assert.equal(res.status,503);
  assert.deepEqual(x.calls,{session:0,source:0});
});
test('D3-SR02 authenticated owner receives exact private sandbox source, not public revision',async()=>{
  const x=fixture();
  const res=await x.service.serve(get());
  assert.equal(res.status,200);
  assert.match(res.headers.get('Cache-Control'),/no-store/);
  assert.equal(res.headers.get('Vary'),'Cookie');
  const data=await res.json();
  assert.equal(data.repositoryId,ID);
  assert.equal(data.sourceRevision,main);
  assert.equal(data.treeSha,tree);
  assert.equal(data.canonicalLive,false);
  assert.equal(data.sandboxOnly,true);
  assert.deepEqual(data.markdown.map(r=>r.path),[note]);
  assert.deepEqual(data.files,[note]);
  assert.deepEqual(data.data.gear,{schemaVersion:2,items:[]});
  assert(!JSON.stringify(data).includes('server-only-GitHub-token'));
  assert.deepEqual(x.calls,{session:1,source:1});
});
test('D3-SR03 anonymous or foreign owner cannot load private repo bytes',async()=>{
  for(const options of [{authenticated:false},{owner:987654}]){
    const x=fixture(options);
    const res=await x.service.serve(get());
    assert.equal(res.status,401);
    assert.equal(x.calls.source,0);
  }
});
test('D3-SR04 path, method, query and Authorization header are rejected',async()=>{
  for(const request of [
    new Request(ORIGIN+'/api/v3/authoring-source?ref=main'),
    new Request(ORIGIN+'/api/v3/operations'),
    new Request('https://evil.example/api/v3/authoring-source'),
    new Request(URL,{method:'POST'}),
    new Request(URL,{headers:{Authorization:'Bearer malicious'}}),
  ]){
    const x=fixture();
    const res=await x.service.serve(request);
    assert.equal(res.status,404);
    assert.equal(x.calls.session,0);
    assert.equal(x.calls.source,0);
  }
});
test('D3-SR05 GitHub errors, wrong repo and oversized source fail closed',async()=>{
  for(const [options,code] of [
    [{fails:true},'SOURCE_UNAVAILABLE'],
    [{valid:false},'INVALID_SOURCE'],
    [{large:true},'SOURCE_TOO_LARGE'],
  ]){
    const x=fixture(options);
    const res=await x.service.serve(get());
    assert.equal(res.status,503);
    assert.equal((await res.json()).error,code);
  }
});
