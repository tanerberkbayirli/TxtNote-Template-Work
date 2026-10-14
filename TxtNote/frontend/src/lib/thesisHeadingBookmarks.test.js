import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {strFromU8,unzipSync} from 'fflate';
import generic from '../../../../engine/src/templates/generic.js';
import {compileThesisDocument} from '../../../../engine/src/engine.js';
import {buildThesisDocx} from '../../../../engine/src/export.js';
describe('imported heading bookmark references',()=>{
 it('preserves plain heading bookmark markers and their PAGEREF target with added chapter numbering',async()=>{
  const content='<h1><span data-docx-bookmark-id="3" data-docx-bookmark-name="_TocSource"></span>Başlık<span data-docx-bookmark-id="3"></span></h1><p><span data-docx-field="fldChar" data-docx-fldchar="begin"></span><span data-docx-field="instrText" data-docx-instruction="PAGEREF _TocSource \\h"></span><span data-docx-field="fldChar" data-docx-fldchar="separate"></span>1<span data-docx-field="fldChar" data-docx-fldchar="end"></span></p>';
  const blob=await buildThesisDocx(compileThesisDocument(generic,{},'Tez',content));
  const xml=strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml']);
  assert.match(xml,/w:name="_TocSource"/);
  assert.deepEqual(blob.exportIssues.fieldAudit.dangling,[]);
  assert.equal(blob.exportIssues.fieldAudit.unbalanced,false);
  assert.match(xml,/Başlık/);
 });
});
