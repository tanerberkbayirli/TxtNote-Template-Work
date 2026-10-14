import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {unzipSync,zipSync,strToU8} from '../../../engine/node_modules/fflate/esm/browser.js';
import {importThesisDocx} from '../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../engine/src/contentModel.js';
import generic from '../../../engine/src/templates/generic.js';
import {readDocxPackage,child,children} from '../../../engine/src/docx/importPackage.js';
const root=new URL('./tab-controls/',import.meta.url);mkdirSync(root,{recursive:true});
const original=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/RESUME14_SRC10.fixture.json')).researchData.thesis.document;
for(const id of [360,708,1440,'tail']){
 const twips=id==='tail'?708:id;
 const files=unzipSync(Buffer.from(original.source.packageBase64,'base64'));
 files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:t>A</w:t><w:tab/><w:t>B</w:t><w:tab/><w:t>C</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr></w:body></w:document>`);
 const text=new TextDecoder().decode(files['word/settings.xml']).replace(/<w:defaultTabStop[^>]*\/>/,`<w:defaultTabStop w:val="${twips}"/>`);
 files['word/settings.xml']=strToU8(text);
 if(id==='tail') files['word/document.xml']=strToU8(new TextDecoder().decode(files['word/document.xml']).replace('<w:t>C</w:t>','<w:t>C</w:t><w:tab/>').replace('w:right="1440"','w:right="8466"'));
 const bytes=zipSync(files);writeFileSync(new URL(`tabs-${id}.docx`,root),bytes);
 const d=await importThesisDocx(bytes);const n=installContentDocument({title:`TABS${twips}`,content:'',researchData:{thesis:{templateId:generic.id}}},d);
 writeFileSync(`TxtNote/frontend/tests/generated/TABS14_${id}.fixture.json`,JSON.stringify({...n,__template:generic}));
}
const pkg=await readDocxPackage(Buffer.from(original.source.packageBase64,'base64'));
const paragraph=children(child(pkg.xml('word/document.xml').documentElement,'body'),'p')[354].toString();
for(const kern of [0,3,30]){
 const files=unzipSync(Buffer.from(original.source.packageBase64,'base64'));
 const p=paragraph.replace(/<w:rPr>/g,`<w:rPr><w:kern w:val="${kern}"/>`);
 files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="2268" w:right="1418"/></w:sectPr></w:body></w:document>`);
 const bytes=zipSync(files);writeFileSync(new URL(`kern-${kern}.docx`,root),bytes);
 const d=await importThesisDocx(bytes);const n=installContentDocument({title:`KERN${kern}`,content:'',researchData:{thesis:{templateId:generic.id}}},d);
 writeFileSync(`TxtNote/frontend/tests/generated/KERN14_${kern}.fixture.json`,JSON.stringify({...n,__template:generic}));
}
