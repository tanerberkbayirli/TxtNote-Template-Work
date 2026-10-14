import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {textLines,readingOrder,ruledTables,analyzePage,repeatedMargins,rasterRegions} from '../thesis/pdf/structure.js';
import {pdfPagesToDocument,revisePdfImport,installPdfDocument} from '../thesis/pdf/model.js';
import {prepareThesisNote,contentNodesToHtml} from '../thesis/contentModel.js';
import {withImportedSections} from '../thesis/docx/projection.js';
import generic from '../thesis/templates/generic.js';
const token=(id,text,x,y,width=40,height=12)=>({id,text,x,y,width,height,baseline:y+height});
const page=(number,tokens,tables=[])=>analyzePage({number,width:600,height:800,method:'text',tokens,tables,images:[],preview:'data:image/jpeg;base64,',rotation:0});
const grid=()=>{const width=260,height=160,data=new Uint8ClampedArray(width*height*4).fill(255);const dot=(x,y)=>{const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=0;};
 for(const y of [20,70,120])for(let x=20;x<=220;x++)dot(x,y);
 for(const x of [20,120,220])for(let y=20;y<=120;y++)dot(x,y);
 return {data,width,height,dot};};
describe('controlled PDF structural import',()=>{
 it('joins real word gaps without concatenating words or changing literal text',()=>{
  const lines=textLines([token('b','dünya & <test>',65,100),token('a','Merhaba',10,100,50)]);
  assert.equal(lines[0].text,'Merhaba dünya & <test>');assert.deepEqual(lines[0].tokens.map(t=>t.id),['a','b']);
 });
 it('reads two columns as complete columns and respects full-width title bands',()=>{
  const items=[{id:'title',x:10,y:10,width:500,height:20},...Array.from({length:4},(_,i)=>({id:'left'+i,x:10,y:70+i*15,width:180,height:12})),...Array.from({length:4},(_,i)=>({id:'right'+i,x:300,y:70+i*15,width:180,height:12}))];
  assert.deepEqual(readingOrder(items.reverse()).map(i=>i.id),['title','left0','left1','left2','left3','right0','right1','right2','right3']);
 });
 it('extracts ruled cells and merged header spans from rendered geometry',()=>{
  const image=grid();let tables=ruledTables(image);assert.equal(tables.length,1);assert.equal(tables[0].cells.length,4);
  for(let y=21;y<70;y++){const i=(y*image.width+120)*4;image.data[i]=image.data[i+1]=image.data[i+2]=255;}
  tables=ruledTables(image);assert.equal(tables[0].cells[0].colspan,2);assert.equal(tables[0].cells.length,3);
 });
 it('assigns every token once including cells and separate margin stories',()=>{
  const tables=ruledTables(grid()),p=page(1,[token('header','ÜST BİLGİ',10,10),token('cell1','Hücre 1',30,35),token('cell2','Hücre 2',130,85),token('body','Gövde',20,250),token('footer','ALT BİLGİ',10,770)],tables);
  const doc=pdfPagesToDocument([p]),html=contentNodesToHtml(doc.sections[0].nodes);
  assert.match(html,/<table/);assert.match(html,/Hücre 1/);assert.match(html,/Gövde/);assert.doesNotMatch(html,/ÜST BİLGİ|ALT BİLGİ/);
  assert.equal(doc.source.pages[0].margins.header.length,1);assert.equal(doc.source.pages[0].margins.footer.length,1);
  const ids=p.items.flatMap(i=>i.kind==='table'?i.cells.flatMap(c=>c.tokens.map(t=>t.id)):i.lines.flatMap(l=>l.tokens.map(t=>t.id)));
  assert.equal(ids.length,5);assert.equal(new Set(ids).size,5);
 });
 it('keeps blank physical pages, page geometry and source bytes through save/reopen',()=>{
  const doc=pdfPagesToDocument([page(1,[token('a','İçerik',30,90)]),page(2,[])],{packageBase64:'JVBERg==',sha256:'fixed'});
  const note=installPdfDocument({title:'Test',researchData:{thesis:{templateId:generic.id}}},doc),saved=prepareThesisNote(JSON.parse(JSON.stringify(note)));
  assert.deepEqual(saved.researchData.thesis.document,doc);assert.equal(doc.sections.length,2);assert.equal(doc.source.packageBase64,'JVBERg==');
  assert.equal(withImportedSections(generic,note.researchData.thesis).sections.length,2);
 });
 it('preserves original geometry and notices while correcting text, role and order',()=>{
  const p=page(1,[token('a','Hatalı OCR',30,90),token('b','İkinci',30,170)]),issues=[{code:'ocr-review',page:1,locator:'PDF sayfa 1',message:'Kontrol edin',preserved:true}];
  const note=installPdfDocument({title:'Test'},pdfPagesToDocument([p],{issues}));
  const next=revisePdfImport(note,1,p=>{p.items[0].reviewText='Düzeltilmiş';p.items[0].kind='heading';p.items.reverse();});
  assert.equal(note.researchData.thesis.document.source.pages[0].items[0].lines[0].text,'Hatalı OCR');
  assert.match(next.content,/Düzeltilmiş/);assert.match(next.content,/<h2/);assert.ok(next.content.indexOf('İkinci')<next.content.indexOf('Düzeltilmiş'));
  assert.deepEqual(next.researchData.thesis.document.source.unsupported,issues);assert.equal(next.researchData.thesis.document.source.pages[0].tokens[0].text,'Hatalı OCR');
 });
 it('recognizes repeated page labels without dropping their source text',()=>{
  const pages=repeatedMargins([1,2,3].map(n=>page(n,[token('h'+n,'Başlık '+n,30,15),token('b'+n,'Gövde',30,100)])));
  assert.ok(pages.every(p=>p.items.find(i=>i.kind==='header').repeatedMargin));
 });
 it('extracts remaining scanned graphics while excluding recognized text regions',()=>{
  const width=120,height=120,data=new Uint8ClampedArray(width*height*4).fill(255);
  for(let y=30;y<65;y++)for(let x=30;x<65;x++){const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=0;}
  assert.equal(rasterRegions({data,width,height},1,[],[]).length,1);
  assert.equal(rasterRegions({data,width,height},1,[{x:25,y:25,width:45,height:45}],[]).length,0);
 });
 it('encodes hostile PDF text as literal editable text',()=>{
  const doc=pdfPagesToDocument([page(1,[token('a','<img src=x onerror=alert(1)> & “tez”',30,90)])]);
  const html=contentNodesToHtml(doc.sections[0].nodes);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
 });
});
