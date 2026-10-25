/**
 * FISH118 P3-29 — isolated ingress deployment sentinel.
 * Destination: fishing-p3-access-ingress-sandbox ONLY.
 * Deploy with workers_dev:false and preview_urls:false, NO bindings/secrets.
 *
 * This is NOT the P3-26 authenticated command ingress implementation.
 * It has no imports or privilege-bearing functions and cannot accept commands,
 * even when given a forged Access JWT or accidentally true env flags.
 */
const blocked=()=>new Response(JSON.stringify({
 ok:false,ready:false,mode:'ingress-disabled'
}),{status:503,headers:{
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
 'Referrer-Policy':'no-referrer'
}});
export function createP3DisabledIngressWorker(){
 return Object.freeze({async fetch(){return blocked();}});
}
export default createP3DisabledIngressWorker();
