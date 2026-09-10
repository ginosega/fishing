import {el,button,text} from './dom.mjs';
export function openViewer(src,alt,caption=''){
 const dialog=el('dialog',{class:'image-dialog','aria-label':'Image viewer'}),stage=el('div',{class:'image-stage'}),img=el('img',{src,alt,draggable:false});
 const prior=document.activeElement;let scale=1,x=0,y=0,origin=null;const pointers=new Map();let pinch=null;
 function apply(){img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;zoomLabel.textContent=Math.round(scale*100)+'%';}
 function zoom(next){scale=Math.max(1,Math.min(8,next));if(scale===1){x=0;y=0;}apply();}
 const zoomLabel=text('span','100%','zoom-label');
 const close=()=>dialog.close();
 const controls=el('div',{class:'viewer-controls'},button('−',()=>zoom(scale/1.3),{title:'Zoom out','aria-label':'Zoom out'}),zoomLabel,button('+',()=>zoom(scale*1.3),{title:'Zoom in','aria-label':'Zoom in'}),button('Reset',()=>zoom(1)),button('Close',close,{variant:'primary'}));
 stage.append(img);
 stage.addEventListener('pointerdown',event=>{stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1)origin={x:event.clientX,y:event.clientY,tx:x,ty:y};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};}});
 stage.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];scale=Math.max(1,Math.min(8,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance)));apply();}else if(pointers.size===1&&origin&&scale>1){x=origin.tx+event.clientX-origin.x;y=origin.ty+event.clientY-origin.y;apply();}});
 function release(event){pointers.delete(event.pointerId);origin=null;pinch=null;if(pointers.size===1){const p=[...pointers.values()][0];origin={...p,tx:x,ty:y};}}
 stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
 stage.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey){event.preventDefault();zoom(scale*(event.deltaY<0?1.15:1/1.15));}},{passive:false});
 dialog.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='=')zoom(scale*1.3);if(event.key==='-')zoom(scale/1.3);if(event.key==='0')zoom(1);});
 dialog.addEventListener('close',()=>{dialog.remove();prior?.focus();});
 dialog.append(el('div',{class:'viewer-top'},text('strong',alt)),stage,...(caption?[text('p',caption,'viewer-caption')]:[]),controls);
 document.body.append(dialog);dialog.showModal();apply();
}
