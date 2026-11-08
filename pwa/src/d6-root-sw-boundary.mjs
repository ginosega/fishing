/**
 * D6 root-scope service-worker boundary.
 * The unified public origin must let its trusted authentication and API
 * endpoints reach the network directly, never V2's offline asset handler.
 * For all existing (including private D5) narrower SW scopes, unchanged.
 */
export const D6_PUBLIC_ROOT='https://fishing.ginosega.workers.dev/';
const ROOT_ASSETS=new Set(['/','/index.html','/release.json','/loader.js',
 '/sw.js','/manifest.webmanifest','/icon.png','/icon-maskable.png']);
const RELEASE_ASSET=/^\/releases\/[a-f0-9]{32}\/(?:[A-Za-z0-9._~!$&'()+,;=:@%-]+\/)*[A-Za-z0-9._~!$&'()+,;=:@%-]+$/;

export function shouldHandleD6RootSWRequest({scope,requestUrl}={}){
 let root,url;
 try{root=new URL(scope);url=new URL(requestUrl);}catch{return false;}
 if(url.origin!==root.origin||url.username||url.password)return false;
 // Preserve the preexisting V2/private scope logic unchanged.
 if(root.href!==D6_PUBLIC_ROOT)return true;
 const path=url.pathname;
 if(path.includes('\\')||path.includes('//')||
    /%(?:2f|5c|00|2e)/i.test(path))return false;
 // At /, the root SW is strictly asset-only. All other requests,
 // especially /auth/*, /session/* and /api/*, bypass its fetch handler.
 return ROOT_ASSETS.has(path)||RELEASE_ASSET.test(path);
}
