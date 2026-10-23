/** In-memory fake adapters ONLY. Cannot reach GitHub or Cloudflare. */
export function memoryStore(){
 const keys=new Map(),ids=new Map();
 return {
  async insertOnce(key,record){
   if(keys.has(key))return {record:structuredClone(keys.get(key)),inserted:false};
   keys.set(key,structuredClone(record));ids.set(record.id,key);
   return {record:structuredClone(record),inserted:true};
  },
  async get(id){const key=ids.get(id);return key?structuredClone(keys.get(key)):null;},
  async update(id,changes,fromState){
   const key=ids.get(id),record=key&&keys.get(key);
   if(!record||record.state!==fromState)throw Error('Concurrent update or missing operation');
   Object.assign(record,structuredClone(changes));record.history.push(record.state);
   return structuredClone(record);
  },
  size:()=>ids.size,
 };
}
export function fakeGitHub(initialSha='a'.repeat(40)){
 let mainSha=initialSha;const prs=new Map();let created=0,merges=0;
 const config={check:'success',rulesSatisfied:true,deployment:'success',deployedSha:null};
 return {
  config,
  async readSnapshot(){return {mainSha,records:{},texts:{}};},
  async ensurePullRequest({operationId,baseSha,changes}){
   if(prs.has(operationId))return {...prs.get(operationId)};
   const number=++created,headSha=(number.toString(16)).padStart(40,'b');
   const pr={number,headSha,baseSha,changes};prs.set(operationId,pr);
   return {...pr};
  },
  async checkPullRequest({headSha}){return {headSha,conclusion:config.check,rulesSatisfied:config.rulesSatisfied};},
  async getMainSha(){return mainSha;},
  async mergePullRequest({operationId,expectedHeadSha}){
   const pr=prs.get(operationId);if(!pr||pr.headSha!==expectedHeadSha)throw Error('Head mismatch');
   if(!pr.mergeSha){pr.mergeSha='c'.repeat(40);mainSha=pr.mergeSha;merges++;}
   return {mergeSha:pr.mergeSha};
  },
  async verifyDeployment({sourceSha}){return {status:config.deployment,verified:config.deployment==='success',sourceSha:config.deployedSha??sourceSha,releaseId:'d'.repeat(32)};},
  setMainSha(value){mainSha=value;},
  stats(){return {created,merges};},
 };
}
