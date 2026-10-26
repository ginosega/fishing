/**
 * FISH118 D3: sandbox-only server-side GitHub App token bindings.
 * Separately named D3 encrypted Worker secrets. This does NOT reactivate
 * the completed D2 Worker, mutate its bindings or expose PEM to browser.
 * The reviewed D2/P3 token issuers still enforce immutable sandbox repo ID,
 * selected installation provenance and per-call least-privilege scopes.
 */
import {createD2SandboxReadTokenIssuer}
 from './d2-sandbox-read-token.mjs';
import {createSandboxWriteTokenIssuer}
 from './sandbox-write-token.mjs';
const ID=1430581407;
export function createD3SandboxTokenIssuers({env,request,
 enabled=()=>false}={}){
 if(typeof request!=='function'||typeof enabled!=='function')
  throw Error('D3 token issuer requires trusted runtime');
 const read=createD2SandboxReadTokenIssuer({
  env:{
   D2_GITHUB_APP_ID:env?.D3_GITHUB_APP_ID,
   D2_GITHUB_INSTALLATION_ID:env?.D3_GITHUB_INSTALLATION_ID,
   D2_GITHUB_APP_PRIVATE_KEY:env?.D3_GITHUB_APP_PRIVATE_KEY,
  },request,
  enabled:()=>enabled()===true&&
   env?.D3_READ_TOKENS_ENABLED==='true'&&
   env?.D3_SANDBOX_REPO_ID===String(ID),
 });
 const write=createSandboxWriteTokenIssuer({
  env:{
   P3_GITHUB_APP_ID:env?.D3_GITHUB_APP_ID,
   P3_GITHUB_INSTALLATION_ID:env?.D3_GITHUB_INSTALLATION_ID,
   P3_GITHUB_PRIVATE_KEY:env?.D3_GITHUB_APP_PRIVATE_KEY,
   P3_WRITE_ENABLED:env?.D3_WRITE_ENABLED,
  },request,
  enabled:()=>enabled()===true&&
   env?.D3_WRITE_ENABLED==='true'&&
   env?.D3_SANDBOX_REPO_ID===String(ID),
 });
 return Object.freeze({issueReadToken:read.issueReadToken,
  issueWriteToken:write.issueToken});
}
