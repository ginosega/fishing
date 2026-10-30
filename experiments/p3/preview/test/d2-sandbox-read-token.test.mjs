import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createD2SandboxReadTokenIssuer,D2TokenError} from '../src/d2-sandbox-read-token.mjs';
const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pem=privateKey.export({format:'pem',type:'pkcs8'}).toString();
const ID=1430581407,API='https://api.github.com',REPO='ginosega/fishing-p3-sandbox';
const grants={checks:'read',contents:'write',pull_requests:'write',metadata:'read'};
const env={D2_GITHUB_APP_ID:'42',D2_GITHUB_INSTALLATION_ID:'99',
 D2_GITHUB_APP_PRIVATE_KEY:pem};
const error=code=>e=>e instanceof D2TokenError&&e.code===code;
const response=body=>({ok:true,status:200,redirected:false,json:async()=>body});
function setup({enabled=false,permissions=grants,wrongRepo=false,
 wrongIssued=false,issuedMetadata=false,issuedExtra=null,missingSecret=false}={}){
 const trace=[];
 const subject=createD2SandboxReadTokenIssuer({
  env:missingSecret?{...env,D2_GITHUB_APP_PRIVATE_KEY:null}:env,
  enabled:()=>enabled,
  request:async(url,opt)=>{
   trace.push({url,method:opt.method,body:opt.body?JSON.parse(opt.body):null});
   assert.equal(opt.redirect,'manual');
   assert.match(opt.headers.Authorization,/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
   if(url===API+'/app/installations/99')return response({
    id:99,app_id:42,account:{login:'ginosega'},repository_selection:'selected',
    suspended_at:null,permissions,
   });
   if(url===API+'/repos/'+REPO+'/installation')return response({
    id:wrongRepo?123:99,app_id:42,account:{login:'ginosega'},
   });
   if(url===API+'/app/installations/99/access_tokens'){
    assert.equal(opt.method,'POST');
    const requested=JSON.parse(opt.body);
    assert.deepEqual(requested.repository_ids,[ID]);
    const allowed=[{contents:'read'},{contents:'read',pull_requests:'read',checks:'read'}];
    assert(allowed.some(v=>JSON.stringify(Object.keys(v).sort())===
     JSON.stringify(Object.keys(requested.permissions).sort())&&
     Object.keys(v).every(k=>v[k]===requested.permissions[k])));
    return response({
     token:'restricted-read-token-example',
     permissions:wrongIssued?{contents:'write'}:{
      ...requested.permissions,
      ...(issuedMetadata?{metadata:'read'}:{}),
      ...(issuedExtra||{}),
     },
     repositories:[{id:ID,full_name:REPO}],
    });
   }
   throw Error('Unexpected path');
  },
 });
 return {subject,trace};
}
test('D2-T01 default-off issuer never signs or sends a provider request',async()=>{
 const x=setup();
 await assert.rejects(x.subject.issueReadToken({
  repositoryId:ID,permissions:{contents:'read'},
 }),error('READ_TOKENS_DISABLED'));
 assert.equal(x.trace.length,0);
});
test('D2-T02 exact read-only token minted only for immutable private sandbox',async()=>{
 const x=setup({enabled:true});
 const result=await x.subject.issueReadToken({
  repositoryId:ID,permissions:{contents:'read'},
 });
 assert.deepEqual(result,{repositoryId:ID,
  permissions:{contents:'read'},token:'restricted-read-token-example'});
 assert.deepEqual(x.trace.map(z=>z.method),['GET','GET','POST']);
 assert(!JSON.stringify(x.trace).includes(pem.slice(0,50)));
});
test('D2-T03 wrong repo/scopes/grants/issuance are refused before unsafe authority',async()=>{
 for(const opts of [
  {wrongRepo:true,code:'TARGET_DENIED'},
  {wrongIssued:true,code:'TOKEN_DENIED'},
  {permissions:{...grants,administration:'read'},code:'INSTALLATION_DENIED'},
  {permissions:{...grants,contents:'read'},code:'INSTALLATION_DENIED'},
  {missingSecret:true,code:'MISSING_SERVER_KEY'},
 ]){
  const x=setup({enabled:true,...opts});
  await assert.rejects(x.subject.issueReadToken({
   repositoryId:ID,permissions:{contents:'read'},
  }),error(opts.code));
 }
});
test('D2-T04 public repo or write token scopes fail before any App signing',async()=>{
 for(const request of [
  {repositoryId:1350909744,permissions:{contents:'read'}},
  {repositoryId:ID,permissions:{contents:'write'}},
  {repositoryId:ID,permissions:{contents:'read',pull_requests:'read'}},
 ]){
  const x=setup({enabled:true});
  await assert.rejects(x.subject.issueReadToken(request),error('READ_SCOPE_DENIED'));
  assert.equal(x.trace.length,0);
 }
});

test('D2-T05 exact checks, contents and PR-read grant for trusted CI observer is permitted',async()=>{
 const x=setup({enabled:true});
 const scope={checks:'read',contents:'read',pull_requests:'read'};
 const result=await x.subject.issueReadToken({
  repositoryId:ID,permissions:scope,
 });
 assert.deepEqual(result.permissions,scope);
 assert.equal(result.repositoryId,ID);
 assert.equal(x.trace.filter(z=>z.method==='POST').length,1);
});

test('D2-T06 implicit GitHub metadata:read on exact one-repo read token is allowed',async()=>{
 const x=setup({enabled:true,issuedMetadata:true});
 const r=await x.subject.issueReadToken({repositoryId:ID,
  permissions:{contents:'read'}});
 assert.deepEqual(r.permissions,{contents:'read'});
 assert.equal(x.trace.length,3);
 const y=setup({enabled:true,issuedMetadata:true});
 const p={contents:'read',pull_requests:'read',checks:'read'};
 const checked=await y.subject.issueReadToken({repositoryId:ID,permissions:p});
 assert.deepEqual(checked.permissions,p);
});
test('D2-T07 only implicit metadata:read extra is allowed, never write or other extra',async()=>{
 for(const issuedExtra of [
  {metadata:'write'},{actions:'read'},{administration:'read'},
  {contents:'write'},{pull_requests:'write'}, {checks:'write'},
 ]){
  const x=setup({enabled:true,issuedExtra});
  await assert.rejects(x.subject.issueReadToken({
   repositoryId:ID,permissions:{contents:'read'},
  }),error('TOKEN_DENIED'));
 }
});
