import test from 'node:test';
import assert from 'node:assert/strict';
import {planD6H2WindowsOffTask,
 createD6H2WindowsOffTaskSupervisor,D6H2OffScheduleError}
 from '../tools/d6-wp3-h2-windows-off-task.mjs';
import {readFileSync} from 'node:fs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const OWNER='TESTPC\\Owner';
const ID='123e4567-e89b-42d3-a456-426614174000';
const NOW=2000000000,DEADLINE=NOW+240;
const CLAIM='h2-begin:'+ID+':tree';
const SCRIPT='C:\\Users\\Owner\\Fishing H2\\d6-wp3-h2-deadline-off.ps1';
const params=()=>({
 offVersion:OFF,deadline:DEADLINE,claimKey:CLAIM,
 scriptPath:SCRIPT,now:()=>NOW*1000,
});
const denied=(f,code)=>assert.throws(f,e=>
 e instanceof D6H2OffScheduleError&&e.code===code);
const deniedAsync=(f,code)=>assert.rejects(f,e=>
 e instanceof D6H2OffScheduleError&&e.code===code);

test('WP3-H2TASK01 Task Scheduler command pins OFF worker, script and deadline',()=>{
 const p=planD6H2WindowsOffTask(params());
 assert.match(p.taskName,/^Fishing-WP3-H2-OFF-[a-f0-9]{16}$/);
 assert.equal(p.workerName,'fishing-v3-wp3-test');
 assert.equal(p.offVersion,OFF);
 assert(p.deadline<=DEADLINE);
 assert(p.deadline>NOW+90);
 assert.equal(p.command.executable,'schtasks.exe');
 assert.equal(p.command.shell,false);
 assert.deepEqual(p.command.args.slice(0,4),
  ['/Create','/TN',p.taskName,'/TR']);
 assert(p.command.args[4].includes('powershell.exe -NoProfile'));
 assert(p.command.args[4].includes('-File "'+SCRIPT+'"'));
 assert(p.command.args[4].endsWith('-OffVersion '+OFF));
 assert(!p.command.args.includes('/F'),
  'never replace existing one-shot safety task');
 assert.equal(p.canPublish,false);assert.equal(p.isLive,false);
});

test('WP3-H2TASK02 only independent registered task evidence yields armed true',async()=>{
 const calls=[];
 const p=planD6H2WindowsOffTask(params());
 const s=createD6H2WindowsOffTaskSupervisor({
  scriptPath:SCRIPT,expectedRunAsUser:OWNER,now:()=>NOW*1000,
  async execute(c){calls.push('create');assert.deepEqual(c.args,[...p.command.args]);
   return {exitCode:0};},
  async readRegisteredTask({taskName}){
   calls.push('query');assert.equal(taskName,p.taskName);
   return {verified:true,scheduler:'windows-task-scheduler',
    taskName:p.taskName,action:p.action,deadline:p.deadline,
    enabled:true,oneShot:true,
    principalVerified:true,principalUser:OWNER,
    logonType:'Interactive',runLevel:'Limited'};
  },
 });
 const r=await s.arm({offVersion:OFF,deadline:DEADLINE,claimKey:CLAIM});
 assert.deepEqual(calls,['create','query']);
 assert.equal(r.armed,true);assert.equal(r.independent,true);
 assert.equal(r.workerName,'fishing-v3-wp3-test');
 assert.equal(r.offVersion,OFF);
 assert.equal(r.deadline,p.deadline);
});

test('WP3-H2TASK03 wrong registered action/deadline/disabled schedule refuses ON',async()=>{
 for(const bad of [
  {verified:false},{scheduler:'process-timer'},
  {action:'cmd.exe /C echo off'}, {deadline:DEADLINE+600},
  {taskName:'arbitrary'}, {enabled:false},{oneShot:false},
  {principalVerified:false},{principalUser:'OTHERPC\\Other'},
  {logonType:'S4U'},{runLevel:'Highest'},
 ]){
  const p=planD6H2WindowsOffTask(params());
  const s=createD6H2WindowsOffTaskSupervisor({
   scriptPath:SCRIPT,expectedRunAsUser:OWNER,now:()=>NOW*1000,
   execute:async()=>({exitCode:0}),
   readRegisteredTask:async()=>({
    verified:true,scheduler:'windows-task-scheduler',
    taskName:p.taskName,action:p.action,deadline:p.deadline,
    enabled:true,oneShot:true,
    principalVerified:true,principalUser:OWNER,
    logonType:'Interactive',runLevel:'Limited',...bad,
   }),
  });
  await deniedAsync(()=>s.arm({
   offVersion:OFF,deadline:DEADLINE,claimKey:CLAIM,
  }),'TASK_NOT_VERIFIED');
 }
});

test('WP3-H2TASK04 error/ambiguous scheduler creation does not claim independent OFF',async()=>{
 for(const execute of [
  async()=>({exitCode:1}),
  async()=>{throw Error('schtasks unavailable');},
 ]){
  const s=createD6H2WindowsOffTaskSupervisor({
   scriptPath:SCRIPT,expectedRunAsUser:OWNER,now:()=>NOW*1000,execute,
   readRegisteredTask:async()=>{throw Error('must not query');},
  });
  await deniedAsync(()=>s.arm({
   offVersion:OFF,deadline:DEADLINE,claimKey:CLAIM,
  }),'SCHEDULE_OUTCOME_UNKNOWN');
 }
});

test('WP3-H2TASK05 hostile paths, wrong version and invalid deadline cannot schedule',()=>{
 for(const bad of [
  {scriptPath:'C:\\temp\\evil.ps1 & whoami'},
  {scriptPath:'..\\off.ps1'},
  {scriptPath:'C:\\some"quoted.ps1'},
  {scriptPath:'C:\\some%PATH%.ps1'},
  {offVersion:'garbage'},
  {offVersion:OFF+' --name public-worker'},
  {claimKey:'dangerous-operation'},
  {deadline:NOW+30},
  {deadline:NOW+4000},
 ]){
  assert.throws(()=>planD6H2WindowsOffTask({
   ...params(),...bad,
  }),D6H2OffScheduleError);
 }
});

test('WP3-H2TASK06 script only restores pinned Worker; never grants writer',()=>{
 const script=readFileSync(new URL(
  '../tools/d6-wp3-h2-deadline-off.ps1',import.meta.url),'utf8');
 assert(script.includes("fishing-v3-wp3-test"));
 assert(script.includes('versions deploy'));
 assert(script.includes('@100%'));
 assert(script.includes(["C:","Program Files","nodejs","npx.cmd"].join(String.fromCharCode(92))));
 assert(script.includes("--offline --yes 'wrangler@4.163.0'"));
 assert(!script.includes("Get-Command -Name 'wrangler'"));
 assert(!script.includes("wrangler@latest"));
 assert(!script.includes('wrangler deploy '));
 assert(!/D6_WP3_(WRITE|MOUNT)_ENABLED.*true/.test(script));
 assert(!/Bearer|PRIVATE KEY|BEGIN RSA|login\.json/i.test(script));
});

test('WP3-H2TASK07 no scheduler adapter configuration is default permissive',()=>{
 denied(()=>createD6H2WindowsOffTaskSupervisor({
  scriptPath:SCRIPT,
 }), 'INVALID_SCHEDULER');
});
