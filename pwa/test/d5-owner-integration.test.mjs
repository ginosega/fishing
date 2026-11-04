import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD5DeviceDraftStore} from '../src/d5-device-drafts.mjs';
import {restoreD5EditorDraft,saveD5EditorDraft}
 from '../src/d5-editor-recovery.mjs';
import {D5_OWNER_CANDIDATE_BASE,selectD5OwnerCandidate,readD5CandidateMode,startD5OwnerCandidate}
 from '../src/d5-owner-candidate.mjs';

const release={id:'a'.repeat(32),sourceRevision:'b'.repeat(40)};
const manifest={base:D5_OWNER_CANDIDATE_BASE,v3OwnerCandidate:true,
 releaseId:release.id,sourceRevision:release.sourceRevision};
const url='https://example.test'+D5_OWNER_CANDIDATE_BASE;
const sourceRevision='b'.repeat(40),baseHash='c'.repeat(64);
const record={id:'p3-test-item',name:'Sample'};
const createIO=()=>{
 const rows=new Map();
 return {rows,io:{get:async key=>rows.get(key),
  put:async row=>{rows.set(row.key,structuredClone(row));},
  delete:async key=>{rows.delete(key);}}};
};
const make=(io)=>createD5DeviceDraftStore({enabled:true,root:url,io});
test('D5-O01 owner candidate is opt-in, scope-bound and distinct from anonymous reader',()=>{
 assert.equal(selectD5OwnerCandidate(),false);
 assert.equal(selectD5OwnerCandidate({enabled:true,root:url,release,manifest}),true);
 for(const root of ['http://example.test'+D5_OWNER_CANDIDATE_BASE,
  'https://example.test/fishing/',url+'?debug=1',
  'https://another.test/fishing/__v3_reader_candidate__/']){
  assert.throws(()=>selectD5OwnerCandidate({
   enabled:true,root,release,manifest}),/scope|root/);
 }
 assert.throws(()=>selectD5OwnerCandidate({enabled:true,root:url,
  release,manifest:{...manifest,v3ReaderCandidate:true}}),/mismatch/);
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 assert.match(entry,/__FISHING_V3_OWNER_CANDIDATE__/);
 assert.match(build,/v3OwnerCandidate&&v3ReaderCandidate|v3ReaderCandidate&&v3OwnerCandidate/);
 assert.match(build,/base!==D5_OWNER_CANDIDATE_BASE/);
 assert.match(build,/__FISHING_V3_OWNER_CANDIDATE__/);
});
test('D5-O02 durable text draft is scoped, explicitly restored or discarded',async()=>{
 const mock=createIO(),store=make(mock.io),key='gear:edit:p3-test-item';
 assert.equal(await saveD5EditorDraft({store,key,domain:'gear',record,notes:'test',
  sourceRevision,baseHash}),true);
 assert.equal(mock.rows.size,1);
 assert([...mock.rows.keys()][0].startsWith(url));
 const restored=await restoreD5EditorDraft({store,key,sourceRevision,baseHash,
  ask:()=>true});
 assert.equal(restored.status,'restored');assert.equal(restored.notes,'test');
 assert.equal((await store.read(key,{sourceRevision,baseHash})).status,'ready');
 const discarded=await restoreD5EditorDraft({store,key,sourceRevision,baseHash,
  ask:()=>false});
 assert.equal(discarded.status,'discarded');
 assert.equal(mock.rows.size,0);
});
test('D5-O03 stale base cannot restore and remains until explicit discard',async()=>{
 const mock=createIO(),store=make(mock.io),key='kb:edit:p3-test-item';
 await store.save({key,domain:'kb',sourceRevision,baseHash,record,
  notes:'a',requiresMedia:false});
 const newer='d'.repeat(40);
 const blocked=await restoreD5EditorDraft({store,key,sourceRevision:newer,
  baseHash,ask:()=>false});
 assert.equal(blocked.status,'stale');assert.equal(mock.rows.size,1);
 const cleared=await restoreD5EditorDraft({store,key,sourceRevision:newer,
  baseHash,ask:()=>true});
 assert.equal(cleared.status,'discarded');assert.equal(mock.rows.size,0);
});
test('D5-O04 storage errors and corruption do not restore or report durable save',async()=>{
 const store=make({get:async()=>{throw Error('QUOTA');},
  put:async()=>{throw Error('QUOTA');},delete:async()=>{throw Error('QUOTA');}});
 assert.equal((await store.read('gear:add:lures',{sourceRevision})).status,'unavailable');
 await assert.rejects(store.save({key:'gear:add:lures',domain:'gear',
  sourceRevision,record,notes:''}),/STORAGE_UNAVAILABLE/);
 const mock=createIO(),good=make(mock.io),key='catches:add:catch';
 mock.rows.set(url+key,{key:url+key,version:1,domain:'catches',
  record:{id:'wrong',secret:'token'},sourceRevision,baseHash:null,notes:'',
  requiresMedia:false,updatedAt:1});
 assert.equal((await good.read(key,{sourceRevision})).status,'corrupt');
});
test('D5-O05 no media bytes, credentials or publication receipts enter device store',async()=>{
 const mock=createIO(),store=make(mock.io),key='gear:add:lures';
 await store.save({key,domain:'gear',record,notes:'draft',sourceRevision,
  requiresMedia:true});
 const serialized=JSON.stringify([...mock.rows.values()]);
 assert.doesNotMatch(serialized,/csrfToken|operationId|idempotencyKey|credential/);
 assert.equal((await store.read(key,{sourceRevision})).draft.requiresMedia,true);
 await assert.rejects(store.save({key,domain:'gear',record:{...record,csrfToken:'secret'},
  notes:'draft',sourceRevision}),/INVALID_DEVICE_DRAFT/);
});
test('D5-O06 device drafts remain separately disableable and no V2 code path opts in',()=>{
 assert.equal(createD5DeviceDraftStore({enabled:false,root:'invalid'}),null);
 const app=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 assert.match(app,/bootstrap\(settings\)\)\.catch/);
 const pilot=readFileSync(new URL('../../experiments/p3/preview/src/d3-owner-test-shell.mjs',import.meta.url),'utf8');
 assert.match(pilot,/draftRecovery=false/);
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/state\.publication==='Live'&&state\.sandboxVerified===true/);
 assert.match(ui,/drafts\?\.discard/);
});

test('D5-O07 deliberate discard waits for pending autosave and does not resurrect it',async()=>{
 const mock=createIO(),store=make(mock.io),key='gear:edit:p3-test-item';
 const first=store.save({key,domain:'gear',sourceRevision,baseHash,
  record,notes:'in flight'});
 const discard=store.discard(key);
 await Promise.all([first,discard]);
 assert.equal(mock.rows.size,0);
 assert.equal((await store.read(key,{sourceRevision,baseHash})).status,'missing');
});
test('D5-O08 editor cancellation honors device draft discard; accepted status does not erase',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../src/editor.mjs',import.meta.url),'utf8');
 const catchEditor=readFileSync(new URL('../src/catch-editor.mjs',import.meta.url),'utf8');
 assert.match(ui,/editor\?\.discardDraft\?\.\(\)/);
 assert.match(editor,/discardDraft,dispose/);
 assert.match(catchEditor,/discardDraft,dispose/);
 assert.match(editor,/Draft saved on this device\. Nothing has been published/);
 assert.match(catchEditor,/Draft saved on this device\. Nothing has been published/);
 assert.match(ui,/state\.publication==='Live'&&state\.sandboxVerified===true/);
});

test('D5-O09 authenticated candidate refreshes verified sandbox source but retains V3 reading controls',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/const ownerCandidate=v3Mode&&location\.pathname==='\/fishing\/__v3_owner_candidate__\/'/);
 assert.match(ui,/const sandboxRefresh=privatePilot\|\|ownerCandidate/);
 assert.match(ui,/onlineOnly:privatePilot/);
 assert.match(ui,/v3ReadingMode:v3Mode&&!privatePilot/);
 assert.match(ui,/if\(!sandboxRefresh\|\|typeof ctx\.v3\?\.refreshSandboxSource/);
});

test('D5-O10 persisted Work Offline is checked before any owner session request',async()=>{
 const root=url;
 const ports={port1:{onmessage:null,close(){}},port2:{}};
 const fake={
  getRegistration:async()=>({scope:root,active:{postMessage(message){
   assert.equal(message.type,'V3_READ_MODE');
   queueMicrotask(()=>ports.port1.onmessage({data:{
    type:'FISHING_V3_MODE',available:true,mode:'Work Offline'}}));
  }}}),
 };
 assert.equal(await readD5CandidateMode(root,{
  serviceWorker:fake,openChannel:()=>ports
 }),'Work Offline');
 assert.equal(await readD5CandidateMode(root,{serviceWorker:{
  getRegistration:async()=>null}}),'Automatic');
 assert.equal(await readD5CandidateMode(root,{serviceWorker:null}),'Unknown');
});
test('D5-O11 offline-mode cold relaunch leaves the owner service untouched',async()=>{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
 let count=0;
 const output=await startD5OwnerCandidate({
  root:url,release,manifest
 },{
  readMode:async()=> 'Work Offline',
  request:async()=>{count++;throw Error('Owner service invoked while Work Offline');},
  bootstrapApp:async(_settings,options)=>options,
 });
 assert.equal(count,0);
 assert.equal(output.v3.readerOnly,true);
 assert.equal(output.v3.publish,undefined);
 if(prior)Object.defineProperty(globalThis,'navigator',prior);
 else delete globalThis.navigator;
});
test('D5-O12 owner session polling uses verified effective reading mode',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/online:\(\)=>onlineForEditing\(\)/);
 assert.doesNotMatch(ui,/online:\(\)=>navigator\.onLine&&!workOffline\(\)/);
});
