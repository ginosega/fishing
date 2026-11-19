import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6H2WindowsTaskProcessAdapters,D6H2WindowsProcessError}
 from '../tools/d6-wp3-h2-windows-task-process-adapters.mjs';
import {planD6H2WindowsOffTask,createD6H2WindowsOffTaskSupervisor}
 from '../tools/d6-wp3-h2-windows-off-task.mjs';

const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const ID='123e4567-e89b-42d3-a456-426614174000';
const SCRIPT='C:\\Users\\Owner\\Fishing H2\\d6-wp3-h2-deadline-off.ps1';
const TIME=2000000000;
const CLAIM='h2-begin:'+ID+':tree';
const p=()=>planD6H2WindowsOffTask({
 offVersion:OFF,claimKey:CLAIM,scriptPath:SCRIPT,
 deadline:TIME+240,now:()=>TIME*1000,
});
function fixture({override={},failCreate=false,failRead=false}={}){
 const expected=p(),calls=[];
 const os=createD6H2WindowsTaskProcessAdapters({
  platform:'win32',scriptPath:SCRIPT,offVersion:OFF,
  async execFile(exe,args,opts){
   calls.push({exe,args,opts});
   assert.equal(opts.shell,false);
   assert.equal(opts.windowsHide,true);
   assert.equal(opts.maxBuffer,32768);
   if(exe==='schtasks.exe'){
    if(failCreate)throw Error('schtasks unavailable');
    return {stdout:'SUCCESS: one task created.'};
   }
   if(exe==='powershell.exe'){
    if(failRead)throw Error('Get-ScheduledTask failed');
    return {stdout:JSON.stringify({
     taskName:expected.taskName,taskPath:'\\',
     action:expected.action,deadline:expected.deadline,
     enabled:true,oneShot:true,runLevel:'Limited',
     ...override,
    })};
   }
   throw Error('unexpected OS process');
  },
 });
 return {os,calls,expected};
}
const denied=(code,fn)=>assert.rejects(fn,e=>
 e instanceof D6H2WindowsProcessError&&e.code===code);
test('WP3-H2OS01 only exact schtasks ONCE LIMITED command, no shell or /F',async()=>{
 const f=fixture(),cmd=f.expected.command;
 const out=await f.os.execute({
  executable:cmd.executable,args:[...cmd.args],shell:false,
 });
 assert.deepEqual(out,{exitCode:0});
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].exe,'schtasks.exe');
 assert.equal(f.calls[0].args.includes('/F'),false);
 assert.equal(f.calls[0].args.at(-1),'LIMITED');
});
test('WP3-H2OS02 OS readback matches exact action, one shot, root and deadline',async()=>{
 const f=fixture(),out=await f.os.readRegisteredTask({
  taskName:f.expected.taskName,
 });
 assert.equal(out.verified,true);
 assert.equal(out.deadline,f.expected.deadline);
 assert.equal(out.action,f.expected.action);
 assert.equal(out.limitedPrivilege,true);
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].exe,'powershell.exe');
 assert.deepEqual(f.calls[0].args.slice(0,2),
  ['-NoProfile','-NonInteractive']);
 const query=f.calls[0].args.at(-1);
 assert(query.includes('Get-ScheduledTask'));
 assert(query.includes(f.expected.taskName));
 assert(!query.includes('Register-ScheduledTask'));
 assert(!query.includes('Start-ScheduledTask'));
 assert(!query.includes('Set-ScheduledTask'));
 assert(!JSON.stringify(out).includes('Authorization'));
});
test('WP3-H2OS03 integration: existing supervisor trusts independently read OS only',async()=>{
 const f=fixture(),sup=createD6H2WindowsOffTaskSupervisor({
  execute:f.os.execute,readRegisteredTask:f.os.readRegisteredTask,
  scriptPath:SCRIPT,now:()=>TIME*1000,
 });
 const proof=await sup.arm({
  offVersion:OFF,claimKey:CLAIM,deadline:TIME+240,
 });
 assert.equal(proof.armed,true);
 assert.equal(proof.independent,true);
 assert.equal(proof.deadline,f.expected.deadline);
 assert.deepEqual(f.calls.map(x=>x.exe),['schtasks.exe','powershell.exe']);
});
test('WP3-H2OS04 wrong or altered task cannot serve as watchdog',async()=>{
 for(const override of [
  {taskName:'Other-Task'}, {taskPath:'\\Microsoft\\Windows\\'},
  {action:'powershell.exe -File C:\\evil.ps1'},
  {deadline:p().deadline+60},{enabled:false},{oneShot:false},
  {runLevel:'Highest'},{runLevel:'not-verified'},
 ]){
  const f=fixture({override});
  await denied('TASK_OUTPUT_UNVERIFIED',()=>
   f.os.readRegisteredTask({taskName:f.expected.taskName}));
 }
});
test('WP3-H2OS05 malformed JSON, missing fields and non-finite deadlines deny',async()=>{
 for(const override of [
  {deadline:'2000000240'},{deadline:null},
  {action:null},{oneShot:1},{enabled:1},{runLevel:null},
 ]){
  const f=fixture({override});
  await denied('TASK_OUTPUT_UNVERIFIED',()=>
   f.os.readRegisteredTask({taskName:f.expected.taskName}));
 }
});
test('WP3-H2OS06 invalid create command cannot run any subprocess',async()=>{
 const f=fixture();
 for(const attempt of [
  {executable:'cmd.exe',args:[...f.expected.command.args],shell:false},
  {executable:'schtasks.exe',args:[...f.expected.command.args,'/F'],shell:false},
  {executable:'schtasks.exe',args:[...f.expected.command.args],shell:true},
  {executable:'schtasks.exe',args:[...f.expected.command.args.slice(0,12),'HIGHEST'],shell:false},
  {executable:'schtasks.exe',args:[...f.expected.command.args.slice(0,4),
   'powershell.exe -File C:\\evil.ps1',...f.expected.command.args.slice(5)],shell:false},
 ]){
  await denied('INVALID_TASK_CREATE',()=>f.os.execute(attempt));
 }
 assert.equal(f.calls.length,0);
});
test('WP3-H2OS07 wrong platform/script/version are rejected at construction',()=>{
 for(const change of [
  {platform:'linux'},{scriptPath:'../bad.ps1'},
  {offVersion:'not-a-uuid'},
 ]){
  assert.throws(()=>createD6H2WindowsTaskProcessAdapters({
   platform:'win32',offVersion:OFF,scriptPath:SCRIPT,
   execFile:async()=>({stdout:''}),...change,
  }),D6H2WindowsProcessError);
 }
});
test('WP3-H2OS08 OS process errors cannot be mistaken for proof',async()=>{
 const create=fixture({failCreate:true}),read=fixture({failRead:true});
 await denied('PROCESS_EXECUTION_FAILED',()=>create.os.execute({
  executable:create.expected.command.executable,
  args:[...create.expected.command.args],shell:false,
 }));
 await denied('PROCESS_EXECUTION_FAILED',()=>read.os.readRegisteredTask({
  taskName:read.expected.taskName,
 }));
});
