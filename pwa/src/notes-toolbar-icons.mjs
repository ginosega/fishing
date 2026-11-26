/* V3 shared toolbar icons; button text remains available via aria-label/title. */
function notesToolbarIcon(kind){
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 for(const [key,val] of Object.entries({viewBox:'0 0 24 24',width:22,height:22,
  fill:'none',stroke:'currentColor','stroke-width':1.8,
  'stroke-linecap':'round','stroke-linejoin':'round',
  'aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,String(val));
 function shape(tag,attrs){
  const node=document.createElementNS(ns,tag);
  for(const [key,val] of Object.entries(attrs))node.setAttribute(key,String(val));
  svg.append(node);
 }
 if(kind==='image'){
  shape('rect',{x:2.5,y:3,width:19,height:18,rx:2.5});
  shape('path',{d:'M4 18l5.5-7 3.5 4 2.2-2.7L20 18H4Z',
   fill:'#6ca6e8',stroke:'none'});
  shape('circle',{cx:16.7,cy:8,r:2.1,fill:'#e9b66d',stroke:'none'});
 }else{
  const paths={
   link:'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
   expand:'M8 3H3v5 M3 3l6 6 M16 3h5v5 M21 3l-6 6 M3 16v5h5 M3 21l6-6 M21 16v5h-5 M21 21l-6-6',
   restore:'M3 9h6V3 M9 9L3 3 M21 9h-6V3 M15 9l6-6 M3 15h6v6 M9 15l-6 6 M21 15h-6v6 M15 15l6 6',
  };
  if(!Object.hasOwn(paths,kind))throw Error('Invalid Notes toolbar icon');
  shape('path',{d:paths[kind]});
 }
 return svg;
}
export function setNotesToolbarIcon(control,kind,label){
 control.classList.add('notes-icon-button');
 control.replaceChildren(notesToolbarIcon(kind));
 control.setAttribute('aria-label',label);
 control.setAttribute('title',label);
}

