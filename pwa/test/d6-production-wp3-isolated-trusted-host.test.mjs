import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {createD6ProductionWp3TrustedHostCandidate}
 from '../../experiments/p3/preview/src/d6-production-wp3-trusted-host-candidate.mjs';
import {D6_PUBLISH_REPOSITORY as REPO,
 D6_PUBLISH_INTAKE_ORIGIN as PROD}
 from '../../experiments/p3/preview/src/d6-production-publish-intake.mjs';
import {D6_WP2_STAGING_ORIGIN as WP2,
 D6_WP3_STAGING_ORIGIN as WP3}
 from '../src/d6-public-reader.mjs';
import {D6_WP3_ISOLATED_PAGES_BASE as PAGES}
 from '../server/d6-pages-path-gateway.mjs';

const NOW=2000000000,COOKIE='K'.repeat(43);
const CSRF_KEY='isolated-test-csrf-000000000000000000000000000000000';
const ID='123e4567-e89b-42d3-a456-426614174000';
const OP='/api/v3/operations',MEDIA='/api/v3/media';
const PAGE_URL=PAGES+'release.json';
const authToken=origin=>createHmac('sha256',CSRF_KEY)
 .update('fishing-v3-csrf-v1\n'+origin+'\n'+COOKIE)
 .digest('base64url');
const request=(host=WP3,path=OP,{token=authToken(host),
 intent='publish',method='POST',cookie=COOKIE,site='same-origin',
 contentType='application/json',body='{}'}={})=>
 new Request(host+path,{
  method,headers:{
   Origin:host,'Sec-Fetch-Site':site,
   'X-Fish-V3-Intent':intent,
   'X-Fish-V3-CSRF':token,
   'Content-Type':contentType,
   Cookie:'__Host-fish_p0_session='+cookie,
  },
  ...(method==='POST'?{body}:{}),
 });
const defaults={
 D6_PRODUCTION_ENABLED:'true',D6_GATEWAY_ENABLED:'true',
 D6_ORIGIN:WP3,
 D6_OWNER_GITHUB_ID:String(REPO.ownerGitHubId),
 D6_REPOSITORY_ID:String(REPO.id),
 D6_WP2_STAGING_ENABLED:'false',
 D6_ISOLATED_PAGES_ENABLED:'false',
 D6_WP3_ISOLATED_READ_ENABLED:'true',
 D6_WP3_ISOLATED_PAGES_ENABLED:'true',
 D6_WP3_READ_PROFILE_ENABLED:'true',
 D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:'true',
 D6_STATIC_ENABLED:'true',D6_OAUTH_ENABLED:'true',
 D6_SOURCE_ENABLED:'true',D6_READ_TOKEN_ENABLED:'true',
 D6_SIGNER_ENABLED:'true',D6_SESSION_ENABLED:'true',
 D6_WP3_RUNTIME_ENABLED:'true',D6_WP3_WRITE_ENABLED:'true',
 D6_WP3_MOUNT_ENABLED:'true',
 D6_CSRF_KEY:CSRF_KEY,
 D6_GITHUB_APP_ID:'77',D6_GITHUB_INSTALLATION_ID:'42',
 D6_GITHUB_APP_PRIVATE_KEY:'test-invalid-app-private-key',
 D6_OAUTH_CLIENT_ID:'Iv1.test-client',
 D6_OAUTH_CLIENT_SECRET:'test-client-secret-000000000000',
};
function fixture({overrides={},approved=false,missingSchema=true,
 auth=true,mediaSecret=false}={}){
 const info={authReads:0,wp3Reads:0,wp3Writes:0,
  calls:[],flow:new Map(),sessions:new Map()};
 info.sessions.set(createHash('sha256').update(COOKIE).digest('base64url'),{
  github_id:REPO.ownerGitHubId,expires_at:NOW+1800,
 });
 const AUTH_DB={prepare(sql){return {bind(...args){return{
  async first(){
   info.authReads++;
   if(sql.startsWith('SELECT github_id,expires_at FROM sessions')){
    if(!auth)return null;
    const row=info.sessions.get(args[0]);
    return row?.expires_at>args[1]?row:null;
   }
   if(sql.startsWith('DELETE FROM auth_flows')){
    const row=info.flow.get(args[0]);
    info.flow.delete(args[0]);
    return row?.expires_at>args[1]?{code_verifier:row.code_verifier}:null;
   }
   throw Error('Unexpected AUTH_DB read');
  },
  async run(){
   if(sql.startsWith('INSERT INTO auth_flows')){
    info.flow.set(args[0],{
     code_verifier:args[1],expires_at:args[2],
    });
   }else if(sql.startsWith('INSERT INTO sessions')){
    info.sessions.set(args[0],{
     github_id:args[1],expires_at:args[2],
    });
   }else throw Error('Unexpected AUTH_DB write');
   return {success:true};
  },
 };}};}};
 const WP3_DB={prepare(sql){
  info.wp3Reads++;
  if(missingSchema)throw Error('WP3 D1 schema is missing');
  return {async all(){return {success:true,results:[]};}};
 }};
 const env={...defaults,AUTH_DB,WP3_DB,
  ...(mediaSecret?{
   D6_WP3_MEDIA_TICKET_SECRET:'test-media-key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  }:{}),
  ...overrides,
 };
 const state={approved};
 const host=createD6ProductionWp3TrustedHostCandidate({
  env,now:()=>NOW,ownerApproval:()=>state.approved,
  network:async(url,options)=>{
   info.calls.push({url,method:options.method});
   if(url.startsWith(PAGES)){
    return new Response('trusted-isolated-pages-bytes',{
     status:200,headers:{'Content-Type':'text/plain'},
    });
   }
   if(url==='https://github.com/login/oauth/access_token')
    return new Response(JSON.stringify({
     access_token:'gho_'+'abc123'.repeat(6),token_type:'bearer',
    }),{headers:{'Content-Type':'application/json'}});
   if(url==='https://api.github.com/user')
    return new Response(JSON.stringify({
     id:REPO.ownerGitHubId,login:'ginosega',
    }),{headers:{'Content-Type':'application/json'}});
   throw Error('Unexpected provider request');
  },
 });
 return {host,env,state,info};
}
const status=async(host,path,settings)=>(
 await host.fetch(request(WP3,path,settings))).status;

test('WP3-ISOHOST01 read profile works, all writes remain absent without independent owner approval',async()=>{
 const x=fixture({approved:false});
 const res=await x.host.fetch(new Request(WP3+'/fishing/release.json'));
 assert.equal(res.status,200);
 assert.equal(await res.text(),'trusted-isolated-pages-bytes');
 assert.equal(x.info.calls[0].url,PAGE_URL);
 for(const path of [OP,OP+'/'+ID+'/begin',MEDIA,MEDIA+'/reconcile'])
  assert.equal(await status(x.host,path),404);
 assert.equal(x.info.authReads,0);
 assert.equal(x.info.wp3Reads,0);
 assert.equal(x.info.wp3Writes,0);
 assert.deepEqual(Object.keys(x.host),['fetch']);
});

test('WP3-ISOHOST02 owner D2 CSRF and same-origin remain required before WP3 D1',async()=>{
 const x=fixture({approved:true});
 for(const settings of [
  {token:'0'.repeat(43)},
  {site:'cross-site'},
  {cookie:'J'.repeat(43)},
 ]){
  assert.equal(await status(x.host,OP,settings),403);
 }
 assert.equal(x.info.wp3Reads,0);
 assert.equal(x.info.wp3Writes,0);
 assert.equal(x.info.calls.length,0);
 // A valid session cannot proceed when the separate WP3 schema is missing.
 const valid=await x.host.fetch(request());
 assert.equal(valid.status,503);
 assert.equal(x.info.wp3Reads,1);
 assert.equal(x.info.wp3Writes,0);
 assert.equal(x.info.calls.length,0);
});

test('WP3-ISOHOST03 media stage is likewise owner-gated before D1 or GitHub',async()=>{
 const x=fixture({approved:true});
 const make=(token)=>request(WP3,MEDIA,{
  token,intent:'stage-media',contentType:'image/png',
  body:new Uint8Array([137,80,78,71]),
 });
 assert.equal((await x.host.fetch(make('0'.repeat(43)))).status,403);
 assert.equal(x.info.wp3Reads,0);
 assert.equal((await x.host.fetch(make(authToken(WP3)))).status,503);
 assert.equal(x.info.wp3Reads,1);
 assert.equal(x.info.wp3Writes,0);
 assert.equal(x.info.calls.length,0);
});

test('WP3-ISOHOST04 wrong/mixed WP2, public and WP3 profile pins deny all write authority',async()=>{
 for(const bad of [
  {D6_ORIGIN:PROD},
  {D6_ORIGIN:WP2},
  {D6_WP2_STAGING_ENABLED:'true'},
  {D6_ISOLATED_PAGES_ENABLED:'true'},
  {D6_WP3_ISOLATED_PAGES_ENABLED:'false'},
  {D6_WP3_ISOLATED_READ_ENABLED:undefined},
  {D6_WP3_READ_PROFILE_ENABLED:undefined},
  {D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED:undefined},
  {D6_SOURCE_ENABLED:undefined},
  {D6_OAUTH_ENABLED:undefined},
  {D6_STATIC_ENABLED:undefined},
  {D6_SIGNER_ENABLED:undefined},
  {D6_READ_TOKEN_ENABLED:undefined},
  {D6_WP3_WRITE_ENABLED:undefined},
  {D6_WP3_MOUNT_ENABLED:undefined},
  {D6_OWNER_GITHUB_ID:'2'},
 ]){
  const x=fixture({approved:true,overrides:bad});
  assert.equal(await status(x.host,OP),404,
   'should deny profile '+JSON.stringify(bad));
  assert.equal(x.info.wp3Reads,0);
  assert.equal(x.info.wp3Writes,0);
  assert.equal(x.info.calls.length,0);
 }
});

test('WP3-ISOHOST05 same-host OAuth callback and D2 owner status, but still no write',async()=>{
 const x=fixture({approved:false});
 const start=await x.host.fetch(new Request(WP3+'/auth/start',{
  headers:{'Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document','Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(start.status,303);
 assert.equal(new URL(start.headers.get('Location'))
  .searchParams.get('redirect_uri'),WP3+'/auth/callback');
 const state=start.headers.get('Set-Cookie')
  ?.match(/__Host-fish_p0_flow=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(state,/^[A-Za-z0-9_-]{43}$/);
 const callback=await x.host.fetch(new Request(WP3+
  '/auth/callback?code=githubSampleCode123456&state='+state,{
  headers:{Cookie:'__Host-fish_p0_flow='+state,
   'Sec-Fetch-Mode':'navigate',
   'Sec-Fetch-Dest':'document','Sec-Fetch-Site':'cross-site'},
 }));
 assert.equal(callback.status,303);
 const sid=callback.headers.get('Set-Cookie')
  ?.match(/__Host-fish_p0_session=([A-Za-z0-9_-]{43})/)?.[1];
 assert.match(sid,/^[A-Za-z0-9_-]{43}$/);
 const session=await x.host.fetch(new Request(WP3+'/session',{
  headers:{Cookie:'__Host-fish_p0_session='+sid,
   'Sec-Fetch-Site':'same-origin'},
 }));
 assert.equal(session.status,200);
 assert.equal((await session.json()).authorized,true);
 assert.equal((await x.host.fetch(request(WP3,OP,{cookie:sid}))).status,404);
 assert.equal(x.info.wp3Writes,0);
 assert.deepEqual(x.info.calls.map(x=>x.url),[
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
 ]);
});

test('WP3-ISOHOST06 isolated user signs in, operator can revoke without deployment or token',async()=>{
 const x=fixture({approved:true});
 assert.equal(await status(x.host,OP),503);
 const before=x.info.wp3Reads;
 x.state.approved=false;
 assert.equal(await status(x.host,OP),404);
 assert.equal(x.info.wp3Reads,before);
 assert.equal(x.info.wp3Writes,0);
 assert.equal(x.info.calls.length,0);
});

test('WP3-ISOHOST07 exact isolated owner with schema shape still fails closed without verified readiness',async()=>{
 const x=fixture({approved:true,missingSchema:false,mediaSecret:true});
 const res=await x.host.fetch(request());
 assert.equal(res.status,503);
 assert.equal(x.info.wp3Reads,1);
 assert.equal(x.info.wp3Writes,0);
 assert.equal(x.info.calls.length,0);
 assert.equal((await res.json()).error,'TEMPORARILY_UNAVAILABLE');
});
