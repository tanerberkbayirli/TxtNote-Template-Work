import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DOMParser} from '../../TxtNote/frontend/node_modules/@xmldom/xmldom/lib/index.js';
import {unzipSync, strFromU8} from '../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
import {importThesisDocx} from '../../engine/src/importDocx.js';
import {installContentDocument} from '../../engine/src/contentModel.js';
import {buildNotePayload, noteFromPayload} from '../../TxtNote/frontend/src/features/sync/payload.js';
import generic from '../../engine/src/templates/generic.js';
import {compileThesisDocument} from '../../engine/src/engine.js';
import {buildThesisDocx} from '../../engine/src/export.js';

const out='orchestration/engine-work/mission08/resume-heldouts';
mkdirSync(out,{recursive:true});
const contract=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
const results=[];
for(const source of contract.cases.filter(c=>c.partition==='held-out')) {
  const row={id:source.id,status:'FAIL'};
  try {
    const bytes=readFileSync(source.input.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.input.sha256);
    const xml=strFromU8(unzipSync(bytes)['word/document.xml']);
    const native=new DOMParser().parseFromString(xml,'text/xml');
    const expected=Array.from(native.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','t')).map(n=>n.textContent);
    const doc=await importThesisDocx(bytes,{fileName:source.input.path.split('/').pop()});
    const texts=[],ids=[];
    const walk=n=>{ if(n.id)ids.push(n.id); if(n.properties?.nativeName==='t')texts.push((n.children||[]).map(c=>(c.text||'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&')).join('')); (n.children||[]).forEach(walk); };
    doc.sections.forEach(s=>s.nodes.forEach(walk));
    assert.deepEqual(texts,expected,'ordered native main-story text');
    assert.equal(new Set(ids).size,ids.length,'unique persistent IDs');
    const note=installContentDocument({title:source.id,researchData:{thesis:{templateId:generic.id}}},doc);
    const restored=noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:source.id,note,deviceId:'resume-13b',updatedAt:0}))));
    assert.deepEqual(restored.researchData.thesis.document,note.researchData.thesis.document,'save/reopen document');
    const model=compileThesisDocument(generic,restored.researchData.thesis,restored.title,restored.content);
    const blob=await buildThesisDocx(model,{});
    writeFileSync(`${out}/${source.id}.docx`,new Uint8Array(await blob.arrayBuffer()));
    Object.assign(row,{status:'PASS',sections:doc.sections.length,textNodes:expected.length,persistentIds:ids.length,issues:doc.source.unsupported,docx:`${out}/${source.id}.docx`});
  } catch(error) { row.error=error.message; }
  results.push(row);
  console.log(`${row.id}: ${row.status} ${row.error||`${row.sections} sections, ${row.textNodes} text nodes`}`);
}
const report={status:results.length&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Frozen held-out input hash, independent ordered native body text, persistent IDs, save/reopen and DOCX production. Visual parity, interactive editing and Word/schema acceptance are separate gates.',results};
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
