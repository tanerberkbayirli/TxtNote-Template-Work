import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getDocument} from '../frontend/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import {unzipSync,strFromU8} from '../frontend/node_modules/fflate/esm/browser.js';

const [editorPath,wordPath,wordReportPath,reportPath]=process.argv.slice(2);
if(!reportPath) throw Error('Usage: editor.pdf word.pdf word.json fidelity.json');
const reports={status:'FAIL',editor:[],word:[],differences:{}};
const mm=points=>points*25.4/72;
async function inspect(file) {
  const task=getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:false,disableFontFace:true});
  try {
    const pdf=await task.promise, pages=[];
    for(let index=1;index<=pdf.numPages;index++) {
      const page=await pdf.getPage(index), content=await page.getTextContent();
      const items=content.items.filter(item=>'str' in item);
      const text=items.map(item=>item.str).join(' ');
      const hit=items.find(item=>/canonical editable text/i.test(item.str));
      pages.push({page:index,text,...(hit?{target:{text:hit.str,xMm:mm(hit.transform[4]),baselineMm:mm(page.view[3]-hit.transform[5]),sizePt:Math.hypot(hit.transform[0],hit.transform[1]),widthMm:mm(hit.width)}}:{})});
    }
    return pages;
  }finally{await task.destroy();}
}
try {
  reports.editor=await inspect(editorPath);reports.word=await inspect(wordPath);
  const rendered=JSON.parse(fs.readFileSync(wordReportPath,'utf8').replace(/^\uFEFF/,''));
  assert.equal(rendered.status,'PASS');
  const docxPath=editorPath.replace(/\.pdf$/i,'.docx');
  const xml=strFromU8(unzipSync(new Uint8Array(fs.readFileSync(docxPath)))['word/document.xml']);
  reports.wordGeometry=[];
  for(const match of xml.matchAll(/<wp:anchor\b[^]*?<\/wp:anchor>/g)) {
    const anchor=match[0],name=anchor.match(/<wp:docPr\b[^>]*\bname="([^"]+)"/)?.[1];
    const actual=rendered.shapes.find(shape=>shape.name===name);
    assert.ok(actual,`Word retained positioned object ${name}`);
    const extent=anchor.match(/<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
    const expected={xMm:Number(anchor.match(/<wp:positionH\b[^]*?<wp:posOffset>(-?\d+)/)?.[1])/36000,yMm:Number(anchor.match(/<wp:positionV\b[^]*?<wp:posOffset>(-?\d+)/)?.[1])/36000,widthMm:Number(extent?.[1])/36000,heightMm:Number(extent?.[2])/36000};
    const differences=Object.fromEntries(Object.keys(expected).map(key=>[key,actual[key]-expected[key]]));
    for(const [key,difference]of Object.entries(differences))assert.ok(Number.isFinite(difference)&&Math.abs(difference)<=.25,`Word ${name} ${key} drift ${difference} mm exceeds 0.25 mm`);
    reports.wordGeometry.push({name,expected,actual,differences});
  }
  const shape=rendered.shapes.find(item=>/canonical editable text/i.test(item.text||''));
  assert.ok(shape,'Word retained an editable text box');
  for(const [key,expected]of Object.entries({xMm:40.25,yMm:42,widthMm:140}))assert.ok(Math.abs(shape[key]-expected)<=.25,`Word ${key}: ${shape[key]} vs ${expected}`);
  assert.equal(shape.font,'Times New Roman');assert.equal(shape.fontSizePt,12);
  const editor=reports.editor.find(page=>page.target),word=reports.word.find(page=>page.target);
  assert.ok(editor?.target&&word?.target,'Text remains searchable in both PDF exports');
  reports.differences={pages:reports.word.length-reports.editor.length,targetPage:word.page-editor.page,xMm:word.target.xMm-editor.target.xMm,baselineMm:word.target.baselineMm-editor.target.baselineMm,widthMm:word.target.widthMm-editor.target.widthMm,sizePt:word.target.sizePt-editor.target.sizePt};
  for(const key of ['xMm','baselineMm','widthMm'])assert.ok(Math.abs(reports.differences[key])<=.5,`${key} drift: ${reports.differences[key]} mm exceeds 0.5 mm`);
  assert.ok(Math.abs(reports.differences.sizePt)<=.01);
  assert.equal(reports.differences.targetPage,0,'Positioned text is on the same physical page');
  assert.equal(reports.differences.pages,0,'Word/PDF physical page count agrees');
  reports.status='PASS';
}catch(error){reports.error=error.stack;process.exitCode=1;}
finally{fs.writeFileSync(reportPath,JSON.stringify(reports,null,2));console.log(JSON.stringify({status:reports.status,differences:reports.differences,error:reports.error},null,2));}
