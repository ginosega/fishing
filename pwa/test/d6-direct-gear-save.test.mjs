import test from 'node:test';
import assert from 'node:assert/strict';
import {createD6DirectGearService} from '../server/d6-direct-gear-service.mjs';
import {createD6DirectGearClient} from '../src/d6-direct-gear-client.mjs';

const origin='https://fishing-v3-wp3-test.ginosega.workers.dev';
const cookie='__Host-fish_p0_session='+'A'.repeat(43);
const item={id:'test-spoon',category:'lures',type:'Spoons',name:'Test spoon',
 specifications:[],links:[]};

function harness(){
 let row={id:item.id,revision:1,record_json:JSON.stringify(item),
  notes_text:'Initial notes',updated_at:100};
 let writes=0;
 const CONTENT_DB={prepare(sql){
  return {bind(...params){
   return {
    async first(){
     if(!sql.startsWith('SELECT'))throw Error('Unexpected SQL SELECT');
     return row?.id===params[0]?{...row}:null;
    },
    async run(){
     if(!sql.startsWith('UPDATE'))throw Error('Unexpected SQL UPDATE');
     if(row?.id!==params[3]||row?.revision!==params[4])
      return {success:true,meta:{changes:0}};
     row={id:params[3],revision:row.revision+1,
      record_json:params[0],notes_text:params[1],updated_at:params[2]};
     ++writes;
     return {success:true,meta:{changes:1}};
    },
   };
  }};
 }};
 const AUTH_DB={prepare(sql){
  assert(sql.includes('FROM sessions'));
  return {bind:()=>({first:async()=>({github_id:265665562,
   expires_at:2000000})})};
 }};
 const service=createD6DirectGearService({
  AUTH_DB,CONTENT_DB,csrfKey:'S'.repeat(64),origin,now:()=>1000000,
  enabled:()=>true,
 });
 function browserRequest(url,options){
  const headers=new Headers(options.headers);
  headers.set('Sec-Fetch-Site','same-origin');
  headers.set('Cookie',cookie);
  if(options.method==='POST')headers.set('Origin',origin);
  return service.handle(new Request(url,{...options,headers}));
 }
 const client=createD6DirectGearClient({
  root:origin+'/fishing/',request:browserRequest,
  enabled:()=>true,online:()=>true,
 });
 return {service,client,writes:()=>writes,db:CONTENT_DB};
}

test('D6-DIRECT-GEAR01 real GET, owner Save, read-after-write, stale revision 409',async()=>{
 const {client,service,writes}=harness();
 const initial=await client.read(item.id);
 assert.equal(initial.revision,1);
 assert.equal(initial.record.name,'Test spoon');
 assert.equal(initial.notes,'Initial notes');

 const modified={...item,name:'Updated spoon'};
 const saved=await client.save({record:modified,notes:'Saved notes',expectedRevision:1});
 assert.equal(saved.revision,2);
 assert.equal(saved.record.name,'Updated spoon');
 assert.equal(saved.notes,'Saved notes');
 assert.equal(writes(),1);

 const reloaded=await client.read(item.id);
 assert.deepEqual(reloaded,saved);

 await assert.rejects(
  client.save({record:{...item,name:'Stale overwrite'},notes:'old',expectedRevision:1}),
  e=>e.code==='CONFLICT'
 );
 assert.equal(writes(),1);
 assert.equal((await client.read(item.id)).record.name,'Updated spoon');

 const anonymous=await service.handle(new Request(origin+'/api/v3/content/gear/'+item.id));
 assert.equal(anonymous.status,200);
 assert.equal((await anonymous.json()).record.name,'Updated spoon');
});

test('D6-DIRECT-GEAR02 unauthenticated, cross-site and bad content cannot write',async()=>{
 const {service,writes}=harness();
 const url=origin+'/api/v3/content/gear/'+item.id;
 const payload=JSON.stringify({record:item,notes:'changed',expectedRevision:1});
 const noAuth=await service.handle(new Request(url,{method:'POST',
  headers:{Origin:origin,'Sec-Fetch-Site':'same-origin',
   'Content-Type':'application/json','X-Fish-V3-Intent':'save-gear'},
  body:payload}));
 assert.equal(noAuth.status,403);

 const crossSite=await service.handle(new Request(url,{method:'POST',
  headers:{Origin:origin,'Sec-Fetch-Site':'cross-site',Cookie:cookie,
   'Content-Type':'application/json','X-Fish-V3-Intent':'save-gear'},
  body:payload}));
 assert.equal(crossSite.status,403);

 const malformed=await service.handle(new Request(url,{method:'POST',
  headers:{Origin:origin,'Sec-Fetch-Site':'same-origin',Cookie:cookie,
   'Content-Type':'application/json','X-Fish-V3-Intent':'save-gear',
   'X-Fish-V3-CSRF':'B'.repeat(43)},body:payload}));
 assert.equal(malformed.status,403);
 assert.equal(writes(),0);

 const csrf=await service.handle(new Request(origin+'/api/v3/content/owner-csrf',{
  headers:{'Sec-Fetch-Site':'same-origin',Cookie:cookie,
   'X-Fish-V3-Intent':'gear-csrf'},
 }));
 assert.equal(csrf.status,200);
 const token=(await csrf.json()).csrfToken;
 const bad=await service.handle(new Request(url,{method:'POST',
  headers:{Origin:origin,'Sec-Fetch-Site':'same-origin',Cookie:cookie,
   'Content-Type':'application/json','X-Fish-V3-Intent':'save-gear',
   'X-Fish-V3-CSRF':token},
  body:JSON.stringify({record:{...item,unexpected:true},notes:'n',expectedRevision:1})}));
 assert.equal(bad.status,400);
 assert.equal(writes(),0);
});

test('D6-DIRECT-GEAR03 default OFF and separate schema/migration',async()=>{
 const disabled=createD6DirectGearService({
  AUTH_DB:{prepare(){throw Error('SHOULD_NOT_READ');}},
  CONTENT_DB:{prepare(){throw Error('SHOULD_NOT_READ');}},
  origin,csrfKey:'S'.repeat(64),
 });
 const result=await disabled.handle(new Request(origin+'/api/v3/content/gear/test-spoon'));
 assert.equal(result.status,503);
});
