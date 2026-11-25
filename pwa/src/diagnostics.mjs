// V3 Connection Status diagnostic snapshot. Strict allowlist: never export
// session, CSRF, owner IDs, operation IDs, draft text, source content or URLs.
const releaseId=value=>typeof value==='string'&&/^[a-f0-9]{32,40}$/.test(value)?
 value:'Unavailable';
const readingMode=value=>value==='Work Offline'?'Work Offline':'Automatic';
const state=value=>['Ready','Incomplete','Downloading','OnlineOnly'].includes(value)?
 value:'Unavailable';
const publication=value=>['None','Accepted','Validating','Checking',
 'Merging','Deploying','Verifying','Live','Failed','Conflict','Unknown']
 .includes(value)?value:'Unavailable';
const browser=value=>/Edg\//.test(value)?'Edge':
 /Firefox\//.test(value)?'Firefox':
 /Chrome\//.test(value)?'Chrome':
 /Safari\//.test(value)?'Safari':'Other';
const platform=value=>/Android/.test(value)?'Android':
 /Windows/.test(value)?'Windows':
 /Macintosh|Mac OS X/.test(value)?'macOS':
 /Linux/.test(value)?'Linux':'Other';
const positiveInteger=value=>Number.isSafeInteger(value)&&value>=0?String(value):'Unavailable';
export function formatV3Diagnostics({
 releaseId:release,sourceRevision,mode,online,offline={},
 publicationState,userAgent='',storageUsed,storageQuota,
}={}){
 const values=[
  ['Application','Fishing Companion'],
  ['App release',releaseId(release)],
  ['Source revision',releaseId(sourceRevision)],
  ['Browser',browser(userAgent)],
  ['Platform',platform(userAgent)],
  ['Reading mode',readingMode(mode)],
  ['Browser network',online===true?'Online':online===false?'Offline':'Unavailable'],
  ['Offline library',state(offline.state)],
  ['Offline release',releaseId(offline.releaseId)],
  ['Offline files',positiveInteger(offline.files)],
  ['Offline bytes',positiveInteger(offline.bytes)],
  ['Publication state',publication(publicationState)],
  ['Storage used (approximate bytes)',positiveInteger(storageUsed)],
  ['Storage quota (approximate bytes)',positiveInteger(storageQuota)],
 ];
 return values.map(([label,value])=>label+': '+value).join('\n');
}
