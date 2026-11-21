/** Real schema-compatible records for isolated, no-network bootstrap tests. */
const make=(count,fn)=>Array.from({length:count},(_,i)=>fn(i));
export function createD6DirectContentFixture({extra=false,fault=null}={}){
 const accessed=[];
 const gear=make(100+(extra?1:0),i=>({
  id:'lure-'+i,category:'lures',type:'Spoons',name:'Test Lure '+i,
  specifications:[],links:[],
 }));
 const kb=make(60+(extra?1:0),i=>({
  id:'kb-'+i,type:'species',name:'Test Species '+i,
  content:'KB/Species/content/Species '+i+'.md',
 }));
 const catches=make(12+(extra?1:0),i=>({
  id:'catch-'+i,date:'2026-11-20',
  notes:'Catches/content/catch-'+i+'.md',
 }));
 if(fault==='short')gear.pop();
 if(fault==='duplicate')kb[1]={...kb[0]};
 if(fault==='badType')gear[0].type='Not a valid lure type';
 if(fault==='missingReference')catches[0].speciesId='kb-no-such-species';
 const v3={
  enabled:true,readerOnly:true,
  directGearEnabled:true,directKBEnabled:true,directCatchEnabled:true,
  directGearClient:{async list(){accessed.push('gear');return gear;}},
  directKBClient:{async list(){accessed.push('kb');return kb;}},
  directCatchClient:{async list(){accessed.push('catches');return catches;}},
 };
 return {v3,reads:()=>accessed};
}
