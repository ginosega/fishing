/**
 * Owner media capability contract for the existing direct-D1 V3 Worker.
 *
 * Hosted original images are readable. All *new* media uploads are OFF:
 * no durable upload provider or atomic metadata/record integration exists.
 * Never treat the presence of a staging function or an upload control as
 * evidence of backend capability. Reassess this contract only when the
 * server and client implement and test authenticated durable media writes.
 */
import {el} from './dom.mjs';

export const DIRECT_D1_MEDIA_CAPABILITIES=Object.freeze({
 version:1,
 canReadExistingImages:true,
 canUploadNewImages:false,
 canReplaceImages:false,
 canUploadKnotSequences:false,
 state:'read-only-original-media',
});

export function presentD6OwnerImageCapability(editor,capabilities){
 if(!editor||typeof editor.querySelector!=='function'||
    capabilities!==DIRECT_D1_MEDIA_CAPABILITIES)
  throw Error('Unverified V3 owner media capability');
 const toolbar=editor.querySelector('.notes-toolbar');
 const hiddenButton=toolbar?.querySelector('[aria-label="Insert Image"]');
 if(!toolbar||!hiddenButton||
    capabilities.canUploadNewImages!==false||
    hiddenButton.hidden!==true)
  throw Error('Shared Notes image capability differs from approved state');
 // Keep the accepted shared Markdown component exact-byte. Add a
 // visible-but-disabled explanatory control, consistent across domains.
 const unavailable=hiddenButton.cloneNode(true);
 unavailable.hidden=false;unavailable.disabled=true;
 unavailable.setAttribute('aria-label','Insert Image unavailable');
 unavailable.setAttribute('title','New image uploads are not yet supported');
 hiddenButton.before(unavailable);
 toolbar.after(el('p',{class:'hint notes-upload-limitation',role:'note'},
  'New image uploads are not yet available. Existing images are preserved.'));
}
