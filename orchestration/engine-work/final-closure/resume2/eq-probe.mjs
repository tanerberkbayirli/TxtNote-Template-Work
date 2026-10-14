import fs from 'node:fs';
import {createRequire} from 'node:module';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../engine/src/contentModel.js';
import generic from '../../../../engine/src/templates/generic.js';
const require=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url));
const {unzipSync,zipSync,strFromU8,strToU8}=require('fflate');
const files=unzipSync(fs.readFileSync('orchestration/engine-work/final-closure/long/table-only-source.docx'));
const original=strFromU8(files['word/document.xml']);
const sect=original.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
const spacing=(line)=>`<w:spacing w:before="0" w:after="0" w:line="${line}" w:lineRule="auto"/>`;
const mark=(n,line=360)=>`<w:p><w:pPr>${spacing(line)}</w:pPr><w:r><w:t>MARK${n}</w:t></w:r></w:p>`;
const r=(t)=>`<m:r><m:t>${t}</m:t></m:r>`;
const eqs={
 text:`<m:oMath>${r('x=1+2')}</m:oMath>`,
 frac:`<m:oMath><m:f><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f></m:oMath>`,
 fracLabel:`<m:oMath>${r('precision=')}<m:f><m:num>${r('(TP)')}</m:num><m:den>${r('(TP+FP)')}</m:den></m:f></m:oMath>`,
 sup:`<m:oMath><m:sSup><m:e>${r('x')}</m:e><m:sup>${r('2')}</m:sup></m:sSup></m:oMath>`,
 sub:`<m:oMath><m:sSub><m:e>${r('W')}</m:e><m:sub>${r('ia')}</m:sub></m:sSub></m:oMath>`,
 sum:`<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${r('i=1')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('x')}</m:e></m:nary></m:oMath>`,
 sqrt:`<m:oMath><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${r('a+b')}</m:e></m:rad></m:oMath>`,
 fracText:`<m:oMath><m:f><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f></m:oMath><w:r><w:t xml:space="preserve"> and text</w:t></w:r>`,
};
let body=mark(0),k=1;
const order=[];
for(const [name,x] of Object.entries(eqs)){for(const line of [360,240]){body+=`<w:p><w:pPr>${spacing(line)}</w:pPr>${x}</w:p>`+mark(k,360);order.push([name,line,k]);k++;}}
const doc=`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${body}${sect}</w:body></w:document>`;
files['word/document.xml']=strToU8(doc);
const bytes=zipSync(files);fs.writeFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe.docx',bytes);
fs.writeFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe.order.json',JSON.stringify(order));
const document=await importThesisDocx(bytes),note=installContentDocument({title:'Eq probe',content:'',researchData:{thesis:{templateId:generic.id}}},document);
fs.writeFileSync('TxtNote/frontend/tests/generated/EQ_PROBE.fixture.json',JSON.stringify({...note,__template:generic}));
console.log('ok',order.length);
