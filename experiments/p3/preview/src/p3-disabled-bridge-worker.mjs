/**
 * FISH118 P3-24 — hard-disabled sandbox command-bridge deployment sentinel.
 * Intended for separate Worker: fishing-p3-command-bridge-sandbox.
 * No public routes, no auth endpoint, no GitHub API, no D1 SQL.
 *
 * IMPORTANT: Deploy config MUST set workers_dev=false, preview_urls=false,
 * P3_WRITE_ENABLED=false, P3_COMMAND_BRIDGE_ENABLED=false. This runtime
 * itself still refuses ALL fetches even if someone misconfigures both flags.
 * Never transform this into an accepting Worker without a separate approval.
 */
const response=()=>new Response(JSON.stringify({ok:false,ready:false,mode:'bridge-disabled'}),{
 status:503,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
 },
});
export function createP3DisabledBridgeWorker(){
 return Object.freeze({
  async fetch(){return response();},
 });
}
export default createP3DisabledBridgeWorker();
