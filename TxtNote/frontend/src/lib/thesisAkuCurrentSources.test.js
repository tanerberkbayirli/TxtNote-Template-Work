import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { akuFbeMaster, akuFbePhd } from '../../../../engine/src/templates/aku-fbe.js';
import { akuSbeMaster, akuSbePhd } from '../../../../engine/src/templates/aku-sbe.js';
import { akuSagbilMaster, akuSagbilPhd } from '../../../../engine/src/templates/aku-sagbil.js';
import { validateThesisContent, validateThesisTemplate } from '../../../../engine/src/validation.js';
import { compileThesisDocument, groupThesisSections } from '../../../../engine/src/engine.js';
import { numberThesisPages } from '../../../../engine/src/pageLayout.js';
import { validateThesisPageCounts } from '../../../../engine/src/contentConformance.js';
const templates=[akuFbeMaster,akuFbePhd,akuSbeMaster,akuSbePhd,akuSagbilMaster,akuSagbilPhd];
const compile=(template,values={})=>compileThesisDocument(template,{values,sectionContent:{introduction:'<p>Giriş metni.</p>'},enabledSections:[]},'Örnek Tez','<h1>Bulgular</h1><p>Deneme.</p>');
test('AKÜ official-source verification records match supplied files byte for byte',()=>{
 const checked=new Set();
 for(const t of templates){
  assert.deepEqual(validateThesisTemplate(t),[]);
  assert.equal(t.source.verifiedAt,'2026-10-24');
  for(const source of t.source.currentVerification.files){
   if(checked.has(source.path))continue;
   assert.equal(createHash('sha256').update(readFileSync(new URL('../../../../'+source.path,import.meta.url))).digest('hex'),source.sha256,source.path);
   checked.add(source.path);
  }
 }
 assert.equal(checked.size,13);
});
test('keyword limits follow each institute, including upper bounds and Turkish alphabetical ordering',()=>{
 for(const t of templates){
  const issue=values=>validateThesisContent(t,{},values).warnings;
  assert.ok(issue({KEYWORDS:'a,b,c,d,e,f,g'}).some(i=>i.field==='KEYWORDS'&&i.code==='maxItems'),t.id);
  if(t.instituteId==='sbe')assert.ok(!issue({KEYWORDS:'a,b,c,d,e'}).some(i=>i.field==='KEYWORDS'));
  if(t.instituteId==='sagbil'){
   assert.ok(issue({KEYWORDS:'zebra,çevre,araştırma'}).some(i=>i.field==='KEYWORDS'&&i.code==='alphabetical'));
   assert.ok(!issue({KEYWORDS:'araştırma,çevre,zebra'}).some(i=>i.field==='KEYWORDS'));
  }
 }
 const invalid=structuredClone(akuFbeMaster);invalid.validation.KEYWORDS.maxItems=2;
 assert.ok(validateThesisTemplate(invalid).some(error=>error.includes('maxItems')));
});
test('FBE §4.2.5 keywords precede year and page counts in both abstract footers',()=>{
 for(const t of [akuFbeMaster,akuFbePhd])for(const id of ['abstract-footer','abstract-en-footer']){
  const blocks=t.sections.find(s=>s.id===id).blocks;
  assert.match(blocks[0].value,/KEYWORDS/);
  assert.match(blocks.at(-1).value,/DEFENSE_YEAR/);
 }
});
test('Sağlık §2.6 gives the first abstract Roman i, SUMMARY ii and introduction Arabic 1',()=>{
 for(const t of [akuSagbilMaster,akuSagbilPhd]){
  const m=compile(t),groups=groupThesisSections(m.sections);
  const pages=numberThesisPages(groups);
  assert.equal(pages.find(p=>p.sectionId==='abstract-tr').labels[0],'i');
  assert.equal(pages.find(p=>p.sectionId==='abstract-en-header').labels[0],'ii');
  assert.equal(pages.find(p=>p.sectionId==='introduction').labels[0],'1');
 }
});
test('the optional current SBE 100/2000 bursary line is below the author, 11pt, and absent when empty',()=>{
 assert.equal(akuSbeMaster.placeholders.YOK_100_2000_THEME,undefined);
 const plain=compile(akuSbePhd),withBursary=compile(akuSbePhd,{STUDENT_NAME:'Ada YILMAZ',YOK_100_2000_THEME:'Somut Olmayan Kültürel Miras'});
 const inner=m=>m.sections.find(s=>s.id==='inner-cover');
 assert.doesNotMatch(inner(plain).html,/100\/2000 YÖK/);
 assert.match(inner(withBursary).html,/Somut Olmayan Kültürel Miras/);
 const text=inner(withBursary).layoutBlocks.flatMap(function visit(b){return [b,...(b.children||b.blocks||[]).flatMap(visit)]});
 const scholarship=text.find(b=>b.text?.includes('100/2000'));
 assert.ok(scholarship);
 assert.equal(scholarship.style.fontSizePt,11);
 assert.ok(inner(withBursary).html.indexOf('Ada YILMAZ')<inner(withBursary).html.indexOf('100/2000'));
});
test('abstract page limits are advisory and taken from their own institute guide',()=>{
 const social=compile(akuSbeMaster),health=compile(akuSagbilMaster);
 assert.equal(validateThesisPageCounts(social,{'abstract-tr':2}).length,1);
 assert.equal(validateThesisPageCounts(health,{'abstract-tr':2}).length,0);
 assert.equal(validateThesisPageCounts(health,{'abstract-tr':3}).length,1);
});
