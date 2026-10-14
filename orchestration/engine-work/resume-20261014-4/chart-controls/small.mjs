import{readFileSync,writeFileSync}from'node:fs';import{installContentDocument}from'../../../../engine/src/contentModel.js';
const n=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/PARETO14_SRC09.fixture.json')),d=n.researchData.thesis.document;
const p=d.sections.flatMap(s=>s.nodes).find(p=>p.type==='paragraph'&&JSON.stringify(p).includes('chartex'));
if(!p)throw Error('Chart not found');d.sections=[{...d.sections[0],nodes:[p]}];
const note=installContentDocument({title:'Pareto',content:'',researchData:{thesis:{templateId:n.__template.id}}},d);
writeFileSync('TxtNote/frontend/tests/generated/PARETO14_CONTROL.fixture.json',JSON.stringify({...note,__template:n.__template}));
