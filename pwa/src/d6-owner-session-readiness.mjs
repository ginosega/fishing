/**
 * D6 owner-session READINESS probe, not an authorization or publisher.
 * The server must independently authorize every future production write.
 * No CSRF token, media ticket, GitHub credential, repository ID, or write
 * capability is exposed to this candidate.
 */
import {D6_READER_BASE,D6_READER_ORIGIN} from './d6-public-reader.mjs';

const fail=(state='Unavailable')=>Object.freeze({state,canPublish:false});
const OWNER_LOGIN=/^[A-Za-z0-9-]{1,39}$/;
export function createD6OwnerSessionReadiness({
 root,request,enabled=()=>false,online=()=>false,
}={}){
 let candidate;
 try{candidate=new URL(root);}catch{throw Error('D6 session probe root invalid');}
 const loopback=candidate.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(candidate.hostname);
 if((candidate.origin!==D6_READER_ORIGIN&&!loopback)||
   candidate.pathname!==D6_READER_BASE||candidate.username||
   candidate.password||candidate.search||candidate.hash||
   typeof request!=='function'||typeof enabled!=='function'||
   typeof online!=='function')
  throw Error('D6 session probe origin or configuration denied');
 const endpoint=candidate.origin+'/session';
 async function check({readingMode='Checking'}={}){
  // A physical network hint is not enough: persisted Work Offline is binding.
  if(enabled()!==true||online()!==true||readingMode!=='Automatic')return fail('Offline');
  let response;
  try{response=await request(endpoint,{
   method:'GET',credentials:'same-origin',cache:'no-store',redirect:'manual',
   headers:{Accept:'application/json'},
  });}catch{return fail();}
  if(!(response instanceof Response)||response.status!==200||
   response.redirected===true||
   !/\bapplication\/json\b/i.test(response.headers.get('Content-Type')??''))
   return fail();
  let data;
  try{data=await response.json();}catch{return fail();}
  if(!data||typeof data!=='object'||Array.isArray(data)||
   typeof data.authenticated!=='boolean'||
   typeof data.authorized!=='boolean'||
   (data.authorized&&!data.authenticated))return fail();
  if(!data.authenticated)return fail('Signed out');
  if(!data.authorized)return fail('Not authorized');
  const login=typeof data.ownerLogin==='string'&&
   OWNER_LOGIN.test(data.ownerLogin)?data.ownerLogin:null;
  return Object.freeze({state:'Owner',canPublish:false,
   ...(login?{ownerLogin:login}:{})});
 }
 return Object.freeze({check});
}
