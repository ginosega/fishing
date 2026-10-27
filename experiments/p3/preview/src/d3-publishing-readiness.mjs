/**
 * FISH118 D3: shared, server-only sandbox publishing readiness predicate.
 * Never trust the browser, a single flag, or an inert Cron attachment.
 * All credential values stay in Worker encrypted bindings, not client code.
 * Even when ready, GitHub App permissions and remote hosted bytes must be
 * proven independently for each operation before sandbox Live.
 */
const ID='1430581407',OWNER='265665562';
const positive=value=>/^[1-9]\d*$/.test(String(value??''));
const secret=(value,min)=>typeof value==='string'&&value.length>=min;
const validOrigin=value=>{
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&url.origin===value&&
   url.pathname==='/'&&!url.search&&!url.hash&&
   !url.username&&!url.password;
 }catch{return false;}
};
export function d3PublishingReady(env){
 if(!env||typeof env!=='object')return false;
 return env.D3_SANDBOX_REPO_ID===ID&&
  String(env.OWNER_GITHUB_ID)===OWNER&&
  env.D3_WRITE_ENABLED==='true'&&
  env.D3_RUNNER_ENABLED==='true'&&
  env.D3_TEST_HOST_ENABLED==='true'&&
  env.D3_READ_TOKENS_ENABLED==='true'&&
  typeof env.DB?.prepare==='function'&&
  typeof env.OPERATIONS_DB?.prepare==='function'&&
  typeof env.OPERATIONS_DB?.batch==='function'&&
  validOrigin(env.APP_ORIGIN)&&
  secret(env.D2_CSRF_KEY,32)&&
  secret(env.D2_HOST_PROBE_KEY,32)&&
  positive(env.D2_GITHUB_APP_ID)&&
  positive(env.D2_GITHUB_INSTALLATION_ID)&&
  env.D3_GITHUB_APP_ID===env.D2_GITHUB_APP_ID&&
  env.D3_GITHUB_INSTALLATION_ID===env.D2_GITHUB_INSTALLATION_ID&&
  secret(env.D2_GITHUB_APP_PRIVATE_KEY,33);
}
