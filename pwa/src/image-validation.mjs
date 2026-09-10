import {safePath,sha256,assert} from './shared.mjs';
const types={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'};
const magic=bytes=>{
 const b=bytes;const signature=(...values)=>values.every((v,i)=>b[i]===v);
 if(signature(255,216,255))return 'image/jpeg';
 if(signature(137,80,78,71,13,10,26,10))return 'image/png';
 if(signature(71,73,70,56)&&(b[4]===55||b[4]===57)&&b[5]===97)return 'image/gif';
 if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';
 return null;
};
export async function validateBrowserImage(file){
 safePath(file.name);
 const extension=file.name.split('.').at(-1).toLowerCase(),type=types[extension];
 assert(type,'Only JPEG, PNG, WebP and GIF images are accepted.');
 assert(file.size>0&&file.size<=10*1024*1024,'Maximum image size is 10 MiB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 assert(magic(bytes)===type,'The image extension does not match its bytes.');
 let width,height,frames=1;
 if(typeof ImageDecoder!=='undefined'&&ImageDecoder.isTypeSupported){
  assert(await ImageDecoder.isTypeSupported(type),'This browser cannot decode the selected image.');
  const decoder=new ImageDecoder({data:bytes,type});
  try{
   await decoder.tracks.ready;
   const track=decoder.tracks.selectedTrack;frames=track.frameCount;
   assert(Number.isSafeInteger(frames)&&frames>0&&frames<=512,'Image animation exceeds the frame limit.');
   for(let i=0;i<frames;i++){
    const result=await decoder.decode({frameIndex:i,completeFramesOnly:true});
    const frame=result.image;
    try{
     width=frame.displayWidth;height=frame.displayHeight;
     assert(width>0&&height>0&&width<=6000&&height<=6000&&width*height<=36000000,'Image exceeds the 6000px/36MP limit.');
     assert(width*height*frames<=512000000,'Image animation exceeds the decode budget.');
    }finally{frame.close();}
   }
  }finally{decoder.close();}
 }else{
  if(type==='image/gif'||type==='image/webp')throw new Error('This browser cannot fully validate animated images. Use a browser with ImageDecoder support or upload the original directly to the repository for build validation.');
  const bitmap=await createImageBitmap(new Blob([bytes],{type}));
  try{width=bitmap.width;height=bitmap.height;assert(width>0&&height>0&&width<=6000&&height<=6000&&width*height<=36000000,'Image exceeds the 6000px/36MP limit.');}
  finally{bitmap.close();}
 }
 return {name:file.name,bytes:file.size,sha256:await sha256(bytes),width,height,frames};
}
