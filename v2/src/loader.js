(async()=>{
 const root=new URL('./',document.currentScript.src).href;
 const main=document.getElementById('app');
 const connection=document.getElementById('connection-status'),dialog=document.getElementById('connection-dialog');
 const openStatus=()=>dialog.showModal(),closeStatus=()=>dialog.close();
 const network=()=>{connection.dataset.online=String(navigator.onLine);document.getElementById('connection-network').textContent=navigator.onLine?'Online':'Offline';};
 connection.addEventListener('click',openStatus);document.getElementById('connection-close').addEventListener('click',closeStatus);network();
 globalThis.__FISHING_SHELL_CLEANUP__=()=>{connection.removeEventListener('click',openStatus);document.getElementById('connection-close').removeEventListener('click',closeStatus);};
 const progress=message=>{main.textContent=message;document.getElementById('offline-status').textContent=message;};
 const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if('serviceWorker' in navigator){
  progress('Preparing the complete offline library…');
  const registration=await navigator.serviceWorker.register(new URL('sw.js',root),{scope:root});
  const controlsPreview=()=>navigator.serviceWorker.controller?.scriptURL===new URL('sw.js',root).href;
  if(!controlsPreview())await new Promise((resolve,reject)=>{
   let timeout;
   const cleanup=()=>{clearTimeout(timeout);navigator.serviceWorker.removeEventListener('controllerchange',changed);navigator.serviceWorker.removeEventListener('message',message);registration.removeEventListener('updatefound',watch);};
   const finish=error=>{cleanup();error?reject(error):resolve();};
   const reset=()=>{clearTimeout(timeout);timeout=setTimeout(()=>finish(new Error('The complete offline library could not be prepared. Retry while online.')),180000);};
   const changed=()=>{if(controlsPreview())finish();};
   const message=event=>{if(event.data?.type==='FISHING_V2_PROGRESS'){const s=event.data.status;progress(`Preparing offline library… ${s.completed||0} of ${s.files||'?'} files`);reset();}else if(event.data?.type==='FISHING_V2_STATUS'&&event.data.status?.state==='Incomplete'&&event.data.status.message)finish(new Error(event.data.status.message));};
   const watch=()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant'&&!controlsPreview())finish(new Error('Offline installation failed. Retry while online.'));});};
   navigator.serviceWorker.addEventListener('controllerchange',changed);navigator.serviceWorker.addEventListener('message',message);registration.addEventListener('updatefound',watch);watch();reset();changed();
  });
 }
 const response=await fetch(new URL('release.json',root),{cache:'no-store'});
 if(!response.ok)throw new Error('Release pointer unavailable');
 const release=await response.json();
 if(!/^[a-f0-9]{32}$/.test(release.id)||release.manifest!==`releases/${release.id}/manifest.json`||!/^[a-f0-9]{64}$/.test(release.manifestSha256))throw new Error('Invalid release pointer');
 const manifestResponse=await fetch(new URL(release.manifest,root),{cache:'no-store'});
 if(!manifestResponse.ok)throw new Error('Release manifest unavailable');
 const manifestBytes=await manifestResponse.arrayBuffer();
 if(await digest(manifestBytes)!==release.manifestSha256)throw new Error('Release manifest integrity mismatch');
 const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes));
 if(manifest.releaseId!==release.id||manifest.sourceRevision!==release.sourceRevision||manifest.base!==new URL(root).pathname||!Array.isArray(manifest.files)||manifest.schemaVersions?.gear!==2||manifest.schemaVersions?.kb!==2||manifest.schemaVersions?.catches!==2)throw new Error('Incompatible release');
 globalThis.__FISHING_BOOT__={root,release,manifest};
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('releases/'+release.id+'/styles.css',root).href;document.head.append(style);
 const script=document.createElement('script');script.src=new URL('releases/'+release.id+'/app.js',root).href;
 script.onerror=()=>{main.textContent='Application bundle unavailable. Retry the complete-library update.';};document.head.append(script);
})().catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.addEventListener('click',()=>location.reload());
 main.append(heading,message,retry);console.error(error);
});
