/**
 * FISH118 P3-39 — SOURCE-ONLY combined GitHub OIDC + App installation
 * GET-metadata proof. Importing this module performs NO provider call.
 *
 * No App private key embedded or printed. No fetch default, token minting,
 * Cloudflare dependency, Worker deployment, D1 or GitHub write API.
 * The future credential-custody decision is intentionally NOT implemented.
 */
import {createP3RunnerProvenance,P3ProvenanceError} from './p3-runner-provenance.mjs';

export class P3AppOidcReadOnlyError extends Error{
 constructor(code){
  super('P3 combined read-only provenance denied');
  this.name='P3AppOidcReadOnlyError';
  this.code=code;
 }
}
const deny=code=>{throw new P3AppOidcReadOnlyError(code);};
const insist=(condition,code)=>{if(!condition)deny(code);};
const WF='ginosega/fishing-p3-sandbox/.github/workflows/'+
 'fishing-p3-oidc-app-readonly.yml@refs/heads/main';
const AUD='fishing-p3:trusted-runner:owner-accept';
const ID=1430581407,OWNER=265665562;
const expectedKeys=[
 'P3_GITHUB_APP_ID','P3_GITHUB_INSTALLATION_ID','P3_GITHUB_PRIVATE_KEY',
 'P3_WRITE_ENABLED',
];
// Historical owner-confirmed installation matrix (P3-10/P3-11).
// Provisional until actual authenticated GET confirms it exactly.
// If grants differ, DENY; never expand from returned provider metadata.
const EXPECTED_PERMISSIONS=Object.freeze({
 checks:'read',contents:'write',metadata:'read',pull_requests:'write',
});
export const P3_APP_OIDC_READONLY_WORKFLOW_REF=WF;
export const P3_APP_OIDC_READONLY_AUDIENCE=AUD;

/**
 * Caller supplies a short-lived OIDC token ONLY from an explicitly authorized
 * trusted runner/service. The module does not issue or transport that token;
 * similarly it never retrieves PEM from GitHub Actions/Cloudflare.
 *
 * The injected GitHub GET wrapper refuses all but two exact metadata URLs,
 * and never returns provider response text to the client on errors.
 */
export function createP3AppOidcReadOnlyPreflight({
 env,expectedWorkflowSha,requestOidcToken,requestOidcKeys,requestGitHub,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 insist(env&&Object.getPrototypeOf(env)===Object.prototype&&
  expectedKeys.every(k=>Object.hasOwn(env,k))&&
  env.P3_WRITE_ENABLED==='false'&&
  typeof expectedWorkflowSha==='string'&&
  /^[a-f0-9]{40}$/.test(expectedWorkflowSha)&&
  typeof requestOidcToken==='function'&&
  typeof requestOidcKeys==='function'&&
  typeof requestGitHub==='function'&&typeof now==='function',
  'PREFLIGHT_DISABLED_OR_INVALID');
 const appId=env.P3_GITHUB_APP_ID,installationId=env.P3_GITHUB_INSTALLATION_ID;
 insist(typeof appId==='string'&&/^[1-9]\d{0,15}$/.test(appId)&&
  typeof installationId==='string'&&/^[1-9]\d{0,15}$/.test(installationId)&&
  typeof env.P3_GITHUB_PRIVATE_KEY==='string'&&
  env.P3_GITHUB_PRIVATE_KEY.length>32,'PREFLIGHT_DISABLED_OR_INVALID');
 // Whitelist both URL and method at this final network boundary. The
 // underlying source verifier also requires the same GET-only endpoints.
 const api='https://api.github.com',allowed=new Set([
  api+'/app/installations/'+installationId,
  api+'/repos/ginosega/fishing-p3-sandbox/installation',
 ]);
 const readGitHub=async(url,options)=>{
  insist(allowed.has(url)&&options?.method==='GET'&&
   options?.redirect==='manual'&&
   typeof options.headers?.Authorization==='string'&&
   options.headers.Authorization.startsWith('Bearer '),
   'GET_ONLY_BOUNDARY_DENIED');
  return requestGitHub(url,options);
 };
 const verifier=createP3RunnerProvenance({
  env:{P3_GITHUB_APP_ID:appId,P3_GITHUB_INSTALLATION_ID:installationId,
   P3_GITHUB_PRIVATE_KEY:env.P3_GITHUB_PRIVATE_KEY},
  requestOidcKeys,requestGitHub:readGitHub,now,
  expectedWorkflowRef:WF,expectedWorkflowSha,
  expectedAudience:AUD,expectedAppPermissions:EXPECTED_PERMISSIONS,
 });
 async function verify(){
  // Zero side effects until caller explicitly invokes verify().
  let jwt;
  try{jwt=await requestOidcToken(AUD);}
  catch{deny('OIDC_SUPPLY_UNAVAILABLE');}
  insist(typeof jwt==='string'&&jwt.length>=120&&jwt.length<=10000,
   'OIDC_SUPPLY_UNAVAILABLE');
  let result;
  try{result=await verifier.verify(jwt);}
  catch(e){
   if(e instanceof P3ProvenanceError){
    // No raw provider response, JWT, PEM, App bearer, header or stack.
    const permitted=new Set([
     'OIDC_INVALID','OIDC_KEYS_UNAVAILABLE','OIDC_SCOPE_DENIED',
     'APP_SIGNING_DENIED','APP_LOOKUP_UNAVAILABLE',
     'APP_INSTALLATION_DENIED','APP_PERMISSIONS_DENIED',
     'APP_REPOSITORY_DENIED',
    ]);
    deny(permitted.has(e.code)?e.code:'PROVENANCE_DENIED');
   }
   if(e instanceof P3AppOidcReadOnlyError)throw e;
   deny('PROVENANCE_DENIED');
  }finally{
   jwt=undefined;
  }
  insist(result?.verified===true&&result.repositoryId===ID&&
   result.ownerGitHubId===OWNER&&
   result.appId===Number(appId)&&
   result.installationId===Number(installationId)&&
   result.workflowSha===expectedWorkflowSha,'PROVENANCE_DENIED');
  return Object.freeze({
   verified:true,readOnlyProof:true,repositoryId:ID,ownerGitHubId:OWNER,
   workflowSha:result.workflowSha,
   runId:result.runId,runAttempt:result.runAttempt,
   appId:result.appId,installationId:result.installationId,
   canMintInstallationToken:false,canPublish:false,
  });
 }
 return Object.freeze({verify});
}
