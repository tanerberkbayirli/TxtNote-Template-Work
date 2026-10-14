// 13-B: held-out (SRC08, SRC10) import -> save/reopen -> DOCX -> content/format diff vs source DOCX.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DOMParser} from '../../../TxtNote/frontend/node_modules/@xmldom/xmldom/lib/index.js';
import {unzipSync, strFromU8} from '../../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
import {importThesisDocx} from '../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../engine/src/contentModel.js';
import {buildNotePayload, noteFromPayload} from '../../../TxtNote/frontend/src/features/sync/payload.js';
import generic from '../../../engine/src/templates/generic.js';
import {compileThesisDocument} from '../../../engine/src/engine.js';
import {buildThesisDocx} from '../../../engine/src/export.js';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const parse=x=>new DOMParser().parseFromString(x,'text/xml');
const all=(d,t)=>Array.from(d.getElementsByTagNameNS(W,t));
const body=d=>d.getElementsByTagNameNS(W,'body')[0];
function stats(bytes){
  const z=unzipSync(bytes), d=parse(strFromU8(z['word/document.xml']));
  const paras=all(d,'p'), txt=paras.map(p=>all(p,'t').map(t=>t.textContent).join('')).filter(s=>s.trim());
  const runs=all(d,'r'), cnt=t=>all(d,t).length;
  const hasX=n=>all(d,n).length;
  const sect=all(d,'sectPr')[0];
  const pg=all(d,'pgSz').map(e=>`${e.getAttributeNS(W,'w')}x${e.getAttributeNS(W,'h')}${e.getAttributeNS(W,'orient')||''}`);
  const fonts=new Map();all(d,'rFonts').forEach(e=>{const f=e.getAttributeNS(W,'ascii');if(f)fonts.set(f,(fonts.get(f)||0)+1)});
  const sizes=new Map();all(d,'sz').forEach(e=>{const f=e.getAttributeNS(W,'val');sizes.set(f,(sizes.get(f)||0)+1)});
  const jc=new Map();all(d,'jc').forEach(e=>{const f=e.getAttributeNS(W,'val');jc.set(f,(jc.get(f)||0)+1)});
  return {z,txt,words:txt.join(' ').split(/\s+/).filter(Boolean).length,chars:txt.join('').length,
    paragraphs:paras.length,tables:cnt('tbl'),rows:cnt('tr'),cells:cnt('tc'),
    bold:all(d,'b').length,italic:all(d,'i').length,underline:all(d,'u').length,
    color:all(d,'color').length,highlight:all(d,'highlight').length,sup:all(d,'vertAlign').length,
    drawings:cnt('drawing'),pict:cnt('pict'),omath:d.getElementsByTagName('m:oMath').length+d.getElementsByTagName('m:oMathPara').length,
    footnoteRef:cnt('footnoteReference'),endnoteRef:cnt('endnoteReference'),fldSimple:cnt('fldSimple'),instrText:cnt('instrText'),
    bookmarks:cnt('bookmarkStart'),hyperlinks:cnt('hyperlink'),tabs:cnt('tab'),br:cnt('br'),pageBreaks:all(d,'br').filter(b=>b.getAttributeNS(W,'type')==='page').length,
    sectPr:cnt('sectPr'),pgSz:pg.join(','),headings:all(d,'pStyle').filter(e=>/^(Heading|Balk|Ba)/i.test(e.getAttributeNS(W,'val')||'')).length,
    numPr:cnt('numPr'),sdt:cnt('sdt'),fonts:Object.fromEntries([...fonts].sort((a,b)=>b[1]-a[1]).slice(0,5)),sizes:Object.fromEntries([...sizes].sort((a,b)=>b[1]-a[1]).slice(0,5)),jc:Object.fromEntries(jc),
    parts:Object.keys(z).filter(k=>/^word\/(media|footnotes|endnotes|header|footer|charts|diagrams)/.test(k)).length};
}
const lcsRatio=(a,b)=>{ // multiset-ordered diff by line hashing (cheap): fraction of source lines found in order
  const idx=new Map();b.forEach((s,i)=>{(idx.get(s)||idx.set(s,[]).get(s)).push(i)});
  let last=-1,hit=0;const miss=[];
  for(const s of a){const l=(idx.get(s)||[]).find(i=>i>last);if(l!==undefined){last=l;hit++}else miss.push(s)}
  return {hit,total:a.length,miss};
};
const MODE=process.env.MODE||'node'; // node | browser (browser-gen.mjs output)
const contract=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
const report={date:new Date().toISOString(),results:[]};
for(const src of contract.cases.filter(c=>c.partition==='held-out')){
  const row={id:src.id};
  try{
    const bytes=readFileSync(src.input.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),src.input.sha256);
    const t0=Date.now();
    const doc=await importThesisDocx(bytes,{fileName:src.input.path.split('/').pop()});
    row.importMs=Date.now()-t0;
    const note=installContentDocument({title:src.id,researchData:{thesis:{templateId:generic.id}}},doc);
    const restored=noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:src.id,note,deviceId:'13b',updatedAt:0}))));
    row.saveReopenEqual=JSON.stringify(restored.researchData.thesis.document)===JSON.stringify(note.researchData.thesis.document);
    const model=compileThesisDocument(generic,restored.researchData.thesis,restored.title,restored.content);
    const out=new Uint8Array(await (await buildThesisDocx(model,{})).arrayBuffer());
    if(MODE==='node')writeFileSync(`orchestration/engine-work/mission13/${src.id}.out.docx`,out);
    // second round-trip: re-import the produced DOCX
    const doc2=await importThesisDocx(MODE==='browser'?readFileSync(`orchestration/engine-work/mission13/${src.id}.browser.docx`):out,{fileName:src.id+'.out.docx'});
    const outBytes=MODE==='browser'?readFileSync(`orchestration/engine-work/mission13/${src.id}.browser.docx`):out;const a=stats(bytes),b=stats(outBytes);
    const norm=s=>s.replace(/\s+/g,' ').trim();
    const cmp=lcsRatio(a.txt.map(norm),b.txt.map(norm));
    row.text={srcParas:a.txt.length,outParas:b.txt.length,inOrderMatched:cmp.hit,missing:cmp.total-cmp.hit,missSample:cmp.miss.slice(0,8).map(s=>s.slice(0,100)),srcWords:a.words,outWords:b.words,srcChars:a.chars,outChars:b.chars};
    const keys=Object.keys(a).filter(k=>!['z','txt'].includes(k));
    row.format={};for(const k of keys)row.format[k]={src:a[k],out:b[k],same:JSON.stringify(a[k])===JSON.stringify(b[k])};
    row.reimportSections=[doc.sections.length,doc2.sections.length];
    row.unsupportedByCode={};for(const i of doc.source.unsupported)row.unsupportedByCode[i.code]=(row.unsupportedByCode[i.code]||0)+1;
    row.status=row.saveReopenEqual&&row.text.missing===0?'PASS':'DIFF';
  }catch(e){row.status='FAIL';row.error=String(e.stack||e)}
  report.results.push(row);console.log(row.id,row.status,row.text?`missing ${row.text.missing}/${row.text.srcParas}`:row.error);
}
writeFileSync(`orchestration/engine-work/mission13/heldout-diff.${MODE}.json`,JSON.stringify(report,null,1));
