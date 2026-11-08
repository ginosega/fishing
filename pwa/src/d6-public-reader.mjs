/**
 * D6 production-path reader-only candidate. No authentication, GitHub writer,
 * sandbox source, publishing API or editor capability is ever returned.
 * This candidate must not be hosted on the existing github.io V2 origin.
 */
export const D6_READER_BASE='/fishing/';
export const D6_READER_ORIGIN='https://fishing.ginosega.workers.dev';

export function selectD6PublicReader({enabled=false,root,release,manifest}={}){
 if(enabled!==true)return null;
 let url;
 try{url=new URL(root);}catch{throw Error('D6 reader root unavailable');}
 const loopback=url.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.origin!==D6_READER_ORIGIN&&!loopback)||
   url.pathname!==D6_READER_BASE||url.search||url.hash||
   url.username||url.password||
   manifest?.base!==D6_READER_BASE||
   manifest?.d6ReaderCandidate!==true||
   release?.d6ReaderCandidate!==true||
   manifest?.releaseId!==release?.id||
   manifest?.sourceRevision!==release?.sourceRevision||
   !/^[a-f0-9]{32}$/.test(release?.id??'')||
   !/^[a-f0-9]{40}$/.test(release?.sourceRevision??''))
  throw Error('D6 reader scope or immutable release identity mismatch');
 return Object.freeze({enabled:true,readerOnly:true});
}
