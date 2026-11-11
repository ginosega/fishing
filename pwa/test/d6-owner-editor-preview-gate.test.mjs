import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6OwnerEditorPreviewGate,D6OwnerEditorPreviewError}
 from '../src/d6-owner-editor-preview-gate.mjs';
const ROOT='https://fishing.ginosega.workers.dev/fishing/';
const SHA='a'.repeat(40);
const source=()=>({
 repositoryId:1350909744,repositoryFullName:'ginosega/fishing',
 ref:'refs/heads/main',sourceRevision:SHA,treeSha:'b'.repeat(40),
 sourceOnly:true,canPublish:false,files:new Set(['Gear/gear.json']),
 markdown:new Map(),data:{gear:{items:[]},kb:{entities:[]},catches:{catches:[]}},
});
const denied=async(p,code)=>assert.rejects(p,e=>
 e instanceof D6OwnerEditorPreviewError&&e.code===code);
function fixture({active=true,online=true,mode='Automatic',
 sessions=['Owner','Owner'],sourceReply=source(),failSource=false,
 failSession=false}={}){
 const calls=[];let checked=0,modeValue=mode,onlineValue=online;
 const gate=createD6OwnerEditorPreviewGate({
  root:ROOT,releaseRevision:SHA,
  enabled:()=>active,online:()=>onlineValue,readingMode:()=>modeValue,
  ownerReadiness:{check:async args=>{
   calls.push(['session',args]);if(failSession)throw Error('unavailable');
   return {state:sessions[Math.min(checked++,sessions.length-1)],
    canPublish:false};
  }},
  canonicalSource:{load:async args=>{
   calls.push(['source',args]);
   if(failSource)throw Error('unavailable');
   return sourceReply;
  }},
 });
 return {gate,calls,setMode:v=>modeValue=v,setOnline:v=>onlineValue=v};
}
test('WP1-EG01 disabled by default and no network calls',async()=>{
 const x=fixture({active:false});
 await denied(x.gate.open(),'DISABLED');assert.equal(x.calls.length,0);
 assert.deepEqual(Object.keys(x.gate),['open']);
});
test('WP1-EG02 approved owner and exact canonical source only give preview',async()=>{
 const x=fixture(),r=await x.gate.open();
 assert.equal(r.editorPreviewOnly,true);
 assert.equal(r.publicationAvailable,false);
 assert.equal(r.source.sourceRevision,SHA);
 assert.deepEqual(x.calls.map(x=>x[0]),['session','source','session']);
 assert.equal(x.calls[1][1].ownerVerified,true);
});
test('WP1-EG03 signed out, unauthorized, and expired sessions never open',async()=>{
 for(const state of ['Signed out','Not authorized','Offline','Unavailable']){
  const x=fixture({sessions:[state]});
  await denied(x.gate.open(),'OWNER_UNVERIFIED');
  assert.deepEqual(x.calls.map(c=>c[0]),['session']);
 }
 const x=fixture({sessions:['Owner','Signed out']});
 await denied(x.gate.open(),'OWNER_UNVERIFIED');
 assert.deepEqual(x.calls.map(c=>c[0]),['session','source','session']);
});
test('WP1-EG04 Work Offline or disconnected never contacts any endpoint',async()=>{
 for(const cfg of [{mode:'Work Offline'},{mode:'Checking'},{online:false}]){
  const x=fixture(cfg);
  await denied(x.gate.open(),'OFFLINE');
  assert.equal(x.calls.length,0);
 }
});
test('WP1-EG05 forbidden or stale source never opens an editor',async()=>{
 for(const patch of [
  {sourceRevision:'c'.repeat(40)},
  {repositoryId:1},{repositoryFullName:'other/repo'},
  {ref:'refs/heads/other'},{sourceOnly:false},{canPublish:true},
  {markdown:null},{files:null},{data:null},{treeSha:'bad'},
 ]){
  const x=fixture({sourceReply:{...source(),...patch}});
  await denied(x.gate.open(),'SOURCE_UNVERIFIED');
 }
});
test('WP1-EG06 session and source transport errors fail closed',async()=>{
 for(const cfg of [{failSession:true},{failSource:true}]){
  const x=fixture(cfg);
  await denied(x.gate.open(),cfg.failSession?
   'OWNER_UNVERIFIED':'SOURCE_UNVERIFIED');
 }
});
test('WP1-EG07 revoke reading mode during in-flight source request',async()=>{
 let mode='Automatic',entered=()=>{},finish=()=>{};
 const started=new Promise(r=>entered=r);
 const held=new Promise(r=>finish=r);
 const x=createD6OwnerEditorPreviewGate({
  root:ROOT,releaseRevision:SHA,enabled:()=>true,
  online:()=>true,readingMode:()=>mode,
  ownerReadiness:{check:async()=>({state:'Owner',canPublish:false})},
  canonicalSource:{load:async()=>{entered();await held;return source();}},
 });
 const task=x.open();await started;mode='Work Offline';finish();
 await denied(task,'OFFLINE');
});
test('WP1-EG08 invalid origin/scope/session config denied',()=>{
 for(const root of ['https://evil.invalid/fishing/',
  ROOT+'other/','http://fishing.ginosega.workers.dev/fishing/']){
  assert.throws(()=>createD6OwnerEditorPreviewGate({
   root,releaseRevision:SHA,enabled:()=>true,online:()=>true,
   readingMode:()=> 'Automatic',ownerReadiness:{check:async()=>{}},
   canonicalSource:{load:async()=>{}},
  }),e=>e.code==='INVALID_CONFIG');
 }
 assert.throws(()=>createD6OwnerEditorPreviewGate({
  root:ROOT,releaseRevision:'bad',ownerReadiness:null,
  canonicalSource:null,
 }),e=>e.code==='INVALID_CONFIG');
});
