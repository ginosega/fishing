// GENERATED SINGLE-FILE CLOUDFLARE DASHBOARD BUNDLE; NO GITHUB WRITE OPERATIONS.
// Source: src/github-app-readonly.mjs + src/worker.mjs.
// After the diagnostic, delete P3_DIAGNOSTIC_KEY to disable the proof route.

/**
 * Isolated, read-only GitHub App installation proof for the P3 sandbox.
 * Only the secret-guarded preview diagnostic calls this proof; no write API.
 * No GitHub repo writes or browser-visible tokens. No credentials in source.
 * Never return GitHub tokens to an HTTP response or logs.
 */
const SANDBOX='ginosega/fishing-p3-sandbox';
// Exact repository ID confirmed using the GitHub connector after access was granted.
const SANDBOX_REPOSITORY_ID=1430581407;
const API='https://api.github.com';
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
const ensure=(ok,msg)=>{if(!ok)throw new Error(msg);};
const id=value=>typeof value==='string'&&/^[1-9]\d{0,15}$/.test(value);
const encoded=data=>btoa(String.fromCharCode(...new Uint8Array(data))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
function derLength(size){
 if(size<128)return Uint8Array.of(size);
 if(size<256)return Uint8Array.of(0x81,size);
 if(size<65536)return Uint8Array.of(0x82,size>>8,size&255);
 throw Error('Unreasonable RSA key length');
}
function concat(...groups){const count=groups.reduce((n,a)=>n+a.length,0),result=new Uint8Array(count);let pos=0;for(const g of groups){result.set(g,pos);pos+=g.length;}return result;}
function wrap(tag,inner){return concat(Uint8Array.of(tag),derLength(inner.length),inner);}
function pkcs1ToPkcs8(input){
 const algorithm=Uint8Array.from([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00]);
 return wrap(0x30,concat(Uint8Array.of(0x02,0x01,0x00),algorithm,wrap(0x04,input)));
}
function pemToDer(pem){
 ensure(typeof pem==='string','Missing GitHub App private key');
 const normalized=pem.replace(/\\n/g,'\n').trim();
 const match=/^-----BEGIN (RSA PRIVATE KEY|PRIVATE KEY)-----\s+([A-Za-z0-9+/=\s]+)\s+-----END \1-----$/.exec(normalized);
 ensure(match,'Invalid GitHub App PEM format');
 const bin=atob(match[2].replace(/\s+/g,'')),bytes=Uint8Array.from(bin,ch=>ch.charCodeAt(0));
 return match[1]==='RSA PRIVATE KEY'?pkcs1ToPkcs8(bytes):bytes;
}
async function appJwt({appId,privateKey,now=Math.floor(Date.now()/1000),cryptoApi=crypto}){
 ensure(id(appId),'Invalid GitHub App ID');
 ensure(Number.isSafeInteger(now)&&now>0,'Invalid clock');
 const key=await cryptoApi.subtle.importKey('pkcs8',pemToDer(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const claims={iat:now-60,exp:now+480,iss:appId};
 const message=encoded(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})))+'.'+encoded(new TextEncoder().encode(JSON.stringify(claims)));
 const signature=await cryptoApi.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(message));
 return message+'.'+encoded(signature);
}
async function verifyReadOnlySandboxInstallation({env,request=fetch,now=Math.floor(Date.now()/1000),cryptoApi=crypto}={}){
 ensure(id(env?.P3_GITHUB_APP_ID)&&id(env?.P3_GITHUB_INSTALLATION_ID),'Missing sandbox GitHub App identifiers');
 ensure(env?.P3_WRITE_ENABLED!=='true','Read-only inspection requires disabled publishing');
 ensure(typeof env?.P3_GITHUB_PRIVATE_KEY==='string','Missing private key secret');
 const jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY,now,cryptoApi});
 const grant=await request(API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID+'/access_tokens',{
  method:'POST',headers:{...headers,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
  body:JSON.stringify({repository_ids:[SANDBOX_REPOSITORY_ID],permissions:{contents:'read'}}),
 });
 ensure(grant.ok,'GitHub refused restricted installation token');
 const body=await grant.json();
 ensure(body?.permissions?.contents==='read' && typeof body.token==='string'&&body.token.length>=12,
  'GitHub returned no verified read-only installation token');
 // A private sandbox is verified with the actual short-lived installation token.
 const repository=await request(API+'/repos/'+SANDBOX,{
  method:'GET',headers:{...headers,Authorization:'Bearer '+body.token},
 });
 ensure(repository.ok,'Sandbox is not accessible to GitHub App installation');
 const details=await repository.json();
 ensure(details?.full_name===SANDBOX&&details.private===true&&details.id===SANDBOX_REPOSITORY_ID,
  'Installation access resolved to an unexpected repository');
 // Never return the key, GitHub installation token, owner secrets or JWT.
 return Object.freeze({verified:true,repository:SANDBOX,repositoryId:details.id,
   private:true,tokenScope:'contents:read',publishingEnabled:false});
}

/**
 * P3 Cloudflare Free sandbox deployment sentinel.
 * No GitHub write API, OAuth callback or publish routes.
 * Temporary secret-guarded, read-only GitHub App installation probe ONLY.
 * Publishing remains disabled.
 */
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; connect-src 'self'; frame-ancestors 'none'",
}});
const fail=()=>json({ok:false,ready:false},503);
// Only a high-entropy, owner-controlled Secret permits the temporary probe.
// Constant-time comparison of equal-length SHA-256 digests, no token logging.
async function authorizedProbe(request,env){
 const received=request.headers.get('X-P3-Diagnostic-Key');
 const expected=env?.P3_DIAGNOSTIC_KEY;
 if(typeof received!=='string'||received.length<32||received.length>256||
    typeof expected!=='string'||expected.length<32||expected.length>256)return false;
 const toDigest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const a=await toDigest(received),b=await toDigest(expected);
 let diff=0;
 for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 return diff===0;
}
function createWorker({verify=verifyReadOnlySandboxInstallation}={}){
 return {
 async fetch(request,env){
  let url;
  try{url=new URL(request.url);}catch{return fail();}
  // This Worker is meant for a single explicitly configured new
  // preview hostname. Never return authenticated status on a mismatch.
  if(!env?.APP_ORIGIN || url.origin!==env.APP_ORIGIN || url.protocol!=='https:')return fail();
  if(url.pathname==='/health'){
   if(request.method!=='GET')return json({ok:false},405);
   if(!env.DB?.prepare)return fail();
   try{
    const result=await env.DB.prepare('SELECT 1 AS alive').first();
    if(Number(result?.alive)!==1)return fail();
    return json({ok:true,ready:false,mode:'preview-no-publishing'});
   }catch{return fail();}
  }
  // One temporary proof-of-installation route. It NEVER writes GitHub;
  // it may only read the exact private sandbox with a scoped one-hour token.
  if(url.pathname==='/_internal/verify-sandbox'){
   if(request.method!=='POST')return json({error:'Not found'},404);
   if(env?.P3_WRITE_ENABLED!=='false')return fail();
   if(!await authorizedProbe(request,env))return json({error:'Forbidden'},403);
   try{
    const result=await verify({env});
    if(result?.verified!==true||result?.repository!=='ginosega/fishing-p3-sandbox'||
       result?.repositoryId!==1430581407||result?.tokenScope!=='contents:read'||
       result?.publishingEnabled!==false)return fail();
    return json({verified:true,repository:result.repository,
      repositoryId:result.repositoryId,tokenScope:'contents:read',publishingEnabled:false});
   }catch{return fail();}
  }
  if(url.pathname==='/session'){
   if(request.method!=='GET')return json({ok:false},405);
   return json({authenticated:false,authorized:false});
  }
  // All write-oriented and privileged routes are disabled.
  if(url.pathname.startsWith('/publications')||url.pathname.startsWith('/operations')||
     url.pathname.startsWith('/auth')||url.pathname.startsWith('/session/'))
    return json({error:'Publishing not enabled'},503);
  return json({error:'Not found'},404);
 }
 };
}
export default createWorker();
