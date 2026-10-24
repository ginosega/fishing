/**
 * FISH118 P3-26. SOURCE ONLY. Access JWT verification for a future ingress.
 * An Access policy alone is not trusted: verify RS256 JWT, issuer, audience,
 * lifetime and exact Access service-token client ID (signed common_name).
 * Requires injected JWKS requester. NO deployed route or default network call.
 */
export class P3AccessError extends Error{
 constructor(code){super('P3 Access authorization refused');this.name='P3AccessError';this.code=code;}
}
const stop=code=>{throw new P3AccessError(code);};
const need=(v,code)=>{if(!v)stop(code);};
const b64=/^[A-Za-z0-9_-]+$/;
const team=/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/;
const aud=/^[a-z0-9_-]{16,128}$/i;
const client=/^[A-Za-z0-9._-]{12,200}\.access$/;
const txt=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
function un64(s){
 need(typeof s==='string'&&s.length>0&&b64.test(s),'ACCESS_TOKEN_INVALID');
 try{
  const bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
  const original=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  need(original===s,'ACCESS_TOKEN_INVALID');
  return bytes;
 }catch(e){if(e instanceof P3AccessError)throw e;stop('ACCESS_TOKEN_INVALID');}
}
function parse(s){
 try{return JSON.parse(decoder.decode(un64(s)));}
 catch{stop('ACCESS_TOKEN_INVALID');}
}
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const integer=x=>Number.isSafeInteger(x)&&x>0;
async function jsonBounded(response){
 need(response instanceof Response&&response.status===200,'ACCESS_KEYS_UNAVAILABLE');
 const length=response.headers.get('Content-Length');
 need(length===null||/^\d+$/.test(length)&&Number(length)<=32768,'ACCESS_KEYS_UNAVAILABLE');
 need(response.body?.getReader,'ACCESS_KEYS_UNAVAILABLE');
 const reader=response.body.getReader(),parts=[];let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;need(size<=32768,'ACCESS_KEYS_UNAVAILABLE');
   parts.push(value);
  }
 }finally{reader.releaseLock();}
 const buf=new Uint8Array(size);let off=0;
 for(const p of parts){buf.set(p,off);off+=p.length;}
 try{return JSON.parse(decoder.decode(buf));}catch{stop('ACCESS_KEYS_UNAVAILABLE');}
}
export function createP3AccessJwtVerifier({
 issuer,audience,serviceClientId,requestJwks,now=()=>Math.floor(Date.now()/1000),
}={}){
 need(typeof issuer==='string'&&team.test(issuer)&&aud.test(audience??'')&&
  client.test(serviceClientId??'')&&typeof requestJwks==='function'&&
  typeof now==='function','INVALID_ACCESS_CONFIG');
 const keysUrl=issuer+'/cdn-cgi/access/certs';
 async function verify(jwt){
  need(typeof jwt==='string'&&jwt.length>=64&&jwt.length<=8192,
   'ACCESS_TOKEN_INVALID');
  const segments=jwt.split('.');
  need(segments.length===3&&segments.every(p=>p&&p.length<=7000),
   'ACCESS_TOKEN_INVALID');
  const header=parse(segments[0]),claims=parse(segments[1]),signature=un64(segments[2]);
  need(obj(header)&&header.alg==='RS256'&&
   typeof header.kid==='string'&&header.kid.length>=8&&header.kid.length<=256&&
   obj(claims),'ACCESS_TOKEN_INVALID');
  const clock=now();
  need(integer(clock)&&integer(claims.iat)&&integer(claims.exp)&&
   claims.exp>clock&&claims.iat<=clock+60&&claims.iat<claims.exp&&
   (claims.nbf===undefined || (integer(claims.nbf)&&claims.nbf<=clock+60))&&
   claims.iss===issuer&&claims.type==='app'&&
   (claims.aud===audience||(Array.isArray(claims.aud)&&claims.aud.includes(audience)))&&
   claims.sub===''&&claims.common_name===serviceClientId,
   'ACCESS_IDENTITY_DENIED');
  let keys;
  try{keys=await jsonBounded(await requestJwks(keysUrl));}
  catch(e){if(e instanceof P3AccessError)throw e;stop('ACCESS_KEYS_UNAVAILABLE');}
  need(obj(keys)&&Array.isArray(keys.keys)&&keys.keys.length<=20,
   'ACCESS_KEYS_UNAVAILABLE');
  const matching=keys.keys.filter(j=>obj(j)&&j.kid===header.kid&&j.kty==='RSA'&&
   (j.use===undefined||j.use==='sig')&&
   (j.alg===undefined||j.alg==='RS256')&&
   typeof j.n==='string'&&typeof j.e==='string');
  need(matching.length===1,'ACCESS_KEYS_UNAVAILABLE');
  let verified=false;
  try{
   const publicKey=await crypto.subtle.importKey('jwk',matching[0],
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,
    signature,txt.encode(segments[0]+'.'+segments[1]));
  }catch{stop('ACCESS_TOKEN_INVALID');}
  need(verified,'ACCESS_TOKEN_INVALID');
  return Object.freeze({serviceClientId});
 }
 return Object.freeze({verify});
}
