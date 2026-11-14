/**
 * FISH-TODO-118 WP3 — exact owner publishing origin identities.
 *
 * SOURCE ONLY. These values are not Worker routes, OAuth redirect grants,
 * Cloudflare bindings, secret provisioners or permission to write to GitHub.
 *
 * The approved canonical production hostname remains the default. The
 * proposed WP3 isolated hostname is only a SOURCE CANDIDATE; it has not been
 * created or owner-approved. The isolated gate defaults OFF. Never choose
 * either origin from a browser URL, Origin header, query, JSON or cookie.
 *
 * This module only pins the ORIGIN equality checked by existing D2 and
 * WP3 HTTP/media ticket boundaries. It does not select the runtime, sign a
 * ticket, issue a token, or bypass the owner+CSRF verifier.
 */
import {D6_PUBLISH_INTAKE_ORIGIN as PRODUCTION_ORIGIN}
 from './d6-production-publish-intake.mjs';

export const D6_WP3_PROPOSED_ISOLATED_ORIGIN=
 'https://fishing-v3-wp3-test.ginosega.workers.dev';

export class D6Wp3OriginError extends Error{
 constructor(code){
  super('WP3 publishing origin is not authorized');
  this.name='D6Wp3OriginError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3OriginError(code);};
export function createD6Wp3PinnedWriteOrigin({
 origin=PRODUCTION_ORIGIN,isolatedEnabled=()=>false,
}={}){
 if(typeof isolatedEnabled!=='function'||
  (origin!==PRODUCTION_ORIGIN&&
   origin!==D6_WP3_PROPOSED_ISOLATED_ORIGIN))
  deny('UNPINNED_ORIGIN');
 function enabled(){
  // Deliberately do not make the isolated origin eligible simply by
  // selecting it at constructor time.
  return origin===PRODUCTION_ORIGIN||
   isolatedEnabled()===true;
 }
 return Object.freeze({origin,enabled});
}
