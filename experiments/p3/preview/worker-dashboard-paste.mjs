/* GENERATED SINGLE-FILE CLOUDFLARE DASHBOARD BUNDLE. NO GITHUB WRITE OPERATIONS. Source: src/github-app-readonly.mjs + src/worker.mjs. Delete P3_DIAGNOSTIC_KEY after the test to disable the probe. */

/**
 * Isolated, read-only GitHub App installation proof for the P3 sandbox.
 * Only the secret-guarded preview diagnostic calls this proof; no write API.
 * No GitHub repo writes or browser-visible tokens. No credentials in source.
 * Never return GitHub tokens to an HTTP response or logs.
 */
const SANDBOX='ginosega/fishing-p3-sandbox';
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
class GitHubProbeError extends Error {
 constructor(code){super('Read-only GitHub App verification failed');this.name='GitHubProbeError';this.code=code;}
}
const proofError=code=>{throw new GitHubProbeError(code);};
const permittedStatus=status=>[401,403,404,422].includes(status)?status:0;
async function verifyReadOnlySandboxInstallation({env,request=fetch,now=Math.floor(Date.now()/1000),cryptoApi=crypto}={}){
 if(!id(env?.P3_GITHUB_APP_ID)||!id(env?.P3_GITHUB_INSTALLATION_ID))
   proofError('invalid_app_identifiers');
 if(env?.P3_WRITE_ENABLED!=='false')proofError('write_flag_not_false');
 if(typeof env?.P3_GITHUB_PRIVATE_KEY!=='string'||!env.P3_GITHUB_PRIVATE_KEY)
   proofError('missing_app_private_key');
 let jwt;
 try{jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY,now,cryptoApi});}
 catch{proofError('app_key_signing_failed');}
 const jwtHeaders={...headers,Authorization:'Bearer '+jwt};
 let installationResponse;
 try{installationResponse=await request(API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID,{
   method:'GET',headers:jwtHeaders,
 });}catch{proofError('app_installation_lookup_network_failure');}
 if(!installationResponse?.ok)
   proofError('app_installation_lookup_http_'+permittedStatus(installationResponse?.status));
 let installation;
 try{installation=await installationResponse.json();}catch{proofError('app_installation_lookup_malformed_response');}
 if(installation?.id!==Number(env.P3_GITHUB_INSTALLATION_ID)||
    installation?.app_id!==Number(env.P3_GITHUB_APP_ID))
   proofError('app_installation_id_mismatch');
 if(installation?.account?.login!=='ginosega')
   proofError('app_installation_owner_mismatch');
 if(installation?.suspended_at!=null)proofError('app_installation_suspended');
 if(installation?.repository_selection!=='selected')
   proofError('app_installation_scope_not_selected');
 if(!['read','write'].includes(installation?.permissions?.contents)||
    installation?.permissions?.pull_requests!=='write')
   proofError('app_installation_permissions_mismatch');
 let sandboxInstallationResponse;
 try{sandboxInstallationResponse=await request(API+'/repos/'+SANDBOX+'/installation',{
  method:'GET',headers:jwtHeaders,
 });}catch{proofError('sandbox_installation_lookup_network_failure');}
 if(!sandboxInstallationResponse?.ok)
   proofError('sandbox_installation_lookup_http_'+permittedStatus(sandboxInstallationResponse?.status));
 let sandboxInstallation;
 try{sandboxInstallation=await sandboxInstallationResponse.json();}
 catch{proofError('sandbox_installation_lookup_malformed_response');}
 if(sandboxInstallation?.id!==installation.id||
    sandboxInstallation?.app_id!==installation.app_id||
    sandboxInstallation?.account?.login!=='ginosega')
   proofError('sandbox_installation_mismatch');
 let grant;
 try{
  grant=await request(API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID+'/access_tokens',{
   method:'POST',headers:{...headers,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
   body:JSON.stringify({repository_ids:[SANDBOX_REPOSITORY_ID],permissions:{contents:'read'}}),
  });
 }catch{proofError('installation_token_network_failure');}
 if(!grant?.ok)proofError('installation_token_http_'+permittedStatus(grant?.status));
 let body;
 try{body=await grant.json();}catch{proofError('installation_token_malformed_response');}
 if(body?.permissions?.contents!=='read'||typeof body.token!=='string'||body.token.length<12)
   proofError('installation_token_scope_mismatch');
 let repository;
 try{
  repository=await request(API+'/repos/'+SANDBOX,{
   method:'GET',headers:{...headers,Authorization:'Bearer '+body.token},
  });
 }catch{proofError('sandbox_read_network_failure');}
 if(!repository?.ok)proofError('sandbox_read_http_'+permittedStatus(repository?.status));
 let details;
 try{details=await repository.json();}catch{proofError('sandbox_read_malformed_response');}
 if(details?.full_name!==SANDBOX||details.private!==true||details.id!==SANDBOX_REPOSITORY_ID)
   proofError('sandbox_identity_mismatch');
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
  if(url.pathname==='/_internal/verify-sandbox'){
   if(request.method!=='POST')return json({error:'Not found'},404);
   if(!await authorizedProbe(request,env))return json({error:'Forbidden'},403);
   if(env?.P3_WRITE_ENABLED!=='false')return json({ok:false,ready:false,code:'write_flag_not_false'},503);
   try{
    const result=await verify({env});
    if(result?.verified!==true||result?.repository!=='ginosega/fishing-p3-sandbox'||
       result?.repositoryId!==1430581407||result?.tokenScope!=='contents:read'||
       result?.publishingEnabled!==false)return json({ok:false,ready:false,code:'unexpected_proof_result'},503);
    return json({verified:true,repository:result.repository,
      repositoryId:result.repositoryId,tokenScope:'contents:read',publishingEnabled:false});
   }catch(e){
    return json({ok:false,ready:false,code:e instanceof GitHubProbeError?e.code:'unexpected_proof_error'},503);
   }
  }
  if(url.pathname==='/session'){
   if(request.method!=='GET')return json({ok:false},405);
   return json({authenticated:false,authorized:false});
  }
  if(url.pathname.startsWith('/publications')||url.pathname.startsWith('/operations')||
     url.pathname.startsWith('/auth')||url.pathname.startsWith('/session/'))
    return json({error:'Publishing not enabled'},503);
  return json({error:'Not found'},404);
 }
 };
}
export default createWorker();
