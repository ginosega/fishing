import fs from 'node:fs';
import crypto from 'node:crypto';
import {fingerprint} from '../../pwa/src/shared.mjs';
import {promoteChange,validatePackage} from '../../pwa/src/handoff.mjs';

const KB_PATH='KB/kb.json';
const kb=JSON.parse(fs.readFileSync(KB_PATH,'utf8'));
const sha256File=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const sha256Text=text=>crypto.createHash('sha256').update(text,'utf8').digest('hex');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const seq=(prefix,rows)=>({
  paths:rows.map(([n])=>`${prefix}/step-${String(n).padStart(2,'0')}.jpg`),
  files:rows.map(([n,bytes,sha256])=>({path:`${prefix}/step-${String(n).padStart(2,'0')}.jpg`,bytes,sha256}))
});

const arborSeq=seq('KB/Knots/assets/knot-arbor',[
[1,5945,'9be00a737bdcf0059b7bc2b88231e995d802213bee121b0cc20afe2a6634f795'],
[2,7546,'90e44f9c5519f964123efb94b2727508a5841c3760caf2a8e10325faf3dbcab4'],
[3,10688,'3c8dec5c28c912f4d5738e7ed8e5811cee32be4bbd4fc747c3f63ad337acd816'],
[4,9393,'830a2d4da24e9b8472a84b8ed0524e7cb863993e2e29ffbb8d614c3277c5b6c8'],
[5,9010,'0b1d39274ec4398e64acd01f6f9a1d8307b0c1689526dd31cd48c96c5f758acb'],
[6,9209,'ba9a23419de7e5c767a0273b225e2f5aebb20485c8cba58db1c9103fae26dc2c'],
[7,8456,'02be234e57ffcda7b7a74484cbb9f74f683c07eaac0f0897799e953bbfed15dd'],
[8,8456,'ce9c8abcd8149e61d751568f06f7948b9d0c900a92582663bed3bd23feafbdf4'],
[9,7369,'98a95fa215b363fcd3c1d8c3d54b8d17932d56819c518952ea07327c9ac2b53d']
]);
const bowlineSeq=seq('KB/Knots/assets/bowline-knot',[
[1,11576,'4a2fecc575d953532c99dd04338fef5611f9e58516c10d0cc33c0846439f383d'],
[2,11234,'4d5b8c5ad13455d8acbcc9357b943d719fd6ca0d3d9b1bae13c8e7b57b9ea136'],
[3,11183,'0a7646c7e04653ec82ccfb4a25f576fdbe24d44750858082418ddcda2137288b'],
[4,10706,'95cffb8b8b9c409d062e6362b66e3a91b35aab28aa7ac026c7363fd1c645f642'],
[5,10154,'327d22bc7bc6636b7abc9e495c0bb908b0861a9599d6f6717cebc82ba67f7192'],
[6,9757,'11ba8409feacc64f4ccefe1eb95d5e0c55c18c8be8c6bb01481c5824216fed62'],
[7,9212,'b69685e00914d4a038643e77f18c11244be184040ad4c0f84ea630a3c0c3d5f8']
]);
const fgSeq=seq('KB/Knots/assets/knot-fg',[
[1,16269,'f87de3570d373e64bfeed8845dc8cea09010c31cc3349bac2677c093f2c10ba4'],
[2,16124,'dd905d89a2bafbceedbbf09933d05c43b90cf7881bc10099497a4f6d242e4672'],
[3,16641,'0330c2868cc57de67c3abfae5596023bdd606e05a3c80087d928c19edbfcf19d'],
[4,17940,'dfa9095994b08ce829f4a4d3e173e5560e21960b0d9694320d62a6bcfce770e4'],
[5,17487,'828f91cd62cc47a20e727dfb78b4f102d7b492d41ce609a4eb27cb62d39a53cf'],
[6,16903,'1a064fadcd4ba60fc19e6fcc6efb19b22aa035eda8998545bb1d95a85d4d2767'],
[7,16887,'54764b539bd0356dbac181ece95ee7659f5d1dd85f59bf4f466a12d8b2f895cc'],
[8,17541,'99cbb56314d9b3c28e122f1cc8d5c092e660f55d15032e0cac2c1ea8f108884f'],
[9,18204,'ab710aae6ae20c427ef832348cd158a768952957cad92bcded5cb9273bd75608'],
[10,17439,'2548af867a38202a90c42142707c8280cf406f7cd3eadb07e1cdeeb832d6ac4d'],
[11,18622,'e5716da025dde27faa3f08dd8e6ed298f064169fb6ef896d45695be29dcb5a4e'],
[12,17353,'556cf95eb31d849cc70700e7f0ffafb082520c25005661e046d0c6df6f7fb4dd'],
[13,18716,'b68318d46c15f37fc30df0242d3864d79cb7a46a5e54d416529862395a513883'],
[14,17247,'54afe9b4a4a7636c714bf63b7e8115302888fb77b4f5618c6229476957d11db0'],
[15,16679,'40532624a9a93be6b83b0de1518ec8df1d3dea0dc14927ff4d9a6e70f4a53974'],
[16,20086,'ce2b3b3367dd72d3446cd66b555dc3a54666f84070d84c0152310058d1b0e483'],
[17,18224,'dfab98af54d3101fe4bc61ccf56493c639cbffebc0d62e270cd9989957f0d3b2'],
[18,19303,'c0faf4119c7877d586cdb1ddcfb0c3e3fbe6473f23f3469cd51b8d2366e98c22'],
[19,18224,'44c78aff947d1147f707a36a6e0d13f0f7804dd30b6129d7d908cfc41d2d11ef'],
[20,18959,'b72738f63bab8b079c108e1fbd2ced0d2f295eb7300e3e82655874e99649d950'],
[21,18144,'e60a24bb3347e48f5e8a1b54033d513347107f34681804237cedcf08cb72cdba'],
[22,19321,'0f8ac0298aed300e154f9358809014e26c459e2988bd308c5453be07772f84ad'],
[23,18497,'1b98385046326f6d1306e35ef21744eeb383d377dd58d09e7e44ad5b9709080f'],
[24,18919,'40b0cdd40dbf5ad1d355e173ad0ffe583546bcae06ebe60f59ee208297875fe0'],
[25,20524,'bb3d3977bb7143e166caa9f28c2ceeb818b351cc0d1256524eeee1bf9eccf477'],
[26,22587,'dc63ea09bbbb57555ca8a334cc5f847955d5d68e3dd611b950ca62d81257ea91'],
[27,19334,'6c2a82ab2e947a7ae385867e946d8f05bda96adb3a73520df9f2a6ba8d8d021b'],
[28,18773,'123d7ef5eb55ee589c1b6c9eb7523a46c7ecc5b5bc974ffca8c0a9ff09419b04'],
[29,16641,'381ae6a1d11652cdc434b7176d552b94f469f8370731753629a81431eee1ec9a']
]);

const packages=[
{
 format:'fishing-companion-change-v2',domain:'kb',operation:'edit',id:'knot-albright',
 base:{schemaVersion:2,sourceRevision:'65ac208dbb1a116cc321d5b13bea1228b3d1ee6f',recordHash:'cab59a0fb55a8d34c462d5cbc18fdc0e208f512565b482f69e85b6ade981b2c5'},
 changes:{set:{description:'Easier on-the-water braid-to-fluoro alternative to the FG knot'},unset:[],baseFields:{description:'Easier on-the-water braid-to-fluoro alternative'}},
 notes:{action:'replace',path:'KB/Knots/content/albright.md',body:'Form a loop in one line; if the lines are unequal, the loop is made in the larger line (gold in the pictures above). Pass the end of the thinner (blue) line through the loop and wrap it neatly around itself and the loop 10 times. Then pass the end back through the loop next to itself. Lubricate, pull the knot tight, and trim the ends.\n\n**Uses:** The Albright knot is a versatile knot that has a wide range of uses. It is only moderately easy to tie but it is suitable for joining different types of fishing line, e.g., monofilament to braided. It is small and neat and will slide through the guides on a fishing rod.\n\nVideo: [Albright knot](https://youtube.com/shorts/v6tp_hG3y1w?is=ck6NxtZj4Sik3nuP)\n',baseSha256:'b7e526e88a3508f62b89c7f8b125428c0a8ca749ee5d9643e0ce94e9c6e2388f'},
 picture:{action:'keep'},pictureSequence:{action:'keep'}
},
{
 format:'fishing-companion-change-v2',domain:'kb',operation:'edit',id:'knot-arbor',
 base:{schemaVersion:2,sourceRevision:'65ac208dbb1a116cc321d5b13bea1228b3d1ee6f',recordHash:'23b5e8f88bb5f19197fbe23770e368b83875b3376f2eba12a781e8d6b829938e'},
 changes:{set:{description:'Use for tying line to spool'},unset:[],baseFields:{description:'Use for spooling line'}},
 notes:{action:'replace',path:'KB/Knots/content/arbor.md',body:'Pass the line around the spool. With the free end, tie an overhand knot (half hitch) around the line. Then tie a second overhand knot in the free end to act as a stopper. Finally, slide the knots down tight against the arbor.\n\n**Uses:** The arbor knot is used to attach fishing line to a spool. The extra overhand knot in the tag end is essential: when the arbor knot is tightened the second overhand knot snugs down against the arbor.\n\nSome fishermen wind the loop two or three times around the Arbor before making the first half hitch. This increases the friction, which may be useful on a highly polished reel. The direction of these turns is critical - rotating the reel should tighten the wraps.\n\n**Releasing:** Pull on the tag end - the second overhand knot. This loosens the first knot and makes it easy to release.\n\nVideo: [Arbor knot](https://youtube.com/shorts/DSlZnvkWKoU?si=qtzxVQ4BVY8jC5FQ)\n',baseSha256:'5759a563969f616f486e1f969ea063d38b104b814391a3e2e5d41ef22643f601'},
 picture:{action:'add',path:'KB/Knots/assets/knot-arbor/step-09.jpg',caption:'Arbor knot',base:{$absent:true}},
 pictureSequence:{action:'set',paths:arborSeq.paths,files:arborSeq.files,base:{$absent:true}}
},
{
 format:'fishing-companion-change-v2',domain:'kb',operation:'add',id:'bowline-knot',
 base:{schemaVersion:2,sourceRevision:'65ac208dbb1a116cc321d5b13bea1228b3d1ee6f',recordHash:null},
 record:{id:'bowline-knot',name:'Bowline Knot',type:'knot'},
 notes:{action:'create',path:'KB/Knots/content/Bowline Knot.md',body:'The bowline makes a reasonably secure loop in the end of a piece of rope. Under load, it does not slip or bind. With no load it can be untied easily. Its principal shortcoming is that it cannot be tied, or untied, when there is a load on the end. It should therefore be avoided when it may have to be released under load. When a bowline is unloaded, it can work its way untied.\n\nVideo: [Bowline knot](https://youtube.com/shorts/ChHLY9Ol-Ls?si=6WhYroVIR8Cawv0N)',baseSha256:null},
 picture:{action:'add',path:'KB/Knots/assets/bowline-knot/step-07.jpg',caption:'Bowline knot'},
 pictureSequence:{action:'set',paths:bowlineSeq.paths,files:bowlineSeq.files}
},
{
 format:'fishing-companion-change-v2',domain:'kb',operation:'edit',id:'knot-fg',
 base:{schemaVersion:2,sourceRevision:'65ac208dbb1a116cc321d5b13bea1228b3d1ee6f',recordHash:'5ce5541daf8bb2ebca8b53a7e6e388a64417ba6ffa941b785506892ec781780c'},
 changes:{set:{},unset:[],baseFields:{}},
 notes:{action:'replace',path:'KB/Knots/content/fg.md',body:'Stretch the braid mainline tight and alternately wrap the fluorocarbon leader first under one side and then under the other. Repeat this wrapping again and again to form a chain of about 12 to 15 double wraps.\n\n**Use:** This knot is valued for its strength and its ability to run freely through rod guides. Although somewhat complicated to learn, with practice it can be tied quickly and reliably.\n\n**Tying:** When tying it, detail is critical. Tension on the braided line may be applied in various ways, but whatever method is used, the line must be kept tight. As the leader is being wrapped the turns may spread out, so after every five or six pairs of wraps the stack should be compressed. The eventual strength of the FG depends on the strong pull at the end because this stretches the last six to ten wraps and tightens the grip - it is advisable to use gloves when tightening the knot.\n\n**Finishing:** tie two overhand knots (half hitches) first around both lines and then around just the braided line. Alternate each half hitch, so that the first one goes over the line and the second one under.\n\n## Links\n- Video: [How to tie an FG knot](https://youtu.be/tPa6R-Eb53I?si=O-MzBM7vrUBwWg2I)\n- Video: [How to tie an FG knot](https://youtu.be/Xt2wB7H_9Zw?si=_QBbHYU1_s0qEsl3) (alternate method)\n- Video: [How to tie an FG knot](https://youtube.com/shorts/8DujEeH2Hqg?si=Iy1CHaCRRgOfYu4h) (alternate method)\n',baseSha256:'bb266fe948456371a4dfc3b13dfac57ad84c4d302d0db6a3fa59b400970be54d'},
 picture:{action:'add',path:'KB/Knots/assets/knot-fg/step-29.jpg',caption:'FG knot',base:{$absent:true}},
 pictureSequence:{action:'set',paths:fgSeq.paths,files:fgSeq.files,base:{$absent:true}}
}
];

for(const pkg of packages){
  validatePackage(pkg);
  const index=kb.entities.findIndex(r=>r.id===pkg.id);
  const current=index>=0?kb.entities[index]:undefined;
  if(pkg.operation==='edit'){
    assert(current,`${pkg.id}: expected current record`);
    const actualHash=await fingerprint(current);
    assert(actualHash===pkg.base.recordHash,`${pkg.id}: recordHash mismatch ${actualHash}`);
  } else {
    assert(!current,`${pkg.id}: add target already exists`);
    assert(pkg.base.recordHash===null,`${pkg.id}: add base hash must be null`);
  }
  if(pkg.notes.action==='replace'){
    assert(current?.content===pkg.notes.path,`${pkg.id}: narrative path mismatch`);
    const currentText=fs.readFileSync(pkg.notes.path,'utf8');
    assert(sha256Text(currentText)===pkg.notes.baseSha256,`${pkg.id}: notes base SHA mismatch`);
  } else if(pkg.notes.action==='create') {
    assert(!fs.existsSync(pkg.notes.path),`${pkg.id}: narrative create path already exists`);
  }
  const files=pkg.pictureSequence?.files||[];
  for(const file of files){
    assert(fs.existsSync(file.path),`${pkg.id}: missing uploaded image ${file.path}`);
    const stat=fs.statSync(file.path);
    assert(stat.size===file.bytes,`${pkg.id}: byte mismatch ${file.path}: ${stat.size} != ${file.bytes}`);
    const actual=sha256File(file.path);
    assert(actual===file.sha256,`${pkg.id}: SHA-256 mismatch ${file.path}: ${actual}`);
  }
  const currentText=current?.content?fs.readFileSync(current.content,'utf8'):'';
  const promoted=await promoteChange({package:pkg,currentRecord:current,currentText,sourceRevision:process.env.GITHUB_SHA,conflictPolicy:'review'});
  assert(promoted.conflicts.length===0,`${pkg.id}: unexpected conflicts ${promoted.conflicts.join(',')}`);
  if(pkg.operation==='edit')kb.entities[index]=promoted.record;
  else {
    const firstLaterKnot=kb.entities.findIndex(r=>r.type==='knot'&&r.name.localeCompare(promoted.record.name)>0);
    if(firstLaterKnot>=0)kb.entities.splice(firstLaterKnot,0,promoted.record);
    else {
      const lastKnot=kb.entities.reduce((last,r,i)=>r.type==='knot'?i:last,-1);
      kb.entities.splice(lastKnot>=0?lastKnot+1:kb.entities.length,0,promoted.record);
    }
  }
  for(const write of promoted.writes){assert(!write.remove,`${pkg.id}: unexpected remove write`);fs.writeFileSync(write.path,write.body,'utf8');}
  console.log(`validated+applied ${pkg.id}`);
}

const byId=id=>kb.entities.find(r=>r.id===id);
assert(byId('knot-albright').description==='Easier on-the-water braid-to-fluoro alternative to the FG knot','Albright description postcondition');
assert(byId('knot-arbor').description==='Use for tying line to spool','Arbor description postcondition');
assert(byId('knot-arbor').picture?.src==='KB/Knots/assets/knot-arbor/step-09.jpg','Arbor picture postcondition');
assert(byId('knot-arbor').pictureSequence?.length===9,'Arbor sequence postcondition');
assert(byId('bowline-knot').content==='KB/Knots/content/Bowline Knot.md','Bowline content postcondition');
assert(byId('bowline-knot').picture?.src==='KB/Knots/assets/bowline-knot/step-07.jpg','Bowline picture postcondition');
assert(byId('bowline-knot').pictureSequence?.length===7,'Bowline sequence postcondition');
assert(byId('knot-fg').picture?.src==='KB/Knots/assets/knot-fg/step-29.jpg','FG picture postcondition');
assert(byId('knot-fg').pictureSequence?.length===29,'FG sequence postcondition');
fs.writeFileSync(KB_PATH,JSON.stringify(kb,null,2)+'\n','utf8');
console.log('FISH099 package validation and canonical apply complete');
