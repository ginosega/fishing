/**
 * FISH118 P3-17: PURE source-only decision aid for manual 0001 -> Wrangler.
 *
 * DOES NOT import Wrangler, fs, child_process, network, SQL or Cloudflare
 * access. This module never executes a migration, invents a ledger, or grants
 * authorization. Stage changes always require a separate owner decision.
 *
 * Only evaluate this against new, owner-verified remote evidence; the earlier
 * P3-16 report proves schema/flags/bookmark but NOT P3 application row counts.
 */
const STAGES=Object.freeze([
 'Rehearse manually-installed 0001 plus restricted Wrangler migration set locally',
 'Independently recheck exact D1/Worker binding, latest schema, row counts, no writes and recovery bookmark',
 'With separate owner approval, let Wrangler track ONLY existing idempotent 0001 and verify preserved state',
 'Stop; verify exactly one Wrangler 0001 ledger entry and unchanged 0001 schema',
 'With separate owner approval, apply ONLY 0002 and verify requests table, triggers and ledger prefix',
 'Stop; verify foreign keys, no unexpected data loss, write-disabled Worker',
 'With separate owner approval, apply ONLY 0003 and verify observation/audit tables and triggers',
 'Stop; verify exact 0001/0002/0003 ledger prefix, integrity, recovery and hosted disabled sentinel',
]);
const EXPECTED_BLOCKERS=new Set(['WRANGLER_LEDGER_MISSING']);
const result=(status,blockers)=>Object.freeze({
 status,blockers:Object.freeze([...new Set(blockers)]),
 stages:STAGES,safeToApply:false,requiresSeparateOwnerApproval:true,
 canDeploy:false,canMerge:false,
});

export function assessP3Manual0001Reconciliation({
 preflight,databaseName,dbBindingMatches,
 writeDisabled,hostedSentinelDisabled,foreignKeysClear,
 timeTravelBookmarkAvailable,tableCounts,
}={}){
 const problems=[];
 if(databaseName!=='fishing-p3-sandbox'||dbBindingMatches!==true)
  problems.push('DATABASE_IDENTITY_UNVERIFIED');
 if(writeDisabled!==true||hostedSentinelDisabled!==true)
  problems.push('PUBLISHING_NOT_PROVEN_DISABLED');
 if(foreignKeysClear!==true)problems.push('FOREIGN_KEY_INTEGRITY_UNVERIFIED');
 if(timeTravelBookmarkAvailable!==true)problems.push('RECOVERY_BOOKMARK_UNVERIFIED');
 if(preflight?.verified0001!==true||
  preflight?.status!=='BLOCKED'||
  !Array.isArray(preflight?.blockers)||
  preflight.blockers.length!==1||
  !preflight.blockers.every(x=>EXPECTED_BLOCKERS.has(x)))
  problems.push('SOURCE_SCHEMA_OR_LEDGER_NOT_EXACT');
 if(!tableCounts||typeof tableCounts!=='object'||
  Object.keys(tableCounts).sort().join(',')!=='p3_events,p3_operations,p3_sessions'||
  !Object.values(tableCounts).every(v=>Number.isSafeInteger(v)&&v===0))
  problems.push('DURABLE_ROWS_NOT_CONFIRMED_EMPTY');
 return result(problems.length?'HALT':'OPERATOR_REVIEW_ONLY',problems);
}
