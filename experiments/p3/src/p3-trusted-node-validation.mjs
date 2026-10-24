/**
 * FISH118 P3-6 trusted Node validation composition.
 * SOURCE ONLY: no HTTP route, no write token, no PR, no merge.
 * Actual P3 Worker is still publish-disabled. Construct on a server only,
 * supplying its independently authorized D1 store and private App secrets.
 */
import {createSandboxReadTokenIssuer} from '../preview/src/sandbox-read-token.mjs';
import {createAuthenticatedSandboxCheckout} from './authenticated-sandbox-checkout.mjs';
import {createCanonicalSourceAware} from './source-aware.mjs';
import {createTrustedSandboxCandidate} from './trusted-sandbox-candidate.mjs';

export function createP3TrustedNodeValidation({
 env,store,request=fetch,gitExec,workspaceRoot,
}={}){
 // This factory intentionally provides NO sourceAware override. An injected
 // fixture/stub must never be promoted as privileged canonical validation.
 const issuer=createSandboxReadTokenIssuer({env,request});
 const checkout=createAuthenticatedSandboxCheckout({
  issueReadToken:issuer.issueReadToken,request,
  ...(gitExec?{gitExec}:{}),
  ...(workspaceRoot?{workspaceRoot}:{}),
 });
 const validateCandidate=createTrustedSandboxCandidate({
  store,
  trustedCheckout:checkout.trustedCheckout,
  releaseCheckout:checkout.releaseCheckout,
  sourceAware:createCanonicalSourceAware(),
 });
 return Object.freeze({
  readMainSha:checkout.readMainSha,
  validateCandidate,
 });
}
