import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {installContentDocument,contentNodesToHtml} from '../../../../engine/src/contentModel.js';
import {compileThesisDocument} from '../../../../engine/src/engine.js';
import {buildThesisDocx} from '../../../../engine/src/export.js';
import generic from '../../../../engine/src/templates/generic.js';
const require=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url));
const {unzipSync,zipSync,strFromU8,strToU8}=require('fflate');
const {DOMParser}=require('@xmldom/xmldom');
const out='orchestration/engine-work/final-closure/quick-math';mkdirSync(out,{recursive:true});
const r=t=>`<m:r><m:t>${t}</m:t></m:r>`;
const d=(pr,args=['a','b','c'])=>`<m:d><m:dPr>${pr}</m:dPr>${args.map(t=>`<m:e>${r(t)}</m:e>`).join('')}</m:d>`;
const f=type=>`<m:f><m:fPr>${type?`<m:type m:val="${type}"/>`:''}</m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`;
const cases=[
 {id:'DEFAULT',xml:d(''),text:'(a|b|c)'},
 {id:'OPENEMPTY',xml:d('<m:begChr/>'),text:'a|b|c)'},
 {id:'CLOSEEMPTY',xml:d('<m:endChr m:val=""/>'),text:'(a|b|c'},
 {id:'BOTHEMPTY',xml:d('<m:begChr m:val=""/><m:endChr/>'),text:'a|b|c'},
 {id:'CUSTOM',xml:d('<m:begChr m:val="["/><m:sepChr m:val=";"/><m:endChr m:val="]"/>'),text:'[a;b;c]'},
 {id:'NOSEPARATOR',xml:d('<m:sepChr/>'),text:'(abc)'},
 {id:'SINGLE',xml:d('',['x']),text:'(x)'},
 {id:'BAR',xml:f(''),text:'ab',type:'bar'},
 {id:'NOBAR',xml:f('noBar'),text:'ab',type:'noBar'},
 {id:'LINEAR',xml:f('lin'),text:'a⁄b',type:'lin'},
];
const files=unzipSync(readFileSync('orchestration/engine-work/final-closure/resume2/exp/eqprobe.docx'));
const sect=strFromU8(files['word/document.xml']).match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
files['word/document.xml']=strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${cases.map(c=>`<w:p><w:r><w:t>${c.id}</w:t></w:r></w:p><w:p><m:oMath>${c.xml}</m:oMath></w:p>`).join('')}${sect}</w:body></w:document>`);
const bytes=zipSync(files);writeFileSync(`${out}/source.docx`,bytes);
writeFileSync(`${out}/cases.json`,JSON.stringify(cases,null,2));
const doc=await importThesisDocx(bytes);
const note=installContentDocument({title:'QUICK_MATH',content:'',researchData:{thesis:{templateId:generic.id}}},doc);
writeFileSync('TxtNote/frontend/tests/generated/QUICK_MATH.fixture.json',JSON.stringify({...note,__template:generic}));
const html=contentNodesToHtml(doc.sections.flatMap(s=>s.nodes),{stampIds:false});
const exported=new Uint8Array(await (await buildThesisDocx(compileThesisDocument(generic,{},'T',html),{})).arrayBuffer());
writeFileSync(`${out}/roundtrip.docx`,exported);
const signature=n=>[n.localName,Array.from(n.attributes||[]).filter(a=>!a.name.startsWith('xmlns')).map(a=>[a.namespaceURI,a.localName,a.value]).sort(),Array.from(n.childNodes||[]).filter(c=>c.nodeType===1||c.nodeType===3&&c.data.trim()).map(c=>c.nodeType===1?signature(c):c.data)];
const equations=bytes=>Array.from(new DOMParser().parseFromString(strFromU8(unzipSync(bytes)['word/document.xml']),'application/xml').getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math','oMath')).map(signature);
assert.deepEqual(equations(exported),equations(bytes));
const reopened=await importThesisDocx(exported);
const reopenedHtml=contentNodesToHtml(reopened.sections.flatMap(s=>s.nodes),{stampIds:false});
for(const fragment of ['linethickness="0"','separator="true"','stretchy="false"'])assert.ok(reopenedHtml.includes(fragment),fragment);
writeFileSync(`${out}/roundtrip.json`,JSON.stringify({status:'PASS',equations:cases.length,sourceOmmlUnchanged:true,reimportPreview:true},null,2));
console.log('Generated 10 cases; export/reimport PASS, source OMML unchanged.');
