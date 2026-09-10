export function el(tag,attributes={},...children){
 const node=document.createElement(tag);
 for(const [key,value] of Object.entries(attributes)){
  if(value===null||value===undefined||value===false)continue;
  if(key==='class')node.className=value;
  else if(key==='text')node.textContent=value;
  else if(key==='html')node.innerHTML=value;
  else if(key==='value')node.value=value;
  else if(key==='checked')node.checked=Boolean(value);
  else if(key.startsWith('on')&&typeof value==='function')node.addEventListener(key.slice(2).toLowerCase(),value);
  else node.setAttribute(key,value===true?'':String(value));
 }
 for(const child of children.flat(Infinity))if(child!==null&&child!==undefined&&child!==false)node.append(child instanceof Node?child:document.createTextNode(String(child)));
 return node;
}
export const text=(tag,value,cls)=>el(tag,{class:cls,text:value});
export function button(label,action,{variant='secondary',title='',disabled=false,'aria-label':ariaLabel}={}){return el('button',{type:'button',class:'btn '+variant,title,disabled,'aria-label':ariaLabel,onclick:action},label);}
export function link(label,href,cls=''){return el('a',{href,class:cls},label);}
export function field(label,control,hint=''){const id='field-'+Math.random().toString(36).slice(2);control.id=id;return el('div',{class:'field'},el('label',{for:id},label),control,hint?text('p',hint,'hint'):null);}
export function input(value='',opts={}){return el('input',{type:opts.type||'text',value,placeholder:opts.placeholder||'',maxlength:opts.maxlength,required:opts.required,readonly:opts.readonly});}
export function select(options,value='',onchange){return el('select',{onchange},options.map(option=>{const [key,label]=Array.isArray(option)?option:[option,option];return el('option',{value:key,selected:key===value},label);}));}
export function empty(message){return el('p',{class:'empty'},message);}
export function status(host,message,kind='info'){host.replaceChildren(el('p',{class:'notice '+kind,role:'status'},message));}
export function picture(src,alt,caption='',open){
 if(!src)return el('div',{class:'picture-empty',role:'img','aria-label':'No picture available'},'No picture available');
 const img=el('img',{src,alt,loading:'lazy',decoding:'async',onerror:()=>{img.hidden=true;fallback.hidden=false;}});
 const fallback=el('span',{class:'picture-empty',hidden:true},'Picture unavailable');
 return el('figure',{class:'picture'},open?el('button',{type:'button',class:'picture-button','aria-label':'Enlarge '+alt,onclick:open},img,fallback):[img,fallback],caption?el('figcaption',{},caption):null);
}
export function section(title,...children){return el('section',{class:'section'},text('h2',title),...children);}
export function toolbar(...children){return el('div',{class:'toolbar'},...children);}
export function table(rows){return el('table',{class:'details-table'},el('tbody',{},rows.map(([key,value])=>el('tr',{},text('th',key),el('td',{},value)) )));}
