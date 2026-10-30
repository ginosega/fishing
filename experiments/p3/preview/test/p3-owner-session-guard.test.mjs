import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sandbox} from './d1-fixture.mjs';
import {createP3OwnerSessionGuard,SessionGuardError} from '../src/p3-owner-session-guard.mjs';
const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const TOKEN='a'.repeat(48),CSRF='b'.repeat(48);
const digest=s=>createHash('sha256').update(s).digest('hex');
const denied=code=>e=>(assert.equal(e instanceof SessionGuardError,true),assert.equal(e.code,code),true);
function session(){
 const e=sandbox();
 let now=1800000000;
 const guard=createP3OwnerSessionGuard({DB:e.DB,ownerGitHubId:778899,origin:ORIGIN,now:()=>now});
 const seed=(githubId=778899,expiry=604800)=>{
  e.sql.prepare('INSERT INTO p3_sessions(token_hash,github_id,csrf_hash,expires_at,created_at) VALUES(?,?,?,?,?)')
   .run(digest(TOKEN),githubId,digest(CSRF),1800000000+expiry,1800000000);
 };
 const req=(overrides={})=>{
  const headers=new Headers({
   'Cookie':'__Host-fish_p3_session='+TOKEN,'Origin':ORIGIN,
   'Sec-Fetch-Site':'same-origin','X-P3-Intent':'publish',
   'Content-Type':'application/json','X-P3-CSRF':CSRF
  });
  for(const [k,v] of Object.entries(overrides.headers??{})){
   if(v===null)headers.delete(k);else headers.set(k,v);
  }
  return new Request(overrides.url??ORIGIN+'/publications',{
   method:overrides.method??'POST',headers,body:overrides.method==='GET'?undefined:'{}',
  });
 };
 return {e,guard,seed,req,time:n=>{now+=n;}};
}
test('P3-A01 valid D1 owner session and CSRF verify with no client-provided owner ID',async()=>{
 const x=session();x.seed();
 assert.deepEqual(await x.guard.authorize(x.req()),{githubId:778899,authorized:true});
});
test('P3-A02 owner mismatch, revoked token and expired session all deny',async()=>{
 const x=session();x.seed(99999);
 await assert.rejects(x.guard.authorize(x.req()),denied('UNAUTHORIZED'));
 x.e.sql.exec('DELETE FROM p3_sessions');
 x.seed(778899,20);
 x.time(21);
 await assert.rejects(x.guard.authorize(x.req()),denied('UNAUTHORIZED'));
 x.e.sql.exec('DELETE FROM p3_sessions');
 await assert.rejects(x.guard.authorize(x.req()),denied('UNAUTHORIZED'));
});
test('P3-A03 strict Origin, Fetch Metadata, method, publishing intent and content type',async()=>{
 const x=session();x.seed();
 for(const [request,code] of [
  [x.req({url:'https://attacker.example/publications'}),'CROSS_ORIGIN'],
  [x.req({headers:{Origin:'https://attacker.example'}}),'CROSS_ORIGIN'],
  [x.req({headers:{'Sec-Fetch-Site':'cross-site'}}),'CROSS_ORIGIN'],
  [x.req({headers:{'Sec-Fetch-Site':null}}),'CROSS_ORIGIN'],
  [x.req({method:'GET'}),'CROSS_ORIGIN'],
  [x.req({headers:{'X-P3-Intent':null}}),'MISSING_INTENT'],
  [x.req({headers:{'Content-Type':'text/plain'}}),'CONTENT_TYPE'],
  [x.req({headers:{Authorization:'Bearer attacker'}}),'UNSUPPORTED_BEARER_AUTH'],
 ])await assert.rejects(x.guard.authorize(request),denied(code));
});
test('P3-A04 altered CSRF token, missing cookie and duplicate cookies reject',async()=>{
 const x=session();x.seed();
 for(const request of [
  x.req({headers:{'X-P3-CSRF':'c'.repeat(48)}}),
  x.req({headers:{'X-P3-CSRF':null}}),
  x.req({headers:{Cookie:null}}),
  x.req({headers:{Cookie:'__Host-fish_p3_session='+TOKEN+'; __Host-fish_p3_session='+TOKEN}}),
 ])await assert.rejects(x.guard.authorize(request),e=>{
  assert.equal(e instanceof SessionGuardError,true);
  assert(['MISSING_SESSION_OR_CSRF','CSRF_DENIED'].includes(e.code));
  return true;
 });
});
test('P3-A05 session duration must never exceed seven days and cannot slide',async()=>{
 const x=session();x.seed(778899,604801);
 await assert.rejects(x.guard.authorize(x.req()),denied('UNAUTHORIZED'));
});
