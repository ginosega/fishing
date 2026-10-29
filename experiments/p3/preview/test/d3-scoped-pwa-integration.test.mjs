import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createD3OwnerPilotHost} from '../src/d3-owner-pilot-host.mjs';
import {createD3GatedAuthGateway} from '../src/d3-gated-auth-gateway.mjs';
import {createD2UnifiedOwnerSession} from '../src/d2-unified-owner-session.mjs';
import auth from '../src/d2-auth-owner-worker.mjs';
import {D3_OWNER_PILOT_PATH,D3_SCOPED_PILOT_PATH,
 D3_SCOPED_PILOT_SCRIPT} from '../src/d3-owner-pilot-page.mjs';

const ORIGIN='https://fishing.example',OWNER=265665562;
const BYTES=new TextEncoder().encode('/* pinned owner-only test module */\nvoid 0;');
const DIGEST=createHash('sha256').update(BYTES).digest('hex');
const req=(path,opts={})=>new Request(ORIGIN+path,opts);

function host({integrated=false,authenticated=true}={}){
 let reads=0;
 const service=createD3OwnerPilotHost({
  origin:ORIGIN,expectedSha256:DIGEST,
  enabled:()=>true,integratedEnabled:()=>integrated,
  ownerSession:{
   authorizePilotPage:async()=>authenticated?
    {authorized:true,ownerGitHubId:OWNER}:null,
   authorizeStatus:async()=>authenticated?
    {authorized:true,ownerGitHubId:OWNER}:null,
  },
  readBundle:async()=>{reads++;return BYTES;},
 });
 return {service,get reads(){return reads;}};
}
test('D3-SCOPE01 scoped HTML and JS are disabled independently of old owner pilot',async()=>{
 const h=host();
 for(const path of [D3_SCOPED_PILOT_PATH,D3_SCOPED_PILOT_SCRIPT]){
  assert.equal((await h.service.serve(req(path))).status,404);
 }
 assert.equal(h.reads,0);
 const old=await h.service.serve(req(D3_OWNER_PILOT_PATH));
 assert.equal(old.status,200);
});
test('D3-SCOPE02 authenticated in-scope page has only exact private script and no-store',async()=>{
 const h=host({integrated:true});
 const res=await h.service.serve(req(D3_SCOPED_PILOT_PATH));
 assert.equal(res.status,200);
 const html=await res.text();
 assert(html.includes('src="'+D3_SCOPED_PILOT_SCRIPT+'"'));
 assert(!html.includes('src="/__d3_pilot__/pilot.js"'));
 assert.match(res.headers.get('Cache-Control'),/no-store/);
 assert.match(res.headers.get('X-Robots-Tag'),/noindex/);
 const js=await h.service.serve(req(D3_SCOPED_PILOT_SCRIPT));
 assert.equal(js.status,200);
 assert.deepEqual(new Uint8Array(await js.arrayBuffer()),BYTES);
});
test('D3-SCOPE03 no anonymous/foreign/query/post/private path widening',async()=>{
 const anonymous=host({integrated:true,authenticated:false});
 for(const path of [D3_SCOPED_PILOT_PATH,D3_SCOPED_PILOT_SCRIPT]){
  assert.equal((await anonymous.service.serve(req(path))).status,401);
 }
 assert.equal(anonymous.reads,0);
 const h=host({integrated:true});
 for(const route of [
  D3_SCOPED_PILOT_PATH+'?x=1',
  D3_SCOPED_PILOT_SCRIPT+'?v=123',
  '/fishing/__d3_pilot__/unknown',
  '/fishing/__d3_pilot__/../index.html',
 ]){
  assert.equal((await h.service.serve(req(route))).status,404);
 }
 assert.equal((await h.service.serve(req(D3_SCOPED_PILOT_PATH,
  {method:'POST'}))).status,404);
 assert.equal(h.reads,0);
});

function gateway(){
 const calls={proxy:0,pilot:0};
 const service=createD3GatedAuthGateway({
  auth:{fetch:async()=>new Response('AUTH')},
  proxy:async()=>{calls.proxy++;return new Response('V2_BYTE_IDENTICAL');},
  requestGitHub:async()=>{throw Error('No GitHub read permitted');},
  issueReadToken:async()=>{throw Error('No token issued');},
  sessionFactory:()=>({
   authorizePilotPage:async()=>({authorized:true,ownerGitHubId:OWNER}),
   authorizeStatus:async()=>({authorized:true,ownerGitHubId:OWNER}),
  }),
  storeFactory:()=>({accept(){},get(){}}),
  pilotHostFactory:args=>{calls.pilot++;return {
   serve:async()=>new Response(args.integratedEnabled()?'SCOPED_OWNER':'OLD_PILOT'),
  };},
 });
 const env={
  APP_ORIGIN:ORIGIN,OWNER_GITHUB_ID:String(OWNER),
  DB:{prepare(){}},OPERATIONS_DB:{prepare(){},batch(){}},
  D2_CSRF_KEY:'c'.repeat(40),D2_HOST_PROBE_KEY:'h'.repeat(40),
  D3_PILOT_ENABLED:'true',D3_PILOT_SHA256:DIGEST,
  D3_SANDBOX_REPO_ID:'1430581407',
 };
 return {service,calls,env};
}
test('D3-SCOPE04 public proxy is immutable unless both scoped pilot gates are ON',async()=>{
 const x=gateway();
 for(const changes of [
  {},
  {D3_INTEGRATED_PWA_ENABLED:'true',D3_PILOT_ENABLED:'false'},
  {D3_INTEGRATED_PWA_ENABLED:'false',D3_PILOT_ENABLED:'true'},
 ]){
  const res=await x.service.fetch(req(D3_SCOPED_PILOT_PATH),
   {...x.env,...changes},{});
  assert.equal(await res.text(),'V2_BYTE_IDENTICAL');
 }
 assert.equal(x.calls.pilot,0);
 const e={...x.env,D3_INTEGRATED_PWA_ENABLED:'true'};
 const scoped=await x.service.fetch(req(D3_SCOPED_PILOT_PATH),e,{});
 assert.equal(await scoped.text(),'SCOPED_OWNER');
 assert.equal(x.calls.pilot,1);
 for(const pathname of ['/fishing/','/fishing/release.json',
  '/fishing/__d3_pilot__/unlisted.js']){
  const res=await x.service.fetch(req(pathname),e,{});
  assert.equal(await res.text(),'V2_BYTE_IDENTICAL');
 }
 assert.equal(x.calls.pilot,1);
});
test('D3-SCOPE05 cross-site OAuth navigation only exempts exact pilot page',async()=>{
 const TOKEN='x'.repeat(43);
 const session=createD2UnifiedOwnerSession({
  AUTH_DB:{prepare:()=>({bind:()=>({first:async()=>({
   github_id:OWNER,expires_at:1800001000,
  })})})},
  ownerGitHubId:OWNER,origin:ORIGIN,
  csrfKey:'s'.repeat(40),now:()=>1800000000,
 });
 const options={headers:{
  Cookie:'__Host-fish_p0_session='+TOKEN,
  'Sec-Fetch-Site':'cross-site',
  'Sec-Fetch-Mode':'navigate',
  'Sec-Fetch-Dest':'document',
 }};
 assert.equal((await session.authorizePilotPage(
  req(D3_SCOPED_PILOT_PATH,options))).authorized,true);
 await assert.rejects(session.authorizePilotPage(
  req('/fishing/',options)),{code:'CROSS_SITE_DENIED'});
 await assert.rejects(session.authorizeStatus(
  req(D3_SCOPED_PILOT_SCRIPT,options)),{code:'CROSS_SITE_DENIED'});
});
test('D3-SCOPE06 scoped OAuth state cannot be created without both flags',async()=>{
 let inserts=0;
 const env={
  APP_ORIGIN:ORIGIN,GITHUB_CLIENT_ID:'public',
  GITHUB_CLIENT_SECRET:'private-test',OWNER_GITHUB_ID:String(OWNER),
  DB:{prepare:()=>({bind:()=>({run:async()=>{inserts++;}})})},
 };
 const url=ORIGIN+'/auth/start?return=%2Ffishing%2F__d3_pilot__%2F';
 for(const settings of [{},{D3_PILOT_ENABLED:'true'},
  {D3_INTEGRATED_PWA_ENABLED:'true'}]){
  const res=await auth.fetch(req('/auth/start?return=%2Ffishing%2F__d3_pilot__%2F'),
   {...env,...settings});
  assert.equal(res.status,400);
 }
 assert.equal(inserts,0);
 const allowed=await auth.fetch(new Request(url),{
  ...env,D3_PILOT_ENABLED:'true',D3_INTEGRATED_PWA_ENABLED:'true',
 });
 assert.equal(allowed.status,303);
 assert.equal(inserts,1);
 const state=new URL(allowed.headers.get('Location')).searchParams.get('state');
 assert.match(state,/^[A-Za-z0-9_-]{43}\.i$/);
 const disallowed=await auth.fetch(req('/auth/callback?state='+state+'&code=dummy',{
  headers:{Cookie:'__Host-fish_p0_flow='+state},
 }),env);
 assert.equal(disallowed.status,400,'Disabling feature rejects outstanding OAuth return');
});
test('D3-SCOPE07 V3 SW excludes only exact private paths from V2 offline cache',async()=>{
 const swPath=fileURLToPath(new URL('../../../../pwa/src/sw.mjs',import.meta.url));
 const sw=await readFile(swPath,'utf8');
 assert.match(sw,/url\.pathname==='\/fishing\/__d3_pilot__\/'/);
 assert.match(sw,/url\.pathname==='\/fishing\/__d3_pilot__\/pilot\.js'/);
 assert.match(sw,/if\(request\.mode==='navigate'\)/);
 assert.match(sw,/return await networkFile\(context,'index\.html'\)/);
 assert.match(sw,/context\.entries\.has\(target\)/);
 // No branch that handles an unlisted private path or caches owner HTML.
 assert(!sw.includes('caches.put(D3_SCOPED_PILOT_PATH'));
});
