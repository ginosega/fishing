import test from 'node:test';
import assert from 'node:assert/strict';
import {d3PublishingReady} from '../src/d3-publishing-readiness.mjs';

const ready=()=>({
 APP_ORIGIN:'https://fishing.example',
 OWNER_GITHUB_ID:'265665562',
 D3_SANDBOX_REPO_ID:'1430581407',
 D3_WRITE_ENABLED:'true',
 D3_RUNNER_ENABLED:'true',
 D3_TEST_HOST_ENABLED:'true',
 D3_READ_TOKENS_ENABLED:'true',
 DB:{prepare(){}},
 OPERATIONS_DB:{prepare(){},batch(){}},
 D2_CSRF_KEY:'synthetic-csrf-'.repeat(4),
 D2_HOST_PROBE_KEY:'synthetic-host-'.repeat(4),
 D2_GITHUB_APP_ID:'1',D3_GITHUB_APP_ID:'1',
 D2_GITHUB_INSTALLATION_ID:'2',D3_GITHUB_INSTALLATION_ID:'2',
 D2_GITHUB_APP_PRIVATE_KEY:'synthetic-nonpem-key-'.repeat(4),
});
test('D3-R01 shared API/runner gate requires every prerequisite',()=>{
 assert.equal(d3PublishingReady(ready()),true);
 assert.equal(d3PublishingReady(null),false);
 assert.equal(d3PublishingReady({}),false);
});
test('D3-R02 every partial privilege combination stays disabled',()=>{
 const keys=['D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
  'D3_TEST_HOST_ENABLED','D3_READ_TOKENS_ENABLED'];
 for(const key of keys){
  assert.equal(d3PublishingReady({...ready(),[key]:'false'}),false,key);
 }
});
test('D3-R03 pinned owner, private repo and exact HTTPS origin',()=>{
 for(const change of [
  {OWNER_GITHUB_ID:'1'},{D3_SANDBOX_REPO_ID:'1350909744'},
  {APP_ORIGIN:'http://fishing.example'},
  {APP_ORIGIN:'https://other.example/path'},
  {APP_ORIGIN:'https://fishing.example?unsafe=1'},
 ]){
  assert.equal(d3PublishingReady({...ready(),...change}),false,
   JSON.stringify(change));
 }
});
test('D3-R04 no receipts unless both D1 bindings and HMAC secrets exist',()=>{
 for(const change of [
  {DB:null},{OPERATIONS_DB:{prepare(){}}},
  {D2_CSRF_KEY:'short'}, {D2_HOST_PROBE_KEY:null},
 ]){
  assert.equal(d3PublishingReady({...ready(),...change}),false);
 }
});
test('D3-R05 missing or mismatched existing App installation denies writer',()=>{
 for(const change of [
  {D2_GITHUB_APP_ID:'0'},
  {D3_GITHUB_APP_ID:'9'},
  {D3_GITHUB_INSTALLATION_ID:'9'},
  {D2_GITHUB_APP_PRIVATE_KEY:null},
  {D2_GITHUB_APP_PRIVATE_KEY:'short'},
 ]){
  assert.equal(d3PublishingReady({...ready(),...change}),false);
 }
});
