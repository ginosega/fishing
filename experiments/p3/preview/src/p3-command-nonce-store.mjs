/**
 * FISH118 P3-21: source-only, fail-closed, one-statement D1 replay nonce consumer.
 *
 * Requires UNAPPLIED source migration 0004_command_nonce_ledger.sql.
 * The remote R1/R2/R3 D1 is NOT altered. Only a native Worker D1 binding is
 * permitted; this cannot use a sequential REST write or an in-memory Map.
 */
export class P3NonceError extends Error{
 constructor(code){super('P3 replay nonce refused');this.name='P3NonceError';this.code=code;}
}
const stop=code=>{throw new P3NonceError(code);};
const allow=(v,code)=>{if(!v)stop(code);};
const hash=/^[0-9a-f]{64}$/;
const REPO_ID=1430581407;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const WINDOW_MS=60_000;
export function createP3D1CommandNonceStore({
 DB,ownerGitHubId,now=()=>Date.now(),
}={}){
 allow(typeof DB?.prepare==='function'&&positive(ownerGitHubId)&&
  typeof now==='function','INVALID_NONCE_STORE_CONFIGURATION');
 async function consumeNonce({nonceSha256,issuedAt,
  ownerGitHubId:requestOwner,repositoryId}={}){
  allow(hash.test(nonceSha256??'')&&
   positive(issuedAt)&&requestOwner===ownerGitHubId&&
   repositoryId===REPO_ID,'INVALID_NONCE_CLAIM');
  const consumedAt=now();
  allow(positive(consumedAt)&&Math.abs(consumedAt-issuedAt)<=WINDOW_MS,
   'NONCE_EXPIRED');
  // Unique primary key + one INSERT/RETURNING is an atomic SQLite statement.
  // No second attempt can consume the same hash, even across Worker isolates.
  // No automatic cleanup is allowed until expiry/race safety is reviewed.
  const statement=DB.prepare(
   'INSERT INTO p3_command_nonces '+
   '(nonce_sha256,github_id,repo_id,issued_at_ms,consumed_at_ms) '+
   'VALUES(?,?,?,?,?) ON CONFLICT(nonce_sha256) DO NOTHING RETURNING nonce_sha256'
  ).bind(nonceSha256,ownerGitHubId,REPO_ID,issuedAt,consumedAt);
  const row=await statement.first();
  return row?.nonce_sha256===nonceSha256;
 }
 return Object.freeze({consumeNonce});
}
