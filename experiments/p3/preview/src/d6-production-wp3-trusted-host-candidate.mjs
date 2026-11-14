/**
 * FISH-TODO-118 WP3 — production-shaped trusted host for existing components.
 * SOURCE ONLY, NOT A WORKER ENTRYPOINT OR DEPLOYED ROUTE. DEFAULT OFF.
 *
 * Reuses WP2 OAuth/read gateway, the exact D2 owner+CSRF session, the original
 * GitHub App signer/token issuers, the existing canonical source snapshot
 * reader, original-media staging/ticket verifier, #496 provider step wiring,
 * #494 one-step publisher, and #493 single same-origin gateway.
 *
 * Only the exact canonical-production profile is eligible for source-level
 * write tests. The existing WP2 isolated staging profile REMAINS READ ONLY;
 * its different origin is not silently retargeted to production credentials.
 * A separately owner-approved isolated-origin security design and hosted
 * acceptance remain outstanding. Importing this file cannot mount a Worker.
 */
import {D6_PUBLISH_INTAKE_ORIGIN as ORIGIN,
 D6_PUBLISH_REPOSITORY as REPO,
 createD6ProductionPublishIntake}
 from './d6-production-publish-intake.mjs';
import {createD6ProductionRuntimeBindingContract}
 from './d6-production-runtime-bindings.mjs';
import {createD2UnifiedOwnerSession}
 from './d2-unified-owner-session.mjs';
import {createD6ProductionAppSigner}
 from './d6-production-app-signer.mjs';
import {createD6ProductionReadTokenIssuer}
 from './d6-production-read-token.mjs';
import {createD6ProductionWriteTokenIssuer}
 from './d6-production-write-token.mjs';
import {createD6ProductionPublishProviderTransport}
 from './d6-production-publish-provider-transport.mjs';
import {createD6CanonicalSnapshotLoader}
 from './d6-canonical-snapshot-loader.mjs';
import {createD6ProductionSourceReview}
 from './d6-production-source-review.mjs';
import {createD6ProductionOperationReceipts}
 from './d6-production-operation-receipts.mjs';
import {createD6ProductionAcceptedOperationReader}
 from './d6-production-accepted-operation-reader.mjs';
import {createD6ProductionPublishIntakeMain}
 from './d6-production-publish-intake-main.mjs';
import {createD6ProductionMediaUploadPreflight}
 from './d6-production-media-upload-preflight.mjs';
import {createD6ProductionMediaStageFence}
 from './d6-production-media-stage-fence.mjs';
import {createD6ProductionMediaStageReconciliation}
 from './d6-production-media-stage-reconcile.mjs';
import {createD6ProductionVerifiedMediaTicketIssuer}
 from './d6-production-media-ticket-issuer.mjs';
import {createD6ProductionMediaTicketVerifier}
 from './d6-production-media-ticket-verify.mjs';
import {createD6ProductionVerifiedMediaOperationBinding}
 from './d6-production-verified-media-operation-binding.mjs';
import {createD6ProductionAtomicSourceMediaTree}
 from './d6-production-atomic-source-media-tree.mjs';
import {createD6ProductionFiveStepWiring}
 from './d6-production-five-step-wiring.mjs';
import {createD6ProductionRequestBoundPublisher}
 from './d6-production-request-bound-publisher.mjs';
import {createD6ProductionPublishWriteRouteCandidate}
 from './d6-production-publish-write-route-candidate.mjs';
import {createD6ProductionMediaWriteRouteCandidate}
 from './d6-production-media-write-route-candidate.mjs';
import {createD6ProductionSingleGatewayCandidate}
 from './d6-production-single-gateway-candidate.mjs';
import {createD6Wp3D1Readiness}
 from './d6-production-wp3-d1-readiness.mjs';
import {createD6ProductionPublishSourcePrecondition}
 from './d6-production-publish-source-precondition.mjs';
import {createD6Wp3CanonicalSourceTransport}
 from './d6-production-wp3-canonical-source-transport.mjs';
import {readD6BoundedJson}
 from './d6-bounded-json-response.mjs';

const API='https://api.github.com',ROOT=API+'/repos/'+REPO.name;
const UUID='[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}';
const OPERATIONS=new RegExp('^/api/v3/operations(?:/'+UUID+
 '/(?:status|begin|reconcile))?$');
const MEDIA=new Set(['/api/v3/media','/api/v3/media/reconcile']);
const SHA=/^[a-f0-9]{40}$/;
const noStore=Object.freeze({'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff'});
const deny=(status,error)=>new Response(JSON.stringify({ok:false,error}),
 {status,headers:noStore});
export class D6Wp3HostError extends Error{
 constructor(code){super('WP3 host runtime cannot activate');
  this.name='D6Wp3HostError';this.code=code;}
}
const need=(ok,code)=>{if(!ok)throw new D6Wp3HostError(code);};
const allowedOrigin=req=>{
 let url;try{url=new URL(req.url);}catch{return false;}
 return url.origin===ORIGIN&&!url.search&&!url.hash&&
  !url.username&&!url.password&&!req.headers.has('Authorization');
};
const isWritePath=path=>OPERATIONS.test(path)||MEDIA.has(path);

export function createD6ProductionWp3TrustedHostCandidate({
 env={},network=globalThis.fetch,cryptoApi=globalThis.crypto,
 now=()=>Math.floor(Date.now()/1000),
 ownerApproval=()=>false,
 authorizeStep=async()=>false,
}={}){
 need(env&&typeof env==='object'&&
  [network,now,ownerApproval,authorizeStep].every(x=>typeof x==='function'),
  'INVALID_CONFIG');
 // Do not share the read-only WP2 capability flag with write activation.
 // The immutable hostname + owner/repo and non-staging profile are required
 // before a WP3 write surface can be considered.
 const profile=()=>env.D6_PRODUCTION_ENABLED==='true'&&
  env.D6_GATEWAY_ENABLED==='true'&&
  env.D6_ORIGIN===ORIGIN&&
  env.D6_OWNER_GITHUB_ID===String(REPO.ownerGitHubId)&&
  env.D6_REPOSITORY_ID===String(REPO.id)&&
  env.D6_WP2_STAGING_ENABLED!=='true'&&
  env.D6_ISOLATED_PAGES_ENABLED!=='true';
 const authoringOn=()=>profile()&&
  env.D6_WP3_RUNTIME_ENABLED==='true'&&
  env.D6_SESSION_ENABLED==='true';
 const writesOn=()=>authoringOn()&&
  env.D6_WP3_WRITE_ENABLED==='true'&&
  env.D6_WP3_MOUNT_ENABLED==='true'&&
  ownerApproval()===true;
 const read=createD6ProductionRuntimeBindingContract({
  env,network,cryptoApi,now,
 });
 // The real D2 checks the preexisting AUTH-P0 sessions table, the existing
 // signed CSRF cookie-bound token and SAME-ORIGIN POST intent each time.
 let session=null,writers=null;
 const getSession=()=>{
  need(writesOn(),'WRITE_DISABLED');
  if(!session)session=createD2UnifiedOwnerSession({
   AUTH_DB:env.AUTH_DB,csrfKey:env.D6_CSRF_KEY,
   ownerGitHubId:REPO.ownerGitHubId,origin:ORIGIN,now,
  });
  return session;
 };
 const readiness=createD6Wp3D1Readiness({
  DB:env.WP3_DB,enabled:writesOn,
 });
 const guardedSourceRequest=createD6Wp3CanonicalSourceTransport({
  upstream:network,enabled:writesOn,
 }).request;
 function instantiate(){
  need(writesOn(),'WRITE_DISABLED');
  if(writers)return writers;
  const DB=env.WP3_DB,actor=getSession();
  need(typeof DB?.prepare==='function'&&
   typeof env.D6_WP3_MEDIA_TICKET_SECRET==='string'&&
   new TextEncoder().encode(env.D6_WP3_MEDIA_TICKET_SECRET).length>=32,
   'HOST_DEPENDENCY_MISSING');
  const signer=createD6ProductionAppSigner({
   cryptoApi,enabled:writesOn,
  });
  // Existing GitHub App issuer validates exact installation/owner/repo,
  // requested permissions and server-only token grants independently.
  const issuerArgs={
   env,request:network,signAppJwt:signer.signAppJwt,
   enabled:writesOn,now,
  };
  const issueReadToken=createD6ProductionReadTokenIssuer(
   issuerArgs).issueReadToken;
  const issueWriteToken=createD6ProductionWriteTokenIssuer(
   issuerArgs).issueWriteToken;
  const provider=createD6ProductionPublishProviderTransport({
   upstream:network,enabled:writesOn,
  });
  const request=provider.request;
  const source=createD6CanonicalSnapshotLoader({
   request:guardedSourceRequest,issueReadToken,
   enabled:writesOn,stagingMode:false,
  });
  const intake=createD6ProductionPublishIntake({
   AUTH_DB:env.AUTH_DB,csrfKey:env.D6_CSRF_KEY,
   enabled:writesOn,now,
  });
  const review=createD6ProductionSourceReview({
   intake,loadSnapshot:source.loadSnapshot,enabled:writesOn,
  });
  const receipts=createD6ProductionOperationReceipts({
   DB,intake,review,enabled:writesOn,now,
  });
  const stored=createD6ProductionAcceptedOperationReader({
   DB,enabled:writesOn,
  }).loadAcceptedOperation;
  const canonicalMain=createD6ProductionPublishIntakeMain({
   request,issueReadToken,enabled:writesOn,
  });
  const prerequisite=createD6ProductionPublishSourcePrecondition({
   request,issueReadToken,enabled:writesOn,
  });
  async function verifyMediaSource(claim){
   // The stage/ticket metadata is independently validated by its existing
   // owner/fence/receipt contract; this callback checks pinned main/commit.
   need(claim?.repositoryId===REPO.id&&
    claim.ownerGitHubId===REPO.ownerGitHubId&&
    SHA.test(claim.sourceRevision??''),'INVALID_MEDIA_SOURCE');
   const checked=await prerequisite.verifyPrerequisite({
    operationId:claim.operationId,repositoryId:REPO.id,
    ownerGitHubId:REPO.ownerGitHubId,ref:REPO.ref,
    sourceRevision:claim.sourceRevision,
    snapshotSha256:claim.snapshotSha256,
    requestSha256:claim.requestSha256,
   });
   return Object.freeze({...claim,verified:checked.verified===true,
    ref:REPO.ref});
  }
  async function readGitBlob({
   repositoryId,repositoryFullName,blobSha,
  }={}){
   need(writesOn()&&repositoryId===REPO.id&&
    repositoryFullName===REPO.name&&SHA.test(blobSha??''),
    'GIT_BLOB_DENIED');
   const grant=await issueReadToken({
    repositoryId:REPO.id,permissions:{contents:'read'},
   });
   need(grant?.repositoryId===REPO.id&&
    grant.permissions?.contents==='read','READ_TOKEN_DENIED');
   const url=ROOT+'/git/blobs/'+blobSha;
   const response=await request(url,{
    method:'GET',redirect:'manual',cache:'no-store',
    credentials:'omit',headers:{
     Authorization:'Bearer '+grant.token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
     'User-Agent':'fishing-wp3-media-blob-verified-source',
    },
   });
   need(response instanceof Response&&response.status===200&&
    response.redirected===false&&
    (!response.url||response.url===url)&&
    /\bapplication\/(?:vnd\.github\+)?json\b/i.test(
     response.headers.get('Content-Type')??''),
    'GIT_BLOB_UNAVAILABLE');
   return readD6BoundedJson(response,15*1024*1024);
  }
  const preflight=createD6ProductionMediaUploadPreflight({
   session:actor,loadAcceptedOperation:stored,enabled:writesOn,
  });
  const stage=createD6ProductionMediaStageFence({
   DB,preflight,verifyPrerequisite:verifyMediaSource,
   issueWriteToken,request,enabled:writesOn,now,
  });
  const reconciliation=createD6ProductionMediaStageReconciliation({
   DB,session:actor,loadAcceptedOperation:stored,
   issueReadToken,request,enabled:writesOn,now,
  });
  const secret=env.D6_WP3_MEDIA_TICKET_SECRET;
  const signed=createD6ProductionVerifiedMediaTicketIssuer({
   DB,session:actor,loadAcceptedOperation:stored,
   verifyCanonicalSource:verifyMediaSource,secret,
   enabled:writesOn,now,
  });
  const verifyTicket=createD6ProductionMediaTicketVerifier({
   secret,now,origin:ORIGIN,
  }).verifyTicket;
  const mediaBinding=createD6ProductionVerifiedMediaOperationBinding({
   session:actor,loadAcceptedOperation:stored,
   issuer:signed,verifyTicket,readGitBlob,enabled:writesOn,
  });
  const atomicPlanner=createD6ProductionAtomicSourceMediaTree({
   loadSnapshot:source.loadSnapshot,readGitBlob,verifyTicket,
   enabled:writesOn,
  });
  const stepSet=createD6ProductionFiveStepWiring({
   DB,session:actor,atomicPlanner,
   issueReadToken,issueWriteToken,request,
   enabled:writesOn,writeEnabled:writesOn,now,
  });
  const publisher=createD6ProductionRequestBoundPublisher({
   DB,session:actor,verifiedMediaBinding:mediaBinding,
   createStepSet:stepSet.createStepSet,
   enabled:writesOn,writeEnabled:writesOn,
   authorizeStep,now,
  });
  const operationRoute=createD6ProductionPublishWriteRouteCandidate({
   session:actor,receipts,dispatcher:publisher,
   getTrustedCurrentMain:canonicalMain.getTrustedCurrentMain,
   enabled:writesOn,writeEnabled:writesOn,
  });
  const mediaRoute=createD6ProductionMediaWriteRouteCandidate({
   session:actor,stage,reconciliation,
   enabled:writesOn,writeEnabled:writesOn,
   stageEnabled:writesOn,reconcileEnabled:writesOn,
  });
  writers=Object.freeze({operationRoute,mediaRoute});
  return writers;
 }
 const gateway=createD6ProductionSingleGatewayCandidate({
  readGateway:read,
  operationRoute:{serve:r=>instantiate().operationRoute.serve(r)},
  mediaRoute:{serve:r=>instantiate().mediaRoute.serve(r)},
  writeMountEnabled:writesOn,writeEnabled:writesOn,
  operationEnabled:writesOn,mediaEnabled:writesOn,
 });
 async function fetchRequest(request){
  if(!(request instanceof Request))return deny(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return deny(404,'NOT_FOUND');}
  if(!isWritePath(url.pathname))return gateway.fetch(request);
  // Reuse the single-gateway exact-path denial for non-canonical methods,
  // malformed query/path and disabled/staging write configurations.
  if(!writesOn()||!allowedOrigin(request)||request.method!=='POST')
   return gateway.fetch(request);
  // Owner/CSRF before ANY WP3 D1 schema read or provider call.
  try{
   const actor=getSession();
   const auth=url.pathname==='/api/v3/media'?
    await actor.authorizeMedia(request):
    await actor.authorizeWrite(request);
   if(auth?.authorized!==true||
    auth.ownerGitHubId!==REPO.ownerGitHubId)
    return deny(403,'OWNER_DENIED');
  }catch{return deny(403,'OWNER_DENIED');}
  // Only read-only PRAGMA inspections; missing/partial D1 schema means
  // all write-family routes fail CLOSED before any token or provider call.
  try{await readiness.inspect();}
  catch{return deny(503,'TEMPORARILY_UNAVAILABLE');}
  try{return await gateway.fetch(request);}
  catch{return deny(503,'TEMPORARILY_UNAVAILABLE');}
 }
 // No public sign/token/database/migrate/deploy/merge or route mount surface.
 return Object.freeze({fetch:fetchRequest});
}
