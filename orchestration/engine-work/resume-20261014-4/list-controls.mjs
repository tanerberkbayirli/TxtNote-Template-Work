import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{unzipSync,zipSync,strToU8,strFromU8}from'../../../engine/node_modules/fflate/esm/browser.js';
import{importThesisDocx}from'../../../engine/src/importDocx.js';import{installContentDocument}from'../../../engine/src/contentModel.js';import generic from'../../../engine/src/templates/generic.js';
const root=new URL('./list-controls/',import.meta.url);mkdirSync(root,{recursive:true});
const source=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/KERN14_SRC10.fixture.json')).researchData.thesis.document;
const original=unzipSync(Buffer.from(source.source.packageBase64,'base64')),xml=strFromU8(original['word/document.xml']);
const hit=xml.indexOf('False Negative: '),start=xml.lastIndexOf('<w:p ',hit),end=xml.indexOf('</w:p>',hit)+6,p=xml.slice(start,end);
if(!p.includes('actually positive.'))throw Error('Wrong paragraph');
for(const kind of['bullet','plain'])for(const height of[602,604,606,608]){
 const mode=`${kind}-${height}`,files={...original};
 const para=kind==='bullet'?p:p.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/,'').replace('<w:pStyle w:val="GvdeMetni1"/>','<w:pStyle w:val="GvdeMetni1"/><w:ind w:left="720" w:hanging="158"/>');
 const spacer=`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${height*20}" w:lineRule="exact"/></w:pPr><w:r><w:t>SPACER</w:t></w:r></w:p>`;
 const sect='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1643" w:left="2268"/><w:cols w:space="708"/></w:sectPr>';
 files['word/document.xml']=strToU8(xml.replace(/<w:body>[\s\S]*<\/w:body>/,`<w:body>${spacer}${para}${sect}</w:body>`));
 const bytes=zipSync(files);writeFileSync(new URL(mode+'.docx',root),bytes);
 const d=await importThesisDocx(bytes),note=installContentDocument({title:mode,content:'',researchData:{thesis:{templateId:generic.id}}},d);
 writeFileSync(`TxtNote/frontend/tests/generated/LIST14_${mode}.fixture.json`,JSON.stringify({...note,__template:generic}));
}
