import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createD6ProductionOwnerSignout}
 from '../server/auth/d6-production-owner-signout.mjs';
import {createD6OwnerAuth} from '../server/d6-owner-auth.mjs';

const HOST='https://fishing.ginosega.workers.dev',OWNER=265665562;
const SID='A'.repeat(43),OTHER='B'.repeat(43);
const sha=s=>createHash('sha256').update(s).digest('base64url');
function request(cookie=SID,opts={}){
 return new Request(HOST+'/session/signout',{
  method:'POST',headers:{
   Origin:HOST,'Sec-Fetch-Site':'same-origin',
   'X-Fish-P0-Intent':'signout',
   Cookie:'__Host-fish_p0_session='+cookie,
   ...opts.headers,
  },...Object.fromEntries(Object.entries(opts).filter(([k])=>k!=='headers')),
 });
}
function db({fail=false,throwError=false}={}){
 const deleted=[],sessions=new Map([[sha(SID),OWNER],[sha(OTHER),OWNER+1]]);
 return {deleted,sessions,prepare(sql){
  assert.equal(sql,'DELETE FROM sessions WHERE token_hash = ? AND github_id = ?');
  return {bind(...args){return {async run(){
   deleted.push(args);
   if(throwError)throw Error('PRIVATE DB ERROR');
   if(fail)return {success:false};
   if(sessions.get(args[0])===args[1])sessions.delete(args[0]);
   return {success:true};
  }};}};
 }};
}
const primitive=(store,enabled=()=>true)=>createD6ProductionOwnerSignout({
 AUTH_DB:store,enabled,
});
test('D6-SIGNOUT01 default-off means no DB mutation or cookie clearing',async()=>{
 const store=db(),signout=createD6ProductionOwnerSignout({AUTH_DB:store});
 const res=await signout.signOut(request());
 assert.equal(res.status,503);
 assert.equal(res.headers.get('Set-Cookie'),null);
 assert.equal(store.deleted.length,0);
 assert.deepEqual(Object.keys(signout),['signOut']);
 assert(Object.isFrozen(signout));
});
test('D6-SIGNOUT02 valid owner cookie revokes only that session',async()=>{
 const store=db(),res=await primitive(store).signOut(request());
 assert.equal(res.status,200);
 assert.deepEqual(await res.json(),{signedOut:true});
 assert.deepEqual(store.deleted,[[sha(SID),OWNER]]);
 assert.equal(store.sessions.has(sha(SID)),false);
 assert.equal(store.sessions.get(sha(OTHER)),OWNER+1);
 assert.match(res.headers.get('Set-Cookie'),
  /__Host-fish_p0_session=; Path=\/; Max-Age=0; Secure; HttpOnly; SameSite=Lax/);
 assert.equal(res.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert(!res.headers.get('Set-Cookie').includes(SID));
});
test('D6-SIGNOUT03 non-owner sessions are never revoked',async()=>{
 const store=db(),res=await primitive(store).signOut(request(OTHER));
 assert.equal(res.status,200);
 assert.equal(store.sessions.get(sha(OTHER)),OWNER+1);
 assert.deepEqual(store.deleted,[[sha(OTHER),OWNER]]);
});
test('D6-SIGNOUT04 forged origins and missing intent fail before DB',async()=>{
 const store=db(),actor=primitive(store);
 const invalid=[
  request(SID,{headers:{Origin:'https://evil.invalid'}}),
  request(SID,{headers:{'Sec-Fetch-Site':'cross-site'}}),
  request(SID,{headers:{'X-Fish-P0-Intent':'overwrite'}}),
  request(SID,{headers:{Authorization:'Bearer fake'}}),
  new Request('https://evil.invalid/session/signout',{
   method:'POST',headers:{Origin:HOST,'Sec-Fetch-Site':'same-origin',
    'X-Fish-P0-Intent':'signout',Cookie:'__Host-fish_p0_session='+SID},
  }),
  new Request(HOST+'/session/signout?redirect=https://evil.invalid',{
   method:'POST',headers:{Origin:HOST,'Sec-Fetch-Site':'same-origin',
    'X-Fish-P0-Intent':'signout',Cookie:'__Host-fish_p0_session='+SID},
  }),
  request(SID,{headers:{'Sec-Fetch-Mode':'navigate'}}),
  request(SID,{body:'hi'}),
  new Request(HOST+'/session/signout',{method:'GET'}),
 ];
 for(const input of invalid){
  assert.equal((await actor.signOut(input)).status,403);
 }
 assert.equal(store.deleted.length,0);
});
test('D6-SIGNOUT05 duplicates and malformed cookie rejected without DB access',async()=>{
 const store=db(),actor=primitive(store);
 for(const req of [
  request('short'),
  request(SID,{headers:{Cookie:'__Host-fish_p0_session='+SID+
   '; __Host-fish_p0_session='+SID}}),
  request(SID,{headers:{Cookie:'foo=bar'}}),
  request(SID,{headers:{Cookie:'__Host-fish_p0_session='+SID+'!'}}),
 ]){
  const res=await actor.signOut(req);
  assert.equal(res.status,401);
  assert.equal(res.headers.get('Set-Cookie'),null);
 }
 assert.equal(store.deleted.length,0);
});
test('D6-SIGNOUT06 database unavailability fails closed without clearing cookie',async()=>{
 for(const store of [db({fail:true}),db({throwError:true})]){
  const res=await primitive(store).signOut(request());
  assert.equal(res.status,503);
  assert.equal(res.headers.get('Set-Cookie'),null);
  assert.equal(store.sessions.get(sha(SID)),OWNER);
  assert(!String(await res.text()).includes('PRIVATE DB ERROR'));
 }
});
test('D6-SIGNOUT07 capability revocation denies subsequent sign-out',async()=>{
 let on=true;const store=db();
 const actor=primitive(store,()=>on);
 on=false;
 assert.equal((await actor.signOut(request())).status,503);
 assert.equal(store.deleted.length,0);
 assert.throws(()=>createD6ProductionOwnerSignout({enabled:true}));
});
function composed(flags={}){
 const store=db();
 const env={
  D6_PRODUCTION_ENABLED:'true',D6_ORIGIN:HOST,
  D6_OWNER_GITHUB_ID:String(OWNER),D6_REPOSITORY_ID:'1350909744',
  D6_WP2_STAGING_ENABLED:'true',D6_ISOLATED_PAGES_ENABLED:'true',
  D6_GATEWAY_ENABLED:'true',D6_SESSION_ENABLED:'true',
  AUTH_DB:store,D6_CSRF_KEY:'source-only-test-key-xxxxxxxxxxxxxxxxx',
  ...flags,
 };
 const app=createD6OwnerAuth({env,origin:HOST,
  network:async()=>{throw Error('unexpected upstream')},now:()=>2000000000});
 return {store,app};
}
test('A01 signout requires explicit flag and never exposes a publisher',async()=>{
 const {app,store}=composed();
 assert.equal((await app.fetch(request())).status,404);
 assert.equal(store.deleted.length,0);
 const active=composed({D6_SIGNOUT_ENABLED:'true'});
 assert.equal((await active.app.fetch(request())).status,200);
 assert.deepEqual(active.store.deleted,[[sha(SID),OWNER]]);
 for(const path of ['/api/v3/operations','/api/v3/authoring-source']){
  assert.equal((await active.app.fetch(new Request(HOST+path))).status,404);
 }
});
test('A01 disabled gateway/session or mismatched owner configuration denies signout',async()=>{
 for(const flag of ['D6_GATEWAY_ENABLED','D6_SESSION_ENABLED','D6_PRODUCTION_ENABLED','D6_WP2_STAGING_ENABLED','D6_ISOLATED_PAGES_ENABLED','D6_OWNER_GITHUB_ID']){
  const {app,store}=composed({D6_SIGNOUT_ENABLED:'true',[flag]:'false'});
  assert.equal((await app.fetch(request())).status,503);
  assert.equal(store.deleted.length,0);
 }
});
test('D6-SIGNOUT11 no sign-out route installs a Worker or authoring publisher',()=>{
 const source=readFileSync(new URL(
  '../server/auth/d6-production-owner-signout.mjs',
  import.meta.url),'utf8');
 assert.match(source,/DELETE FROM sessions WHERE token_hash = \? AND github_id = \?/);
 assert.match(source,/SameSite=Lax/);
 assert.doesNotMatch(source,/export default|addEventListener\(/);
 assert.doesNotMatch(source,/authorizeWrite|issueWriteToken|createPR|revoke-all/);
 assert.doesNotMatch(source,/fishing-p3-sandbox|1430581407|private[_-]key/i);
});
