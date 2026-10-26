import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3GatedAuthGateway}
  from '../src/d3-gated-auth-gateway.mjs';

const ORIGIN='https://fishing.example';
const ID=1430581407,OWNER=265665562;
const path='/api/v3/operations';
const request=(route,method='GET')=>new Request(ORIGIN+route,{
  method,...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{}),
});
const env=(extra={})=>({
  APP_ORIGIN:ORIGIN,OWNER_GITHUB_ID:String(OWNER),
  DB:{prepare(){}},OPERATIONS_DB:{prepare(){},batch(){}},
  D2_CSRF_KEY:'s'.repeat(40),
  D3_WRITE_ENABLED:'false',
  D3_READ_TOKENS_ENABLED:'false',
  D3_SANDBOX_REPO_ID:String(ID),
  ...extra,
});
function fixture(){
  const calls={auth:0,proxy:0,api:0,transport:0,created:0,gate:null,source:0,sourceGate:null};
  const service=createD3GatedAuthGateway({
    auth:{fetch:async()=>{
      calls.auth++;return new Response('AUTH', {status:200});}},
    proxy:async()=>{
      calls.proxy++;return new Response('BYTE_IDENTICAL',{status:200});},
    requestGitHub:async()=>{
      calls.transport++;throw Error('unexpected external access');},
    issueReadToken:async()=>{
      calls.transport++;throw Error('unexpected token issue');},
    sessionFactory:args=>{
      assert.equal(args.ownerGitHubId,OWNER);calls.created++;
      return {describe:async()=>{},authorizeWrite:async()=>{},
        authorizeStatus:async()=>{}};
    },
    storeFactory:args=>{
      assert.equal(args.repositoryId,ID);calls.created++;
      return {accept:async()=>{},get:async()=>{}};
    },
    sourceReadFactory:args=>{
      assert.equal(args.origin,ORIGIN);
      assert.equal(typeof args.loadSnapshot,'function');
      calls.source++;
      calls.sourceGate=args.enabled();
      return {serve:async()=>new Response('SANDBOX_READ',
        {status:args.enabled()?200:503})};
    },
    apiFactory:args=>{
      calls.api++;
      calls.gate=args.enabled();
      assert.equal(typeof args.validateCandidate,'function');
      return {handle:async()=>new Response('API',{status:200})};
    },
  });
  return {service,calls};
}
test('D3-G01 default-disabled POST never creates session, store or tokens',async()=>{
  const x=fixture(),res=await x.service.fetch(request(path,'POST'),env(),{});
  assert.equal(res.status,503);
  assert.equal(x.calls.api,0);
  assert.equal(x.calls.created,0);
  assert.equal(x.calls.transport,0);
});

test('D3-G02 same-origin anonymous Pages bytes remain unchanged',async()=>{
  const x=fixture();
  for(const url of ['/fishing/','/fishing/releases/example.js']){
    const res=await x.service.fetch(request(url),env(),{});
    assert.equal(await res.text(),'BYTE_IDENTICAL');
  }
  assert.equal(x.calls.proxy,2);
  assert.equal(x.calls.api,0);
});

test('D3-G03 existing sign-in and callback routes retain AUTH-P0 owner service',async()=>{
  const x=fixture();
  for(const route of ['/auth/start','/auth/callback','/session/signout']){
    const res=await x.service.fetch(request(route),env(),{});
    assert.equal(await res.text(),'AUTH');
  }
  assert.equal(x.calls.auth,3);
  assert.equal(x.calls.api,0);
});

test('D3-G04 disabled writer leaves read-only /session fallback intact',async()=>{
  const x=fixture();
  const res=await x.service.fetch(request('/session'),
    env({OPERATIONS_DB:null}),{});
  assert.equal(await res.text(),'AUTH');
  assert.equal(x.calls.auth,1);
  assert.equal(x.calls.created,0);
});

test('D3-G05 only exact HTTPS origin and allowlisted routes are accepted',async()=>{
  const x=fixture();
  const wrong=new Request('https://other.example/api/v3/operations');
  assert.equal((await x.service.fetch(wrong,env(),{})).status,404);
  for(const legacy of ['/','/test-client.js','/test.css']){
    const res=await x.service.fetch(request(legacy),env(),{});
    assert.equal(res.status,404,'P0 test UI must not be a D3 owner entrypoint: '+legacy);
  }
  assert.equal((await x.service.fetch(request('/_internal/write'),env(),{})).status,404);
  assert.equal((await x.service.fetch(request('/__d2_test__/operations/test/Gear/gear.json'),env(),{})).status,404);
  assert.equal(x.calls.auth,0);
  assert.equal(x.calls.api,0);
});

test('D3-G06 D3 writer cannot pass gate with wrong repo ID or read-only setting',async()=>{
  for(const props of [
    {D3_SANDBOX_REPO_ID:'1350909744'},
    {D3_READ_TOKENS_ENABLED:'false'},
    {D3_WRITE_ENABLED:'false'},
  ]){
    const x=fixture();
    const e=env({D3_WRITE_ENABLED:'true',
      D3_READ_TOKENS_ENABLED:'true',...props});
    const res=await x.service.fetch(request('/session'),e,{});
    assert.equal(res.status,200);
    assert.equal(x.calls.gate,false);
    assert.equal(x.calls.transport,0);
  }
});

test('D3-G07 missing D1, owner identity or CSRF fails closed on enabled route',async()=>{
  for(const props of [
    {OWNER_GITHUB_ID:'42'},
    {OPERATIONS_DB:null},
    {D2_CSRF_KEY:'short'},
  ]){
    const x=fixture(),e=env({
      D3_WRITE_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',...props,
    });
    const res=await x.service.fetch(request(path,'POST'),e,{});
    assert.equal(res.status,503);
    assert.equal(x.calls.api,0);
  }
});

test('D3-G08 correct source-only composition preserves exact sandbox gate',async()=>{
  const x=fixture(),e=env({
    D3_WRITE_ENABLED:'true',D3_READ_TOKENS_ENABLED:'true',
  });
  const res=await x.service.fetch(request(path,'POST'),e,{});
  assert.equal(await res.text(),'API');
  assert.equal(x.calls.api,1);
  assert.equal(x.calls.gate,true);
  assert.equal(x.calls.created,2);
  assert.equal(x.calls.transport,0);
});

test('D3-G09 read-only sandbox source uses separate disabled owner gate, never a publishing route',async()=>{
  const off=fixture();
  const url='/api/v3/authoring-source';
  const denied=await off.service.fetch(request(url),env(),{});
  assert.equal(denied.status,503);
  assert.equal(off.calls.source,1);
  assert.equal(off.calls.sourceGate,false);
  assert.equal(off.calls.api,0);
  assert.equal(off.calls.transport,0);
  const on=fixture();
  const source=await on.service.fetch(request(url),
    env({D3_READ_TOKENS_ENABLED:'true'}),{});
  assert.equal(await source.text(),'SANDBOX_READ');
  assert.equal(on.calls.sourceGate,true);
  assert.equal(on.calls.api,0);
  assert.equal(on.calls.transport,0);
});
