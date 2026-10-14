import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {unzipSync,zipSync,strFromU8,strToU8}=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url))('fflate');
const files=unzipSync(readFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe.docx'));
const sect=strFromU8(files['word/document.xml']).match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
const run=t=>`<m:r><m:t>${t}</m:t></m:r>`;
const nary=loc=>`<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="${loc}"/></m:naryPr><m:sub>${run('L')}</m:sub><m:sup>${run('U')}</m:sup><m:e>${run('x')}</m:e></m:nary></m:oMath>`;
const cases=[];
for(const loc of ['undOvr','subSup'])for(const before of ['', '<w:r><w:t xml:space="preserve"> </w:t></w:r>', '<w:r><w:t>TEXT</w:t></w:r>']){
 const id=`C${cases.length}`;cases.push({id,loc,before});
}
const body=cases.map(c=>`<w:p><w:r><w:t>${c.id}</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/></w:pPr>${c.before}${nary(c.loc)}</w:p>`).join('');
files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${body}${sect}</w:body></w:document>`);
writeFileSync('orchestration/engine-work/final-closure/src09-active/nary.docx',zipSync(files));
writeFileSync('orchestration/engine-work/final-closure/src09-active/nary-cases.json',JSON.stringify(cases));
