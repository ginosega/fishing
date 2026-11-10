import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6ProductionOwnerSession,D6_OWNER_SESSION_ORIGIN,
 D6_OWNER_GITHUB_ID}
 from '../../experiments/p3/preview/src/d6-production-owner-session.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const NOW=2000000000;
const COOKIE='A'.repeat(43);
const req=(path='/session',options={})=>new Request(ORIGIN+path,options);
const cookieRequest=(options={})=>req('/session',{
 ...options,headers:{Cookie:'__Host-fish_p0_session='+COOKIE,
  ...options.headers},
});
function sessionDatabase({ownerId=D6_OWNER_GITHUB_ID,expires=NOW+3600}={}){
 const seen=[];
 return {seen,prepare(sql){
  assert.match(sql,/SELECT github_id,expires_at FROM sessions/);
  return {bind(hash){
   seen.push(hash);
   return {first:async()=>({github_id:ownerId,expires_at:expires})};
  }};
 }};
}

test('D6-OWN01 default OFF has no DB access or exposed writer methods',async()=>{
 let queried=0;
 const p=createD6ProductionOwnerSession({
  AUTH_DB:{prepare:()=>{queried++;throw Error('unexpected');}},
  csrfKey:'K'.repeat(64),
 });
 await assert.rejects(p.describe(req()),/unavailable/);
 await assert.rejects(p.authorizeStatus(req()),/unavailable/);
 assert.equal(queried,0);
 assert.deepEqual(Object.keys(p).sort(),['authorizeStatus','describe']);
 assert.equal(p.authorizeWrite,undefined);
 assert.equal(p.authorizeMedia,undefined);
 assert.equal(D6_OWNER_SESSION_ORIGIN,ORIGIN);
 assert(Object.isFrozen(p));
});

test('D6-OWN02 enabled signed-out response is minimal and never reads DB',async()=>{
 const db=sessionDatabase();
 const p=createD6ProductionOwnerSession({
  AUTH_DB:db,csrfKey:'K'.repeat(64),enabled:()=>true,now:()=>NOW,
 });
 assert.deepEqual(await p.describe(req()),{
  authenticated:false,authorized:false,
 });
 assert.equal(db.seen.length,0);
 await assert.rejects(p.authorizeStatus(req()));
});

test('D6-OWN03 valid D5 owner session projects only safe read status',async()=>{
 const db=sessionDatabase();
 const p=createD6ProductionOwnerSession({
  AUTH_DB:db,csrfKey:'K'.repeat(64),enabled:()=>true,now:()=>NOW,
 });
 const request=cookieRequest({headers:{'Sec-Fetch-Site':'same-origin'}});
 const result=await p.describe(request);
 assert.deepEqual(result,{authenticated:true,authorized:true,
  ownerLogin:'ginosega'});
 assert.equal(result.csrfToken,undefined);
 assert.equal(result.expiresAt,undefined);
 assert.equal(result.ownerGitHubId,undefined);
 assert(Object.isFrozen(result));
 assert.deepEqual(await p.authorizeStatus(request),
  {ownerGitHubId:D6_OWNER_GITHUB_ID,authorized:true});
 assert.equal(db.seen.length,2);
 assert(db.seen.every(x=>/^[A-Za-z0-9_-]{43}$/.test(x)));
});

test('D6-OWN04 foreign owner, expired session and malformed cookie denied',async()=>{
 for(const opts of [{ownerId:123},{expires:NOW-1}]){
  const p=createD6ProductionOwnerSession({
   AUTH_DB:sessionDatabase(opts),csrfKey:'K'.repeat(64),
   enabled:()=>true,now:()=>NOW,
  });
  assert.deepEqual(await p.describe(cookieRequest()),{
   authenticated:false,authorized:false,
  });
  await assert.rejects(p.authorizeStatus(cookieRequest()));
 }
 const db=sessionDatabase();
 const p=createD6ProductionOwnerSession({
  AUTH_DB:db,csrfKey:'K'.repeat(64),enabled:()=>true,now:()=>NOW,
 });
 assert.deepEqual(await p.describe(req('/session',{
  headers:{Cookie:'__Host-fish_p0_session=bad'},
 })),{authenticated:false,authorized:false});
 assert.equal(db.seen.length,0);
});

test('D6-OWN05 cross-site, bearer, wrong host and POST rejected',async()=>{
 const p=createD6ProductionOwnerSession({
  AUTH_DB:sessionDatabase(),csrfKey:'K'.repeat(64),
  enabled:()=>true,now:()=>NOW,
 });
 for(const request of [
  cookieRequest({headers:{'Sec-Fetch-Site':'same-site'}}),
  cookieRequest({headers:{'Sec-Fetch-Site':'cross-site'}}),
  cookieRequest({headers:{Authorization:'Bearer wrong'}}),
  new Request('https://evil.invalid/session',{
   headers:{Cookie:'__Host-fish_p0_session='+COOKIE},
  }),
  cookieRequest({method:'POST'}),
 ]){
  await assert.rejects(p.describe(request));
  await assert.rejects(p.authorizeStatus(request));
 }
});

test('D6-OWN06 disabling after a valid session fails closed',async()=>{
 let active=true;
 const p=createD6ProductionOwnerSession({
  AUTH_DB:sessionDatabase(),csrfKey:'K'.repeat(64),
  enabled:()=>active,now:()=>NOW,
 });
 assert.equal((await p.describe(cookieRequest())).authorized,true);
 active=false;
 await assert.rejects(p.describe(cookieRequest()),/unavailable/);
 await assert.rejects(p.authorizeStatus(cookieRequest()),/unavailable/);
});

test('D6-OWN07 missing D1/secret fails closed once enabled',async()=>{
 for(const opts of [
  {AUTH_DB:null,csrfKey:'K'.repeat(64)},
  {AUTH_DB:sessionDatabase(),csrfKey:''},
 ]){
  const p=createD6ProductionOwnerSession({
   ...opts,enabled:()=>true,now:()=>NOW,
  });
  await assert.rejects(p.describe(req()));
 }
 assert.throws(()=>createD6ProductionOwnerSession({enabled:true}));
});
