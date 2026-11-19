/**
 * FISH-TODO-118 / WP3 H2 — Windows Task Scheduler process adapters.
 *
 * SOURCE ONLY, never invoked by module import. The only permitted mutation
 * is creation of ONE exact, limited-privilege, single-run isolated H2 OFF task
 * assembled by d6-wp3-h2-windows-off-task.mjs. No /F or task replacement.
 * Readback obtains the task definition from the Windows OS independently,
 * not from schtasks' exit code or the plan object.
 *
 * A successfully registered task CANNOT prove that a sleeping/offline PC
 * will execute it or that Cloudflare actually returned to OFF. Remote
 * deployment/version readback and denied write-route checks are separate.
 */
import {execFile as nativeExecFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile as nativeReadFile,lstat as nativeLstat} from 'node:fs/promises';
import {promisify} from 'node:util';
import {win32} from 'node:path';

const runNative=promisify(nativeExecFile);
const WORKER='fishing-v3-wp3-test';
const TASK=/^Fishing-WP3-H2-OFF-[a-f0-9]{16}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256=/^[a-f0-9]{64}$/;
const SCRIPT=/^[A-Za-z]:\\[A-Za-z0-9 _\\.()-]+\.ps1$/;
const DAY=/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/20[0-9]{2}$/;
const CLOCK=/^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export class D6H2WindowsProcessError extends Error{
 constructor(code){
  super('H2 Windows OFF task process/readback unavailable');
  this.name='D6H2WindowsProcessError';this.code=code;
 }
}
const deny=code=>{throw new D6H2WindowsProcessError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const own=Object.hasOwn;

export function createD6H2WindowsTaskProcessAdapters({
 scriptPath,offVersion,expectedScriptSha256,
 execFile=runNative,readFile=nativeReadFile,lstat=nativeLstat,
 platform=process.platform,
}={}){
 need(platform==='win32'&&
  typeof scriptPath==='string'&&win32.isAbsolute(scriptPath)&&
  SCRIPT.test(scriptPath)&&
  !/[\r\n"'%&|<>^!]/.test(scriptPath)&&
  UUID.test(offVersion??'')&&SHA256.test(expectedScriptSha256??'')&&
  typeof execFile==='function'&&typeof readFile==='function'&&
  typeof lstat==='function',
  'INVALID_PROCESS_SCOPE');
 const expectedAction='powershell.exe -NoProfile -NonInteractive '+
  '-ExecutionPolicy Bypass -File "'+scriptPath+'" -OffVersion '+offVersion;

 async function verifyScript(){
  try{
   const stats=await lstat(scriptPath);
   need(stats?.isFile?.()===true&&
    stats?.isSymbolicLink?.()===false,'SCRIPT_UNTRUSTED');
   const bytes=await readFile(scriptPath);
   need(bytes instanceof Uint8Array&&bytes.length>0&&
    bytes.length<=32768&&
    createHash('sha256').update(bytes).digest('hex')===
     expectedScriptSha256,'SCRIPT_UNTRUSTED');
  }catch{deny('SCRIPT_UNTRUSTED');}
 }

 async function invoke(command,args) {
  need(typeof command==='string'&&Array.isArray(args)&&
   args.every(x=>typeof x==='string'&&x.length<2048),
   'INVALID_PROCESS_ARGUMENTS');
  try{
   // Native execFile does not use cmd.exe/shell substitution. The caller's
   // interpreter is strictly fixed and arguments have been allowlisted.
   const result=await execFile(command,args,{
    shell:false,windowsHide:true,timeout:15000,
    maxBuffer:32768,encoding:'utf8',
   });
   need(typeof result?.stdout==='string'&&
    result.stdout.length<=32768,
    'PROCESS_OUTPUT_UNVERIFIED');
   return result.stdout;
  }catch(e){
   if(e instanceof D6H2WindowsProcessError)throw e;
   deny('PROCESS_EXECUTION_FAILED');
  }
 }

 async function execute({executable,args,shell}={}){
  need(executable==='schtasks.exe'&&shell===false&&
   Array.isArray(args)&&args.length===13&&
   args[0]==='/Create'&&args[1]==='/TN'&&
   TASK.test(args[2])&&args[3]==='/TR'&&
   args[4]===expectedAction&&
   args[5]==='/SC'&&args[6]==='ONCE'&&
   args[7]==='/SD'&&DAY.test(args[8])&&
   args[9]==='/ST'&&CLOCK.test(args[10])&&
   args[11]==='/RL'&&args[12]==='LIMITED',
   'INVALID_TASK_CREATE');
  await verifyScript();
  await invoke('schtasks.exe',args);
  // Only claim the CLI process exited cleanly. The source supervisor MUST
  // independently call readRegisteredTask for actual task definition proof.
  return Object.freeze({exitCode:0});
 }

 async function readRegisteredTask({taskName}={}){
  need(TASK.test(taskName??''),'INVALID_TASK_NAME');
  // No user input except the digest-derived, strictly regex-checked name.
  // PowerShell reads only; it does not register, start or change tasks.
  const script=[
   "$ErrorActionPreference='Stop'",
   "$t=Get-ScheduledTask -TaskName '"+taskName+
    "' -TaskPath '\\' -ErrorAction Stop",
   "if(@($t).Count -ne 1){throw 'invalid task count'}",
   "$a=@($t.Actions);$g=@($t.Triggers)",
   "if($a.Count -ne 1 -or $g.Count -ne 1){throw 'invalid task shape'}",
   "$time=[datetime]::SpecifyKind([datetime]$g[0].StartBoundary,[System.DateTimeKind]::Local)",
   "$stamp=([DateTimeOffset]::new($time)).ToUnixTimeSeconds()",
   "$exe=Split-Path -Leaf $a[0].Execute",
   "$kind=[string]$g[0].CimClass.CimClassName",
   "$level=[string]$t.Principal.RunLevel",
   "$out=[ordered]@{taskName=[string]$t.TaskName;taskPath=[string]$t.TaskPath;"+
    "action=($exe+' '+$a[0].Arguments);deadline=$stamp;"+
    "enabled=([bool]$t.Settings.Enabled);"+
    "oneShot=($kind -eq 'MSFT_TaskTimeTrigger' -and [bool]$g[0].Enabled -and "+
    "[string]::IsNullOrEmpty([string]$g[0].Repetition.Interval));"+
    "runLevel=$level}",
   "$out | ConvertTo-Json -Compress -Depth 3",
  ].join(';');
  await verifyScript();
  const stdout=await invoke('powershell.exe',[
   '-NoProfile','-NonInteractive','-Command',script,
  ]);
  let data;
  try{data=JSON.parse(stdout);}catch{deny('TASK_OUTPUT_UNVERIFIED');}
  need(data&&typeof data==='object'&&!Array.isArray(data)&&
   Object.keys(data).length===7&&
   ['taskName','taskPath','action','deadline','enabled','oneShot',
    'runLevel'].every(k=>own(data,k))&&
   data.taskName===taskName&&data.taskPath==='\\'&&
   data.action===expectedAction&&
   Number.isSafeInteger(data.deadline)&&data.deadline>0&&
   data.enabled===true&&data.oneShot===true&&
   ['Limited','LeastPrivilege'].includes(data.runLevel),
   'TASK_OUTPUT_UNVERIFIED');
  return Object.freeze({
   verified:true,scheduler:'windows-task-scheduler',
   taskName:data.taskName,action:data.action,deadline:data.deadline,
   enabled:true,oneShot:true,limitedPrivilege:true,
  });
 }
 return Object.freeze({execute,readRegisteredTask});
}
