/**
 * FISH118 P3-0: hermetic, backend-independent publishing broker prototype.
 * This module has NO network, GitHub App credentials, Cloudflare binding,
 * HTTP route or deploy integration. All store/GitHub/source-aware adapters are injected.
 * The GitHub and validation adapters are mocks in this stage. NOT production-ready.
 */
import {createHash, timingSafeEqual} from 'node:crypto';

export class BrokerError extends Error {
  constructor(code, message) {super(message); this.name='BrokerError'; this.code=code;}
}
const deny=(code,msg)=>{throw new BrokerError(code,msg);};
const assert=(condition,code,msg)=>{if(!condition)deny(code,msg);};
const sha=value=>createHash('sha256').update(value).digest('hex');
const jsonHash=value=>sha(JSON.stringify(value));
const clean=s=>typeof s==='string' && s.length>0 && s.length<=256;
const idOk=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,159}$/.test(s);
const operationStates=new Set(['Accepted','Validating','Checking','Merging','Deploying','Live','Conflict','Failed']);
const shaOk=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
function constEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length && timingSafeEqual(x,y);
}
export function safeCanonicalPath(path,domain){
 assert(typeof path==='string'&&path.length<=240,'INVALID_PATH','Invalid path');
 assert(!path.startsWith('/')&&!path.includes('\\')&&!path.includes('%')&&!/\p{Cc}/u.test(path),'INVALID_PATH','Invalid path');
 assert(!path.split('/').some(s=>!s||s==='.'||s==='..'),'INVALID_PATH','Invalid path');
 assert(path.startsWith(domain==='gear'?'Gear/':'KB/'),'INVALID_PATH','Path outside approved content root');
 assert(!path.endsWith('/') && !/(?:^|\/)\.git(?:\/|$)/i.test(path),'INVALID_PATH','Invalid path');
 return path;
}
function validateSubmission(req,settings){
 const {session,http,repository,package:pkg,idempotencyKey,media=[]}=req??{};
 assert(session?.githubId===settings.ownerGitHubId && Number.isSafeInteger(session.githubId),'UNAUTHORIZED','Owner session required');
 assert(Number.isSafeInteger(session.expiresAt) && session.expiresAt>settings.now(),'UNAUTHORIZED','Session expired');
 assert(http?.origin===settings.origin && http?.fetchSite==='same-origin','CSRF','Same-origin request required');
 assert(http?.method==='POST'&&http?.intent==='publish','CSRF','Publish intent required');
 assert(constEqual(http?.csrf,session?.csrf),'CSRF','Invalid CSRF proof');
 assert(repository?.id===settings.repositoryId && repository?.name===settings.repositoryName,'REPOSITORY_DENIED','Repository not allowlisted');
 assert(typeof idempotencyKey==='string' && /^[a-zA-Z0-9_-]{12,96}$/.test(idempotencyKey),'INVALID_REQUEST','Invalid idempotency key');
 assert(pkg?.format==='fishing-companion-change-v2' && ['gear','kb'].includes(pkg.domain) && ['add','edit'].includes(pkg.operation),'INVALID_PACKAGE','Unsupported change package');
 assert(idOk(pkg.id)&&pkg.base?.schemaVersion===2&&clean(pkg.base.sourceRevision),'INVALID_PACKAGE','Invalid identity/base');
 assert(pkg.operation!=='add' || (pkg.record && typeof pkg.record==='object' && !Array.isArray(pkg.record)),'INVALID_PACKAGE','Add requires a new record');
 assert(pkg.operation!=='edit' || (pkg.changes && typeof pkg.changes==='object' && pkg.changes.baseFields && typeof pkg.changes.baseFields==='object'),'INVALID_PACKAGE','Edit requires source-aware base fields');
 assert(media && Array.isArray(media) && media.length<=12,'MEDIA','Invalid media count');
 const paths=new Set();let bytes=0;
 for(const file of media){
  assert(file?.content instanceof Uint8Array,'MEDIA','Media bytes required');
  const path=safeCanonicalPath(file.path,pkg.domain);
  assert(/\.(?:png|jpe?g|webp|gif)$/i.test(path)&&path.includes('/assets/'),'MEDIA','Invalid media asset path');
  assert(!paths.has(path),'MEDIA','Duplicate media file');paths.add(path);
  assert(file.content.length>0&&file.content.length<=settings.maxFileBytes,'MEDIA','Media file too large');
  assert(typeof file.sha256==='string' && /^[a-f0-9]{64}$/.test(file.sha256),'MEDIA','Invalid media digest');
  assert(sha(file.content)===file.sha256,'MEDIA','Media digest mismatch');
  bytes+=file.content.length;
 }
 assert(bytes<=settings.maxTotalBytes,'MEDIA','Media request too large');
 return {session,http,repository,pkg,idempotencyKey,media};
}

export function createBroker({store,github,sourceAware,ownerGitHubId,repositoryId,repositoryName,origin,now=()=>Math.floor(Date.now()/1000),maxFileBytes=3_000_000,maxTotalBytes=8_000_000}){
 assert(store&&github&&sourceAware&&Number.isSafeInteger(ownerGitHubId)&&Number.isSafeInteger(repositoryId)&&clean(repositoryName)&&origin?.startsWith('https://'),'CONFIG','Broker configuration required');
 for(const fn of ['insertOnce','get','update'])assert(typeof store[fn]==='function','CONFIG','Missing durable store method');
 for(const fn of ['readSnapshot','ensurePullRequest','checkPullRequest','getMainSha','mergePullRequest','verifyDeployment'])assert(typeof github[fn]==='function','CONFIG','Missing GitHub adapter method');
 assert(typeof sourceAware.promote==='function','CONFIG','Mandatory source-aware validator missing');
 const settings={ownerGitHubId,repositoryId,repositoryName,origin,now,maxFileBytes,maxTotalBytes};
 // NOTE: a real server must bind session identity/expiry to its own D1 lookup,
 // not accept session objects supplied by a browser. This prototype has no HTTP adapter.
 const submit=async request=>{
  const v=validateSubmission(request,settings);
  const submitted={package:structuredClone(v.pkg),media:v.media.map(m=>({path:m.path,sha256:m.sha256,bytes:m.content.length,content:Array.from(m.content)}))};
  const fingerprint=jsonHash(submitted);
  const key=v.session.githubId+':'+v.repository.id+':'+v.idempotencyKey;
  const newRecord={id:sha(key).slice(0,32),key,ownerId:v.session.githubId,repoId:v.repository.id,repoName:v.repository.name,
   fingerprint,request:submitted,state:'Accepted',createdAt:now(),updatedAt:now(),history:['Accepted']};
  const {record,inserted}=await store.insertOnce(key,newRecord);
  assert(record.fingerprint===fingerprint,'IDEMPOTENCY_CONFLICT','The idempotency key was reused for different content');
  return {id:record.id,state:record.state,inserted};
 };
 const status=async (id,session)=>{
  assert(session?.githubId===ownerGitHubId && Number.isSafeInteger(session.expiresAt)&&session.expiresAt>now(),'UNAUTHORIZED','Owner session required');
  const op=await store.get(id);
  assert(op?.ownerId===session.githubId&&op.repoId===repositoryId,'NOT_FOUND','Unknown operation');
  return {id:op.id,state:op.state,prNumber:op.prNumber??null,headSha:op.headSha??null,mergedSha:op.mergedSha??null,releaseId:op.releaseId??null,reason:op.reason??null};
 };
 const step=async id=>{
  const op=await store.get(id);
  assert(op?.repoId===repositoryId&&op.ownerId===ownerGitHubId,'NOT_FOUND','Unknown operation');
  assert(operationStates.has(op.state),'STATE','Unknown state');
  if(['Live','Failed','Conflict'].includes(op.state))return statusInternal(op);
  // This mock stepper is deliberately single-threaded. The real D1 adapter
  // must use CAS claims/lease expiry + durable retry, tested before deployment.
  try{
   if(op.state==='Accepted'){
    await store.update(id,{state:'Validating'},op.state);
    return {id,state:'Validating'};
   }
   if(op.state==='Validating'){
    const snapshot=await github.readSnapshot({repositoryId:repositoryId});
    assert(shaOk(snapshot?.mainSha),'SNAPSHOT','Missing exact main SHA');
    const plan=await sourceAware.promote({package:structuredClone(op.request.package),media:op.request.media.map(m=>({path:m.path,sha256:m.sha256,content:Uint8Array.from(m.content)})),snapshot});
    assert(plan?.validated===true && Array.isArray(plan.changes)&&plan.changes.length>0,'VALIDATION','Full candidate/source validation required');
    assert(plan.changes.every(x=>x && ['write','delete'].includes(x.action)&&safeCanonicalPath(x.path,op.request.package.domain)),'VALIDATION','Invalid candidate path');
    const pr=await github.ensurePullRequest({operationId:id,repositoryId,baseSha:snapshot.mainSha,changes:plan.changes});
    assert(Number.isSafeInteger(pr?.number)&&shaOk(pr.headSha),'GITHUB','Unverifiable PR identity');
    await store.update(id,{state:'Checking',baseSha:snapshot.mainSha,headSha:pr.headSha,prNumber:pr.number},'Validating');
    return {id,state:'Checking',prNumber:pr.number};
   }
   if(op.state==='Checking'){
    const check=await github.checkPullRequest({number:op.prNumber,headSha:op.headSha});
    assert(check?.headSha===op.headSha,'CHECKS','Check SHA differs from PR head');
    if(check.conclusion==='pending')return statusInternal(op);
    assert(check.conclusion==='success' && check.rulesSatisfied===true,'CHECKS','PR checks/rules not satisfied');
    await store.update(id,{state:'Merging'},'Checking');return {id,state:'Merging'};
   }
   if(op.state==='Merging'){
    const current=await github.getMainSha();assert(current===op.baseSha,'CONFLICT','Main moved after candidate creation');
    const merge=await github.mergePullRequest({number:op.prNumber,expectedHeadSha:op.headSha,operationId:id});
    assert(shaOk(merge?.mergeSha),'GITHUB','Missing merged SHA');
    await store.update(id,{state:'Deploying',mergedSha:merge.mergeSha},'Merging');return {id,state:'Deploying'};
   }
   if(op.state==='Deploying'){
    const result=await github.verifyDeployment({sourceSha:op.mergedSha,operationId:id});
    if(result?.status==='pending')return statusInternal(op);
    assert(result?.status==='success'&&result?.verified===true&&result?.sourceSha===op.mergedSha&&/^[a-f0-9]{32}$/.test(result?.releaseId),'DEPLOYMENT','Not verified on intended merged source');
    await store.update(id,{state:'Live',releaseId:result.releaseId},'Deploying');return {id,state:'Live',releaseId:result.releaseId};
   }
  }catch(error){
   const code=error instanceof BrokerError?error.code:'FAILED';
   const terminal=code==='CONFLICT'?'Conflict':'Failed';
   const current=await store.get(id);
   if(current && !['Live','Conflict','Failed'].includes(current.state))await store.update(id,{state:terminal,reason:code},current.state);
   return {id,state:terminal,reason:code};
  }
 };
 const statusInternal=op=>({id:op.id,state:op.state,reason:op.reason??null});
 return Object.freeze({submit,status,step});
}
