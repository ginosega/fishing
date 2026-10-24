/**
 * FISH118 P3-11: one-shot, read-only Node proof of dedicated P3 App Checks:read.
 * SOURCE ONLY. No Worker route, secrets persistence, GitHub write, PR update,
 * merge, deployment or production action.
 *
 * Server-owned target: the already approved synthetic sandbox draft PR #1.
 * A successful result never means an automatic merge is permitted.
 */
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createSandboxCheckReadTokenIssuer} from '../src/sandbox-check-read-token.mjs';
import {createSandboxCheckObserver} from '../src/sandbox-check-observer.mjs';

const ID=1430581407;
const RECEIPT=Object.freeze({
 repositoryId:ID,
 prNumber:1,
 expectedHeadSha:'7e39c018081e9677b33c3bcab7ebe80b44d924f8',
 expectedBaseSha:'e37db3b18bd9948bf4453d7f885f868e830a9a9a',
 expectedBranch:'experiment/p3-7-ci-smoke',
});

export class P3ReadProofError extends Error {
 constructor(code){super('P3 read-only installation proof refused');this.name='P3ReadProofError';this.code=code;}
}
export async function verifySandboxCheckGrant({env,request=fetch}={}){
 if(env?.P3_CHECK_READ_PROOF_ENABLED!=='true'||env?.P3_WRITE_ENABLED!=='false')
  throw new P3ReadProofError('PROOF_DISABLED');
 if(typeof request!=='function')throw new P3ReadProofError('INVALID_REQUEST');
 const issuer=createSandboxCheckReadTokenIssuer({
  env,request,enabled:()=>true,
 });
 const observer=createSandboxCheckObserver({
  request,enabled:()=>true,issueCheckReadToken:issuer.issueCheckReadToken,
 });
 const observed=await observer.observe(RECEIPT);
 if(observed?.repositoryId!==ID||observed?.prNumber!==1||
    observed?.headSha!==RECEIPT.expectedHeadSha||
    observed?.baseSha!==RECEIPT.expectedBaseSha||
    observed?.checkObserved!=='success'||
    observed?.canMerge!==false||observed?.canDeploy!==false)
  throw new P3ReadProofError('EVIDENCE_MISMATCH');
 // Never print a JWT, private key, installation token, raw App response or
 // arbitrary GitHub error. Only the following strict proof is allowed out.
 return Object.freeze({
  verified:true,
  repository:'ginosega/fishing-p3-sandbox',
  repositoryId:ID,
  prNumber:1,
  headSha:observed.headSha,
  baseSha:observed.baseSha,
  checkName:observed.checkName,
  checkRunId:observed.checkRunId,
  result:'completed/success',
  checksReadPermissionConfirmed:true,
  canMerge:false,
  canDeploy:false,
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  console.log(JSON.stringify(await verifySandboxCheckGrant({env:process.env})));
 }catch(e){
  // Only static error codes from owned modules, no error message/body/stack.
  const name=['P3ReadProofError','CheckReadTokenError','SandboxCheckError'];
  console.error('P3_CHECK_READ_PROOF_REFUSED '+(name.includes(e?.name)?
   e.code:'UNEXPECTED_REFUSAL'));
  process.exitCode=1;
 }
}
