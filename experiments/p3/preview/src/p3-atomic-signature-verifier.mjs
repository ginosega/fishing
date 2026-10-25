/**
 * FISH118 P3-34: cryptographic-only source composition. Not a Worker entrypoint.
 * ALL network proof is delegated to createP3RunnerProvenance.verify, injected
 * by trusted runtime; only a verified GitHub OIDC+App identity is acceptable.
 * No D1, nonce consume, approval consume, GitHub mutation or fetch default.
 * The atomic acceptance receiver remains the sole persistence authority.
 */
import {createP3OperatorApprovalVerifier} from './p3-operator-approval.mjs';
import {verifyP3InternalCommandSignature} from './p3-internal-command-gate.mjs';

export class P3AtomicSignatureError extends Error{
 constructor(code){super('P3 signed command authorization denied');this.name='P3AtomicSignatureError';this.code=code;}
}
const deny=c=>{throw new P3AtomicSignatureError(c);};
const need=(ok,code)=>{if(!ok)deny(code);};
const positive=x=>Number.isSafeInteger(x)&&x>0;

export function createP3AtomicSignatureVerifier({
 verifyProvenance,operatorPublicJwk,secret,nowMs=()=>Date.now(),
}={}){
 need(typeof verifyProvenance==='function'&&
  operatorPublicJwk?.kty==='EC'&&operatorPublicJwk.crv==='P-256'&&
  typeof secret==='string'&&secret.length>=32&&secret.length<=512&&
  typeof nowMs==='function','INVALID_SIGNATURE_CONFIG');
 const owner=createP3OperatorApprovalVerifier({
  verifyProvenance,operatorPublicJwk,now:()=>Math.floor(nowMs()/1000),
 });
 async function verifyAuthorization({body,authorization,nonceValue,timestampMs}={}){
  need(typeof body==='string'&&
   authorization&&Object.getPrototypeOf(authorization)===Object.prototype&&
   Object.keys(authorization).sort().join(',')===
    'approval,hmacSignature,oidcJwt,operatorSignature',
   'INVALID_AUTHORIZATION');
  let command;
  try{command=JSON.parse(body);}catch{deny('INVALID_AUTHORIZATION');}
  need(command&&Object.getPrototypeOf(command)===Object.prototype&&
   Object.keys(command).sort().join(',')==='action,idempotencyKey,snapshot'&&
   command.action==='accept'&&typeof command.idempotencyKey==='string',
   'INVALID_AUTHORIZATION');
  need(positive(timestampMs)&&typeof nonceValue==='string',
   'INVALID_AUTHORIZATION');
  // HMAC signs the exact bytes, timestamp, nonce and fixed internal method/path.
  // ECDSA independently signs the body hash, idempotency key and runner identity.
  // Neither step performs an approval or HMAC nonce database write.
  let hmac,approval;
  try{
   hmac=await verifyP3InternalCommandSignature({
    secret,nonce:nonceValue,timestamp:timestampMs,
    signature:authorization.hmacSignature,body,now:nowMs,
   });
   approval=await owner.verify({
    oidcJwt:authorization.oidcJwt,approval:authorization.approval,
    signature:authorization.operatorSignature,
    body,idempotencyKey:command.idempotencyKey,
   });
  }catch{deny('SIGNATURE_OR_PROVENANCE_DENIED');}
  need(hmac?.verified===true&&hmac.nonceValue===nonceValue&&
   hmac.timestampMs===timestampMs&&
   approval?.verified===true&&hmac.bodySha256===approval.bodySha256,
   'SIGNATURE_OR_PROVENANCE_DENIED');
  return approval;
 }
 return Object.freeze({verifyAuthorization});
}
