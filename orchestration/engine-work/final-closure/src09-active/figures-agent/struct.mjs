import {readFileSync} from 'node:fs';
const {importThesisDocx}=await import('../../../../../engine/src/importDocx.js');
const cases=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases;
const c=cases.find(c=>c.id==='SRC09'),input=c.input||c.inputs[0];
const doc=await importThesisDocx(readFileSync(input.path));
globalThis.doc=doc;
const find=(nodes,id)=>{for(const n of nodes||[]){if(n.id===id)return n;const r=find(n.children,id);if(r)return r;}};
for(const s of doc.sections){const p=find(s.nodes,process.argv[2]);if(p){const show=(n,d=0)=>{console.log(' '.repeat(d)+n.type+' '+n.tag+' '+n.id+' '+JSON.stringify(Object.fromEntries(Object.entries(n.attributes||{}).map(([k,v])=>[k,String(v).slice(0,30)]))));(n.children||[]).forEach(c=>show(c,d+1))};show(p);console.log(JSON.stringify(p.properties).slice(0,600));break;}}
