import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url));
const {unzipSync,zipSync,strFromU8,strToU8}=require('fflate');
const files=unzipSync(fs.readFileSync('orchestration/engine-work/final-closure/long/table-only-source.docx'));
const sect=strFromU8(files['word/document.xml']).match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
const spacing=(line)=>`<w:spacing w:before="0" w:after="0" w:line="${line}" w:lineRule="auto"/>`;
const mark=(n)=>`<w:p><w:pPr>${spacing(360)}</w:pPr><w:r><w:t>MARK${n}</w:t></w:r></w:p>`;
const r=(t)=>`<m:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t>${t}</m:t></m:r>`;
const frac=`<m:f><m:num>${r('(TP)')}</m:num><m:den>${r('(TP+FP)')}</m:den></m:f>`;
const tab='<w:r><w:tab/></w:r>';
const v={
 plain:`<m:oMath>${r('precision=')}${frac}</m:oMath>`,
 plainRm:`<m:oMath>${r('precision=')}${frac}</m:oMath>`,
 tabs7:`<m:oMath>${r('precision=')}${frac}</m:oMath>${tab.repeat(7)}<w:r><w:tab/><w:t>(2)</w:t></w:r>${tab}`,
 tabs1:`<m:oMath>${r('precision=')}${frac}</m:oMath>${tab}<w:r><w:t>(2)</w:t></w:r>`,
 indent:`<m:oMath>${r('precision=')}${frac}</m:oMath>`,
};
let body=mark(0),k=1;const order=[];
for(const [name,x] of Object.entries(v)){const ind=name==='indent'||name==='tabs7'?'<w:ind w:firstLine="708"/>':'';body+=`<w:p><w:pPr>${spacing(360)}${ind}</w:pPr>${x}</w:p>`+mark(k);order.push([name,360,k]);k++;}
files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${body}${sect}</w:body></w:document>`);
fs.writeFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe2.docx',zipSync(files));
fs.writeFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe2.order.json',JSON.stringify(order));
