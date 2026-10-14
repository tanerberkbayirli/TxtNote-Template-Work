import{readFileSync,writeFileSync}from'node:fs';import{unzipSync,zipSync,strFromU8,strToU8}from'../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';import{importThesisDocx}from'../../engine/src/importDocx.js';import{installContentDocument}from'../../engine/src/contentModel.js';import generic from'../../engine/src/templates/generic.js';
const a=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json'));const output=[];
for(const id of ['SRC01','SRC04','SRC05','EDGE_STRUCTURE']){
 const c=a.cases.find(c=>c.id===id);const z=unzipSync(readFileSync(c.input.path)),d=await importThesisDocx(readFileSync(c.input.path));
 const xml=strFromU8(z['word/document.xml']);const body=d.sections.map((s,i)=>`<w:p><w:r><w:t>${id}_SECTION_${i+1}</w:t></w:r></w:p>`+(i===d.sections.length-1?s.properties.ooxml:`<w:p><w:pPr>${s.properties.ooxml}</w:pPr></w:p>`)).join('');
 z['word/document.xml']=strToU8(xml.replace(/<w:body[\s>][\s\S]*<\/w:body>/,`<w:body>${body}</w:body>`));
 const bytes=zipSync(z);writeFileSync(`orchestration/engine-work/mission06/${id}-geometry.docx`,bytes);
 const native=await importThesisDocx(bytes),n=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},native);writeFileSync(`orchestration/engine-work/mission06/${id}-geometry.fixture.json`,JSON.stringify({...n,__template:generic},null,2));
 output.push({id,source:c.input,role:'Section geometry excerpt; original sectPr, header/footer parts, styles and settings retained; body replaced with one marker per native section. Not long-thesis pagination acceptance.',sections:d.sections.map(s=>s.properties)});
}
writeFileSync('orchestration/engine-work/mission06/source-excerpts.json',JSON.stringify(output,null,2));
