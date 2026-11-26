// A verified mode change must switch the complete content source, not mix
// cached catalog rows with online-only detail Notes.
export function needsContentModeReload({source,mode,online,direct}={}){
 return source==='d1'&&mode==='Work Offline'||
  ['release','v3-content'].includes(source)&&mode==='Automatic'&&
  online===true&&direct===true;
}
