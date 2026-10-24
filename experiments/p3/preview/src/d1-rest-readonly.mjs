/**
 * FISH118 P3-19 — trusted Node read-only D1 REST binding.
 * Source-only; not routed, scheduled, deployed, or invoked by production.
 *
 * Refuses all D1 writes, batch, and unknown SQL. Cloudflare D1 REST batch
 * transaction guarantees are not treated as equivalent to Worker DB.batch().
 * A future privileged, owner-scoped, atomic write bridge requires new design.
 */
export class P3ReadOnlyD1Error extends Error {
 constructor(code){super('P3 read-only D1 adapter refused operation');this.name='P3ReadOnlyD1Error';this.code=code;}
}
const fail=code=>{throw new P3ReadOnlyD1Error(code);};
const requireIt=(v,code)=>{if(!v)fail(code);};
const hex=/^[a-f0-9]{32}$/i;
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const ID=1430581407;
const repo='fishing-p3-sandbox';
const leaseGet='SELECT operation_id,state,pr_number,pr_head_sha,main_base_sha FROM p3_operations WHERE operation_id=? AND github_id=? AND repo_id=?';
const observationGet='SELECT c.* FROM p3_ci_observations c JOIN p3_operations o ON c.operation_id=o.operation_id WHERE c.operation_id=? AND o.github_id=? AND o.repo_id=?';
const historyGet='SELECT a.attempt,a.state,a.check_run_id,a.reason_code,a.observed_at,a.next_poll_at FROM p3_ci_observation_audit a JOIN p3_operations o ON o.operation_id=a.operation_id WHERE a.operation_id=? AND o.github_id=? AND o.repo_id=? ORDER BY a.attempt';
const approved=new Set([leaseGet,observationGet,historyGet]);
const normalize=s=>s.replace(/\s+/g,' ').trim();
const operation=/^p3_[0-9a-f-]{36}$/;
const owner=n=>Number.isSafeInteger(n)&&n>0;
const allowedParams=args=>args.length===3&&operation.test(args[0])&&owner(args[1])&&args[2]===ID;

export async function createP3ReadOnlyD1REST({
 accountId,databaseId,apiToken,request=fetch,
}={}){
 requireIt(typeof accountId==='string'&&hex.test(accountId)&&
   typeof databaseId==='string'&&uuid.test(databaseId)&&
   typeof apiToken==='string'&&apiToken.length>=16&&
   typeof request==='function','INVALID_REMOTE_CONFIGURATION');
 const root='https://api.cloudflare.com/client/v4/accounts/'+accountId+
   '/d1/database/'+databaseId;
 const headers={'Authorization':'Bearer '+apiToken,
   'User-Agent':'fishing-p3-trusted-read-only',
   'Content-Type':'application/json'};
 async function call(url,init){
  let response;
  try{response=await request(url,init);}catch{fail('REMOTE_NETWORK_FAILED');}
  requireIt(response&&typeof response.ok==='boolean'&&response.ok,
    'REMOTE_HTTP_REJECTED');
  let body;
  try{body=await response.json();}catch{fail('REMOTE_JSON_INVALID');}
  requireIt(body&&body.success===true&&Array.isArray(body.errors)&&
    body.errors.length===0,'REMOTE_RESPONSE_FAILED');
  return body;
 }
 // Do not accept a secret UUID by itself as proof of correct database.
 const identity=await call(root,{method:'GET',headers});
 requireIt(identity.result?.uuid?.toLowerCase()===databaseId.toLowerCase()&&
   identity.result?.name===repo&&identity.result?.version==='production',
   'WRONG_D1_TARGET');
 async function query(statement,args){
  const sql=normalize(statement);
  requireIt(approved.has(sql)&&allowedParams(args),'UNAPPROVED_SQL');
  const body=await call(root+'/query',{method:'POST',headers,
    body:JSON.stringify({sql,params:args.map(String)})});
  requireIt(Array.isArray(body.result)&&body.result.length===1,
    'UNEXPECTED_RESULT_SHAPE');
  const result=body.result[0];
  requireIt(result?.success===true&&Array.isArray(result.results),
    'SQL_QUERY_FAILED');
  requireIt(result.meta?.changed_db===false&&
    result.meta?.rows_written===0,'UNEXPECTED_DB_WRITE');
  return Object.freeze({results:result.results});
 }
 const DB=Object.freeze({
  prepare(statement){
   const sql=normalize(statement);
   // Check SQL at prepare time before any HTTP call or parameters.
   requireIt(approved.has(sql),'UNAPPROVED_SQL');
   return Object.freeze({
    bind(...params){
     requireIt(allowedParams(params),'INVALID_READ_PARAMETERS');
     return Object.freeze({
      async first(){const data=await query(sql,params);return data.results[0]??null;},
      async all(){return query(sql,params);},
     });
    },
   });
  },
  // Never approximate atomic D1.batch with independent REST requests.
  async batch(){fail('REMOTE_BATCH_FORBIDDEN');},
 });
 return DB;
}
