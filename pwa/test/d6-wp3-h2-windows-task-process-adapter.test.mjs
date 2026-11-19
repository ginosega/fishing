import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createD6H2WindowsTaskProcessAdapters,verifyD6H2TaskCreationArgs,
 D6H2WindowsProcessError,
} from '../tools/d6-wp3-h2-windows-task-process-adapter.mjs';
import {
 planD6H2WindowsOffTask,createD6H2WindowsOffTaskSupervisor,
} from '../tools/d6-wp3-h2-windows-off-task.mjs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const ID='123e4567-e89b-42d3-a456-426614174000';
const NOW=2000000000;
const OFFPATH='C:\\Fishing H2\\d6-wp3-h2-deadline-off.ps1';
const QUERYPATH='C:\\Fishing H2\\d6-wp3-h2-query-off-task.ps1';
const claimKey='h2-begin:'+ID+':tree';
const params={offVersion:OFF,deadline:NOW+240,claimKey,scriptPath:OFFPATH,
 now:()=>NOW*1000};
const plan=planD6H2WindowsOffTask(params);
const error=(f,code)=>assert.throws(f,e=>
 e instanceof D6H2WindowsProcessError&&e.code===code);
const errorAsync=(f,code)=>assert.rejects(f,e=>
 e instanceof D6H2WindowsProcessError&&e.code===code);

test('WP3-H2PROC01 approved Task Scheduler argument vector pins exact OFF script/version',()=>{
 const got=verifyD6H2TaskCreationArgs([...plan.command.args],{
  offScriptPath:OFFPATH,
 });
 assert.equal(got.taskName,plan.taskName);
 assert.equal(got.offVersion,OFF);
 for(const bad of [
  [...plan.command.args,'/F'],
  ['/Run',...plan.command.args.slice(1)],
  plan.command.args.map(x=>x==='/RL'?'--':'/Create'),
  plan.command.args.map(x=>x===plan.action?
   x.replace(OFF,'11a3a0c1-1518-45d6-8541-70012b0dac4f').replace(OFFPATH,'C:\\evil.ps1'):x),
  plan.command.args.map(x=>x===plan.taskName?'other-task':x),
 ]){
  error(()=>verifyD6H2TaskCreationArgs(bad,{offScriptPath:OFFPATH}),
   'UNSAFE_TASK_COMMAND');
 }
});

test('WP3-H2PROC02 exact create and separately queried Task Scheduler yield verified task',async()=>{
 const calls=[];
 const adapters=createD6H2WindowsTaskProcessAdapters({
  offScriptPath:OFFPATH,queryScriptPath:QUERYPATH,
  run:async(exe,args,opts)=>{
   calls.push({exe,args,opts});
   assert.equal(opts.shell,false);
   assert.equal(opts.windowsHide,true);
   if(exe==='schtasks.exe')return {stdout:'SUCCESS: task created'};
   if(exe==='powershell.exe')
    return {stdout:JSON.stringify({
     taskName:plan.taskName,action:plan.action,
     deadline:plan.deadline,enabled:true,oneShot:true,
     scheduler:'windows-task-scheduler',verified:true,
    })};
   throw Error('unexpected process');
  },
 });
 const scheduler=createD6H2WindowsOffTaskSupervisor({
  scriptPath:OFFPATH,now:()=>NOW*1000,
  execute:adapters.execute,
  readRegisteredTask:adapters.readRegisteredTask,
 });
 const result=await scheduler.arm({offVersion:OFF,
  deadline:NOW+240,claimKey});
 assert.equal(result.armed,true);
 assert.equal(result.independent,true);
 assert.equal(result.offVersion,OFF);
 assert.equal(calls.length,2);
 assert.equal(calls[0].exe,'schtasks.exe');
 assert.deepEqual(calls[0].args,[...plan.command.args]);
 assert.equal(calls[1].exe,'powershell.exe');
 assert.deepEqual(calls[1].args,[
  '-NoProfile','-NonInteractive','-ExecutionPolicy',
  'Bypass','-File',QUERYPATH,'-TaskName',plan.taskName,
 ]);
 assert(!JSON.stringify(result).includes('Authorization'));
});

test('WP3-H2PROC03 forged OS output or wrong task cannot count as armed',async()=>{
 for(const bad of [
  {verified:false},{enabled:false},{oneShot:false},
  {scheduler:'other'},{taskName:'fake-task'},
  {action:'powershell.exe -File C:\\danger.ps1'},
  {deadline:NOW+99999},
 ]){
  const adapter=createD6H2WindowsTaskProcessAdapters({
   offScriptPath:OFFPATH,queryScriptPath:QUERYPATH,
   run:async()=>({stdout:JSON.stringify({
    taskName:plan.taskName,action:plan.action,
    deadline:plan.deadline,enabled:true,oneShot:true,
    scheduler:'windows-task-scheduler',verified:true,...bad,
   })}),
  });
  await assert.rejects(adapter.readRegisteredTask({
   taskName:plan.taskName,
  }),D6H2WindowsProcessError);
 }
});

test('WP3-H2PROC04 invalid shell, arbitrary task, extra flags never execute',async()=>{
 let calls=0;
 const adapter=createD6H2WindowsTaskProcessAdapters({
  offScriptPath:OFFPATH,queryScriptPath:QUERYPATH,
  run:async()=>{calls++;return {stdout:'{}'};},
 });
 await errorAsync(()=>adapter.execute({
  executable:'cmd.exe',args:[...plan.command.args],shell:false,
 }),'UNSAFE_TASK_COMMAND');
 await errorAsync(()=>adapter.execute({
  executable:'schtasks.exe',args:[...plan.command.args],shell:true,
 }),'UNSAFE_TASK_COMMAND');
 await errorAsync(()=>adapter.execute({
  executable:'schtasks.exe',args:[...plan.command.args,'/F'],
  shell:false,
 }),'UNSAFE_TASK_COMMAND');
 await errorAsync(()=>adapter.readRegisteredTask({taskName:'arbitrary'}),
  'INVALID_TASK');
 assert.equal(calls,0);
});

test('WP3-H2PROC05 process crash or unreadable task fails closed',async()=>{
 for(const failure of [
  async()=>{throw Error('process failed');},
  async()=>({stdout:'not-json'}),
  async()=>({stdout:'x'.repeat(4100)}),
 ]){
  const adapter=createD6H2WindowsTaskProcessAdapters({
   offScriptPath:OFFPATH,queryScriptPath:QUERYPATH,run:failure,
  });
  await assert.rejects(adapter.readRegisteredTask({
   taskName:plan.taskName,
  }),D6H2WindowsProcessError);
 }
 const create=createD6H2WindowsTaskProcessAdapters({
  offScriptPath:OFFPATH,queryScriptPath:QUERYPATH,
  run:async()=>{throw Error('failed');},
 });
 await errorAsync(()=>create.execute({
  executable:'schtasks.exe',args:[...plan.command.args],shell:false,
 }),'TASK_CREATE_UNCERTAIN');
});

test('WP3-H2PROC06 missing or unpinned query script denies all operations',()=>{
 for(const bad of [
  {offScriptPath:'/tmp/off.ps1',queryScriptPath:QUERYPATH},
  {offScriptPath:OFFPATH,queryScriptPath:'C:\\danger%TEMP%.ps1'},
  {offScriptPath:OFFPATH,queryScriptPath:'..\\query.ps1'},
 ]){
  error(()=>createD6H2WindowsTaskProcessAdapters(bad),
   'INVALID_CONFIG');
 }
});
