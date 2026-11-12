/**
 * D6 production-path reader-only candidate. No authentication, GitHub writer,
 * sandbox source, publishing API or editor capability is ever returned.
 * This candidate must not be hosted on the existing github.io V2 origin.
 */
export const D6_READER_BASE='/fishing/';
export const D6_READER_ORIGIN='https://fishing.ginosega.workers.dev';
// Reserved staging hostname only: NOT a deployed Worker or public cutover.
export const D6_STATIC_STAGING_ORIGIN='https://fishing-d6-static-test.ginosega.workers.dev';
// Dedicated WP2 test host, distinct from the accepted Stage A static Worker.
export const D6_WP2_STAGING_ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';

export function selectD6PublicReader({
 enabled=false,staticStaging=false,wp2Staging=false,root,release,manifest,
}={}){
 if(staticStaging===true&&wp2Staging===true)
  throw Error('D6 staged origin modes conflict');
 if(enabled!==true)return null;
 let url;
 try{url=new URL(root);}catch{throw Error('D6 reader root unavailable');}
 const loopback=url.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const staging=staticStaging===true;
 const allowedOrigin=staging?D6_STATIC_STAGING_ORIGIN:
  wp2Staging===true?D6_WP2_STAGING_ORIGIN:D6_READER_ORIGIN;
 if((url.origin!==allowedOrigin&&!loopback)||
   url.pathname!==D6_READER_BASE||url.search||url.hash||
   url.username||url.password||
   manifest?.base!==D6_READER_BASE||
   (release?.d6StaticStaging===true)!==staging||
   (manifest?.d6StaticStaging===true)!==staging||
   (release?.d6Wp2Staging===true)!==(wp2Staging===true)||
   (manifest?.d6Wp2Staging===true)!==(wp2Staging===true)||
   manifest?.d6ReaderCandidate!==true||
   release?.d6ReaderCandidate!==true||
   manifest?.releaseId!==release?.id||
   manifest?.sourceRevision!==release?.sourceRevision||
   !/^[a-f0-9]{32}$/.test(release?.id??'')||
   !/^[a-f0-9]{40}$/.test(release?.sourceRevision??''))
  throw Error('D6 reader scope or immutable release identity mismatch');
 return Object.freeze({enabled:true,readerOnly:true});
}
