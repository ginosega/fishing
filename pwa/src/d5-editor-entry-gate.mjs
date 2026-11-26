// Pure D5 owner candidate gate; read-only pages and public V2 never wait.
export function d5EditorEntryGate({enabled=false,online=false,modeAvailable=false,
 readingMode='Checking',modeChecking=true,ownerPhase='Unverified',
 authorized=false,editorTimedOut=false}={}){
 if(!enabled)return 'ready';
 if(online!==true)return 'offline';
 if(editorTimedOut)return 'unavailable';
 if(modeAvailable!==true)return modeChecking?'pending':'unavailable';
 if(readingMode==='Work Offline')return 'offline';
 if(readingMode!=='Automatic')return 'unavailable';
 if(['Unverified','Checking','SigningOut'].includes(ownerPhase))
  return 'pending';
 if(['Unavailable','Offline'].includes(ownerPhase))return 'unavailable';
 return ownerPhase==='Owner'&&authorized===true?'ready':'unauthorized';
}
