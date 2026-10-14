import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {strFromU8,unzipSync} from 'fflate';
import generic from '../thesis/templates/generic.js';
import {compileThesisDocument,groupThesisSections} from '../thesis/engine.js';
import {buildThesisPageModel,thesisPagedCss} from '../thesis/pageLayout.js';
import {buildThesisDocx} from '../thesis/export.js';
import {importThesisDocx} from '../thesis/importDocx.js';
import {installContentDocument} from '../thesis/contentModel.js';
import {docxImportFixture} from './fixtures/docxImportFixture.js';
const group=(id,start=true,numbering={})=>({id,pageBreakBefore:start,rules:{page:{...structuredClone(generic.page),numbering:{enabled:true,format:'arabic',restart:false,...numbering}}},sections:[{specialPage:true}]});
const pages=(groups,counts)=>buildThesisPageModel(groups,counts).flatMap(g=>g.pages);
describe('Mission 06 section geometry',()=>{
 it('even-page padding is unlabelled, has no chrome and counts before restarting',()=>{
  const a=group('a'),b=group('b','evenPage',{restart:true,startAt:4});
  const p=pages([a,b],{a:2,b:2});assert.deepEqual(p.map(p=>p.label),['1','2','','4']);assert.equal(p[2].showHeader,false);assert.equal(p[2].showFooter,false);assert.equal(p[3].physicalIndex,3);
 });
 it('rounds conflicting numbered odd starts up without adding an extra sheet',()=>{const a=group('a'),b=group('b','oddPage',{restart:true,startAt:2});a.rules.page.header={evenContent:'EVEN'};assert.deepEqual(pages([a,b],{a:2,b:1}).map(p=>p.label),['1','2','3']);});
 it('ignores parity breaks on the first Word section',()=>assert.deepEqual(pages([group('a','evenPage')],{a:1}).map(p=>p.label),['1']));
 it('does not pad an even start already on an even physical sheet',()=>assert.deepEqual(pages([group('a'),group('b','evenPage')],{a:1,b:1}).map(p=>p.label),['1','2']));
 it('matches Word duplex numbering restarts even at ordinary next-page breaks',()=>{
  const a=group('a'),b=group('b',true,{format:'roman-lower',restart:true,startAt:1});a.rules.page.header={content:'ODD',evenContent:'EVEN'};
  assert.deepEqual(pages([a,b],{a:1,b:2}).map(p=>p.label),['1','','i']);
 });
 it('reserves parity columns for next-page numbering restarts as well as explicit odd/even starts',()=>{
  const t=structuredClone(generic),m=compileThesisDocument(t,{},'Tez','<p>BODY</p>');assert.match(thesisPagedCss(groupThesisSections(m.sections)),/data-thesis-odd-page-spacer/);
 });
 it('retains counted labels on hidden pages for native PAGE fields',()=>{
  const p=pages([group('a',true,{enabled:false,restart:true,startAt:8})],{a:2});assert.deepEqual(p.map(p=>p.label),['','']);assert.deepEqual(p.map(p=>p.countedLabel),['8','9']);
 });
 it('preserves evenPage through compile, grouping and editable Word export',async()=>{
  const t=structuredClone(generic);t.sections.find(s=>s.id==='main').pageBreakBefore='evenPage';
  const m=compileThesisDocument(t,{},'Tez','<p>MAIN</p>');assert.equal(groupThesisSections(m.sections).find(s=>s.id==='main').pageBreakBefore,'evenPage');
  const z=unzipSync(new Uint8Array(await(await buildThesisDocx(m)).arrayBuffer()));assert.match(strFromU8(z['word/document.xml']),/w:type w:val="evenPage"/);
 });
 const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const head=text=>`<w:hdr xmlns:w="${W}"><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:hdr>`;
 const rel=(id,target)=>`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="${target}"/>`;
 const source=(active=false)=>docxImportFixture({relationships:rel('h','header1.xml')+rel('e','header2.xml')+(active?'<Relationship Id="settings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>':''),parts:{'word/header1.xml':head('ODD'),'word/header2.xml':head('EVEN'),'word/settings.xml':`<w:settings xmlns:w="${W}"><w:evenAndOddHeaders/></w:settings>`},finalSection:'<w:sectPr><w:headerReference w:type="default" r:id="h"/><w:headerReference w:type="even" r:id="e"/><w:type w:val="evenPage"/><w:titlePg/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:bottom="1080" w:left="1440" w:right="1800"/><w:pgNumType w:fmt="upperRoman" w:start="4"/></w:sectPr>'});
 it('uses native first-page omission rather than leaking the default header',async()=>{
  const d=await importThesisDocx(source());assert.equal(d.sections[0].properties.rules.page.header.firstContent,'');assert.equal(d.sections[0].properties.rules.page.header.content,'ODD');
 });
 it('keeps even headers inactive unless settings enable them',async()=>{
  const d=await importThesisDocx(source());assert.equal(d.sections[0].properties.rules.page.header.evenContent,undefined);
 });
 it('activates native even headers from Word settings',async()=>{const d=await importThesisDocx(source(true));assert.equal(d.sections[0].properties.rules.page.header.evenContent,'EVEN');});
 it('preserves native geometry and numbering after save/reopen',async()=>{
  const d=JSON.parse(JSON.stringify(await importThesisDocx(source()))),n=installContentDocument({title:'Tez',content:'',researchData:{thesis:{templateId:generic.id}}},d);
  const m=compileThesisDocument(generic,n.researchData.thesis,n.title,n.content),p=m.sections[0].rules.page;
  assert.equal(p.orientation,'landscape');assert.ok(Math.abs(p.widthMm-297.0036)<.05);assert.equal((p.docxMargins || p.margins).topMm,12.7);assert.equal(p.numbering.format,'roman-upper');assert.equal(p.numbering.startAt,4);
 });
 it('native logical parity preserves restarted odd numbers on even physical pages',()=>{
  const a=group('a'),b=group('b','oddPage',{restart:true,startAt:1});b.rules.page.sectionParity='logical';
  assert.deepEqual(pages([a,b],{a:1,b:1}).map(p=>p.label),['1','1']);
 });
 it('omitted Word page-number format defaults to decimal',async()=>{const d=await importThesisDocx(docxImportFixture({finalSection:'<w:sectPr><w:pgNumType w:start="1"/></w:sectPr>'}));assert.equal(d.sections[0].properties.rules.page.numbering.format,'arabic');});
 it('keeps blank footer paragraph spacing in the source model',async()=>{const d=await importThesisDocx(docxImportFixture({relationships:rel('h','header1.xml'),parts:{'word/header1.xml':head('Page').replace('</w:hdr>','<w:p><w:pPr><w:spacing w:after="200"/></w:pPr><w:r><w:t> </w:t></w:r></w:p></w:hdr>')},finalSection:'<w:sectPr><w:headerReference w:type="default" r:id="h"/></w:sectPr>'}));const p=d.sections[0].properties.rules.page.header.paragraphs;assert.equal(p.length,2);assert.equal(p[1].style.spaceAfterPt,10);});
 it('source mode excludes template-only first headers and positioned frames',async()=>{
  const d=await importThesisDocx(source()),n=installContentDocument({title:'Tez',content:'',researchData:{thesis:{templateId:generic.id}}},d),t=structuredClone(generic);
  t.page.header.firstContent='UNIVERSITY FIRST';t.page.docxMargins={...t.page.margins,leftMm:40};t.page.docxContentFrame={xMm:20,yMm:20,widthMm:120};
  const p=compileThesisDocument(t,n.researchData.thesis,n.title,n.content).sections[0].rules.page;
  assert.equal((p.docxMargins || p.margins).leftMm,25.4);assert.equal(p.docxContentFrame,undefined);assert.equal(p.header.firstContent,'');assert.equal(p.header.heightMm,0);
 });
 it('document margin edits update nominal Word margins and the source text frame together',async()=>{
  const d=await importThesisDocx(source()),n=installContentDocument({title:'Tez',content:'',researchData:{thesis:{templateId:generic.id}}},d);n.researchData.thesis.layout={page:{margins:{leftMm:40,topMm:35}}};
  const p=compileThesisDocument(generic,n.researchData.thesis,n.title,n.content).sections[0].rules.page;assert.equal(p.margins.leftMm,40);assert.equal(p.margins.topMm,35);assert.equal((p.docxMargins||p.margins).leftMm,40);assert.equal((p.docxMargins||p.margins).topMm,35);
 });
 it('renders PAGE/NUMPAGES fields live without copying stale cache values',async()=>{
  const d=await importThesisDocx(docxImportFixture({relationships:rel('h','header1.xml'),parts:{'word/header1.xml':`<w:hdr xmlns:w="${W}"><w:p><w:r><w:t>Page </w:t><w:fldChar w:fldCharType="begin"/><w:instrText> PAGE </w:instrText><w:fldChar w:fldCharType="separate"/><w:t>99</w:t><w:fldChar w:fldCharType="end"/></w:r><w:fldSimple w:instr="NUMPAGES"><w:r><w:t>999</w:t></w:r></w:fldSimple></w:p></w:hdr>`},finalSection:'<w:sectPr><w:headerReference w:type="default" r:id="h"/></w:sectPr>'}));
  assert.equal(d.sections[0].properties.rules.page.header.content,'Page {{PAGE}}{{NUMPAGES}}');
  const n=installContentDocument({title:'Tez',content:'',researchData:{thesis:{templateId:generic.id}}},d),m=compileThesisDocument(generic,n.researchData.thesis,n.title,n.content);
  const z=unzipSync(new Uint8Array(await(await buildThesisDocx(m)).arrayBuffer()));const h=Object.entries(z).filter(([n])=>/^word\/header\d+\.xml$/.test(n)).map(([,b])=>strFromU8(b)).join('');assert.match(h,/>PAGE</);assert.match(h,/>NUMPAGES</);assert.doesNotMatch(h,/>99</);
 });
});

