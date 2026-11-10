import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD6ProductionGitHubReadback,D6GitHubReadbackError}
 from '../../experiments/p3/preview/src/d6-production-github-readback.mjs';
import {describeD6ProductionGitHubStep}
 from '../../experiments/p3/preview/src/d6-production-github-step-writer.mjs';

const REPO=1350909744,OWNER=265665562;
const ID='00000000-0000-4000-8000-000000000001';
const SOURCE='a'.repeat(40),BASE_TREE='b'.repeat(40);
const RESULT_TREE='f'.repeat(40),COMMIT='c'.repeat(40);
const HASH='d'.repeat(64),OLD='1'.repeat(40),NEW='2'.repeat(40);
const MD='3'.repeat(40),BRANCH='fish-v3/publish/'+ID;
const API='https://api.github.com/repos/ginosega/fishing';
const scope={contents:'write',pull_requests:'write'};
const operation=()=>({operationId:ID,ownerGitHubId:OWNER,
 repositoryId:REPO,ref:'refs/heads/main',
 sourceRevision:SOURCE,candidateSha256:HASH,
 state:'Accepted',domain:'gear',operation:'edit'});
const plans={
 branch:{},
 blob:{path:'Gear/Lures/content/Sample.md',content:'# Sample'},
 tree:{baseTreeSha:BASE_TREE,resultTreeSha:RESULT_TREE,entries:[
  {path:'Gear/gear.json',mode:'100644',type:'blob',sha:NEW},
  {path:'Gear/Lures/content/Sample.md',mode:'100644',
   type:'blob',sha:MD},
 ]},
 commit:{treeSha:RESULT_TREE,resultCommitSha:COMMIT},
 advance:{commitSha:COMMIT},
 pr:{},
};
const copy=x=>structuredClone(x);
const ref=sha=>({ref:'refs/heads/'+BRANCH,
 object:{type:'commit',sha}});
const commit=(sha=COMMIT,tree=RESULT_TREE)=>({
 sha,message:'Fishing Companion V3 content update '+ID,
 tree:{sha:tree},parents:[{sha:SOURCE}],
});
const tree=(sha,items)=>({sha,truncated:false,tree:items.map(
 ([path,fileSha,mode='100644',type='blob'])=>({
  path,sha:fileSha,mode,type,
 }))});
const baseTree=()=>tree(BASE_TREE,[['Gear/gear.json',OLD],
 ['README.md',OLD]]);
const resultTree=()=>tree(RESULT_TREE,[['Gear/gear.json',NEW],
 ['Gear/Lures/content/Sample.md',MD],['README.md',OLD]]);
const pr=()=>({number:501,state:'open',draft:false,merged_at:null,
 head:{ref:BRANCH,sha:COMMIT,repo:{id:REPO}},
 base:{ref:'main',sha:SOURCE,repo:{id:REPO}}});
const blobSha=content=>{
 const raw=Buffer.from(content,'utf8');
 return createHash('sha1').update(
  Buffer.concat([Buffer.from('blob '+raw.length+'\0'),raw])).digest('hex');
};
const responses=()=>{
 const map=new Map();
 const put=(endpoint,obj)=>map.set(API+endpoint,obj);
 put('/git/ref/heads/'+BRANCH,ref(SOURCE));
 const body=plans.blob.content;
 put('/git/blobs/'+blobSha(body),{
  sha:blobSha(body),encoding:'base64',
  size:Buffer.byteLength(body),content:Buffer.from(body).toString('base64'),
 });
 put('/git/commits/'+SOURCE,commit(SOURCE,BASE_TREE));
 put('/git/trees/'+BASE_TREE+'?recursive=1',baseTree());
 put('/git/trees/'+RESULT_TREE+'?recursive=1',resultTree());
 put('/git/commits/'+COMMIT,commit());
 put('/pulls?state=all&head='+encodeURIComponent('ginosega:'+BRANCH)+
  '&per_page=100',[pr()]);
 return map;
};
const json=(o,{status=200,headers={}}={})=>new Response(
 JSON.stringify(o),{status,headers:{
  'Content-Type':'application/json',...headers,
 }});
function setup({
 active=true,actor=operation(),planPatch={},fencePatch={},
 provider=responses(),revoke='',tokenOk=true,
 transport,
}={}){
 const state={active,reads:0,plans:[],fences:[],
  tokens:[],network:[],provider};
 const verifier=createD6ProductionGitHubReadback({
  enabled:()=>state.active,
  readOperation:async id=>{
   state.reads++;assert.equal(id,ID);return actor;
  },
  planStep:async({operationId,step})=>{
   state.plans.push(step);assert.equal(operationId,ID);
   return {operationId,ownerGitHubId:OWNER,repositoryId:REPO,
    sourceRevision:SOURCE,candidateSha256:HASH,
    step,sourceOnly:true,...copy(plans[step]),...copy(planPatch)};
  },
  readStepFence:async({operationId,stepKey})=>{
   state.fences.push(stepKey);
   const step=stepKey.startsWith('blob:')?'blob':stepKey;
   const p={operationId,ownerGitHubId:OWNER,repositoryId:REPO,
    sourceRevision:SOURCE,candidateSha256:HASH,
    step,sourceOnly:true,...copy(plans[step]),...copy(planPatch)};
   const action=await describeD6ProductionGitHubStep({
    operation:actor,step,plan:p,
   });
   return {operation_id:operationId,step_key:stepKey,
    owner_github_id:OWNER,repository_id:REPO,
    request_sha256:action.requestSha256,
    state:'Unknown',...fencePatch};
  },
  issueWriteToken:async args=>{
   state.tokens.push(args);
   if(revoke==='token')state.active=false;
   return tokenOk?{repositoryId:REPO,permissions:scope,
    token:'SYNTHETIC-NOT-A-GITHUB-TOKEN-123456789'}:
    {repositoryId:REPO,permissions:{contents:'read'},token:'wrong'};
  },
  request:async(url,options)=>{
   state.network.push({url,options});
   if(transport)return transport(url,options);
   if(!provider.has(url))return json({message:'not found'},{status:404});
   return json(provider.get(url));
  },
 });
 return {verifier,state};
}
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6GitHubReadbackError&&e.code===code);

test('D6-RBACK01 default OFF no operation/D1/token/GitHub access',async()=>{
 const x=setup({active:false});
 await denied(x.verifier.inspect(ID,'branch'),'DISABLED');
 assert.equal(x.state.reads,0);assert.equal(x.state.network.length,0);
 assert.equal(x.state.tokens.length,0);
 assert.deepEqual(Object.keys(x.verifier),['inspect']);
});

test('D6-RBACK02 branch independently verified exact ref and original SHA',async()=>{
 const x=setup();
 const r=await x.verifier.inspect(ID,'branch');
 assert.equal(r.githubReadbackVerified,true);
 assert.equal(r.remoteObjectSha,SOURCE);
 assert.equal(r.fenceStillUnknown,true);
 assert.equal(r.requiresDurableReconciliation,true);
 assert.equal(r.canMerge,false);assert.equal(r.isLive,false);
 assert.deepEqual(x.state.network.map(n=>n.url),[
  API+'/git/ref/heads/'+BRANCH,
 ]);
 assert.equal(x.state.network[0].options.method,'GET');
 assert.equal(x.state.network[0].options.redirect,'manual');
 assert.equal(x.state.network[0].options.credentials,'omit');
 assert.deepEqual(x.state.tokens[0],{
  repositoryId:REPO,permissions:scope,
 });
});

test('D6-RBACK03 branch moving to foreign SHA remains unverified',async()=>{
 for(const bad of [ref(COMMIT),{...ref(SOURCE),
  ref:'refs/heads/main'},{...ref(SOURCE),object:{sha:SOURCE,type:'tree'}}]){
  const map=responses();map.set(API+'/git/ref/heads/'+BRANCH,bad);
  const x=setup({provider:map});
  await denied(x.verifier.inspect(ID,'branch'),'REF_UNVERIFIED');
 }
});

test('D6-RBACK04 blob verifies Git object SHA-1 and exact returned bytes',async()=>{
 const x=setup(),r=await x.verifier.inspect(ID,'blob');
 assert.equal(r.remoteObjectSha,blobSha('# Sample'));
 assert.equal(r.verifiedBytes,8);
 assert.equal(x.state.network[0].url,
  API+'/git/blobs/'+blobSha('# Sample'));
});

test('D6-RBACK05 modified blob bytes/size/encoding/sha are rejected',async()=>{
 const path=API+'/git/blobs/'+blobSha('# Sample');
 const correct=responses().get(path);
 for(const patch of [
  {sha:OLD},{size:9},{encoding:'utf-8'},
  {content:Buffer.from('# Alter').toString('base64')},
  {content:'!!!!!!'},
  {content:'a'.repeat(200001)},
 ]){
  const map=responses();map.set(path,{...correct,...patch});
  const x=setup({provider:map});
  await denied(x.verifier.inspect(ID,'blob'),'BLOB_UNVERIFIED');
 }
});

test('D6-RBACK06 tree verifies base main and exact authorized blob diff',async()=>{
 const x=setup(),r=await x.verifier.inspect(ID,'tree');
 assert.equal(r.remoteObjectSha,RESULT_TREE);
 assert.equal(r.changedPathsVerified,2);
 assert.deepEqual(x.state.network.map(x=>x.url),[
  API+'/git/commits/'+SOURCE,
  API+'/git/trees/'+BASE_TREE+'?recursive=1',
  API+'/git/trees/'+RESULT_TREE+'?recursive=1',
 ]);
});

test('D6-RBACK07 missing tree object SHA stays Unknown, no GitHub read',async()=>{
 const x=setup({planPatch:{resultTreeSha:null}});
 await denied(x.verifier.inspect(ID,'tree'),'OBJECT_ID_UNKNOWN');
 assert.equal(x.state.network.length,0);
});

test('D6-RBACK08 tree cannot include unseen content or modified README',async()=>{
 const entry=API+'/git/trees/'+RESULT_TREE+'?recursive=1';
 for(const mutation of [
  t=>{t.tree.push({path:'README.md',sha:NEW,mode:'100644',type:'blob'});},
  t=>{t.tree=t.tree.filter(x=>x.path!=='Gear/gear.json');},
  t=>{t.tree.find(x=>x.path==='Gear/gear.json').mode='120000';},
  t=>{t.tree.find(x=>x.path==='Gear/gear.json').sha=OLD;},
  t=>{t.truncated=true;},
  t=>{t.tree.push({...t.tree[0]});},
 ]){
  const map=responses(),t=copy(map.get(entry));mutation(t);map.set(entry,t);
  const x=setup({provider:map});
  await denied(x.verifier.inspect(ID,'tree'),'TREE_UNVERIFIED');
 }
});

test('D6-RBACK09 tree base must match reviewed canonical main commit',async()=>{
 const map=responses(),key=API+'/git/commits/'+SOURCE;
 map.set(key,{...commit(SOURCE,BASE_TREE),tree:{sha:RESULT_TREE}});
 const x=setup({provider:map});
 await denied(x.verifier.inspect(ID,'tree'),'BASE_TREE_UNVERIFIED');
});

test('D6-RBACK10 commit SHA must be known and parent/tree/message exact',async()=>{
 const x=setup(),r=await x.verifier.inspect(ID,'commit');
 assert.equal(r.remoteObjectSha,COMMIT);
 for(const patch of [
  {sha:OLD},{tree:{sha:OLD}},{parents:[{sha:COMMIT}]},
  {parents:[]},{message:'unrelated commit'},
 ]){
  const map=responses();map.set(API+'/git/commits/'+COMMIT,
   {...commit(),...patch});
  const s=setup({provider:map});
  await denied(s.verifier.inspect(ID,'commit'),'COMMIT_UNVERIFIED');
 }
 const unknown=setup({planPatch:{resultCommitSha:null}});
 await denied(unknown.verifier.inspect(ID,'commit'),'OBJECT_ID_UNKNOWN');
 assert.equal(unknown.state.network.length,0);
});

test('D6-RBACK11 branch advance must equal planned commit with original parent',async()=>{
 const map=responses();map.set(API+'/git/ref/heads/'+BRANCH,ref(COMMIT));
 const x=setup({provider:map});
 const r=await x.verifier.inspect(ID,'advance');
 assert.equal(r.remoteObjectSha,COMMIT);
 assert.equal(r.remoteTreeSha,RESULT_TREE);
 map.set(API+'/git/commits/'+COMMIT,{
  ...commit(),parents:[{sha:OLD}],
 });
 const bad=setup({provider:map});
 await denied(bad.verifier.inspect(ID,'advance'),'COMMIT_UNVERIFIED');
});

test('D6-RBACK12 PR verified only by GitHub list+matching branch+commit',async()=>{
 const map=responses();map.set(API+'/git/ref/heads/'+BRANCH,ref(COMMIT));
 const x=setup({provider:map});
 const r=await x.verifier.inspect(ID,'pr');
 assert.equal(r.prNumber,501);assert.equal(r.remoteObjectSha,COMMIT);
 assert.equal(r.isLive,false);assert.equal(r.fenceStillUnknown,true);
 assert.equal(x.state.network.length,3);
 assert(x.state.network[0].url.includes('head=ginosega%3A'));
});

test('D6-RBACK13 missing, duplicate, forked, or incorrect PR not proved',async()=>{
 const url=API+'/pulls?state=all&head='+
  encodeURIComponent('ginosega:'+BRANCH)+'&per_page=100';
 for(const result of [
  [],[pr(),pr()],
  [{...pr(),base:{ref:'develop',repo:{id:REPO}}}],
  [{...pr(),head:{...pr().head,repo:{id:1}}}],
  [{...pr(),draft:true}],
  [{...pr(),state:'closed'}],
 ]){
  const map=responses();map.set(url,result);
  const x=setup({provider:map});
  await denied(x.verifier.inspect(ID,'pr'),'PR_UNVERIFIED');
 }
});

test('D6-RBACK14 PR list next-page pagination always fails closed',async()=>{
 const x=setup({transport:async(url)=>json([pr()],{
  headers:{Link:'<https://api.github.com/next>; rel="next"'},
 })});
 await denied(x.verifier.inspect(ID,'pr'),'INCOMPLETE_PR_LIST');
});

test('D6-RBACK15 fenced immutable request mismatch prevents GitHub reads',async()=>{
 const x=setup({fencePatch:{request_sha256:'f'.repeat(64)}});
 await denied(x.verifier.inspect(ID,'branch'),'FENCE_MISMATCH');
 assert.equal(x.state.tokens.length,0);
 assert.equal(x.state.network.length,0);
});

test('D6-RBACK16 forged operation/repo or unauthorized token fails',async()=>{
 for(const bad of [
  {ownerGitHubId:0},{repositoryId:1430581407},
  {state:'Unknown'},{sourceRevision:'bad'},
  {domain:'catches'},{ref:'refs/heads/fake'},
 ]){
  const x=setup({actor:{...operation(),...bad}});
  await denied(x.verifier.inspect(ID,'branch'),'UNTRUSTED_OPERATION');
  assert.equal(x.state.tokens.length,0);
 }
 const bad=setup({tokenOk:false});
 await denied(bad.verifier.inspect(ID,'branch'),'TOKEN_UNAVAILABLE');
 assert.equal(bad.state.network.length,0);
});

test('D6-RBACK17 invalid HTTP/redirect/fetch failure never proves object',async()=>{
 for(const transport of [
  async()=>Response.redirect('https://evil.invalid',302),
  async()=>new Response('Forbidden',{status:403}),
  async()=>new Response('<html>no</html>',{
   headers:{'Content-Type':'text/html'},
  }),
  async()=>{throw Error('hidden token error');},
  async()=>json({unexpected:true},{headers:{
   'Content-Length':'999999999',
  }}),
 ]){
  const x=setup({transport});
  await denied(x.verifier.inspect(ID,'branch'),'GITHUB_READ_UNAVAILABLE');
 }
});

test('D6-RBACK18 disable during token issuance blocks all reads',async()=>{
 const x=setup({revoke:'token'});
 await denied(x.verifier.inspect(ID,'branch'),'DISABLED');
 assert.equal(x.state.network.length,0);
});

test('D6-RBACK19 source read-only API cannot write or mark D1 verified',async()=>{
 const x=setup();
 await x.verifier.inspect(ID,'branch');
 assert(x.state.network.every(c=>c.options.method==='GET'));
 assert.equal(Object.hasOwn(x.verifier,'publish'),false);
 assert.equal(Object.hasOwn(x.verifier,'merge'),false);
 assert.equal(Object.hasOwn(x.verifier,'createPr'),false);
 assert.equal(Object.hasOwn(x.verifier,'updateFence'),false);
 assert.throws(()=>createD6ProductionGitHubReadback({
  readOperation:()=>{},readStepFence:()=>{},planStep:()=>{},
  issueWriteToken:null,request:()=>{},
 }),e=>e instanceof D6GitHubReadbackError&&e.code==='INVALID_CONFIG');
});
