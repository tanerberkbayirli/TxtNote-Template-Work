import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{unzipSync,zipSync,strToU8}from'../../../engine/node_modules/fflate/esm/browser.js';
import{importThesisDocx}from'../../../engine/src/importDocx.js';import{installContentDocument}from'../../../engine/src/contentModel.js';import generic from'../../../engine/src/templates/generic.js';
const root=new URL('./table-controls/',import.meta.url);mkdirSync(root,{recursive:true});
const source=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/KERN14_SRC10.fixture.json')).researchData.thesis.document;
for(const mode of['split','whole','exact','header']){
 const files=unzipSync(Buffer.from(source.source.packageBase64,'base64'));
 const rows=Array.from({length:24},(_,i)=>`<w:tr><w:trPr>${mode==='whole'?'<w:cantSplit/>':''}<w:trHeight w:val="${mode==='exact'?400:600}"${mode==='exact'?' w:hRule="exact"':''}/></w:trPr><w:tc><w:tcPr><w:tcW w:w="6000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="${mode==='exact'?0:120}" w:after="${mode==='exact'?0:120}" w:line="${mode==='exact'?240:360}" w:lineRule="auto"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>ROW${String(i+1).padStart(2,'0')}</w:t></w:r></w:p></w:tc></w:tr>`).join('');
 files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tblPr><w:tblW w:w="6000" w:type="dxa"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="8"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid>${rows}</w:tbl><w:p><w:r><w:t>AFTER</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="10880"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr></w:body></w:document>`);
 if(mode==='header'){
  let xml=new TextDecoder().decode(files['word/document.xml']);let at=0;
  xml=xml.replace('<w:gridCol w:w="6000"/>','<w:gridCol w:w="3000"/><w:gridCol w:w="3000"/>').replace(/<w:tcW w:w="6000"/g,'<w:tcW w:w="3000"');
  xml=xml.replace(/(<w:trPr>[\s\S]*?<\/w:trPr>)(?=<w:tc>)/g,m=>{const i=at++;return m+`<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/>${i===0?'<w:vMerge w:val="restart"/>':i===1?'<w:vMerge/>':''}</w:tcPr><w:p>${i===1?'':'<w:r><w:t>HEADER</w:t></w:r>'}</w:p></w:tc>`});
  files['word/document.xml']=strToU8(xml);
 }
 const bytes=zipSync(files);writeFileSync(new URL(`${mode}.docx`,root),bytes);
 const d=await importThesisDocx(bytes),note=installContentDocument({title:mode,content:'',researchData:{thesis:{templateId:generic.id}}},d);
 writeFileSync(`TxtNote/frontend/tests/generated/GUARD14_${mode}.fixture.json`,JSON.stringify({...note,__template:generic}));
}

