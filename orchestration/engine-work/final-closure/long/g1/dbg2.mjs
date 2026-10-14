import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/SRC09.fixture.json','utf8'));
const find=(o,id)=>{if(o&&typeof o==='object'){if(o.id===id&&o.type)return o;for(const v of Object.values(o)){const r=find(v,id);if(r)return r}}};
const n=find(d.researchData,process.argv[2]);
const out=[];const visit=(nodes,dp=0)=>{for(const c of nodes||[]){out.push(' '.repeat(dp)+c.type+' '+c.tag+' id='+c.id+' hidden='+(c.attributes&&Object.hasOwn(c.attributes,'hidden'))+' shape='+(c.properties&&c.properties.shape?JSON.stringify({k:c.properties.shape.kind,w:c.properties.shape.wrap,v:c.properties.shape.vertical,h:c.properties.shape.heightPt}):'-'));if(c.type!=='paragraph'&&dp<9)visit(c.children,dp+1)}};
visit(n.children);console.log(out.slice(0,40).join('\n'));
