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
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',
 'User-Agent':'fishing-p3-sandbox-publisher'};
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
export async function appJwt({appId,privateKey,now=Math.floor(Date.now()/1000),cryptoApi=crypto}){
 ensure(id(appId),'Invalid GitHub App ID');
 ensure(Number.isSafeInteger(now)&&now>0,'Invalid clock');
 const key=await cryptoApi.subtle.importKey('pkcs8',pemToDer(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const claims={iat:now-60,exp:now+480,iss:appId};
 const message=encoded(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})))+'.'+encoded(new TextEncoder().encode(JSON.stringify(claims)));
 const signature=await cryptoApi.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(message));
 return message+'.'+encoded(signature);
}
// Stable and nonsecret diagnostic reasons. Never include GitHub response bodies.
export class GitHubProbeError extends Error {
 constructor(code){super('Read-only GitHub App verification failed');this.name='GitHubProbeError';this.code=code;}
}
const proofError=code=>{throw new GitHubProbeError(code);};
const permittedStatus=status=>[401,403,404,422].includes(status)?status:0;
export async function verifyReadOnlySandboxInstallation({env,request=fetch,now=Math.floor(Date.now()/1000),cryptoApi=crypto}={}){
 if(!id(env?.P3_GITHUB_APP_ID)||!id(env?.P3_GITHUB_INSTALLATION_ID))
   proofError('invalid_app_identifiers');
 if(env?.P3_WRITE_ENABLED!=='false')proofError('write_flag_not_false');
 if(typeof env?.P3_GITHUB_PRIVATE_KEY!=='string'||!env.P3_GITHUB_PRIVATE_KEY)
   proofError('missing_app_private_key');
 let jwt;
 try{jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY,now,cryptoApi});}
 catch{proofError('app_key_signing_failed');}
 // Read-only JWT-authenticated preflight proves App/installation identity and grants.
 // GitHub's two GET endpoints return metadata only and never issue an access token.
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
 // No secrets, tokens or unauthorized repository values are returned.
 return Object.freeze({verified:true,repository:SANDBOX,repositoryId:details.id,
   private:true,tokenScope:'contents:read',publishingEnabled:false});
}
