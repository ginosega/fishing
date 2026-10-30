/**
 * FISH118 P3-30 — SOURCE ONLY: bounded, strict UTF-8 response reader.
 * Never call Response.text() on an untrusted upstream before enforcing limits.
 */
export class P3BoundedResponseError extends Error {
 constructor(){super('P3 response rejected');this.name='P3BoundedResponseError';}
}
const refuse=()=>{throw new P3BoundedResponseError();};
export async function readP3BoundedResponseText(response,maxBytes){
 if(!(response instanceof Response)||!Number.isSafeInteger(maxBytes)||
    maxBytes<1||maxBytes>32768)refuse();
 const n=response.headers.get('Content-Length');
 if(n!==null&&(!/^\d+$/.test(n)||Number(n)>maxBytes))refuse();
 if(!response.body?.getReader)refuse();
 const reader=response.body.getReader(),pieces=[];let size=0,done=false;
 try{
  for(;;){
   const part=await reader.read();
   if(part.done){done=true;break;}
   if(!(part.value instanceof Uint8Array))refuse();
   size+=part.value.byteLength;
   if(size>maxBytes)refuse();
   pieces.push(part.value);
  }
 }finally{
  if(!done)void reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
 const bytes=new Uint8Array(size);let offset=0;
 for(const piece of pieces){bytes.set(piece,offset);offset+=piece.byteLength;}
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
 catch{refuse();}
}
