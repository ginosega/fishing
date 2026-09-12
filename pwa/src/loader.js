(async()=>{
 const root=new URL('./',document.currentScript.src).href;
 const main=document.getElementById('app');
 const connection=document.getElementById('connection-status'),dialog=document.getElementById('connection-dialog');
 const openStatus=()=>dialog.showModal(),closeStatus=()=>dialog.close();
 const network=()=>{connection.dataset.online=String(navigator.onLine);document.getElementById('connection-network').textContent=navigator.onLine?'Online':'Offline';};
 connection.addEventListener('click',openStatus);document.getElementById('connection-close').addEventListener('click',closeStatus);network();
 globalThis.__FISHING_SHELL_CLEANUP__=()=>{connection.removeEventListener('click',openStatus);document.getElementById('connection-close').removeEventListener('click',closeStatus);};
 const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if('serviceWorker' in navigator){
  const registration=await navigator.serviceWorker.register(new URL('sw.js',root),{scope:root});
  // V1 and production v2 share sw.js. Wait only for a FISH091-capable worker
  // to control the page; complete offline preparation is never part of startup.
  const controlsCurrent=async()=>{
   const worker=navigator.serviceWorker.controller;if(worker?.scriptURL!==new URL('sw.js',root).href)return false;
   return new Promise(resolve=>{const channel=new MessageChannel();const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};const timer=setTimeout(()=>finish(false),1500);channel.port1.onmessage=e=>finish(e.data?.protocol==='fishing-companion-v2'&&e.data.base===new URL(root).pathname&&e.data.capabilities?.onlineDefault===true);worker.postMessage({type:'HELLO'},[channel.port2]);});
  };
  if(!await controlsCurrent())await new Promise((resolve,reject)=>{
   let timeout;
   const cleanup=()=>{clearTimeout(timeout);navigator.serviceWorker.removeEventListener('controllerchange',changed);registration.removeEventListener('updatefound',watch);};
   const finish=error=>{cleanup();error?reject(error):resolve();};
   const changed=async()=>{if(await controlsCurrent())finish();};
   const watch=()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',async()=>{if(worker.state==='redundant'&&!await controlsCurrent())finish(new Error('Fishing Companion could not activate its current service worker. Retry while online.'));});};
   navigator.serviceWorker.addEventListener('controllerchange',changed);registration.addEventListener('updatefound',watch);watch();timeout=setTimeout(()=>finish(new Error('Fishing Companion could not activate its current service worker. Retry while online.')),30000);changed();
  });
 }
 const response=await fetch(new URL('release.json',root),{cache:'no-store'});
 if(!response.ok)throw new Error(response.status===503?'Fishing Companion is not prepared for offline use on this device.':'Release pointer unavailable');
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
 script.onerror=()=>{main.textContent='Application bundle unavailable. Check your connection, or update the offline library while online before relying on offline access.';};document.head.append(script);
})().catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.addEventListener('click',()=>location.reload());
 main.append(heading,message,retry);console.error(error);
});
