import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/SRC09.fixture.json','utf8'));
const find=(o,id)=>{if(o&&typeof o==='object'){if(o.id===id&&o.type)return o;for(const v of Object.values(o)){const r=find(v,id);if(r)return r}}};
for(const id of process.argv.slice(2)){
const n=find(d.researchData,id);
const out=[];const visit=(nodes,hid=false)=>{for(const c of nodes||[]){const h=hid||(c.attributes&&Object.hasOwn(c.attributes,'hidden'));if(c.type==='drawing'&&c.properties?.shape){const s=c.properties.shape;out.push(`${h?'H':' '} ${s.kind} wrap=${s.wrap} w=${s.widthPt} h=${s.heightPt} H=${JSON.stringify(s.horizontal)} V=${JSON.stringify(s.vertical)} dist=${JSON.stringify(s.distPt)} txt=${s.hasText}`)}if(c.type!=='paragraph')visit(c.children,h)}};
visit(n.children);console.log(id);console.log(out.join('\n'))}
