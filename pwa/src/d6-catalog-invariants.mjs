/** Source-only V3 direct-D1 catalog contract.
 * Migration counts are lower bounds, not permanent maximums.
 * UI verifies historic IDs while the offline snapshot is frozen.
 */
export const D6_MIGRATED_MINIMUMS=Object.freeze({gear:100,kb:60,catches:12});
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validD6Catalog(domain,{items,count,requiredIds}={}){
 const minimum=D6_MIGRATED_MINIMUMS[domain];
 if(!minimum||!Array.isArray(items)||items.length<minimum||
    (count!==undefined&&count!==items.length))return false;
 const ids=new Set();
 for(const item of items){
  const id=item?.id;
  if(typeof id!=='string'||id.length>160||!ID.test(id)||ids.has(id))
   return false;
  ids.add(id);
 }
 if(requiredIds){
  if(!(requiredIds instanceof Set)||requiredIds.size<minimum)return false;
  for(const id of requiredIds)if(!ids.has(id))return false;
 }
 return true;
}
