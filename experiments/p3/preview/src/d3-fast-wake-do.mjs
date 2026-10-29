/**
 * FISH118 P1 — real Cloudflare Durable Object alarm boundary, SOURCE ONLY.
 * Not bound, migrated, routed, or enabled in any deployed Worker.
 * The named DO always corresponds to one exact existing sandbox D1 operation.
 * Alarms are wake-ups; all canonical state and merge evidence remains in D1.
 */
import {DurableObject} from 'cloudflare:workers';
import {createD3FastWatchdog} from './d3-fast-watchdog.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD3SandboxTokenIssuers} from './d3-sandbox-token-issuers.mjs';
import {createD3SandboxScheduledCoordinator} from './d3-sandbox-scheduled-coordinator.mjs';
import {createD3PrivateHostProof} from './d3-private-host-proof.mjs';
import {d3PublishingReady} from './d3-publishing-readiness.mjs';
const OWNER=265665562,ID=1430581407,OP=/^p3_[0-9a-f-]{36}$/;
export class D3FastWakeAlarm extends DurableObject {
 _enabled(){
  return this.env.D3_FAST_WATCHDOG_ENABLED==='true'&&
   d3PublishingReady(this.env)&&
   this.ctx.id.name&&OP.test(this.ctx.id.name);
 }
 async arm({operationId,deadlineMs}={}){
  if(!this._enabled()||operationId!==this.ctx.id.name||
    !Number.isSafeInteger(deadlineMs)||deadlineMs<0||
    deadlineMs>Date.now()+300000)throw Error('D3_FAST_WAKE_DENIED');
  // DO IDs are named by op, not user-controlled arbitrary alarm keys.
  // Keep the EARLIEST wake if duplicate signed webhooks race. A prior
  // alarm at/before now will fire rather than being postponed.
  const existing=await this.ctx.storage.getAlarm();
  if(existing===null||existing>deadlineMs)
   await this.ctx.storage.setAlarm(Math.max(Date.now(),deadlineMs));
  return {armed:true,testOnly:true};
 }
 async alarm(){
  if(!this._enabled())return;
  const operationId=this.ctx.id.name;
  const store=createD1OperationStore({
   DB:this.env.OPERATIONS_DB,ownerGitHubId:OWNER,repositoryId:ID});
  const requestGitHub=fetch,requestHosted=fetch,env=this.env;
  const {issueReadToken,issueWriteToken}=createD3SandboxTokenIssuers({
   env,request:requestGitHub,enabled:()=>d3PublishingReady(env)});
  const hosted=createD3PrivateHostProof({
   origin:env.APP_ORIGIN,key:env.D2_HOST_PROBE_KEY,
   store,issueReadToken,requestGitHub,requestHosted});
  const coordinator=createD3SandboxScheduledCoordinator({
   env,store,requestGitHub,issueReadToken,issueWriteToken,
   verifyHosted:info=>hosted.verifyHosted(info)});
  const watch=createD3FastWatchdog({
   enabled:()=>this._enabled(),
   getOperation:id=>store.get(id),
   runOneStep:()=>coordinator.tick(),
   readOnlyRecoverMerge:()=>coordinator.tick(),
   // The next alarm belongs to this EXACT named operation.
   arm:args=>this.arm(args),
  });
  // At least once, never blindly retry a marked merge. The existing
  // D1 coordinator reconciles ambiguous merge outcomes read-only.
  await watch.onAlarm(operationId);
 }
}
