/** Precise V3 Cancel confirmation only after local draft storage has succeeded. */
export function v3DeviceDraftLeaveMessage({unavailable=false,needsReselect=false}={}){
 const intro=unavailable?
  'Save is unavailable while working offline or signed out. ':
  'These changes have not been published. ';
 const saved='Your text and field edits have been saved as a device draft on this device, not published. ';
 const media=needsReselect?
  'Locally selected pictures are not stored in the draft and must be selected again when restoring it. ':
  '';
 return intro+saved+media+'Leave this editor?';
}
