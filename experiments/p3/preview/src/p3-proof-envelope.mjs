/**
 * FISH118 P3-36. Source-only strict transport for exact inner command bytes.
 * NOT a Worker route, publish API, deployment, credential source or signature
 * verifier. Raw Access JWT and service-token secrets NEVER belong inside this
 * envelope. Signature checks must happen only at the private atomic receiver.
 *
 * Wire v1 has one canonical JSON representation, fixed field order and strictly
 * canonical nested command JSON / owner approval. No duplicated/unknown keys,
 * whitespace variants, proto fields, noncanonical base64 or invalid UTF-8.
 */
import {canonicalP3Approval} from './p3-operator-approval.mjs';

export class P3ProofEnvelopeError extends Error {
 constructor(code){super('P3 signed-proof envelope rejected');this.name='P3ProofEnvelopeError';this.code=code;}
}
const fail=code=>{throw new P3ProofEnvelopeError(code);};
const need=(ok,code)=>{if(!ok)fail(code);};
export const P3_PROOF_MAX_COMMAND_BYTES=8192;
export const P3_PROOF_MAX_OUTER_BYTES=24576;
const enc=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const b64url=/^[A-Za-z0-9_-]+$/;
const nonce=/^[A-Za-z0-9_-]{22,64}$/;
const hmac=/^[A-Za-z0-9_-]{43}$/;
const ecdsa=/^[A-Za-z0-9_-]{86}$/;
const keys=['v','bodyB64','oidcJwt','approval','operatorSignature','hmacSignature',
 'nonceValue','timestampMs'];
const object=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
function exactly(x,expected){
 need(object(x)&&Object.keys(x).length===expected.length&&
  expected.every(k=>Object.hasOwn(x,k)),'INVALID_PROOF_SHAPE');
}
function bytes64(bytes){
 let s='';
 for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function from64(s){
 need(typeof s==='string'&&s.length>0&&
  s.length<=Math.ceil(P3_PROOF_MAX_COMMAND_BYTES*4/3)&&
  b64url.test(s),'INVALID_COMMAND_ENCODING');
 let bytes;
 try{
  bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+
   '='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));
 }catch{fail('INVALID_COMMAND_ENCODING');}
 need(bytes.length>0&&bytes.length<=P3_PROOF_MAX_COMMAND_BYTES&&
  bytes64(bytes)===s,'INVALID_COMMAND_ENCODING');
 return bytes;
}
function inner(body){
 need(typeof body==='string'&&enc.encode(body).byteLength>0&&
  enc.encode(body).byteLength<=P3_PROOF_MAX_COMMAND_BYTES,'INVALID_COMMAND');
 let command;
 try{command=JSON.parse(body);}catch{fail('INVALID_COMMAND');}
 exactly(command,['action','idempotencyKey','snapshot']);
 need(command.action==='accept'&&
  typeof command.idempotencyKey==='string'&&
  /^[A-Za-z0-9_-]{12,96}$/.test(command.idempotencyKey)&&
  object(command.snapshot)&&
  JSON.stringify(command)===body,'INVALID_COMMAND');
 // The full nested exact-byte check denies duplicate keys anywhere, exotic
 // escaping, whitespace, and number normalization ambiguity.
 return body;
}
function canonicalWire({body,oidcJwt,approval,operatorSignature,hmacSignature,
 nonceValue,timestampMs}){
 const exactBody=inner(body);
 need(typeof oidcJwt==='string'&&oidcJwt.length>=120&&
  oidcJwt.length<=10000&&
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(oidcJwt)&&
  typeof operatorSignature==='string'&&ecdsa.test(operatorSignature)&&
  typeof hmacSignature==='string'&&hmac.test(hmacSignature)&&
  nonce.test(nonceValue)&&Number.isSafeInteger(timestampMs)&&
  /^\d{13}$/.test(String(timestampMs)),'INVALID_PROOF_SHAPE');
 let canonicalApproval;
 try{canonicalApproval=canonicalP3Approval(approval);}
 catch{fail('INVALID_PROOF_SHAPE');}
 // Field order and escaped serialization are an explicit versioned protocol.
 const text='{"v":1,"bodyB64":'+JSON.stringify(bytes64(enc.encode(exactBody)))+
  ',"oidcJwt":'+JSON.stringify(oidcJwt)+',"approval":'+canonicalApproval+
  ',"operatorSignature":'+JSON.stringify(operatorSignature)+
  ',"hmacSignature":'+JSON.stringify(hmacSignature)+
  ',"nonceValue":'+JSON.stringify(nonceValue)+
  ',"timestampMs":'+String(timestampMs)+'}';
 need(enc.encode(text).byteLength<=P3_PROOF_MAX_OUTER_BYTES,'PROOF_TOO_LARGE');
 return text;
}
export function encodeP3ProofEnvelope(args={}){
 need(object(args),'INVALID_PROOF_SHAPE');
 exactly(args,['body','oidcJwt','approval','operatorSignature','hmacSignature',
  'nonceValue','timestampMs']);
 return canonicalWire(args);
}
export function decodeP3ProofEnvelope(wire){
 need(typeof wire==='string'&&enc.encode(wire).byteLength>0&&
  enc.encode(wire).byteLength<=P3_PROOF_MAX_OUTER_BYTES,'PROOF_TOO_LARGE');
 let obj;
 try{obj=JSON.parse(wire);}catch{fail('INVALID_PROOF_JSON');}
 exactly(obj,keys);
 need(obj.v===1,'INVALID_PROOF_VERSION');
 let body;
 try{body=decoder.decode(from64(obj.bodyB64));}
 catch{fail('INVALID_COMMAND_ENCODING');}
 // Reserialize the entire signed-proof message and demand byte equality.
 // This rejects duplicates at ALL JSON object depths (including approval).
 need(canonicalWire({body,oidcJwt:obj.oidcJwt,approval:obj.approval,
  operatorSignature:obj.operatorSignature,hmacSignature:obj.hmacSignature,
  nonceValue:obj.nonceValue,timestampMs:obj.timestampMs})===wire,
  'NONCANONICAL_PROOF');
 return Object.freeze({body,nonceValue:obj.nonceValue,timestampMs:obj.timestampMs,
  authorization:Object.freeze({oidcJwt:obj.oidcJwt,approval:obj.approval,
   operatorSignature:obj.operatorSignature,hmacSignature:obj.hmacSignature})});
}
export async function readP3ProofRequest(request){
 need(request instanceof Request,'INVALID_REQUEST');
 need(request.headers.get('Content-Type')==='application/json','INVALID_CONTENT_TYPE');
 const size=request.headers.get('Content-Length');
 need(size===null||(/^\d+$/.test(size)&&
  Number(size)<=P3_PROOF_MAX_OUTER_BYTES),'PROOF_TOO_LARGE');
 need(request.body?.getReader,'INVALID_REQUEST');
 const reader=request.body.getReader(),parts=[];let count=0,ended=false;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done){ended=true;break;}
   need(value instanceof Uint8Array,'INVALID_REQUEST');
   count+=value.byteLength;
   need(count<=P3_PROOF_MAX_OUTER_BYTES,'PROOF_TOO_LARGE');
   parts.push(value);
  }
 }finally{
  if(!ended)void reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
 need(count>0,'INVALID_REQUEST');
 const bytes=new Uint8Array(count);let at=0;
 for(const p of parts){bytes.set(p,at);at+=p.byteLength;}
 let wire;
 try{wire=decoder.decode(bytes);}catch{fail('INVALID_PROOF_ENCODING');}
 // Reader returns unchanged canonical bytes, not a reconstructed JSON body.
 decodeP3ProofEnvelope(wire);
 return wire;
}
