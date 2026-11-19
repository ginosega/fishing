/**
 * Source-only client for direct Gear editing in the approved V3 UI.
 * Uses the existing first-party owner cookie; no GitHub writer or JSON handoff.
 */
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const error=(message,code)=>Object.assign(new Error(message),{code});
export function createD6DirectGearClient({
 root,request,enabled=()=>false,online=()=>true,
}={}){
 let app;
 try{app=new URL(root);}catch{throw Error('DIRECT_GEAR_ORIGIN_DENIED');}
 const local=app.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(app.hostname);
 if((app.protocol!=='https:'&&!local)||app.pathname!=='/fishing/'||
    app.search||app.hash||app.username||app.password||
    typeof request!=='function'||typeof enabled!=='function'||
    typeof online!=='function')
  throw Error('DIRECT_GEAR_ORIGIN_DENIED');
 const endpoint=app.origin+'/api/v3/content/';
 const ready=()=>enabled()===true&&online()===true;
 const idOK=id=>typeof id==='string'&&id.length<=160&&ID.test(id);
 async function readJSON(url,options){
  let response;
  try{response=await request(url,{...options,credentials:'same-origin',
    cache:'no-store',redirect:'manual'});}
  catch{throw error('Unable to reach Fishing Companion. Your edit is preserved.','UNAVAILABLE');}
  if(!(response instanceof Response)||response.redirected||
     (response.url&&response.url!==url)||
     !/^application\/json\b/i.test(response.headers.get('Content-Type')??''))
   throw error('Save result could not be verified. Your edit is preserved.','UNVERIFIED');
  if(response.status===404)
   throw error('This Gear record has not been imported into D1 yet.','NOT_FOUND');
  if(response.status===409)
   throw error('This item changed since you opened it. Your edit is preserved. Reload before saving.','CONFLICT');
  if(response.status===401||response.status===403)
   throw error('Please sign in again. Your edit is preserved.','SIGN_IN_REQUIRED');
  if(response.status!==200)
   throw error('The record is unavailable or was not saved. Your edit is preserved.','UNAVAILABLE');
  let data;
  try{data=await response.json();}catch{throw error('Save result could not be verified.','UNVERIFIED');}
  if(!data||data.ok!==true)return Promise.reject(error('Save was not confirmed.','UNVERIFIED'));
  return data;
 }
 async function read(id){
  if(!ready()||!idOK(id))throw error('Gear editing unavailable.','UNAVAILABLE');
  const data=await readJSON(endpoint+'gear/'+encodeURIComponent(id),{
   method:'GET',headers:{Accept:'application/json'},
  });
  if(data.record?.id!==id||!Number.isSafeInteger(data.revision)||
     data.revision<1||typeof data.notes!=='string')
   throw error('Gear record could not be verified.','UNVERIFIED');
  return {record:data.record,notes:data.notes,revision:data.revision};
 }
 async function save({record,notes,expectedRevision}={}){
  if(!ready()||!idOK(record?.id)||!Number.isSafeInteger(expectedRevision)||
     expectedRevision<1||typeof notes!=='string')
   throw error('Gear edit is not ready for Save.','UNAVAILABLE');
  const csrf=await readJSON(endpoint+'owner-csrf',{
   method:'GET',headers:{Accept:'application/json',
    'X-Fish-V3-Intent':'gear-csrf'},
  });
  if(!CSRF.test(csrf.csrfToken??''))throw error('Owner session not verified.','SIGN_IN_REQUIRED');
  const id=record.id;
  const data=await readJSON(endpoint+'gear/'+encodeURIComponent(id),{
   method:'POST',
   headers:{Accept:'application/json','Content-Type':'application/json',
    'X-Fish-V3-Intent':'save-gear','X-Fish-V3-CSRF':csrf.csrfToken},
   body:JSON.stringify({record,notes,expectedRevision}),
  });
  if(data.record?.id!==id||data.revision!==expectedRevision+1||
     typeof data.notes!=='string')
   throw error('Save response was not independently verified.','UNVERIFIED');
  return {record:data.record,notes:data.notes,revision:data.revision};
 }
 return Object.freeze({read,save});
}
