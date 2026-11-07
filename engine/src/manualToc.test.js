import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { contentsTitleParts, manualTocEntries, sortManualTocRows } from './manualToc.js';
import { compileThesisDocument } from './engine.js';
import { createThesisDocument } from './document.js';
import { resolveGeneratedIndexes, generatedIndexPageTargets } from './generatedIndex.js';
import { buildThesisDocx } from './export.js';
import master, { mcbuPhd } from './templates/mcbu.js';
import medicine from './templates/mcbu-tip.js';
import { THESIS_TEMPLATE_REGISTRY } from './registry.js';
import { contentsPanelUniversity } from './manualToc.js';

test('authored hierarchy numbers siblings, resets children and repairs skipped parents', () => {
  const entries = manualTocEntries([1,2,1,2,2,4,0,1,2].map((level,i) => ({ id:`row${i}`, level, title:'Başlık', page:i+1 })));
  assert.deepEqual(entries.map(row=>row.label), ['1','1.1','2','2.1','2.2','2.2.1','','3','3.1']);
  assert.equal(entries[0].anchor,'manual-toc-row0');
});

for (const descriptor of THESIS_TEMPLATE_REGISTRY.filter(item => /^(aku|afsu)-/.test(item.id))) {
  test(`${descriptor.id}: shared contents editor preserves names, sorted page labels and Word output`, async () => {
    const template = (await descriptor.load()).default;
    const thesis = createThesisDocument(template, {}, 2026);
    const automatic = compileThesisDocument(template, thesis, 'Deneme', '<p>Metin.</p>');
    const autoToc = automatic.sections.find(section=>section.generatedIndex?.kind==='toc');
    assert.equal(contentsPanelUniversity(template.id), descriptor.id.startsWith('aku-') ? 'AKÜ' : 'AFSÜ');
    const compiled = compileThesisDocument(template, {...thesis,manualToc:{enabled:true,rows:[
      {id:'later',literalTitle:true,title:'2.1 Özel deneme',page:'10'},
      {id:'front',literalTitle:true,title:'Önsöz denemesi',page:'IX'},
      {id:'first',literalTitle:true,title:'1. İlk deneme',page:'2'},
    ]}},'Deneme','<p>Metin.</p>');
    const toc = compiled.sections.find(section=>section.generatedIndex?.kind==='toc');
    if (!autoToc) { assert.equal(toc,undefined); return; }
    assert.deepEqual(toc.generatedIndex, autoToc.generatedIndex);
    assert.deepEqual(toc.indexRows.map(row=>row.text),['Önsöz denemesi','1. İlk deneme','2.1 Özel deneme']);
    assert.deepEqual(toc.indexRows.map(row=>row.page),['IX','2','10']);
    const repaginated = resolveGeneratedIndexes(compiled, {'manual-toc-later':{label:'999'}});
    assert.equal(repaginated.sections.find(section=>section.generatedIndex?.kind==='toc').indexRows[2].page,'10');
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(repaginated)).arrayBuffer()))['word/document.xml']);
    assert.ok(xml.includes('Önsöz denemesi'));
    assert.ok(xml.toLocaleLowerCase('tr').includes('özel deneme'));
    assert.doesNotMatch(xml,/PAGEREF[^<]*manual/);
  });
}

test('page order puts Roman front matter before Arabic pages and keeps equal pages stable', () => {
  const rows = ['10','IX','2','II','5','1','3','IV','2','','IIV'].map((page, i) => ({id:String(i),page}));
  assert.deepEqual(sortManualTocRows(rows).map(row=>row.page), ['II','IV','IX','1','2','2','3','5','10','','IIV']);
  assert.deepEqual(sortManualTocRows(rows).filter(row=>row.page==='2').map(row=>row.id), ['2','8']);
  assert.equal(rows[0].page, '10');
});

test('literal names preserve optional authored numbering rather than adding a second number', async () => {
  assert.deepEqual(contentsTitleParts('3.3.3. Amaç'), {label:'3.3.3.',title:'Amaç',level:3});
  const thesis = {...createThesisDocument(master,{},2026),manualToc:{enabled:true,rows:[
    {id:'a',literalTitle:true,title:'2.1 Özel amaç',page:'10'},
    {id:'b',literalTitle:true,title:'Özet',page:'II'},
    {id:'c',literalTitle:true,title:'1. Giriş',page:'2'},
  ]}};
  const model = compileThesisDocument(master,thesis,'Test','<p>Metin</p>');
  const toc = model.sections.find(section=>section.generatedIndex?.kind==='toc');
  assert.deepEqual(toc.indexRows.map(row=>row.text), ['Özet','1. Giriş','2.1 Özel amaç']);
  assert.deepEqual(toc.indexRows.map(row=>row.page), ['II','2','10']);
  const xml=strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))['word/document.xml']);
  assert.ok(xml.indexOf('Özet') < xml.indexOf('2.1 Özel amaç'));
  assert.doesNotMatch(toc.html,/BİRİNCİ BÖLÜM/);
  assert.match(toc.html,/data-index-manual-page="2"[^]*?class="thesis-index-page"[^>]*>2<\/span>/);
});

for (const template of [master, mcbuPhd, medicine]) test(`${template.id}: authored page labels and template formatting survive repagination and Word export`, async () => {
  const thesis = { ...createThesisDocument(template, {}, 2026), manualToc:{ enabled:true, rows:[
    {id:'preface',level:0,title:'Önsöz',page:'IV'},
    {id:'chapter',level:1,title:'Araştırma',page:'12'},
    {id:'child',level:2,title:'Özel amaç',page:'37'},
    {id:'next',level:1,title:'Sonuç',page:'49'},
  ] } };
  const initial = compileThesisDocument(template, thesis, 'Deneme', '<h1>Başka başlık</h1><p>Metin.</p>');
  const model = resolveGeneratedIndexes(initial, {'manual-toc-child':{label:'999'}});
  const toc = model.sections.find(section=>section.generatedIndex?.kind==='toc');
  assert.deepEqual(toc.indexRows.map(row=>row.page), ['IV','12','37','49']);
  assert.match(toc.html,/data-index-manual-page="37"/);
  assert.ok(toc.html.includes('Özel amaç') || toc.html.includes('ÖZEL AMAÇ'));
  assert.ok(!toc.html.includes('Başka başlık'));
  assert.ok(!generatedIndexPageTargets(model).includes('manual-toc-child'));
  if (template === master || template === mcbuPhd) {
    assert.equal(toc.indexRows[1].label,'BİRİNCİ BÖLÜM');
    assert.equal(toc.indexRows[1].labelLine,true);
    assert.equal(toc.indexRows[2].label,'1.1.');
  }
  const blob = await buildThesisDocx(model);
  const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml']);
  assert.match(xml,/>37<\/w:t>/);
  assert.doesNotMatch(xml,/PAGEREF[^<]*manual/);
  assert.doesNotMatch(xml,/>\s*TOC \\/);
  const auto = compileThesisDocument(template, {...thesis,manualToc:undefined}, 'Deneme', '<h1>Başka başlık</h1>');
  assert.ok(auto.sections.find(section=>section.generatedIndex?.kind==='toc').indexRows.some(row=>row.text.includes('Başka başlık')||row.text.includes('BAŞKA BAŞLIK')));
});
