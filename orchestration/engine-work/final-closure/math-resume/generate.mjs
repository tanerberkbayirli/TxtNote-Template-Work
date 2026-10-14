import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../engine/src/contentModel.js';
import generic from '../../../../engine/src/templates/generic.js';
const {unzipSync,zipSync,strFromU8,strToU8}=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url))('fflate');
const out='orchestration/engine-work/final-closure/math-resume';mkdirSync(out,{recursive:true});
const r=t=>`<m:r><m:t>${t}</m:t></m:r>`;
const cases=[
  {id:'SUMDEFAULT',op:'∑',pr:'',tag:'munderover',sub:true,sup:true},
  {id:'SUMSIDE',op:'∑',pr:'<m:limLoc m:val="subSup"/>',tag:'msubsup',sub:true,sup:true},
  {id:'INTDEFAULT',op:'∫',pr:'',tag:'msubsup',sub:true,sup:true},
  {id:'INTUNDER',op:'∫',pr:'<m:limLoc m:val="undOvr"/>',tag:'munderover',sub:true,sup:true},
  {id:'HIDELOW',op:'∑',pr:'<m:subHide/>',tag:'mover',sub:false,sup:true},
  {id:'HIDEHIGH',op:'∑',pr:'<m:supHide m:val="1"/>',tag:'munder',sub:true,sup:false},
  {id:'HIDEBOTH',op:'∑',pr:'<m:subHide/><m:supHide/>',tag:'mo',sub:false,sup:false},
  {id:'EMPTYLOC',op:'∫',pr:'<m:limLoc/>',tag:'munderover',sub:true,sup:true},
];
const files=unzipSync(readFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe.docx'));
const old=strFromU8(files['word/document.xml']),sect=old.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
const body=cases.map(c=>`<w:p><w:r><w:t>${c.id}</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><m:oMath><m:nary><m:naryPr><m:chr m:val="${c.op}"/>${c.pr}</m:naryPr><m:sub>${r('L')}</m:sub><m:sup>${r('U')}</m:sup><m:e>${r('x')}</m:e></m:nary></m:oMath></w:p>`).join('');
files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${body}${sect}</w:body></w:document>`);
const bytes=zipSync(files);writeFileSync(`${out}/nary-source.docx`,bytes);
writeFileSync(`${out}/cases.json`,JSON.stringify(cases,null,2));
const install=(id,d)=>{const note=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},d);writeFileSync(`TxtNote/frontend/tests/generated/${id}.fixture.json`,JSON.stringify({...note,__template:generic}));};
install('NARY_RESUME',await importThesisDocx(bytes));
const acceptance=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
for(const id of ['SRC09','SRC10']){
 const c=acceptance.cases.find(c=>c.id===id),input=c.input||c.inputs[0];
 install(`${id}_MATH_RESUME`,await importThesisDocx(readFileSync(input.path)));
}
console.log('Fresh imports: NARY_RESUME, SRC09_MATH_RESUME, SRC10_MATH_RESUME');
