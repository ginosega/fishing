import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {DOMAIN,sha256} from '../src/shared.mjs';
import {prepareChange,promoteChange} from '../src/handoff.mjs';
import {expectedD6CanonicalMedia}
 from '../../experiments/p3/preview/src/d6-production-media-contract.mjs';
import {D6_PUBLISH_REPOSITORY,D6_PUBLISH_INTAKE_ORIGIN}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {createD6ProductionMediaTicketVerifier,
 d6CanonicalMediaTicketPayload,D6_MEDIA_TICKET_VERSION}
 from '../../experiments/p3/preview/src/d6-production-media-ticket-verify.mjs';
import {createD6ProductionAtomicSourceMediaTree,D6AtomicMediaTreeError}
 from '../../experiments/p3/preview/src/d6-production-atomic-source-media-tree.mjs';

const REPO=D6_PUBLISH_REPOSITORY,ORIGIN=D6_PUBLISH_INTAKE_ORIGIN;
const MAIN='a'.repeat(40),BASE_TREE='c'.repeat(40),SNAP='b'.repeat(64);
const ID='123e4567-e89b-42d3-a456-426614174000',NOW=1800000002;
const SECRET='source-only-test-key-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const PNG=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'));
const gitSha=bytes=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+bytes.length+'\0'),Buffer.from(bytes)])).digest('hex');
const PNG_SHA=gitSha(PNG);
const blob=bytes=>({sha:gitSha(bytes),encoding:'base64',
 size:bytes.length,content:Buffer.from(bytes).toString('base64')});
const baseData=()=>({
 gear:{schemaVersion:2,items:[]},
 kb:{schemaVersion:2,entities:[]},
 catches:{schemaVersion:2,catches:[]},
});
async function setup(kind='catches'){
 let domain,id,record,text='',imagePaths=[],opts={};
 const meta=(path,digest)=>({path,bytes:PNG.length,sha256:digest});
 const digest=await sha256(PNG);
 if(kind==='catches'){
  domain='catches';id='catch-example';
  record={id,date:'2026-11-12'};
  imagePaths=['Catches/assets/catch-example/notes/photo.png'];
  text='The fish\n\n![Original](../assets/catch-example/notes/photo.png)';
  opts={notesImages:imagePaths.map(x=>meta(x,digest))};
 }else if(kind==='gear'){
  domain='gear';id='example-jig';
  record={id,category:'lures',type:'Jigs',name:'Example Jig'};
  imagePaths=['Gear/Lures/assets/example.png'];
  opts={pictureAction:'add',picturePath:imagePaths[0],
   pictureFile:meta(imagePaths[0],digest)};
 }else{
  domain='kb';id='example-knot';
  record={id,type:'knot',name:'Example Knot'};
  imagePaths=[1,2].map(n=>'KB/Knots/assets/example-knot/step-0'+n+'.png');
  text='# Example Knot';
  opts={pictureAction:'add',picturePath:imagePaths[1],
   pictureFile:meta(imagePaths[1],digest),
   pictureSequenceAction:'set',
   pictureSequencePaths:imagePaths,
   pictureSequenceFiles:imagePaths.map(x=>meta(x,digest))};
 }
 const pkg=await prepareChange({domain,operation:'add',id,record,
  text,sourceRevision:MAIN,...opts});
 const operation={operationId:ID,repositoryId:REPO.id,
  ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,state:'Accepted',
  sourceRevision:MAIN,snapshotSha256:SNAP,
  domain,recordId:id,operation:'add'};
 const source={repositoryId:REPO.id,repositoryFullName:REPO.name,
  ref:REPO.ref,sourceRevision:MAIN,treeSha:BASE_TREE,
  sourceOnly:true,canPublish:false,data:baseData(),
  files:new Set(Object.values(DOMAIN).map(x=>x.file)),
  markdown:new Map()};
 const promoted=await promoteChange({package:pkg,sourceRevision:MAIN});
 const next=baseData();
 next[domain][DOMAIN[domain].array].push(promoted.record);
 const bodies=new Map();
 const jsonBody=JSON.stringify(next[domain],null,2)+'\n';
 bodies.set(gitSha(Buffer.from(jsonBody)),Buffer.from(jsonBody));
 if(pkg.notes.action==='create'){
  const contents=Buffer.from(pkg.notes.body);
  bodies.set(gitSha(contents),contents);
 }
 bodies.set(PNG_SHA,PNG);
 const tickets=[];
 for(const item of expectedD6CanonicalMedia(pkg)){
  const ticket={version:D6_MEDIA_TICKET_VERSION,operationId:ID,
   repositoryId:REPO.id,ownerGitHubId:REPO.ownerGitHubId,
   ref:REPO.ref,sourceRevision:MAIN,snapshotSha256:SNAP,
   path:item.path,blobSha:PNG_SHA,sha256:digest,
   bytes:PNG.length,mime:'image/png',
   issuedAt:NOW-10,expiresAt:NOW+1000};
  ticket.signature=createHmac('sha256',SECRET)
   .update(d6CanonicalMediaTicketPayload(ORIGIN,ticket))
   .digest('base64url');
  tickets.push(ticket);
 }
 const verifyTicket=createD6ProductionMediaTicketVerifier({
  secret:SECRET,origin:ORIGIN,now:()=>NOW,
 }).verifyTicket;
 const calls=[];
 const originalReader=async({repositoryId,repositoryFullName,blobSha})=>{
  calls.push(blobSha);
  assert.equal(repositoryId,REPO.id);
  assert.equal(repositoryFullName,REPO.name);
  const bytes=bodies.get(blobSha);
  if(!bytes)throw Error('missing Git blob');
  return blob(bytes);
 };
 const state={enabled:true,reader:originalReader,source};
 const tree=createD6ProductionAtomicSourceMediaTree({
  loadSnapshot:async({expectedReleaseRevision})=>{
   assert.equal(expectedReleaseRevision,MAIN);return state.source;
  },
  readGitBlob:async ctx=>state.reader(ctx),
  verifyTicket,enabled:()=>state.enabled,
 });
 const input={operation,package:pkg,mediaTickets:tickets};
 return {tree,input,source,state,bodies,calls,paths:imagePaths,
  jsonBody,pkg,tickets,operation};
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6AtomicMediaTreeError&&e.code===code);

test('WP3-ATOM01 Catch Notes yields one all-or-nothing JSON/Markdown/image tree',async()=>{
 const x=await setup('catches'),result=await x.tree.plan(x.input);
 assert.equal(result.atomicTreeReady,true);
 assert.equal(result.canSubmitTree,false);
 assert.equal(result.canPublish,false);
 assert.equal(result.isLive,false);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.baseTreeSha,BASE_TREE);
 assert.equal(result.ref,REPO.ref);
 assert.equal(result.mediaCount,1);
 assert.equal(result.textCount,2);
 assert.equal(result.fileCount,3);
 assert.deepEqual(new Set(result.entries.map(v=>v.path)),new Set([
  'Catches/catches.json','Catches/content/catch-example.md',x.paths[0],
 ]));
 assert.deepEqual(result.entries.find(v=>v.path===x.paths[0]),{
  path:x.paths[0],mode:'100644',type:'blob',sha:PNG_SHA});
 assert.equal(result.requiresDurableGitStepFence,true);
 assert.equal(result.requiresIndependentTreeReadback,true);
 assert.equal(x.calls.length,3);
});

test('WP3-ATOM02 Gear representative original shares atomic tree with record JSON',async()=>{
 const x=await setup('gear'),r=await x.tree.plan(x.input);
 assert.equal(r.mediaCount,1);assert.equal(r.textCount,1);
 assert.equal(r.entries.length,2);
 assert.deepEqual(new Set(r.entries.map(v=>v.path)),new Set([
  DOMAIN.gear.file,x.paths[0],
 ]));
 assert.equal(r.entries.find(v=>v.path===x.paths[0]).sha,PNG_SHA);
});

test('WP3-ATOM03 Knot sequence frames retain exact order and bytes',async()=>{
 const x=await setup('kb'),r=await x.tree.plan(x.input);
 assert.equal(r.mediaCount,2);assert.equal(r.textCount,2);
 assert.equal(r.entries.length,4);
 assert.deepEqual(new Set(r.entries.map(v=>v.path)),new Set([
  DOMAIN.kb.file,'KB/Knots/content/Example Knot.md',
  ...x.paths,
 ]));
 for(const path of x.paths)
  assert.equal(r.entries.find(v=>v.path===path).sha,PNG_SHA);
 assert.equal(x.calls.length,4);
});

test('WP3-ATOM04 ticket forgery and a missing ticket never yield partial tree',async()=>{
 const x=await setup();
 x.input.mediaTickets=[{...x.tickets[0],sha256:'f'.repeat(64)}];
 await denied(x.tree.plan(x.input),'SIGNED_MEDIA_UNVERIFIED');
 assert.equal(x.calls.length,0);
 x.input.mediaTickets=[];
 await denied(x.tree.plan(x.input),'SIGNED_MEDIA_UNVERIFIED');
 assert.equal(x.calls.length,0);
});

test('WP3-ATOM05 missing or forged Markdown or JSON blob fails closed',async()=>{
 const x=await setup(),original=x.state.reader;
 x.state.reader=async ctx=>{
  if(ctx.blobSha!==PNG_SHA)throw Error('staging unfinished');
  return original(ctx);
 };
 await denied(x.tree.plan(x.input),'TEXT_BLOB_READ_UNKNOWN');
 const y=await setup(),first=y.state.reader;
 y.state.reader=async ctx=>{
  const result=await first(ctx);
  if(ctx.blobSha===PNG_SHA)return result;
  result.content=Buffer.from('corrupt').toString('base64');
  return result;
 };
 await denied(y.tree.plan(y.input),'TEXT_BLOB_UNVERIFIED');
});

test('WP3-ATOM06 stale or foreign source and operation never read Git blobs',async()=>{
 const x=await setup();
 x.state.source={...x.source,repositoryId:123};
 await denied(x.tree.plan(x.input),'UNVERIFIED_MAIN');
 assert.equal(x.calls.length,0);
 const y=await setup();
 y.input.operation.sourceRevision='d'.repeat(40);
 await denied(y.tree.plan(y.input),'UNTRUSTED_OPERATION');
 assert.equal(y.calls.length,0);
});

test('WP3-ATOM07 pre-existing asset path cannot be silently overwritten',async()=>{
 const x=await setup();
 x.source.files.add(x.paths[0]);
 await denied(x.tree.plan(x.input),'EXISTING_MEDIA_COLLISION');
 assert.equal(x.calls.length,0);
});

test('WP3-ATOM08 canonical record ID conflicts cannot mutate another record',async()=>{
 const x=await setup();
 x.source.data.catches.catches.push({id:'catch-example',
  date:'2026-11-12'});
 await denied(x.tree.plan(x.input),'RECORD_CONFLICT');
 assert.equal(x.calls.length,0);
});

test('WP3-ATOM09 changed Notes must embed their exact original images',async()=>{
 const x=await setup();
 x.pkg.notes.body='A Note with no embedded image';
 await denied(x.tree.plan(x.input),'MEDIA_OWNERSHIP_DENIED');
 assert.equal(x.calls.length,0);
});

test('WP3-ATOM10 disabled planner makes no source or blob request',async()=>{
 const x=await setup();
 x.state.enabled=false;
 await denied(x.tree.plan(x.input),'DISABLED');
 assert.equal(x.calls.length,0);
});
