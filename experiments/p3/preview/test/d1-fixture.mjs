import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createD1OperationStore} from '../src/d1-operation-store.mjs';
export const sample={package:{format:'fishing-companion-change-v2',domain:'gear',operation:'edit',id:'sample'},media:[]};
export function sandbox(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON;');
 for(const n of ['0001_initial.sql','0002_durable_snapshot_and_audit.sql','0003_ci_observation_recovery.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
 let at=1800000000,seq=0;
 const prepared=(q,args=[])=>({
  first:async()=>sql.prepare(q).get(...args)??null,
  all:async()=>({results:sql.prepare(q).all(...args)}),
  run:async()=>({success:true,meta:sql.prepare(q).run(...args)}),
  execute:()=>sql.prepare(q).run(...args),
 });
 const DB={
  prepare(q){return {bind(...args){return prepared(q,args);}}},
  async batch(stmts){
   const out=[];sql.exec('BEGIN IMMEDIATE;');
   try{for(const s of stmts)out.push({success:true,meta:s.execute()});
    sql.exec('COMMIT;');return out;}
   catch(e){sql.exec('ROLLBACK;');throw e;}
  },
 };
 const store=()=>createD1OperationStore({DB,ownerGitHubId:778899,now:()=>at,leaseSeconds:30,
  makeId:()=> 'p3_'+String(++seq).padStart(8,'0')+'-1111-4111-8111-123456789abc'});
 return {sql,DB,store,key:'unique-request-key-A12345',clock(n){at+=n;}};
}
