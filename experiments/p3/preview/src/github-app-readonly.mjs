/**
 * Isolated, NOT ROUTED GitHub App proof for the private P3 sandbox.
 * This is NOT called by the currently deployed disabled Cloudflare Worker.
 * No GitHub repo writes or browser-visible tokens. No credentials in source.
 * A later security-reviewed endpoint must authenticate the owner before
 * executing, and must never return GitHub tokens to an HTTP response.
 */
const SANDBOX='ginosega/fishing-p3-sandbox';
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
export async function appJwt({appId,privateKey,now=Math.floor(Date.now()/1000),cryptoApi=crypto}){
 ensure(id(appId),'Invalid GitHub App ID');
 ensure(Number.isSafeInteger(now)&&now>0,'Invalid clock');
 const key=await cryptoApi.subtle.importKey('pkcs8',pemToDer(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const claims={iat:now-60,exp:now+480,iss:appId};
 const message=encoded(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})))+'.'+encoded(new TextEncoder().encode(JSON.stringify(claims)));
 const signature=await cryptoApi.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(message));
 return message+'.'+encoded(signature);
}
export async function verifyReadOnlySandboxInstallation({env,request=fetch,now=Math.floor(Date.now()/1000),cryptoApi=crypto}={}){
 ensure(id(env?.P3_GITHUB_APP_ID)&&id(env?.P3_GITHUB_INSTALLATION_ID),'Missing sandbox GitHub App identifiers');
 ensure(env?.P3_WRITE_ENABLED!=='true','Read-only inspection requires disabled publishing');
 ensure(typeof env?.P3_GITHUB_PRIVATE_KEY==='string','Missing private key secret');
 const jwt=await appJwt({appId:env.P3_GITHUB_APP_ID,privateKey:env.P3_GITHUB_PRIVATE_KEY,now,cryptoApi});
 const grant=await request(API+'/app/installations/'+env.P3_GITHUB_INSTALLATION_ID+'/access_tokens',{
  method:'POST',headers:{...headers,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
  body:JSON.stringify({repositories:['fishing-p3-sandbox'],permissions:{contents:'read'}}),
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
 ensure(details?.full_name===SANDBOX&&details.private===true&&Number.isSafeInteger(details.id),
  'Installation access resolved to an unexpected repository');
 // Never return the key, GitHub installation token, owner secrets or JWT.
 return Object.freeze({verified:true,repository:SANDBOX,repositoryId:details.id,
   private:true,tokenScope:'contents:read',publishingEnabled:false});
}
