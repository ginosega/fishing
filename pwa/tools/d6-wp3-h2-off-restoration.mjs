/**
 * FISH-TODO-118 / WP3 H2 — exact isolated Worker OFF restoration adapter.
 *
 * SOURCE ONLY: never called by a deployed Worker or browser. NO default
 * credential, network client, shell, scheduler or authorization. A separate
 * operator invokes this only after exact owner-approved H2 safety OFF scope.
 * It uses Wrangler's documented "versions deploy <uuid>@100% --name" command.
 * One attempt maximum. Always independently recheck active deployment.
 *
 * The independent deadline supervisor must live outside the controller
 * process (e.g. Windows Task Scheduler); this function alone is NOT one.
 */
const WORKER='fishing-v3-wp3-test';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class D6H2OffError extends Error{
 constructor(code){
  super('H2 isolated Worker OFF restoration not independently confirmed');
  this.name='D6H2OffError';this.code=code;
 }
}
const deny=code=>{throw new D6H2OffError(code);};
const need=(v,code)=>{if(!v)deny(code);};

export function makeD6H2OffCommand({offVersion}={}){
 need(UUID.test(offVersion??''),'INVALID_OFF_VERSION');
 return Object.freeze({
  executable:'wrangler',
  args:Object.freeze([
   'versions','deploy',offVersion+'@100%',
   '--name',WORKER,'--yes',
   '--message','WP3 H2 approved safety OFF restoration',
  ]),
  workerName:WORKER,offVersion,sourceOnly:true,
  canPublish:false,isLive:false,
 });
}

export function createD6H2OffRestoration({
 readDeployment,runWrangler,authorizeOff,
}={}){
 need(typeof readDeployment==='function'&&
  typeof runWrangler==='function'&&
  typeof authorizeOff==='function','INVALID_CONFIG');
 async function restore({offVersion,reason}={}){
  need(UUID.test(offVersion??'')&&
   ['phase-complete','phase-abort','deadline'].includes(reason),
   'INVALID_OFF_TARGET');
  const approved=await authorizeOff({
   workerName:WORKER,offVersion,reason,
  });
  need(approved?.approved===true&&
   approved.workerName===WORKER&&
   approved.offVersion===offVersion&&
   approved.scope==='h2-safety-off-only',
   'OFF_NOT_AUTHORIZED');
  // OFF is the only permitted target; no generic deployment or arbitrary
  // source upload. Check actual provider state before any provider write.
  let prior;
  try{prior=await readDeployment({expectedVersion:offVersion});}
  catch(e){
   if(e?.code!=='VERSION_MISMATCH')deny('PREFLIGHT_UNAVAILABLE');
  }
  if(prior?.verified===true&&prior.version===offVersion&&
   prior.traffic===100&&prior.workerName===WORKER)
   return Object.freeze({...prior,restorationExecuted:false});
  // A wrong active version is expected during the authorized H2 ON
  // interval. But provider readback must be trustworthy, not HTTP failure.
  // The adapter's readDeployment must reject any split/unknown traffic.
  need(prior===undefined,'UNVERIFIED_PREVIOUS_TRAFFIC');
  const command=makeD6H2OffCommand({offVersion});
  let output;
  try{
   output=await runWrangler({
    executable:command.executable,args:[...command.args],
    shell:false,expectedWorker:WORKER,
   });
  }catch{deny('OFF_COMMAND_UNCERTAIN');}
  need(output?.exitCode===0,'OFF_COMMAND_UNCERTAIN');
  // A successful Wrangler exit code is NOT OFF evidence.
  let actual;
  try{actual=await readDeployment({expectedVersion:offVersion});}
  catch{deny('OFF_READBACK_UNVERIFIED');}
  need(actual?.verified===true&&actual.workerName===WORKER&&
   actual.version===offVersion&&actual.traffic===100,
   'OFF_READBACK_UNVERIFIED');
  return Object.freeze({...actual,restorationExecuted:true});
 }
 return Object.freeze({restore});
}
