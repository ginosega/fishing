// FISH118 D5 opt-in, read-only V3 candidate. Never enables GitHub writes,
// auth, the D3 sandbox client or the canonical /fishing/ app entry.
export const V3_READER_CANDIDATE_BASE='/fishing/__v3_reader_candidate__/';

export function selectV3ReaderCandidate({enabled=false,root,release,manifest}={}){
 if(enabled!==true)return null;
 let url;
 try{url=new URL(root);}catch{throw new Error('V3 reader candidate root is invalid');}
 if(!['https:','http:'].includes(url.protocol)||
    (url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))||
    url.pathname!==V3_READER_CANDIDATE_BASE||
    url.search||url.hash||url.username||url.password||
    manifest?.base!==V3_READER_CANDIDATE_BASE||
    manifest?.v3ReaderCandidate!==true||
    manifest?.releaseId!==release?.id||
    manifest?.sourceRevision!==release?.sourceRevision)
  throw new Error('V3 reader candidate release/scope mismatch');
 // No auth/client/publish method is supplied. UI may read public candidate
 // content and use its own verified offline library, never mutate the repo.
 return Object.freeze({enabled:true,readerOnly:true});
}
