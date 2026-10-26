/**
 * FISH118 D3: sandbox-only server-side GitHub App token bindings.
 * Reuses the SAME existing encrypted D2 App PEM on the SAME trusted Worker,
 * never copying, exporting or rotating its value. A D3 issuer is enabled
 * only if both D2 and D3 IDs pin the same exact selected sandbox App
 * installation; it cannot mint public-repository tokens. No new PEM key
 * is introduced merely for the D3 test. Completed D2 Worker stays parked.
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
 const sameInstallation=()=>env?.D3_GITHUB_APP_ID===env?.D2_GITHUB_APP_ID&&
  env?.D3_GITHUB_INSTALLATION_ID===env?.D2_GITHUB_INSTALLATION_ID&&
  /^[1-9]\d*$/.test(String(env?.D2_GITHUB_APP_ID??''))&&
  /^[1-9]\d*$/.test(String(env?.D2_GITHUB_INSTALLATION_ID??''))&&
  typeof env?.D2_GITHUB_APP_PRIVATE_KEY==='string'&&
  env.D2_GITHUB_APP_PRIVATE_KEY.length>32;
 const read=createD2SandboxReadTokenIssuer({
  env:{
   D2_GITHUB_APP_ID:env?.D2_GITHUB_APP_ID,
   D2_GITHUB_INSTALLATION_ID:env?.D2_GITHUB_INSTALLATION_ID,
   D2_GITHUB_APP_PRIVATE_KEY:env?.D2_GITHUB_APP_PRIVATE_KEY,
  },request,
  enabled:()=>enabled()===true&&sameInstallation()&&
   env?.D3_READ_TOKENS_ENABLED==='true'&&
   env?.D3_SANDBOX_REPO_ID===String(ID),
 });
 const write=createSandboxWriteTokenIssuer({
  env:{
   P3_GITHUB_APP_ID:env?.D2_GITHUB_APP_ID,
   P3_GITHUB_INSTALLATION_ID:env?.D2_GITHUB_INSTALLATION_ID,
   P3_GITHUB_PRIVATE_KEY:env?.D2_GITHUB_APP_PRIVATE_KEY,
   P3_WRITE_ENABLED:env?.D3_WRITE_ENABLED,
  },request,
  enabled:()=>enabled()===true&&sameInstallation()&&
   env?.D3_WRITE_ENABLED==='true'&&
   env?.D3_SANDBOX_REPO_ID===String(ID),
 });
 return Object.freeze({issueReadToken:read.issueReadToken,
  issueWriteToken:write.issueToken});
}
