import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import { importThesisDocx } from './importDocx.js';
import { installContentDocument } from './contentModel.js';
import { compileThesisDocument } from './engine.js';
import { buildThesisDocx } from './export.js';
import { docxImportFixture } from '../../TxtNote/frontend/src/lib/fixtures/docxImportFixture.js';
import generic from './templates/generic.js';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const parse=xml=>new DOMParser().parseFromString(xml,'application/xml');
const nodes=(root,name)=>Array.from(root.getElementsByTagNameNS(W,name));
async function note(input){return installContentDocument({title:'T',content:'',researchData:{thesis:{templateId:generic.id}}},await importThesisDocx(input));}
async function output(n){const m=compileThesisDocument(generic,n.researchData.thesis,n.title,n.content);const b=await buildThesisDocx(m);const files=unzipSync(new Uint8Array(await b.arrayBuffer()));return{m,files,xml:strFromU8(files['word/document.xml']),root:parse(strFromU8(files['word/document.xml']))};}
test('native editable drawing stories retain boundary spaces and whitespace-only rich runs',async()=>{
 const body='<w:p><w:r><w:pict xmlns:v="urn:schemas-microsoft-com:vml"><v:shape id="space-control" style="width:180pt;height:60pt"><v:textbox><w:txbxContent><w:p><w:r><w:t xml:space="preserve">First </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>second</w:t></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t xml:space="preserve">third </w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r></w:p>';
 const n=await note(docxImportFixture({body}));
 n.content=n.content.replaceAll('second','changed');
 for(const [key,value]of Object.entries(n.researchData.thesis.sectionContent || {}))n.researchData.thesis.sectionContent[key]=value.replaceAll('second','changed');
 const x=await output(n),story=nodes(x.root,'txbxContent')[0];
 assert.deepEqual(nodes(story,'t').map(t=>t.textContent),['First ','changed',' ','third ']);
 assert.equal(nodes(story,'b').length,1);
});
test('source DOCX keeps inherited and direct paragraph/run/table formatting instead of the section default',async()=>{
  const input=docxImportFixture({styles:'<w:style w:type="paragraph" w:styleId="Cover"><w:pPr><w:jc w:val="center"/><w:spacing w:before="360" w:after="240"/><w:keepNext/></w:pPr><w:rPr><w:sz w:val="26"/></w:rPr></w:style>',body:'<w:p><w:pPr><w:pStyle w:val="Cover"/></w:pPr><w:r><w:t>Cover title</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="1000"/><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="600" w:hRule="exact"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="1000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial"/><w:sz w:val="20"/></w:rPr><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'});
  const x=await output(await note(input));
  assert.match(x.xml,/<w:pStyle w:val="Cover"/);assert.match(strFromU8(x.files['word/styles.xml']),/w:before="360"/);
  assert.match(x.xml,/w:ascii="Arial"/);assert.match(x.xml,/w:hRule="exact"/);assert.match(x.xml,/<w:gridCol w:w="3000"/);
});
test('source export writes actual text edits, insertion and deletion rather than returning the old package',async()=>{
  const n=await note(docxImportFixture({body:'<w:p><w:r><w:t>Change me</w:t></w:r></w:p><w:p><w:r><w:t>Delete me</w:t></w:r></w:p>'}));
  n.content=n.content.replace('Change me','Changed now').replace(/<p\b[^>]*>[\s\S]*?<\/p>/g,p=>p.includes('Delete me')?'':p)+'<p><span data-fmt-pt="24" class="fmt-bold">Added 24</span></p>';
  const x=await output(n);assert.match(x.xml,/Changed now/);assert.match(x.xml,/Added 24/);assert.doesNotMatch(x.xml,/Change me|Delete me/);assert.match(x.xml,/<w:sz w:val="48"/);assert.match(x.xml,/<w:b w:val="1"/);
});
test('formatting inserted inside an imported text leaf becomes its own correctly styled Word run',async()=>{
  const n=await note(docxImportFixture());n.content=n.content.replace('Kaynak metin','Kaynak <strong data-fmt-pt="24">yeni</strong> metin');
  const x=await output(n),runs=nodes(x.root,'r');const styled=runs.find(r=>r.textContent==='yeni');assert.ok(styled);assert.equal(nodes(styled,'sz')[0].getAttributeNS(W,'val'),'48');assert.equal(nodes(styled,'b')[0].getAttributeNS(W,'val'),'1');
});
test('explicit normal weight and style survive source DOCX export',async()=>{
  const n=await note(docxImportFixture());
  n.content=n.content.replace('Kaynak metin','<span class="fmt-not-bold fmt-not-italic">Normal metin</span>');
  const x=await output(n);
  const run=nodes(x.root,'r').find(r=>nodes(r,'t').some(t=>t.textContent==='Normal metin'));
  assert.ok(run);
  assert.equal(nodes(run,'b')[0]?.getAttributeNS(W,'val'),'0');
  assert.equal(nodes(run,'i')[0]?.getAttributeNS(W,'val'),'0');
});
test('a valid TOC/PAGEREF field stream survives a source section boundary',async()=>{
  const body='<w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:pPr><w:r><w:fldChar w:fldCharType="begin"/><w:instrText> TOC \\o "1-3" </w:instrText><w:fldChar w:fldCharType="separate"/><w:t>Row one</w:t></w:r></w:p><w:p><w:r><w:t>Row two</w:t><w:fldChar w:fldCharType="end"/></w:r></w:p>';
  const x=await output(await note(docxImportFixture({body})));assert.equal(x.m.nativeDocument.sections.length,2);assert.equal(nodes(x.root,'instrText')[0].textContent,' TOC \\o "1-3" ');assert.equal(nodes(x.root,'fldChar').length,3);assert.equal(nodes(x.root,'sectPr').length,2);
});
test('source export respects document margin overrides',async()=>{
  const n=await note(docxImportFixture());n.researchData.thesis.layout={page:{margins:{leftMm:40,topMm:35}}};const x=await output(n),margin=nodes(x.root,'pgMar').at(-1);assert.equal(margin.getAttributeNS(W,'left'),String(Math.round(40*1440/25.4)));assert.equal(margin.getAttributeNS(W,'top'),String(Math.round(35*1440/25.4)));
});
test('new inline pictures and equations in a source document are real related Word objects',async()=>{
  const n=await note(docxImportFixture());const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  n.content+='<p><img src="data:image/png;base64,'+png+'" width="20" height="20"/><span class="math-formula" data-latex="x^2"></span></p>';
  const x=await output(n);assert.ok(nodes(x.root,'drawing').length);assert.ok(x.root.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math','oMath').length);assert.match(strFromU8(x.files['word/_rels/document.xml.rels']),/txnSourceImage/);assert.ok(Object.keys(x.files).some(p=>p.startsWith('word/media/')));assert.equal(nodes(x.root,'r').some(r=>nodes(r,'r').length),false);
});
test('new source-document lists, links and footnotes retain their Word semantics',async()=>{
  const n=await note(docxImportFixture());n.content+='<ol start="3"><li>First</li><li>Second</li></ol><p><a href="https://example.com/a">Link</a><span class="academic-footnote" data-fn-text="New note" data-fn-index="1">1</span></p>';
  const x=await output(n);assert.ok(nodes(x.root,'numPr').length);assert.match(strFromU8(x.files['word/numbering.xml']),/<w:start w:val="3"/);assert.match(strFromU8(x.files['word/_rels/document.xml.rels']),/https:\/\/example.com\/a/);assert.ok(nodes(x.root,'footnoteReference').length);assert.match(strFromU8(x.files['word/footnotes.xml']),/New note/);
});
test('source export keeps tab leaves empty, rPr children in schema order and drawing relationships resolvable',async()=>{
  const styles='<w:style w:type="character" w:styleId="Hyperlink"><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>';
  const body='<w:p><w:hyperlink w:anchor="_Toc1"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:noProof/></w:rPr><w:t>Heading</w:t></w:r><w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:tab/></w:r></w:hyperlink></w:p><w:p><w:r><w:t>Plain</w:t></w:r></w:p>';
  const n=await note(docxImportFixture({styles,body}));
  n.content=n.content.replace('Plain','<strong data-fmt-color="#ff0000" data-fmt-pt="14" class="fmt-underline">Plain</strong>');
  const x=await output(n);
  for(const tab of nodes(x.root,'tab'))if(tab.parentNode.localName==='r')assert.equal(tab.childNodes.length,0,'w:tab is a leaf element');
  const order='rStyle rFonts b bCs i iCs caps smallCaps strike noProof vanish webHidden color spacing w kern position sz szCs highlight u effect vertAlign'.split(' ');
  for(const pr of nodes(x.root,'rPr')){const ranks=Array.from(pr.childNodes).filter(c=>c.nodeType===1).map(c=>order.indexOf(c.localName)).filter(i=>i>=0);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b),pr.toString());}
  const rels=strFromU8(x.files['word/_rels/document.xml.rels']);
  for(const m of x.xml.matchAll(/r:(?:embed|id|link)="([^"]+)"/g))assert.ok(rels.includes(`Id="${m[1]}"`),`relationship ${m[1]} exists`);
});
