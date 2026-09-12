import {el,button,text} from './dom.mjs';

function imageStage(src,alt){
 const stage=el('div',{class:'image-stage'}),img=el('img',{src,alt,draggable:false});
 let scale=1,x=0,y=0,origin=null;const pointers=new Map();let pinch=null;
 function apply(){img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
 function zoom(next){scale=Math.max(1,Math.min(8,next));if(scale===1){x=0;y=0;}apply();}
 function reset(){scale=1;x=0;y=0;origin=null;pinch=null;pointers.clear();apply();}
 stage.append(img);
 stage.addEventListener('pointerdown',event=>{stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1)origin={x:event.clientX,y:event.clientY,tx:x,ty:y};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};}});
 stage.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];scale=Math.max(1,Math.min(8,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance)));apply();}else if(pointers.size===1&&origin&&scale>1){x=origin.tx+event.clientX-origin.x;y=origin.ty+event.clientY-origin.y;apply();}});
 function release(event){pointers.delete(event.pointerId);origin=null;pinch=null;if(pointers.size===1){const p=[...pointers.values()][0];origin={...p,tx:x,ty:y};}}
 stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
 stage.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey){event.preventDefault();zoom(scale*(event.deltaY<0?1.15:1/1.15));}},{passive:false});
 apply();return {stage,img,zoom,reset,getScale:()=>scale};
}

export function openViewer(src,alt,caption=''){
 const dialog=el('dialog',{class:'image-dialog','aria-label':'Image viewer'}),view=imageStage(src,alt),prior=document.activeElement;
 const zoomLabel=text('span','100%','zoom-label');
 function syncZoom(){zoomLabel.textContent=Math.round(view.getScale()*100)+'%';}
 function zoom(next){view.zoom(next);syncZoom();}
 const close=()=>dialog.close();
 const controls=el('div',{class:'viewer-controls'},button('−',()=>zoom(view.getScale()/1.3),{title:'Zoom out','aria-label':'Zoom out'}),zoomLabel,button('+',()=>zoom(view.getScale()*1.3),{title:'Zoom in','aria-label':'Zoom in'}),button('Reset',()=>{view.reset();syncZoom();}),button('Close',close,{variant:'primary'}));
 dialog.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='=')zoom(view.getScale()*1.3);if(event.key==='-')zoom(view.getScale()/1.3);if(event.key==='0'){view.reset();syncZoom();}});
 dialog.addEventListener('close',()=>{dialog.remove();prior?.focus();});
 dialog.append(el('div',{class:'viewer-top'},text('strong',alt)),view.stage,...(caption?[text('p',caption,'viewer-caption')]:[]),controls);
 document.body.append(dialog);dialog.showModal();syncZoom();
}

export function openSequenceViewer(sources,alt,caption=''){
 if(!Array.isArray(sources)||sources.length<2)throw new Error('Image sequence requires at least two frames.');
 const dialog=el('dialog',{class:'image-dialog','aria-label':'Image sequence viewer'}),view=imageStage(sources[0],alt),prior=document.activeElement;
 const indicator=text('p',`1 of ${sources.length}`,'viewer-caption viewer-frame-indicator'),failure=text('p','','hint');failure.hidden=true;
 let index=0,timer=null,playing=false;const preloads=[];
 const previous=button('Previous',()=>manual(-1),{'aria-label':'Previous'}),play=button('Play',togglePlay,{'aria-label':'Play'}),next=button('Next',()=>manual(1),{'aria-label':'Next'}),close=button('Close',()=>dialog.close(),{variant:'primary'});
 const controls=el('div',{class:'viewer-controls'},previous,play,next,close);
 function stop(){if(timer){clearInterval(timer);timer=null;}playing=false;play.textContent='Play';play.setAttribute('aria-label','Play');}
 function sync(){indicator.textContent=`${index+1} of ${sources.length}`;previous.disabled=index===0;next.disabled=index===sources.length-1;}
 function show(nextIndex){index=nextIndex;failure.hidden=true;failure.textContent='';view.reset();view.img.src=sources[index];sync();}
 function manual(delta){stop();const target=index+delta;if(target<0||target>=sources.length)return;show(target);}
 function tick(){show((index+1)%sources.length);}
 function togglePlay(){if(playing){stop();return;}playing=true;play.textContent='Pause';play.setAttribute('aria-label','Pause');timer=setInterval(tick,1000);}
 view.img.addEventListener('error',()=>{stop();failure.textContent=`Unable to load frame ${index+1} of ${sources.length}.`;failure.hidden=false;});
 view.img.addEventListener('load',()=>{failure.hidden=true;failure.textContent='';});
 dialog.addEventListener('keydown',event=>{
  const interactive=event.target?.closest?.('button,input,select,textarea,a');
  if(event.key==='ArrowLeft'){event.preventDefault();manual(-1);return;}
  if(event.key==='ArrowRight'){event.preventDefault();manual(1);return;}
  if(event.key===' '&&!interactive){event.preventDefault();togglePlay();return;}
  if(event.key==='+'||event.key==='=')view.zoom(view.getScale()*1.3);
  if(event.key==='-')view.zoom(view.getScale()/1.3);
  if(event.key==='0')view.reset();
 });
 dialog.addEventListener('close',()=>{stop();for(const image of preloads)image.src='';dialog.remove();prior?.focus();});
 dialog.append(el('div',{class:'viewer-top'},text('strong',alt)),view.stage,...(caption?[text('p',caption,'viewer-caption')]:[]),indicator,failure,controls);
 document.body.append(dialog);dialog.showModal();sync();
 for(const source of sources.slice(1)){const image=new Image();image.src=source;preloads.push(image);}
}
