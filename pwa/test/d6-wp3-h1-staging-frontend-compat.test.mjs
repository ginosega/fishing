import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6OwnerEditorPreviewGate,D6OwnerEditorPreviewError}
 from '../src/d6-owner-editor-preview-gate.mjs';
import {createD6OwnerConnectionAdapter}
 from '../src/d6-owner-connection-adapter.mjs';
import {createD6OwnerDeviceDraftStore}
 from '../src/d6-owner-device-drafts.mjs';

const PROD='https://fishing.ginosega.workers.dev/fishing/';
const STAGE='https://fishing-v3-wp3-test.ginosega.workers.dev/fishing/';
const WP2='https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/';
const HOSTED='a'.repeat(40),MAIN='b'.repeat(40);
const source=(patch={})=>({
 repositoryId:1350909744,repositoryFullName:'ginosega/fishing',
 ref:'refs/heads/main',sourceRevision:MAIN,treeSha:'c'.repeat(40),
 stagingOnly:true,hostedRevision:HOSTED,sourceOnly:true,canPublish:false,
 files:new Set(['Gear/gear.json']),markdown:new Map(),
 data:{gear:{items:[]},kb:{entities:[]},catches:{catches:[]}},
 ...patch,
});
const readiness={check:async()=>({state:'Owner',canPublish:false,ownerLogin:'ginosega'})};
function gate({root=STAGE,wp3Staging=true,reply=source(),
 readingMode='Automatic',session=readiness}={}){
 return createD6OwnerEditorPreviewGate({
  root,releaseRevision:HOSTED,wp3Staging,
  ownerReadiness:session,canonicalSource:{load:async()=>reply},
  enabled:()=>true,online:()=>true,readingMode:()=>readingMode,
 });
}
const denied=(promise,code)=>assert.rejects(promise,e=>
 e instanceof D6OwnerEditorPreviewError&&e.code===code);

test('WP3-H1-UI01 explicitly pinned isolated staging + canonical main read opens preview only',async()=>{
 const result=await gate().open();
 assert.equal(result.editorPreviewOnly,true);
 assert.equal(result.publicationAvailable,false);
 assert.equal(result.source.sourceRevision,MAIN);
 assert.equal(result.source.hostedRevision,HOSTED);
 assert.equal(result.source.canPublish,false);
});
test('WP3-H1-UI02 staging identity and source mismatches fail closed',async()=>{
 for(const patch of [
  {stagingOnly:false},{hostedRevision:MAIN},
  {hostedRevision:undefined},{hostedRevision:'x'},
  {sourceRevision:'invalid'},{repositoryId:1},
  {ref:'refs/heads/other'},{canPublish:true},{sourceOnly:false},
  {files:null},{markdown:null},
 ]){
  await denied(gate({reply:source(patch)}).open(),'SOURCE_UNVERIFIED');
 }
 await denied(gate({readingMode:'Work Offline'}).open(),'OFFLINE');
 await denied(gate({session:{check:async()=>({
  state:'Signed out',canPublish:false,
 })}}).open(),'OWNER_UNVERIFIED');
});
test('WP3-H1-UI03 no WP3 gate on production, WP2 or arbitrary origin',()=>{
 for(const root of [PROD,WP2,'https://evil.invalid/fishing/']){
  assert.throws(()=>gate({root}),e=>e.code==='INVALID_CONFIG');
 }
 assert.throws(()=>gate({wp3Staging:false}),e=>e.code==='INVALID_CONFIG');
 assert.throws(()=>gate({wp3Staging:'true'}),e=>e.code==='INVALID_CONFIG');
});
test('WP3-H1-UI04 production gate preserves canonical release exact-SHA rule',async()=>{
 const production=source({
  sourceRevision:HOSTED,stagingOnly:undefined,hostedRevision:undefined,
 });
 delete production.stagingOnly;
 delete production.hostedRevision;
 const x=await gate({root:PROD,wp3Staging:false,reply:production}).open();
 assert.equal(x.publicationAvailable,false);
 await denied(gate({root:PROD,wp3Staging:false}).open(),'SOURCE_UNVERIFIED');
 await denied(gate({root:PROD,wp3Staging:false,reply:source({
  sourceRevision:HOSTED,hostedRevision:HOSTED,
 })}).open(),'SOURCE_UNVERIFIED');
});
test('WP3-H1-UI05 Connection Status adapter is bound to exact isolated origin',async()=>{
 const adapter=createD6OwnerConnectionAdapter({
  root:STAGE,wp3Staging:true,ownerReadiness:readiness,
  request:async()=>{throw Error('No request');},
  enabled:()=>true,online:()=>true,readingMode:()=> 'Automatic',
 });
 const state=await adapter.restore();
 assert.equal(state.authorized,true);
 assert.equal(state.ownerLogin,'ginosega');
 assert.equal(state.publicLive,false);
 assert.equal(state.publication,'None');
 for(const root of [PROD,WP2,'https://evil.invalid/fishing/']){
  assert.throws(()=>createD6OwnerConnectionAdapter({
   root,wp3Staging:true,ownerReadiness:readiness,request:async()=>{},
  }),/root denied/);
 }
 assert.throws(()=>createD6OwnerConnectionAdapter({
  root:STAGE,ownerReadiness:readiness,request:async()=>{},
 }),/root denied/);
 assert.throws(()=>createD6OwnerConnectionAdapter({
  root:STAGE,wp2Staging:true,wp3Staging:true,
  ownerReadiness:readiness,request:async()=>{},
 }),/root denied/);
});
test('WP3-H1-UI06 staged owner drafts are device-local and origin isolated',async()=>{
 const rows=new Map();
 const io={
  get:async k=>rows.get(k),
  put:async v=>{rows.set(v.key,v);},
  delete:async k=>{rows.delete(k);},
 };
 const draft=createD6OwnerDeviceDraftStore({
  enabled:true,root:STAGE,wp3Staging:true,io,
 });
 const key='gear:edit:test';
 await draft.save({
  key,domain:'gear',sourceRevision:MAIN,
  record:{id:'test',name:'Test'},notes:'',requiresMedia:false,
 });
 assert.equal((await draft.read(key,{sourceRevision:MAIN})).status,'ready');
 assert.equal(rows.size,1);
 assert([...rows.keys()][0].startsWith(STAGE));
 assert.equal((await draft.read(key,{sourceRevision:HOSTED})).status,'stale');
 for(const root of [PROD,WP2,'https://evil.invalid/fishing/']){
  assert.throws(()=>createD6OwnerDeviceDraftStore({
   enabled:true,root,wp3Staging:true,io,
  }),/DEVICE_DRAFT_SCOPE_DENIED/);
 }
 assert.throws(()=>createD6OwnerDeviceDraftStore({
  enabled:true,root:STAGE,io,
 }),/DEVICE_DRAFT_SCOPE_DENIED/);
});
test('WP3-H1-UI07 staged UI threads exact isolated mode through all three gates',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/createD6OwnerEditorPreviewGate\(\{[\s\S]*?wp3Staging:ctx\.v3\?\.wp3Staging===true/);
 assert.match(ui,/createD6OwnerDeviceDraftStore\(\{[\s\S]*?wp3Staging:ctx\.v3\?\.wp3Staging===true/);
 assert.match(ui,/createD6OwnerConnectionAdapter\(\{[\s\S]*?wp3Staging:ctx\.v3\?\.wp3Staging===true/);
});
