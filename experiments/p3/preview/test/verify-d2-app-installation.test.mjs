import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyD2AppInstallation,D2ActivationProofError} from
 '../tools/verify-d2-app-installation.mjs';

const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com';
const installation=28282828,app=5436811;
const expected={contents:'write',pull_requests:'write',checks:'read',metadata:'read'};
const fakeKey='-----BEGIN RSA PRIVATE KEY-----\n'+'a'.repeat(160)+'\n-----END RSA PRIVATE KEY-----';
const okJson=(obj,status=200)=>({ok:true,status,redirected:false,json:async()=>obj});
const refuse=code=>e=>e instanceof D2ActivationProofError&&e.code===code;
function fixture({permissions=expected,scope='selected',repositories=[{
 id:ID,full_name:REPO,private:true}],tokenPerms={
 contents:'read',pull_requests:'read',checks:'read',metadata:'read',
 },association=true,failAt=null}={}){
 const calls=[];
 const request=async (url,opt={})=>{
  calls.push({url,method:opt.method,body:opt.body?JSON.parse(opt.body):null});
  if(url===failAt)return {ok:false,status:403,redirected:false};
  if(url===API+'/app/installations/'+installation)return okJson({
   id:installation,app_id:app,account:{login:'ginosega'},
   repository_selection:scope,suspended_at:null,permissions,
  });
  if(url===API+'/repos/'+REPO+'/installation')return okJson({
   id:association?installation:1,app_id:app,account:{login:'ginosega'},
  });
  if(url===API+'/app/installations/'+installation+'/access_tokens'){
   assert.equal(opt.method,'POST');
   assert.deepEqual(JSON.parse(opt.body),{permissions:{
    contents:'read',pull_requests:'read',checks:'read',
   }});
   assert.equal(opt.body.includes('repository_ids'),false);
   return okJson({token:'read-only-secret-token',permissions:tokenPerms},201);
  }
  if(url===API+'/installation/repositories?per_page=100&page=1'){
   assert.equal(opt.method,'GET');
   return okJson({total_count:repositories.length,repositories});
  }
  throw Error('unexpected external call');
 };
 return {request,calls};
}
async function verify(opts={}){
 const {request,calls}=fixture(opts);
 const output=await verifyD2AppInstallation({
  appId:String(app),installationId:String(installation),privateKey:fakeKey,
  request,signJwt:async()=> 'fixture.jwt.signed',
 });
 return {output,calls};
}
test('D2-A01 full GitHub installation inventory identifies EXACT one private sandbox with read-only token',async()=>{
 const {output,calls}=await verify();
 assert.equal(output.verified,true);
 assert.equal(output.installationSelectedOnly,true);
 assert.equal(output.selectedRepositoryCount,1);
 assert.equal(output.repositoryId,ID);
 assert.equal(output.inspectionToken,'read-only');
 assert.equal(output.publishingEnabled,false);
 assert.equal(calls.length,4);
 assert.deepEqual(calls.map(x=>x.method),['GET','GET','POST','GET']);
 assert(calls.every(x=>x.url.startsWith(API)));
 assert(!JSON.stringify(output).includes('secret'));
 assert(!JSON.stringify(output).includes('fixture.jwt.signed'));
});
test('D2-A02 grants with extra repo or ALL repositories are denied',async()=>{
 await assert.rejects(verify({repositories:[{id:ID,full_name:REPO,private:true},
  {id:999999,full_name:'ginosega/fishing',private:false}]}),refuse('INSTALLATION_REPOSITORY_SCOPE_DENIED'));
 await assert.rejects(verify({scope:'all'}),refuse('WRONG_INSTALLATION'));
});
test('D2-A03 missing Content/PR writes, extra permissions, and missing Checks block activation',async()=>{
 for(const bad of [
  {...expected,contents:'read'}, {...expected,pull_requests:'read'},
  {...expected,checks:undefined},{...expected,actions:'write'},
 ]){
  await assert.rejects(verify({permissions:bad}),refuse('INSTALLATION_PERMISSIONS_NOT_READY'));
 }
});
test('D2-A04 installation mismatch and unauthenticated sandbox are denied',async()=>{
 await assert.rejects(verify({association:false}),refuse('SANDBOX_NOT_INSTALLED'));
 await assert.rejects(verify({failAt:API+'/repos/'+REPO+'/installation'}),refuse('GITHUB_REJECTED'));
});
test('D2-A05 token lacks full read downgrade or includes write/extra scope',async()=>{
 for(const tokenPerms of [
  {contents:'write',pull_requests:'read',checks:'read'},
  {contents:'read',pull_requests:'read',checks:'read',actions:'read'},
  {contents:'read',pull_requests:'read',metadata:'read'},
 ]){
  await assert.rejects(verify({tokenPerms}),refuse('READ_TOKEN_NOT_RESTRICTED'));
 }
});
test('D2-A06 no PEM, invalid id or signer failure refuses without GitHub request',async()=>{
 const f=fixture();
 await assert.rejects(verifyD2AppInstallation({
  appId:'0',installationId:String(installation),privateKey:fakeKey,
  request:f.request,signJwt:async()=> 'token',
 }),refuse('BAD_LOCAL_CONFIG'));
 await assert.rejects(verifyD2AppInstallation({
  appId:String(app),installationId:String(installation),privateKey:fakeKey,
  request:f.request,signJwt:async()=>{throw Error('secret');},
 }),refuse('PEM_SIGNING_FAILED'));
 assert.deepEqual(f.calls,[]);
});
