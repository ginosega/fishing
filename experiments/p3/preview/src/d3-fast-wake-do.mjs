/**
 * FISH118 P1 — real Cloudflare Durable Object alarm boundary, SOURCE ONLY.
 * Not bound, migrated, routed, or enabled in any deployed Worker.
 * The named DO always corresponds to one exact existing sandbox D1 operation.
 * Alarms are wake-ups; all canonical state and merge evidence remains in D1.
 */
import {createD3FastWatchdog} from './d3-fast-watchdog.mjs';
import {createD3PublishingSpanRecorder} from './d3-publishing-span-recorder.mjs';
import {createD1OperationStore} from './d1-operation-store.mjs';
import {createD3SandboxTokenIssuers} from './d3-sandbox-token-issuers.mjs';
import {createD3SandboxScheduledCoordinator} from './d3-sandbox-scheduled-coordinator.mjs';
import {createD3PrivateHostProof} from './d3-private-host-proof.mjs';
import {d3PublishingReady} from './d3-publishing-readiness.mjs';
const OWNER=265665562,ID=1430581407,OP=/^p3_[0-9a-f-]{36}$/;
export class D3FastWakeAlarm {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async fetch(request){
  if(!(request instanceof Request)||request.method!=='POST'||
    new URL(request.url).pathname!=='/arm'||
    request.headers.get('Content-Type')!=='application/json')
   return new Response(null,{status:404});
  const body=await request.text();
  if(new TextEncoder().encode(body).length>256)return new Response(null,{status:413});
  let data;try{data=JSON.parse(body);}catch{return new Response(null,{status:400});}
  try{
   const result=await this.arm(data);
   return new Response(JSON.stringify(result),{status:200,
    headers:{'Cache-Control':'no-store','Content-Type':'application/json'}});
  }catch{return new Response(null,{status:503});}
 }
 _enabled(){
  return this.env.D3_FAST_WATCHDOG_ENABLED==='true'&&
   d3PublishingReady(this.env)&&
   this.ctx.id.name&&OP.test(this.ctx.id.name);
 }
 async _schedule(operationId,deadlineMs,insideAlarm=false){
  if(!this._enabled()||operationId!==this.ctx.id.name||
    !Number.isSafeInteger(deadlineMs)||deadlineMs<0||
    deadlineMs>Date.now()+300000)throw Error('D3_FAST_WAKE_DENIED');
  // External duplicate notifications never postpone an earlier alarm.
  // Inside an alarm handler we ALWAYS set the NEXT alarm, even if
  // getAlarm() still reports the currently firing alarm. Otherwise the
  // newly requested wake could be lost when the current alarm completes.
  const existing=insideAlarm?null:await this.ctx.storage.getAlarm();
  if(insideAlarm||existing===null||existing>deadlineMs)
   await this.ctx.storage.setAlarm(Math.max(Date.now(),deadlineMs));
  return {armed:true,testOnly:true};
 }
 async arm({operationId,deadlineMs}={}){
  return this._schedule(operationId,deadlineMs,false);
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
  const trace=createD3PublishingSpanRecorder({
   operationId,enabled:env.D3_FAST_TRACE_ENABLED==='true',
   sink:async entry=>console.info('FISH118_D3_FAST_SPAN',JSON.stringify(entry)),
  });
  const coordinator=createD3SandboxScheduledCoordinator({
   env,store,requestGitHub,issueReadToken,issueWriteToken,
   verifyHosted:info=>hosted.verifyHosted(info),measure:trace.measure});
  const watch=createD3FastWatchdog({
   enabled:()=>this._enabled(),
   getOperation:id=>store.get(id),
   runOneStep:({operationId:id})=>coordinator.tick({targetOperationId:id}),
   readOnlyRecoverMerge:({operationId:id})=>coordinator.tick({targetOperationId:id}),
   // The next alarm belongs to this EXACT named operation.
   arm:args=>this._schedule(args.operationId,args.deadlineMs,true),
  });
  // At least once, never blindly retry a marked merge. The existing
  // D1 coordinator reconciles ambiguous merge outcomes read-only.
  const stalled=await this.ctx.storage.get('stallCount');
  const count=Number.isSafeInteger(stalled)&&stalled>=0?stalled:0;
  const result=await watch.onAlarm(operationId,{stallCount:count});
  // Re-arm happens before recording this optional backoff counter.
  if(result.terminal)await this.ctx.storage.delete('stallCount');
  else await this.ctx.storage.put('stallCount',result.progressed?0:Math.min(1000,count+1));
 }
}
