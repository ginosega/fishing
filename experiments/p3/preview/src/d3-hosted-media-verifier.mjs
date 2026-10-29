/** Shared D3/D4 hosted-media ticket proof for BOTH Cron and DO.
 * Keep request-time verification exact and use signed original receipts; do
 * not relax expired tickets except when explicitly verifying a durable
 * previously accepted snapshot.
 */
import {createD4TicketVerifier} from './d4-git-blob-stage.mjs';
import {validateD4MediaTickets} from './d4-media-tickets.mjs';

export function createD3HostedMediaVerifier({
 origin,secret,enabled=()=>false,
}={}){
 if(typeof enabled!=='function')throw Error('INVALID_MEDIA_VERIFIER');
 const tickets=createD4TicketVerifier({origin,secret});
 return async function verifyMedia(pkg,media,options={}){
  if(!Array.isArray(media))throw Error('INVALID_MEDIA_SNAPSHOT');
  const changed=pkg?.picture?.action!=='keep'||
   (pkg?.pictureSequence?.action??'keep')!=='keep'||media.length>0;
  if(changed&&enabled()!==true)throw Error('D4_MEDIA_DISABLED');
  return validateD4MediaTickets({
   package:pkg,media,verifyTicket:tickets.verifyTicket,...options,
  });
 };
}
