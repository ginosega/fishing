/**
 * The standalone V3 bootstrap independently verifies D1 and Automatic
 * before createApp runs. The SW mode controller is initialized afterward.
 * Prefer the verified boot mode until the live controller becomes available,
 * so a newly reloaded detail view never fetches old release-file Notes.
 * Once controls are available, their current mode takes precedence.
 */
export function canReadD6DirectNotes({
 online=false,modeAvailable=false,mode=null,
 contentSource=null,contentReadingMode=null,
}={}){
 if(online!==true)return false;
 if(modeAvailable===true)return mode==='Automatic';
 return contentSource==='d1'&&contentReadingMode==='Automatic';
}
