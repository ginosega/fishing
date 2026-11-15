/**
 * FISH-TODO-118 WP3 H2 — server-only, two-phase, single-operation approval.
 *
 * SOURCE ONLY / DEFAULT DENY. This is not a credential, a D1 approval record,
 * an installed Worker or owner consent. An operator must pin an exact reviewed
 * synthetic envelope before any intake, and later pin the returned immutable
 * operation ID plus ONE next provider step. No approval from an HTTP value.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/;
const SHA40=/^[a-f0-9]{40}$/,SHA64=/^[a-f0-9]{64}$/;
const RECORD=/^h2-synthetic-[a-z0-9-]{1,48}$/;
const STEPS=Object.freeze(['tree','branch','commit','advance','pr']);
const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const NAME='WP3-H2-SYNTH-KB-001';
const MIME=/^application\/json(?:;\s*charset=utf-8)?$/i;
const enc=new TextEncoder();

export function createD6Wp3H2OperatorApproval({
 env={},now=()=>Math.floor(Date.now()/1000),
 cryptoApi=globalThis.crypto,
}={}){
 if(!env||typeof env!=='object'||typeof now!=='function'||
  typeof cryptoApi?.subtle?.digest!=='function')
  throw Error('Invalid H2 operator approval dependencies');
 const phase=()=>env.D6_WP3_H2_APPROVED_PHASE;
 const active=()=>{
  const start=Number(env.D6_WP3_H2_APPROVED_START),
   end=Number(env.D6_WP3_H2_APPROVED_END),time=now();
  return env.D6_WP3_H2_OPERATOR_APPROVED==='true'&&
   env.D6_WP3_H2_TEST_NAME===NAME&&
   (phase()==='intake'||phase()==='steps')&&
   Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&
   Number.isSafeInteger(time)&&start>=1700000000&&
   end>start&&end-start<=1800&&time>=start&&time<=end&&
   SHA40.test(env.D6_WP3_H2_APPROVED_SOURCE_REVISION??'')&&
   SHA64.test(env.D6_WP3_H2_APPROVED_ENVELOPE_SHA256??'')&&
   RECORD.test(env.D6_WP3_H2_APPROVED_RECORD_ID??'')&&
   env.D6_WP3_H2_APPROVED_NOTES_PATH===
    'KB/Techniques/content/'+env.D6_WP3_H2_APPROVED_RECORD_ID+'.md'&&
   (phase()==='intake'?
    !env.D6_WP3_H2_APPROVED_OPERATION_ID&&
     !env.D6_WP3_H2_APPROVED_STEP:
    UUID.test(env.D6_WP3_H2_APPROVED_OPERATION_ID??'')&&
     STEPS.includes(env.D6_WP3_H2_APPROVED_STEP));
 };
 const approved=()=>active();
 async function permit(request){
  if(!active()||!(request instanceof Request)||request.method!=='POST'||
   request.headers.has('Authorization'))return false;
  let url;
  try{url=new URL(request.url);}catch{return false;}
  if(url.origin!==ORIGIN||url.search||url.hash||url.username||
   url.password)return false;
  if(phase()==='steps'){
   const expected='/api/v3/operations/'+
    env.D6_WP3_H2_APPROVED_OPERATION_ID+'/';
   return ['status','begin','reconcile'].some(s=>
    url.pathname===expected+s);
  }
  if(url.pathname!=='/api/v3/operations'||!MIME.test(
   request.headers.get('Content-Type')??''))return false;
  const length=request.headers.get('Content-Length');
  if(length!==null&&(!/^\d+$/.test(length)||Number(length)>128*1024))
   return false;
  let bytes;
  try{bytes=new Uint8Array(await request.clone().arrayBuffer());}
  catch{return false;}
  if(!bytes.length||bytes.length>128*1024||!active())return false;
  let digest;
  try{digest=Array.from(new Uint8Array(await cryptoApi.subtle.digest(
   'SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');}
  catch{return false;}
  if(digest!==env.D6_WP3_H2_APPROVED_ENVELOPE_SHA256)return false;
  let body;
  try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{return false;}
  const p=body?.snapshot?.package;
  return active()&&JSON.stringify(body)===
   new TextDecoder().decode(bytes)&&
   p?.format==='fishing-companion-change-v2'&&
   p.domain==='kb'&&p.operation==='add'&&
   p.id===env.D6_WP3_H2_APPROVED_RECORD_ID&&
   p.record?.id===p.id&&
   p.record?.type==='technique'&&
   p.base?.schemaVersion===2&&
   p.base?.sourceRevision===env.D6_WP3_H2_APPROVED_SOURCE_REVISION&&
   p.base?.recordHash===null&&
   p.notes?.action==='create'&&
   p.notes.path===env.D6_WP3_H2_APPROVED_NOTES_PATH&&
   typeof p.notes.body==='string'&&p.notes.body.length>0&&
   p.picture?.action==='keep'&&
   p.pictureSequence?.action==='keep'&&
   Array.isArray(body.snapshot.media)&&body.snapshot.media.length===0;
 }
 async function authorizeStep(proof){
  if(!active()||phase()!=='steps'||!proof||typeof proof!=='object')
   return false;
  const step=env.D6_WP3_H2_APPROVED_STEP,idx=STEPS.indexOf(step);
  if(idx<0||!Array.isArray(proof.verifiedSteps))return false;
  // Each new step requires a fresh exact prefix and server-held step pin.
  const prefix=idx===0?'':STEPS.slice(0,idx).join(',');
  return proof.operationId===env.D6_WP3_H2_APPROVED_OPERATION_ID&&
   proof.step===step&&proof.domain==='kb'&&
   proof.recordId===env.D6_WP3_H2_APPROVED_RECORD_ID&&
   proof.sourceRevision===env.D6_WP3_H2_APPROVED_SOURCE_REVISION&&
   env.D6_WP3_H2_APPROVED_STEP_PREFIX===prefix&&
   proof.verifiedSteps.length===idx&&
   proof.verifiedSteps.every((s,i)=>STEPS[i]===s)&&active();
 }
 return Object.freeze({approved,permit,authorizeStep});
}
