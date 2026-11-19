/**
 * FISH-TODO-118 WP3 H2 — Windows Task Scheduler OFF safety boundary.
 *
 * SOURCE ONLY. No task is scheduled merely by importing this module.
 * A separately approved operator must supply a trusted Windows schtasks
 * process adapter and an independent verified task readback. The registered
 * one-shot task runs outside the parent controller process and invokes
 * ONLY the pinned isolated H2 OFF script/version.
 *
 * Task Scheduler does not guarantee execution if Windows is asleep,
 * powered off or has lost Cloudflare access. It is NOT proof of remote OFF.
 */
import {createHash} from 'node:crypto';
import {win32} from 'node:path';

const WORKER='fishing-v3-wp3-test';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PATH=/^[A-Za-z]:\\[A-Za-z0-9 _\\.()-]+\.ps1$/;
const KEY=/^h2-(?:intake:WP3-H2-SYNTH-KB-001|begin:[0-9a-f-]+:(?:tree|branch|commit|advance|pr)|reconcile:[0-9a-f-]+:(?:tree|branch|commit|advance|pr):[A-Za-z0-9_.:-]+)$/;

export class D6H2OffScheduleError extends Error{
 constructor(code){super('H2 Windows OFF safety task unavailable');
  this.name='D6H2OffScheduleError';this.code=code;}
}
const deny=code=>{throw new D6H2OffScheduleError(code);};
const need=(x,code)=>{if(!x)deny(code);};
const pad=n=>String(n).padStart(2,'0');

export function planD6H2WindowsOffTask({
 offVersion,deadline,claimKey,scriptPath,now=Date.now,
}={}){
 need(UUID.test(offVersion??'')&&KEY.test(claimKey??'')&&
  Number.isSafeInteger(deadline)&&deadline>=1700000000&&
  typeof now==='function','INVALID_OFF_SCHEDULE');
 need(typeof scriptPath==='string'&&win32.isAbsolute(scriptPath)&&
  PATH.test(scriptPath)&&!/[\r\n"'%&|<>^!]/.test(scriptPath),
  'INVALID_SCRIPT_PATH');
 const nowSec=Math.floor(now()/1000);
 // Task Scheduler is minute-resolution. Round DOWN; never schedule after
 // the independent OFF deadline. Reject short or stale time windows.
 const minute=Math.floor(deadline/60)*60;
 need(minute>=nowSec+90&&minute<=nowSec+1800,
  'DEADLINE_OUT_OF_RANGE');
 const start=new Date(minute*1000),present=new Date(nowSec*1000);
 need(start.getTimezoneOffset()===present.getTimezoneOffset(),
  'TIMEZONE_SHIFT');
 const date=pad(start.getMonth()+1)+'/'+pad(start.getDate())+
  '/'+start.getFullYear();
 const hour=pad(start.getHours())+':'+pad(start.getMinutes());
 const taskName='Fishing-WP3-H2-OFF-'+
  createHash('sha256').update(claimKey).digest('hex').slice(0,16);
 const action='powershell.exe -NoProfile -NonInteractive '+
  '-ExecutionPolicy Bypass -File "'+scriptPath+'" '+
  '-OffVersion '+offVersion;
 return Object.freeze({
  taskName,workerName:WORKER,offVersion,
  deadline:minute,scriptPath,action,
  command:Object.freeze({
   executable:'schtasks.exe',
   args:Object.freeze(['/Create','/TN',taskName,
    '/TR',action,'/SC','ONCE','/SD',date,'/ST',hour,
    '/RL','LIMITED']),
   shell:false,
  }),
  sourceOnly:true,canPublish:false,isLive:false,
 });
}

export function createD6H2WindowsOffTaskSupervisor({
 execute,readRegisteredTask,scriptPath,now=Date.now,
}={}){
 need(typeof execute==='function'&&
  typeof readRegisteredTask==='function'&&
  typeof now==='function','INVALID_SCHEDULER');
 async function arm({offVersion,deadline,claimKey}={}){
  const plan=planD6H2WindowsOffTask({
   offVersion,deadline,claimKey,scriptPath,now,
  });
  // No automatic retry of task creation: ambiguous schtasks output is
  // read back by exact name, not replaced using /F.
  let commandResult;
  try{commandResult=await execute({
   executable:plan.command.executable,args:[...plan.command.args],
   shell:false,
  });}catch{deny('SCHEDULE_OUTCOME_UNKNOWN');}
  need(commandResult?.exitCode===0,'SCHEDULE_OUTCOME_UNKNOWN');
  let task;
  try{task=await readRegisteredTask({taskName:plan.taskName});}
  catch{deny('TASK_NOT_VERIFIED');}
  need(task?.verified===true&&
   task.scheduler==='windows-task-scheduler'&&
   task.taskName===plan.taskName&&
   task.action===plan.action&&
   task.deadline===plan.deadline&&
   task.enabled===true&&task.oneShot===true,
   'TASK_NOT_VERIFIED');
  return Object.freeze({
   armed:true,independent:true,workerName:WORKER,
   offVersion,deadline:plan.deadline,
   taskName:plan.taskName,
   sourceOnly:true,canPublish:false,isLive:false,
  });
 }
 return Object.freeze({arm});
}
