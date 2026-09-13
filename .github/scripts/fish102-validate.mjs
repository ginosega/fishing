import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validatePackage} from '../../pwa/src/handoff.mjs';

const expectedMain='1b421ac67d27fb6279b4e5f5a7db9402596323ea';
const pkg={
  format:'fishing-companion-change-v2',domain:'kb',operation:'add',id:'line-tackle-knot-reference',
  base:{schemaVersion:2,sourceRevision:'360d71ff2bfaf075ad498d18f05126268f6606f1',recordHash:null},
  record:{id:'line-tackle-knot-reference',name:'Line-Tackle-Knot Reference',type:'knot',description:'Recommended knots for line, lure, and tackle combinations'},
  notes:{action:'create',path:'KB/Knots/content/Line-Tackle-Knot Reference.md',body:'**Braided line**\n- To leader: FG knot, or Albright when on the water\n- To swivel: N/A (the swivel is in the leader)\n- To snap: Palomar\n- To hook: N/A (use leader)\n- To lure: Palomar or Modified Uni (topwater fishing only, otherwise use leader)\n\n**Fluorocarbon**\n- To swivel: Trilene\n- To snap: Trilene\n- To hook: Improved Clinch, or Palomar for heavier tackle\n- To lure: Use snap for more action, otherwise Palomar\n\n**Monofilament**\n- To swivel: Improved Clinch\n- To snap: Improved Clinch\n- To hook: Improved Clinch, or Palomar for heavier tackle\n- To lure: Use snap for more action, otherwise Palomar',baseSha256:null},
  picture:{action:'add',path:'KB/Knots/assets/Line-Tackle-Knot Reference.png',file:{bytes:2603991,sha256:'520957564ae81f5f0bdee377785f35a31026366260b4822216b1a537ef851072'}},
  pictureSequence:{action:'keep'}
};

const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
validatePackage(pkg);
const currentMain=execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim();
assert(currentMain===expectedMain,`main moved during validation: ${currentMain}`);
execFileSync('git',['merge-base','--is-ancestor',pkg.base.sourceRevision,currentMain]);
execFileSync('git',['merge-base','--is-ancestor',expectedMain,'HEAD']);
const kb=JSON.parse(await fs.readFile('KB/kb.json','utf8'));
assert(kb.schemaVersion===2,'KB schemaVersion changed');
assert(!kb.entities.some(x=>x.id===pkg.id),'Requested ID already exists');
try{await fs.access(pkg.notes.path);throw new Error('Requested Markdown path already exists');}catch(error){if(error.message==='Requested Markdown path already exists')throw error;if(error.code!=='ENOENT')throw error;}
const bytes=await fs.readFile(pkg.picture.path);
assert(bytes.byteLength===pkg.picture.file.bytes,`Picture bytes mismatch: ${bytes.byteLength}`);
const digest=crypto.createHash('sha256').update(bytes).digest('hex');
assert(digest===pkg.picture.file.sha256,`Picture sha256 mismatch: ${digest}`);
console.log(JSON.stringify({validated:true,baseRevision:pkg.base.sourceRevision,currentMain,id:pkg.id,pictureBytes:bytes.byteLength,pictureSha256:digest},null,2));
