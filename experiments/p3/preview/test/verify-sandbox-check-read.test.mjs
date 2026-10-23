import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {verifySandboxCheckGrant,P3ReadProofError}
 from '../tools/verify-sandbox-check-read.mjs';

const ID=1430581407;
const REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com';
const HEAD='7e39c018081e9677b33c3bcab7ebe80b44d924f8';
const BASE='e37db3b18bd9948bf4453d7f885f868e830a9a9a';
const KEY=generateKeyPairSync('rsa',{modulusLength:2048})
 .privateKey.export({format:'pem',type:'pkcs1'}).toString();
const env=()=>({
 P3_CHECK_READ_PROOF_ENABLED:'true',P3_WRITE_ENABLED:'false',
 P3_GITHUB_APP_ID:'1001',P3_GITHUB_INSTALLATION_ID:'2002',
 P3_GITHUB_PRIVATE_KEY:KEY,
});
function fixture({checks='read',wrongApp=false,movedMain=false,missingCheck=false,
 wrongCheckSource=false,changedPR=false,grantExtra=false,deny=false}={}){
 const calls=[];let mainReads=0,prReads=0;
 const reply=(value,status=200)=>({
  ok:status>=200&&status<300,status,json:async()=>value,
 });
 const request=async(url,init)=>{
  calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});
  assert.equal(init.headers['User-Agent'],'fishing-p3-sandbox-publisher');
  if(deny&&url.endsWith('/access_tokens'))return reply({message:'no'},403);
  const installation={id:2002,app_id:wrongApp?3003:1001,
   account:{login:'ginosega'},repository_selection:'selected',
   suspended_at:null,permissions:{contents:'write',pull_requests:'write',checks}};
  if(url===API+'/app/installations/2002')return reply(installation);
  if(url===API+'/repos/'+REPO+'/installation')return reply(installation);
  if(url===API+'/app/installations/2002/access_tokens'){
   assert.equal(init.method,'POST');
   assert.deepEqual(JSON.parse(init.body),{
    repository_ids:[ID],
    permissions:{contents:'read',pull_requests:'read',checks:'read'},
   });
   return reply({
    token:'restricted_sandbox_read_only_token_example',
    permissions:{contents:'read',pull_requests:'read',checks:'read',metadata:'read',
     ...(grantExtra?{administration:'read'}:{})},
    repositories:[{id:ID,full_name:REPO}],
   },201);
  }
  const root=API+'/repos/'+REPO;
  assert.equal(init.method,'GET');
  if(url===root)return reply({id:ID,full_name:REPO,private:true});
  if(url===root+'/git/ref/heads/main'){
   mainReads++;
   return reply({object:{sha:movedMain&&mainReads===2?'f'.repeat(40):BASE}});
  }
  if(url===root+'/pulls/1'){
   prReads++;
   return reply({number:1,state:'open',draft:true,merged:false,merged_at:null,
    head:{sha:changedPR&&prReads===2?'e'.repeat(40):HEAD,
     ref:'experiment/p3-7-ci-smoke',repo:{id:ID}},
    base:{sha:BASE,ref:'main',repo:{id:ID}},
   });
  }
  if(url===root+'/commits/'+HEAD+'/check-runs?per_page=100&filter=latest')
   return reply(missingCheck?{total_count:0,check_runs:[]}:{
    total_count:1,check_runs:[{id:120492395098,name:'validate-sandbox-head',
     status:'completed',conclusion:'success',head_sha:HEAD,
     app:{id:wrongCheckSource?42:15368}}],
   });
  throw Error('Unknown fixture read '+url);
 };
 return {request,calls};
}
test('P3-L01 one-shot App proof returns only safe, immutable evidence',async()=>{
 const f=fixture();
 const proof=await verifySandboxCheckGrant({env:env(),request:f.request});
 assert.equal(Object.isFrozen(proof),true);
 assert.deepEqual(proof,{
  verified:true,repository:REPO,repositoryId:ID,
  prNumber:1,headSha:HEAD,baseSha:BASE,
  checkName:'validate-sandbox-head',checkRunId:120492395098,
  result:'completed/success',checksReadPermissionConfirmed:true,
  canMerge:false,canDeploy:false,
 });
 const serialized=JSON.stringify(proof);
 assert(!serialized.includes('restricted_sandbox'));
 assert(!serialized.includes('PRIVATE KEY'));
 assert.equal(f.calls.length,9);
 assert.deepEqual(f.calls.filter(x=>x.method==='POST')
  .map(x=>({url:x.url,body:x.body})),[{
  url:API+'/app/installations/2002/access_tokens',
  body:{repository_ids:[ID],permissions:{
   contents:'read',pull_requests:'read',checks:'read',
  }},
 }]);
 assert.equal(f.calls.filter(x=>x.method!=='GET').length,1);
});
test('P3-L02 missing explicit one-shot flag or write-disabled state refuses without touching GitHub',async()=>{
 for(const change of [
  {P3_CHECK_READ_PROOF_ENABLED:'false'},
  {P3_WRITE_ENABLED:'true'},
  {P3_WRITE_ENABLED:undefined},
 ]){
  const f=fixture();
  await assert.rejects(verifySandboxCheckGrant({env:{...env(),...change},request:f.request}),
   e=>e instanceof P3ReadProofError&&e.code==='PROOF_DISABLED');
  assert.equal(f.calls.length,0);
 }
});
test('P3-L03 Checks permission absent on App installation is a hard stop',async()=>{
 const f=fixture({checks:null});
 await assert.rejects(verifySandboxCheckGrant({env:env(),request:f.request}),
  e=>e.code==='CHECKS_INSTALLATION_NOT_APPROVED');
 assert(!f.calls.some(x=>x.method==='POST'));
});
test('P3-L04 app identity, expanded token and GitHub grant errors refuse',async()=>{
 for(const [options,code] of [
  [{wrongApp:true},'CHECKS_INSTALLATION_NOT_APPROVED'],
  [{grantExtra:true},'READ_GRANT_SCOPE_MISMATCH'],
  [{deny:true},'GITHUB_RESPONSE_DENIED'],
 ]){
  const f=fixture(options);
  await assert.rejects(verifySandboxCheckGrant({env:env(),request:f.request}),
   e=>e.code===code);
 }
});
test('P3-L05 stale base, altered PR or unrelated check are never accepted',async()=>{
 for(const [options,code] of [
  [{movedMain:true},'MAIN_MOVED'],
  [{changedPR:true},'PR_HEAD_OR_BASE_MOVED'],
  [{wrongCheckSource:true},'CHECK_IDENTITY_DENIED'],
  [{missingCheck:true},'CHECK_MISSING_OR_AMBIGUOUS'],
 ]){
  const f=fixture(options);
  await assert.rejects(verifySandboxCheckGrant({env:env(),request:f.request}),
   e=>e.code===code,JSON.stringify(options));
 }
});
