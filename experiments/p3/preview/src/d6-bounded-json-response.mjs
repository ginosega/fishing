/**
 * WP2 trusted-server upstream JSON limiter, source-only. It exposes no
 * network requests, credentials, session state or publishing routes.
 */
export class D6BoundedJsonError extends Error{
 constructor(code){
  super('Upstream JSON response denied');
  this.name='D6BoundedJsonError';this.code=code;
 }
}
const reject=code=>{throw new D6BoundedJsonError(code);};
export async function readD6BoundedJson(response,maxBytes){
 if(!(response instanceof Response)||!Number.isSafeInteger(maxBytes)||
    maxBytes<1)reject('INVALID_RESPONSE');
 const length=response.headers.get('Content-Length');
 if(length!==null){
  const declared=Number(length);
  if(!/^\d+$/.test(length)||!Number.isSafeInteger(declared)||
     declared>maxBytes)reject('TOO_LARGE');
 }
 let reader;
 try{reader=response.body?.getReader();}catch{reject('INVALID_RESPONSE');}
 if(!reader)reject('INVALID_RESPONSE');
 const parts=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array))reject('INVALID_RESPONSE');
   total+=value.byteLength;
   if(total>maxBytes)reject('TOO_LARGE');
   parts.push(value);
  }
 }catch(error){
  try{await reader.cancel();}catch{}
  if(error instanceof D6BoundedJsonError)throw error;
  reject('INVALID_RESPONSE');
 }finally{
  try{reader.releaseLock();}catch{}
 }
 const joined=new Uint8Array(total);let offset=0;
 for(const part of parts){joined.set(part,offset);offset+=part.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));}
 catch{reject('INVALID_RESPONSE');}
}
