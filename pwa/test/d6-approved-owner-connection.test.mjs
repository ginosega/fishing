import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD6OwnerConnectionAdapter}
 from '../src/d6-owner-connection-adapter.mjs';
import {mountV3ConnectionExperience} from '../src/v3-connection-experience.mjs';

const HOST='https://fishing.ginosega.workers.dev', ROOT=HOST+'/fishing/';
function harness({result={state:'Signed out',canPublish:false},
 enabled=true,network=true,mode='Automatic',reply={signedOut:true},
 status=200,throwSignout=false}={}){
 const calls=[],checks=[],paints=[];
 let active=enabled,online=network,readingMode=mode,observed=result;
 const adapter=createD6OwnerConnectionAdapter({
  root:ROOT,
  ownerReadiness:{async check(input){checks.push(input);return observed;}},
  request:async(url,opts)=>{
   calls.push({url,opts});
   if(throwSignout)throw Error('Private server signout failure');
   return new Response(JSON.stringify(reply),{
    status,headers:{'Content-Type':'application/json; charset=utf-8'},
   });
  },
  enabled:()=>active,online:()=>online,readingMode:()=>readingMode,
  onChange:x=>paints.push(x),
 });
 return {adapter,calls,checks,paints,
  set:(next={})=>{
   if(Object.hasOwn(next,'enabled'))active=next.enabled;
   if(Object.hasOwn(next,'online'))online=next.online;
   if(Object.hasOwn(next,'mode'))readingMode=next.mode;
   if(Object.hasOwn(next,'result'))observed=next.result;
  },
 };
}
test('D6-OWNUI01 starts with zero owner privileges, zero publication state',()=>{
 const x=harness(),s=x.adapter.current();
 assert.equal(s.phase,'Unverified');assert.equal(s.authorized,false);
 assert.equal(s.publicLive,false);assert.equal(s.sandboxVerified,false);
 assert.equal(s.publication,'None');
 assert(Object.isFrozen(s));assert(Object.isFrozen(x.adapter));
 assert.deepEqual(x.calls,[]);assert.deepEqual(x.checks,[]);
});
test('D6-OWNUI02 only verified D6 owner read state can render signed in',async()=>{
 const x=harness({result:{state:'Owner',ownerLogin:'ginosega',
  canPublish:false}});
 const s=await x.adapter.restore();
 assert.equal(s.phase,'Owner');assert.equal(s.authorized,true);
 assert.equal(s.authenticated,true);assert.equal(s.ownerLogin,'ginosega');
 assert.equal(s.publication,'None');assert.equal(s.publicLive,false);
 assert.equal(s.sandboxVerified,false);
 assert.deepEqual(x.checks,[{readingMode:'Automatic'}]);
 assert.equal(x.calls.length,0);
});
test('D6-OWNUI03 signed-out and foreign account cannot become owner',async()=>{
 for(const result of [
  {state:'Signed out',canPublish:false},
  {state:'Not authorized',canPublish:false},
 ]){
  const x=harness({result});const s=await x.adapter.restore();
  assert.equal(s.phase,'Anonymous');assert.equal(s.authorized,false);
  assert.equal(s.ownerLogin,null);
 }
});
test('D6-OWNUI04 privileged or malformed readiness fails closed',async()=>{
 for(const result of [
  {state:'Owner',ownerLogin:'ginosega',canPublish:true},
  {state:'Owner',ownerLogin:'ginosega'},
  {state:'Unavailable',canPublish:false},
  null,
 ]){
  const x=harness({result});const s=await x.adapter.restore();
  assert.equal(s.phase,'Unavailable');assert.equal(s.authorized,false);
  assert.equal(s.publicLive,false);
 }
});
test('D6-OWNUI05 Work Offline, no network and off switch never touch session',async()=>{
 for(const settings of [
  {mode:'Work Offline'}, {mode:'Checking'}, {network:false},
  {enabled:false},
 ]){
  const x=harness(settings);const s=await x.adapter.restore();
  assert.equal(s.phase,'Offline');assert.equal(s.authorized,false);
  assert.equal(x.checks.length,0);assert.equal(x.calls.length,0);
 }
});
test('D6-OWNUI06 valid sign-out calls exact same-origin API once',async()=>{
 const x=harness({result:{state:'Owner',ownerLogin:'ginosega',
  canPublish:false}});
 await x.adapter.restore();
 const s=await x.adapter.signOut();
 assert.equal(s.phase,'Anonymous');assert.equal(s.authorized,false);
 assert.equal(x.calls.length,1);
 const {url,opts}=x.calls[0];
 assert.equal(url,HOST+'/session/signout');
 assert.equal(opts.method,'POST');assert.equal(opts.credentials,'same-origin');
 assert.equal(opts.redirect,'manual');assert.equal(opts.cache,'no-store');
 assert.equal(opts.headers['X-Fish-P0-Intent'],'signout');
 assert.equal(opts.body,undefined);
 assert.equal(opts.headers.Authorization,undefined);
 assert.equal(x.adapter.current().publicLive,false);
});
test('D6-OWNUI07 sign-out forbidden unless current verified owner and Automatic',async()=>{
 const x=harness();
 await x.adapter.restore();
 await assert.rejects(()=>x.adapter.signOut());
 assert.equal(x.calls.length,0);
 x.set({result:{state:'Owner',ownerLogin:'ginosega',canPublish:false}});
 await x.adapter.restore();x.set({mode:'Work Offline'});
 await assert.rejects(()=>x.adapter.signOut());
 assert.equal(x.calls.length,0);
});
test('D6-OWNUI08 unknown sign-out result never claims successful sign-out',async()=>{
 for(const settings of [
  {status:503},{status:404},{reply:{signedOut:false}},
  {reply:{signedOut:'true'}},{throwSignout:true},
 ]){
  const x=harness({result:{state:'Owner',ownerLogin:'ginosega',
   canPublish:false},...settings});
  await x.adapter.restore();
  await assert.rejects(()=>x.adapter.signOut(),/unconfirmed/);
  assert.equal(x.adapter.current().phase,'Unavailable');
  assert.equal(x.adapter.current().authorized,false);
  assert.equal(x.calls.length,1);
 }
});
test('D6-OWNUI09 a late owner reply cannot restore a stale privilege',async()=>{
 let release;
 let count=0;
 const adapter=createD6OwnerConnectionAdapter({
  root:ROOT,enabled:()=>true,online:()=>true,
  readingMode:()=> 'Automatic',
  request:async()=>{throw Error('No signout');},
  ownerReadiness:{check(){
   count+=1;
   if(count===1)return new Promise(resolve=>{release=resolve;});
   return Promise.resolve({state:'Signed out',canPublish:false});
  }},
 });
 const old=adapter.restore();
 const current=await adapter.restore();
 assert.equal(current.phase,'Anonymous');
 release({state:'Owner',ownerLogin:'ginosega',canPublish:false});
 await old;
 assert.equal(adapter.current().phase,'Anonymous');
 assert.equal(adapter.current().authorized,false);
});
test('D6-OWNUI14 stale owner GET cannot survive completed sign-out',async()=>{
 let finish;
 const adapter=createD6OwnerConnectionAdapter({
  root:ROOT,enabled:()=>true,online:()=>true,
  readingMode:()=> 'Automatic',
  ownerReadiness:{check:async()=>({
   state:'Owner',ownerLogin:'ginosega',canPublish:false,
  })},
  request:()=>new Promise(resolve=>{finish=resolve;}),
 });
 await adapter.restore();
 const signingOut=adapter.signOut();
 const stale=await adapter.restore();
 assert.equal(stale.authorized,true);
 finish(new Response(JSON.stringify({signedOut:true}),{
  status:200,headers:{'Content-Type':'application/json'},
 }));
 await signingOut;
 assert.equal(adapter.current().phase,'Anonymous');
 assert.equal(adapter.current().authorized,false);
 assert.equal(adapter.current().publicLive,false);
});
test('D6-OWNUI10 never exposes a fake publication or writer',async()=>{
 const x=harness({result:{state:'Owner',ownerLogin:'ginosega',
  canPublish:false}});
 await x.adapter.restore();
 assert.equal((await x.adapter.refreshPublication()).publication,'None');
 assert.throws(()=>x.adapter.acknowledgeFailedPublication());
 assert.deepEqual(Object.keys(x.adapter).sort(),[
  'acknowledgeFailedPublication','current','refreshPublication',
  'restore','signOut',
 ]);
 assert.equal(typeof x.adapter.publish,'undefined');
});
test('D6-OWNUI11 only exact production or local loopback reading roots accepted',()=>{
 const o={ownerReadiness:{check:async()=>({state:'Signed out',
  canPublish:false})},request:async()=>new Response(''),};
 for(const root of [
  'https://evil.invalid/fishing/',HOST+'/fishing/v2-preview/',
  HOST+'/fishing/?debug=1',HOST+'/fishing/#/',HOST+'/',
  'https://ginosega.github.io/fishing/',
 ]){
  assert.throws(()=>createD6OwnerConnectionAdapter({...o,root}));
 }
 assert.doesNotThrow(()=>createD6OwnerConnectionAdapter({...o,root:ROOT}));
 assert.doesNotThrow(()=>createD6OwnerConnectionAdapter({
  ...o,root:'http://127.0.0.1:5197/fishing/',
 }));
});
test('D6-OWNUI12 approved presenter source remains exact D5 byte version',()=>{
 const src=readFileSync(new URL('../src/v3-connection-experience.mjs',
  import.meta.url));
 assert.equal(typeof mountV3ConnectionExperience,'function');
 // Existing approved D5 blob is already SHA-pinned by D6-UX-PORT01.
 assert(src.includes(Buffer.from('Sign in with GitHub')));
 assert(src.includes(Buffer.from('Publishing Status')));
 assert(src.includes(Buffer.from('Signed in as ')));
});
test('D6-OWNUI13 mounting requires explicit isolated production-path build',()=>{
 const b=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 const e=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 const u=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 assert.match(b,/--d6-owner-connection-candidate/);
 assert.match(b,/!d6ReaderCandidate\|\|d6StaticStaging/);
 assert.match(b,/__FISHING_D6_OWNER_CONNECTION__/);
 assert.match(e,/d6OwnerConnectionCandidate/);
 assert.match(e,/if\(d6StaticStaging\)\{/);
 assert.match(e,/if\(d6EditorPreview\)throw Error\('D6 editor preview cannot use static staging'\)/);
 assert.match(u,/approvedConnection=readerOnly&&ctx\.v3\?\.ownerConnectionCandidate===true/);
 assert.match(u,/mountV3ConnectionExperience/);
 assert.match(u,/createD6OwnerConnectionAdapter/);
 assert.match(u,/link\.setAttribute\('href','\/auth\/start'\)/);
 assert.match(css,/Alpine Mist dark theme/);
 assert.match(css,/\.v3-connection-dialog/);
 assert.match(css,/v3-publishing-toggle/);
 assert.doesNotMatch(e,/d3-owner-test-shell|d5-owner-candidate/);
 assert.doesNotMatch(u,/createD3PublicationLifecycle|d3-authoring-client/);
});

test('D6-OWNUI14 WP2 staging connects to its own signout endpoint only',async()=>{
 const stage='https://fishing-d6-wp2-test.ginosega.workers.dev';
 const calls=[];
 const init={root:stage+'/fishing/',wp2Staging:true,
  ownerReadiness:{check:async()=>({state:'Owner',canPublish:false,
   ownerLogin:'ginosega'})},
  request:async(url,options)=>{
   calls.push({url,options});
   return new Response(JSON.stringify({signedOut:true}),{
    headers:{'Content-Type':'application/json'},
   });
  },
  enabled:()=>true,online:()=>true,readingMode:()=> 'Automatic',
 };
 const adapter=createD6OwnerConnectionAdapter(init);
 assert.equal((await adapter.restore()).authorized,true);
 assert.equal((await adapter.signOut()).authorized,false);
 assert.equal(calls[0].url,stage+'/session/signout');
 assert.equal(calls[0].options.method,'POST');
 assert.throws(()=>createD6OwnerConnectionAdapter({
  ...init,wp2Staging:false,
 }));
 assert.throws(()=>createD6OwnerConnectionAdapter({
  ...init,root:'https://evil.invalid/fishing/',
 }));
});
