/**
 * Standalone V3 owner authentication only. Reuse the accepted PKCE issuer,
 * session projection and sign-out implementation, not the retired READ
 * gateway/App signer. No GitHub content/API grants, static proxy or publisher.
 */
import {createD6ProductionOAuthSessionIssuer}
 from './auth/d6-production-oauth-session-issuer.mjs';
import {createD6ProductionOwnerSession}
 from './auth/d6-production-owner-session.mjs';
import {createD6ProductionOwnerSignout,D6_OWNER_SIGNOUT_PATH}
 from './auth/d6-production-owner-signout.mjs';

import {isD6OwnerOrigin} from './auth/owner-origins.mjs';

const headers=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
});
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const fail=(status,error)=>response(status,{ok:false,error});
export function createD6OwnerAuth({env,origin,network,cryptoApi,now}){
 // One exact configured host and the pinned owner. No GitHub repository grants.
 const gateway=env.D6_PRODUCTION_ENABLED==='true'&&
  isD6OwnerOrigin(origin)&&env.D6_ORIGIN===origin&&
  env.D6_OWNER_GITHUB_ID==='265665562';
 const sessionOn=gateway&&env.D6_SESSION_ENABLED==='true';
 const loginOn=sessionOn&&env.D6_OAUTH_ENABLED==='true';
 const signoutOn=sessionOn&&env.D6_SIGNOUT_ENABLED==='true';
 const requestGitHub=async(url,options)=>{
  const exchange=url==='https://github.com/login/oauth/access_token'&&
   options?.method==='POST'&&
   options.headers?.['Content-Type']==='application/json'&&
   typeof options.body==='string';
  const identity=url==='https://api.github.com/user'&&
   options?.method==='GET'&&options.body===undefined&&
   /^Bearer [A-Za-z0-9_-]{16,2048}$/.test(options.headers?.Authorization??'');
  if((!exchange&&!identity)||options?.redirect!=='manual'||
    options.credentials!=='omit'||options.cache!=='no-store')
   throw Error('OAuth endpoint denied');
  return network(url,options);
 };
 async function fetch(request){
  if(!(request instanceof Request))return fail(404,'NOT_FOUND');
  let url;try{url=new URL(request.url);}catch{return fail(404,'NOT_FOUND');}
  if(url.origin!==origin||url.username||url.password||
    request.headers.has('Authorization'))return fail(404,'NOT_FOUND');
  const login=url.pathname==='/auth/start'||url.pathname==='/auth/callback';
  const status=url.pathname==='/session';
  const signout=url.pathname===D6_OWNER_SIGNOUT_PATH;
  if(!login&&!status&&!signout)return fail(404,'NOT_FOUND');
  if(!gateway)return fail(503,'TEMPORARILY_UNAVAILABLE');
  const requestOrigin=request.headers.get('Origin');
  if(requestOrigin&&requestOrigin!==origin)return fail(403,'ORIGIN_DENIED');
  if(login){
   if(!loginOn)return fail(503,'TEMPORARILY_UNAVAILABLE');
   const issuer=createD6ProductionOAuthSessionIssuer({
    AUTH_DB:env.AUTH_DB,clientId:env.D6_OAUTH_CLIENT_ID,
    clientSecret:env.D6_OAUTH_CLIENT_SECRET,requestGitHub,
    cryptoApi,now,origin,enabled:()=>loginOn,
   });
   return url.pathname==='/auth/start'?
    issuer.start(request):issuer.callback(request);
  }
  if(signout){
   if(env.D6_SIGNOUT_ENABLED!=='true')return fail(404,'NOT_FOUND');
   const handler=createD6ProductionOwnerSignout({
    AUTH_DB:env.AUTH_DB,cryptoApi,origin,enabled:()=>signoutOn,
   });
   return handler.signOut(request);
  }
  if(request.headers.get('Sec-Fetch-Site')==='cross-site')
   return fail(403,'ORIGIN_DENIED');
  if(request.method!=='GET'||url.search||url.hash)
   return fail(404,'NOT_FOUND');
  if(!sessionOn)return fail(503,'TEMPORARILY_UNAVAILABLE');
  try{
   const session=createD6ProductionOwnerSession({
    AUTH_DB:env.AUTH_DB,csrfKey:env.D6_CSRF_KEY,now,origin,
    enabled:()=>sessionOn,
   });
   return response(200,await session.describe(request));
  }catch{return fail(503,'SESSION_UNAVAILABLE');}
 }
 return Object.freeze({fetch});
}
