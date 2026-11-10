/**
 * D6 production-only GitHub App JWT signing primitive — SOURCE ONLY.
 *
 * No Worker entrypoint, OAuth callback, provider call, D1 read/write, App
 * installation, secret binding, token issuer or publishing route. The trusted
 * runtime must independently authorize activation and supply its server-only
 * PEM. Disabled by default, including when a signer was previously used.
 *
 * This is NOT the D2/D3 sandbox issuer or an import of its credentials.
 */
const ENCODER=new TextEncoder();
const APP_ID=/^[1-9]\d{0,15}$/;
const PRIVATE_PEM=/^-----BEGIN (RSA PRIVATE KEY|PRIVATE KEY)-----\s+([A-Za-z0-9+\/=\s]+)\s+-----END \1-----$/;
const ALGORITHM=Object.freeze({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'});
const RSA_IDENTIFIER=Uint8Array.of(
 0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00
);
export class D6ProductionAppSigningError extends Error{
 constructor(code){
  super('D6 production App signing unavailable');
  this.name='D6ProductionAppSigningError';
  this.code=code;
 }
}
const deny=code=>{throw new D6ProductionAppSigningError(code);};
const requireOk=(ok,code)=>{if(!ok)deny(code);};
function concat(...parts){
 const output=new Uint8Array(parts.reduce((n,p)=>n+p.byteLength,0));
 let offset=0;
 for(const part of parts){output.set(part,offset);offset+=part.byteLength;}
 return output;
}
function derLength(length){
 requireOk(Number.isSafeInteger(length)&&length>0&&length<65536,'INVALID_PEM');
 if(length<128)return Uint8Array.of(length);
 if(length<256)return Uint8Array.of(0x81,length);
 return Uint8Array.of(0x82,length>>8,length&255);
}
const derWrap=(tag,inner)=>concat(Uint8Array.of(tag),derLength(inner.length),inner);
function pkcs1ToPkcs8(pkcs1){
 return derWrap(0x30,concat(Uint8Array.of(0x02,0x01,0x00),
  RSA_IDENTIFIER,derWrap(0x04,pkcs1)));
}
function pemDer(value){
 requireOk(typeof value==='string'&&value.length<32000,'INVALID_PEM');
 const normalized=value.replace(/\\n/g,'\n').trim();
 const match=PRIVATE_PEM.exec(normalized);
 requireOk(match,'INVALID_PEM');
 const raw=match[2].replace(/\s+/g,'');
 requireOk(raw.length>=512&&raw.length<=24000&&raw.length%4===0,
  'INVALID_PEM');
 let bytes;
 try{
  bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
  const check=btoa(String.fromCharCode(...bytes));
  requireOk(check===raw,'INVALID_PEM');
 }catch{deny('INVALID_PEM');}
 return match[1]==='RSA PRIVATE KEY'?pkcs1ToPkcs8(bytes):bytes;
}
function base64url(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 return btoa(String.fromCharCode(...bytes)).replace(/=/g,'')
  .replace(/\+/g,'-').replace(/\//g,'_');
}

/**
 * signAppJwt is the injectable trusted-server dependency of
 * createD6ProductionReadTokenIssuer. It never exposes the PEM, nor a provider
 * access token. The caller MUST keep the returned signed App JWT server-only.
 */
export function createD6ProductionAppSigner({
 enabled=()=>false,cryptoApi=globalThis.crypto,
}={}){
 requireOk(typeof enabled==='function'&&
  typeof cryptoApi?.subtle?.importKey==='function'&&
  typeof cryptoApi?.subtle?.sign==='function','INVALID_CONFIG');
 async function signAppJwt({appId,privateKey,now}={}){
  requireOk(enabled()===true,'DISABLED');
  requireOk(typeof appId==='string'&&APP_ID.test(appId)&&
   Number.isSafeInteger(Number(appId)),'INVALID_APP_ID');
  requireOk(Number.isSafeInteger(now)&&now>=61&&now<Number.MAX_SAFE_INTEGER-540,
   'INVALID_CLOCK');
  const keyBytes=pemDer(privateKey);
  let key,signature;
  const header=base64url(ENCODER.encode(JSON.stringify({
   alg:'RS256',typ:'JWT',
  })));
  const body=base64url(ENCODER.encode(JSON.stringify({
   iat:now-60,exp:now+480,iss:appId,
  })));
  const message=header+'.'+body;
  try{
   key=await cryptoApi.subtle.importKey('pkcs8',keyBytes,
    ALGORITHM,false,['sign']);
   requireOk(key?.type==='private'&&
    key.algorithm?.modulusLength>=2048,'INVALID_KEY');
   // Recheck the capability immediately before signing. In-progress
   // revocation cannot enable subsequent minting.
   requireOk(enabled()===true,'DISABLED');
   signature=await cryptoApi.subtle.sign('RSASSA-PKCS1-v1_5',key,
    ENCODER.encode(message));
  }catch(error){
   if(error instanceof D6ProductionAppSigningError)throw error;
   deny('SIGNING_FAILED');
  }
  requireOk(signature instanceof ArrayBuffer&&signature.byteLength>=256,
   'SIGNING_FAILED');
  return message+'.'+base64url(signature);
 }
 return Object.freeze({signAppJwt});
}
