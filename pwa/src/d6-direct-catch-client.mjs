/** Direct V3 Catch Log client: same-origin private Worker, no GitHub writer. */
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const error=(message,code)=>Object.assign(new Error(message),{code});
export function createD6DirectCatchClient({
 root,request,enabled=()=>false,online=()=>true,
}={}){
 let app;try{app=new URL(root);}catch{throw Error('DIRECT_CATCH_ORIGIN_DENIED');}
 const local=app.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(app.hostname);
 if((app.protocol!=='https:'&&!local)||app.pathname!=='/fishing/'||
    app.search||app.hash||app.username||app.password||
    typeof request!=='function'||typeof enabled!=='function'||
    typeof online!=='function')throw Error('DIRECT_CATCH_ORIGIN_DENIED');
 const endpoint=app.origin+'/api/v3/content/';
 const ready=()=>enabled()===true&&online()===true;
 const validId=id=>typeof id==='string'&&id.length<=160&&ID.test(id);
 async function fetchJSON(url,options){
  let response;
  try{response=await request(url,{...options,credentials:'same-origin',
   cache:'no-store',redirect:'manual'});}
  catch{throw error('Unable to reach Fishing Companion. Your edit is preserved.','UNAVAILABLE');}
  if(!(response instanceof Response)||response.redirected||
     (response.url&&response.url!==url)||
     !/^application\/json\b/i.test(response.headers.get('Content-Type')??''))
   throw error('Catch response could not be verified. Your edit is preserved.','UNVERIFIED');
  if(response.status===404)throw error('Catch not found.','NOT_FOUND');
  if(response.status===409)
   throw error('This Catch changed since you opened it. Reload before saving. Your edit is preserved.','CONFLICT');
  if(response.status===401||response.status===403)
   throw error('Please sign in again. Your edit is preserved.','SIGN_IN_REQUIRED');
  if(response.status!==200)
   throw error('The Catch is unavailable or was not saved. Your edit is preserved.','UNAVAILABLE');
  let data;try{data=await response.json();}catch{
   throw error('Catch response could not be verified.','UNVERIFIED');
  }
  if(!data||data.ok!==true)
   throw error('Catch Save was not confirmed.','UNVERIFIED');
  return data;
 }
 async function list(){
  if(!ready())throw error('Catch Log unavailable.','UNAVAILABLE');
  const data=await fetchJSON(endpoint+'catches',{
   method:'GET',headers:{Accept:'application/json'},
  });
  if(!Number.isSafeInteger(data.count)||data.count<12||
     !Array.isArray(data.items)||data.items.length!==data.count||
     new Set(data.items.map(row=>row?.id)).size!==data.count||
     data.items.some(row=>!validId(row?.id)))
   throw error('The complete Catch Log could not be verified.','UNVERIFIED');
  return data.items;
 }
 async function read(id){
  if(!ready()||!validId(id))throw error('Catch editing unavailable.','UNAVAILABLE');
  const data=await fetchJSON(endpoint+'catches/'+encodeURIComponent(id),{
   method:'GET',headers:{Accept:'application/json'},
  });
  if(data.record?.id!==id||!Number.isSafeInteger(data.revision)||
     data.revision<1||typeof data.notes!=='string')
   throw error('Catch could not be verified.','UNVERIFIED');
  return {record:data.record,notes:data.notes,revision:data.revision};
 }
 async function save({record,notes='',expectedRevision}={}){
  if(!ready()||!validId(record?.id)||typeof notes!=='string'||
     !Number.isSafeInteger(expectedRevision)||expectedRevision<0)
   throw error('Catch edit not ready for Save.','UNAVAILABLE');
  const csrf=await fetchJSON(endpoint+'catches-csrf',{
   method:'GET',headers:{Accept:'application/json',
    'X-Fish-V3-Intent':'catch-csrf'},
  });
  if(!CSRF.test(csrf.csrfToken??''))
   throw error('Owner session not verified.','SIGN_IN_REQUIRED');
  const id=record.id;
  const data=await fetchJSON(endpoint+'catches/'+encodeURIComponent(id),{
   method:'POST',
   headers:{Accept:'application/json','Content-Type':'application/json',
    'X-Fish-V3-Intent':'save-catch','X-Fish-V3-CSRF':csrf.csrfToken},
   body:JSON.stringify({record,notes,expectedRevision}),
  });
  if(data.record?.id!==id||data.revision!==expectedRevision+1||
     typeof data.notes!=='string')
   throw error('Catch Save could not be verified.','UNVERIFIED');
  return {record:data.record,notes:data.notes,revision:data.revision};
 }
 return Object.freeze({list,read,save});
}
