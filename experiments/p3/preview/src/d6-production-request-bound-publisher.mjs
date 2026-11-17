/**
 * FISH-TODO-118 WP3 — bind the single existing publish dispatcher to one
 * owner-authenticated, original-media-verified operation per HTTP request.
 *
 * SOURCE ONLY / DEFAULT OFF / UNMOUNTED.
 * Reuses #482 verified-media binding, #477 lifecycle and #489 dispatcher.
 * No alternative publisher, browser media ticket endpoint, credential,
 * GitHub request or Worker route is introduced here.
 *
 * The trusted host must supply the five EXISTING provider coordinators and
 * independent readback reconcilers via createStepSet. The immutable D1
 * Accepted-operation loader is NOT supplied to them directly: every step
 * gets only #482's request-scoped verified original-media loader.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';
import {createD6ProductionPublishRecoveryLifecycle}
 from './d6-production-publish-recovery-lifecycle.mjs';
import {createD6ProductionPublishStepDispatcher}
 from './d6-production-publish-step-dispatcher.mjs';

const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS=new Set(['current','beginOne','reconcileOne']);
export class D6PublishRequestBindingError extends Error{
 constructor(code){
  super('WP3 request-scoped publishing dependencies unverified');
  this.name='D6PublishRequestBindingError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishRequestBindingError(code);};
const need=(x,code)=>{if(!x)deny(code);};

export function createD6ProductionRequestBoundPublisher({
 DB,session,verifiedMediaBinding,createStepSet,
 enabled=()=>false,writeEnabled=()=>false,
 authorizeStep=async()=>false,
 now=()=>Math.floor(Date.now()/1000),
}={}){
 need(DB?.prepare&&typeof session?.authorizeWrite==='function'&&
  typeof verifiedMediaBinding?.forRequest==='function'&&
  [createStepSet,enabled,writeEnabled,authorizeStep,now]
   .every(fn=>typeof fn==='function'),'INVALID_CONFIG');
 const active=()=>need(enabled()===true,'DISABLED');
 const writable=()=>need(writeEnabled()===true,'WRITE_DISABLED');

 async function dispatch(action,request,operationId){
  active();
  need(ACTIONS.has(action)&&request instanceof Request&&
   request.method==='POST'&&ID.test(operationId??''),
   'INVALID_REQUEST');
  if(action!=='current')writable();
  // Authenticate before opening even a read-only media binding or D1.
  let actor;
  try{actor=await session.authorizeWrite(request);}
  catch{deny('OWNER_DENIED');}
  need(actor?.authorized===true&&actor.ownerGitHubId===REPO.ownerGitHubId,
   'OWNER_DENIED');
  active();
  if(action!=='current')writable();

  let bound;
  try{bound=verifiedMediaBinding.forRequest(request);}
  catch{deny('ORIGINAL_BINDING_UNAVAILABLE');}
  need(typeof bound?.loadAcceptedOperation==='function',
   'ORIGINAL_BINDING_UNAVAILABLE');
  // The factory runs in trusted server code. It receives ONLY the
  // request-bound, owner-rechecked, ticket+Git-byte verified operation
  // reader. It does not see the bare D1 row or browser-submitted tickets.
  let steps;
  try{
   steps=await createStepSet(Object.freeze({
    loadAcceptedOperation:bound.loadAcceptedOperation,
    operationId,authRequest:request,
   }));
  }catch{deny('STEP_SET_UNAVAILABLE');}
  need(steps&&STEPS.every(k=>
   typeof steps.coordinators?.[k]?.attempt==='function'&&
   typeof steps.reconcilers?.[k]?.reconcile==='function'),
   'STEP_SET_UNAVAILABLE');

  active();
  if(action!=='current')writable();
  const lifecycle=createD6ProductionPublishRecoveryLifecycle({
   DB,session,loadAcceptedOperation:bound.loadAcceptedOperation,
   reconcilers:steps.reconcilers,enabled,now,
  });
  const dispatcher=createD6ProductionPublishStepDispatcher({
   session,lifecycle,coordinators:steps.coordinators,
   enabled,writeEnabled,authorizeStep,
  });
  // Exactly one action. beginOne can at most fence/attempt ONE step,
  // and reconcileOne uses only a separate independent readback path.
  return dispatcher[action](request,operationId);
 }
 return Object.freeze({
  current:(request,id)=>dispatch('current',request,id),
  beginOne:(request,id)=>dispatch('beginOne',request,id),
  reconcileOne:(request,id)=>dispatch('reconcileOne',request,id),
 });
}
