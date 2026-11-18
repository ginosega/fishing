/**
 * FISH-TODO-118 WP3 H2: durable one-shot operator audit journal, LOCAL ONLY.
 *
 * The exclusive claim is flushed BEFORE any Worker ON attempt. A crash
 * leaves the claim in place so its intake/begin request cannot be replayed
 * by this operator. It stores ONLY a restricted non-secret audit record.
 * This is NOT remote D1 proof, App authorization, or cross-device locking.
 */
import {createHash} from 'node:crypto';
import {mkdir,lstat,open} from 'node:fs/promises';
import {isAbsolute,join} from 'node:path';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{40}$/;
const REF=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const STEPS=['tree','branch','commit','advance','pr'];
const ACTIONS=['intake','step','reconcile'];
const OUTCOMES=['REQUEST_EXACT_STEP_APPROVAL',
 'RECONCILE_ONLY','VERIFY_UNMERGED_PR_READ_ONLY'];
const keysExact=(v,allowed)=>Object.keys(v).every(k=>allowed.includes(k));
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.getPrototypeOf(v)===Object.prototype;
const need=(v)=>{if(!v)throw Error('H2 operator audit journal refused input');};
const hex=s=>createHash('sha256').update(s).digest('hex');

function cleanClaim(v) {
 need(plain(v)&&keysExact(v,['mode','operationId','step',
  'sourceRevision','approvalRef'])&&
  ACTIONS.includes(v.mode)&&
  (v.operationId===null||UUID.test(v.operationId??''))&&
  (v.step===null||STEPS.includes(v.step))&&
  SHA.test(v.sourceRevision??'')&&REF.test(v.approvalRef??''));
 return Object.freeze({
  mode:v.mode,operationId:v.operationId,step:v.step,
  sourceRevision:v.sourceRevision,approvalRef:v.approvalRef,
 });
}
function cleanCheckpoint(v){
 need(plain(v)&&keysExact(v,['operationId','sourceRevision',
  'state','step','verifiedSteps'])&&
  UUID.test(v.operationId??'')&&SHA.test(v.sourceRevision??'')&&
  ['AwaitingAuthorizedWrite','ReconciliationRequired','VerifiedPr']
   .includes(v.state)&&Array.isArray(v.verifiedSteps)&&
  v.verifiedSteps.length<=5&&
  v.verifiedSteps.every((s,i)=>STEPS[i]===s)&&
  (v.state==='VerifiedPr'?
   v.step===null&&v.verifiedSteps.length===5:
   v.step===STEPS[v.verifiedSteps.length]));
 return {operationId:v.operationId,sourceRevision:v.sourceRevision,
  state:v.state,step:v.step,verifiedSteps:[...v.verifiedSteps]};
}
function cleanCompletion(v){
 need(plain(v)&&keysExact(v,['mode','operationId','step',
  'nextAction','checkpoint','prNumber','finalPrVerified'])&&
  ACTIONS.includes(v.mode)&&UUID.test(v.operationId??'')&&
  (v.step===null||STEPS.includes(v.step))&&
  OUTCOMES.includes(v.nextAction)&&
  (v.prNumber===null||Number.isSafeInteger(v.prNumber)&&v.prNumber>0)&&
  (v.finalPrVerified===undefined||v.finalPrVerified===true));
 return {mode:v.mode,operationId:v.operationId,step:v.step,
  nextAction:v.nextAction,checkpoint:cleanCheckpoint(v.checkpoint),
  prNumber:v.prNumber,
  ...(v.finalPrVerified?{finalPrVerified:true}:{})};
}

export function createD6Wp3H2AtomicJournal({directory}={}) {
 need(typeof directory==='string'&&directory.length>0&&
  isAbsolute(directory)&&!directory.includes('\0'));
 async function location(){
  await mkdir(directory,{recursive:true,mode:0o700});
  const st=await lstat(directory);
  need(st.isDirectory()&&!st.isSymbolicLink());
  return directory;
 }
 async function writeOnce(key,suffix,record) {
  need(typeof key==='string'&&key.length>=8&&key.length<=180&&
   /^[a-zA-Z0-9_:.-]+$/.test(key));
  const dir=await location(),file=join(dir,hex(key)+suffix);
  let fd;
  try{fd=await open(file,'wx',0o600);}
  catch(e){if(e?.code==='EEXIST')return false;throw e;}
  try{
   await fd.writeFile(JSON.stringify(record)+'\n','utf8');
   await fd.sync();
  }finally{await fd.close();}
  return true;
 }
 return Object.freeze({
  async claimOnce(key,details){
   return writeOnce(key,'.claim.json',cleanClaim(details));
  },
  async complete(key,details){
   const saved=await writeOnce(key,'.complete.json',
    cleanCompletion(details));
   need(saved);return true;
  },
 });
}
