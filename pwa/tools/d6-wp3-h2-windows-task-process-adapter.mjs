/**
 * FISH-TODO-118 WP3 H2 — exact Windows Task Scheduler process adapters.
 *
 * SOURCE ONLY: importing this module does not create/query/run any OS task.
 * A separately authorized, offline-pinned controller may supply these
 * functions to #562's scheduler. Readback calls a fixed nonmutating
 * Get-ScheduledTask PowerShell file and independently checks the JSON.
 * Create calls ONLY schtasks /Create with the exact restricted one-shot
 * action; never /F, /Run, /Change, /Delete or arbitrary shell input.
 *
 * The registered task's ability to run as expected and Cloudflare OFF
 * remain distinct required proofs; do not claim remote safety from a
 * successful schtasks response.
 */
import {execFile as execFileCallback} from 'node:child_process';
import {promisify} from 'node:util';
import {win32} from 'node:path';

const execFile=promisify(execFileCallback);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TASK=/^Fishing-WP3-H2-OFF-[a-f0-9]{16}$/;
const PATH=/^[A-Za-z]:\\[A-Za-z0-9 _\\.()-]+\.ps1$/;
const COMMAND=/^powershell\.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "([A-Za-z]:\\[A-Za-z0-9 _\\.()-]+\.ps1)" -OffVersion ([0-9a-f-]+)$/;
const DATE=/^(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12][0-9]|3[01])\/[0-9]{4}$/;
const TIME=/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
const MAX=4096;

export class D6H2WindowsProcessError extends Error{
 constructor(code){super('H2 Windows safety task process not independently verified');
  this.name='D6H2WindowsProcessError';this.code=code;}
}
const deny=code=>{throw new D6H2WindowsProcessError(code);};
const need=(x,code)=>{if(!x)deny(code);};

export function verifyD6H2TaskCreationArgs(args,{offScriptPath}={}){
 need(PATH.test(offScriptPath??'')&&win32.isAbsolute(offScriptPath),
  'INVALID_OFF_SCRIPT');
 need(Array.isArray(args)&&args.length===13&&
  args[0]==='/Create'&&args[1]==='/TN'&&TASK.test(args[2]??'')&&
  args[3]==='/TR'&&typeof args[4]==='string'&&
  args[5]==='/SC'&&args[6]==='ONCE'&&
  args[7]==='/SD'&&DATE.test(args[8]??'')&&
  args[9]==='/ST'&&TIME.test(args[10]??'')&&
  args[11]==='/RL'&&args[12]==='LIMITED',
  'UNSAFE_TASK_COMMAND');
 const match=COMMAND.exec(args[4]);
 need(match&&match[1]===offScriptPath&&UUID.test(match[2]),
  'UNSAFE_TASK_COMMAND');
 return Object.freeze({taskName:args[2],offVersion:match[2]});
}

export function createD6H2WindowsTaskProcessAdapters({
 offScriptPath,queryScriptPath,run=execFile,
}={}){
 need(PATH.test(offScriptPath??'')&&win32.isAbsolute(offScriptPath)&&
  PATH.test(queryScriptPath??'')&&win32.isAbsolute(queryScriptPath)&&
  typeof run==='function','INVALID_CONFIG');
 const options={shell:false,windowsHide:true,timeout:10000,
  maxBuffer:MAX,encoding:'utf8'};
 async function execute({executable,args,shell}={}){
  need(executable==='schtasks.exe'&&shell===false,
   'UNSAFE_TASK_COMMAND');
  verifyD6H2TaskCreationArgs(args,{offScriptPath});
  try{
   await run('schtasks.exe',args,{...options});
  }catch{deny('TASK_CREATE_UNCERTAIN');}
  return Object.freeze({exitCode:0});
 }
 async function readRegisteredTask({taskName}={}){
  need(TASK.test(taskName??''),'INVALID_TASK');
  const args=['-NoProfile','-NonInteractive','-ExecutionPolicy',
   'Bypass','-File',queryScriptPath,'-TaskName',taskName];
  let stdout;
  try{
   const result=await run('powershell.exe',args,{...options});
   stdout=result?.stdout;
  }catch{deny('TASK_QUERY_UNAVAILABLE');}
  need(typeof stdout==='string'&&stdout.length>0&&
   stdout.length<=MAX,'TASK_QUERY_UNAVAILABLE');
  let record;
  try{record=JSON.parse(stdout);}catch{deny('TASK_QUERY_UNAVAILABLE');}
  need(record&&typeof record==='object'&&
   record.verified===true&&
   record.taskName===taskName&&
   record.scheduler==='windows-task-scheduler'&&
   record.enabled===true&&record.oneShot===true&&
   Number.isSafeInteger(record.deadline)&&record.deadline>1700000000&&
   typeof record.action==='string'&&COMMAND.test(record.action)&&
   COMMAND.exec(record.action)[1]===offScriptPath&&
   UUID.test(COMMAND.exec(record.action)[2]),
   'TASK_QUERY_UNVERIFIED');
  return Object.freeze({
   verified:true,taskName:record.taskName,
   scheduler:'windows-task-scheduler',
   action:record.action,deadline:record.deadline,
   enabled:true,oneShot:true,
  });
 }
 return Object.freeze({execute,readRegisteredTask});
}
